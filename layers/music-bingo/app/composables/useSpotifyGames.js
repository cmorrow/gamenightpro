import { computed, ref } from "vue";
import { getPlaylistTracksData } from "../data/playlistTracks.js";
import { resolvePlaylistImagePath } from "../data/localPlaylists.js";
import {
  BINGO_GAME_MODE_IDS,
  isBingoGameModeSupportedForGridSize,
} from "../data/bingoWinPatterns.js";
import {
  fetchPlaylistMeta,
  fetchPlaylistTracks,
  getStoredToken,
  parsePlaylistId,
  fetchCurrentPlayback,
  playTrackUris,
  fetchPlaylistTrackUris,
  getPreferredSpotifyDeviceId,
  pausePlayback,
  resumePlayback,
  playlistSpecifiedCoverImageUrl,
  effectivePlaylistCoverUrl,
  spotifyApiPlaylistId,
  isLikelySpotifyPlaylistId,
} from "./useSpotify.js";

const STORAGE_KEY = "spotify_games_playlists";
const LAST_CARDS_KEY = "bingo_last_generated_cards";
const SETTINGS_STORAGE_KEY = "spotify_games_settings";

function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function normalizeTrackKey(name, artist) {
  return `${(name || "").trim().toLowerCase()}::${(artist || "").trim().toLowerCase()}`;
}

function normalizeCardItem(item) {
  return normalizeTrackKey(item?.text, item?.sub);
}

function mapRawPlaylist(playlist) {
  const id = playlist.id;
  const storedUrl = typeof playlist.playlistUrl === "string" ? playlist.playlistUrl.trim() : "";
  const playlistUrl =
    storedUrl ||
    (isLikelySpotifyPlaylistId(id) ? `https://open.spotify.com/playlist/${id}` : "");
  return {
    id: playlist.id,
    name: String(playlist.name || playlist.spotifyName || "Untitled Playlist"),
    spotifyName: String(playlist.spotifyName || playlist.name || "Untitled Playlist"),
    playlistUrl,
    uri: playlist.uri,
    trackCount: Number(playlist.trackCount) || 0,
    playedSongs: Array.isArray(playlist.playedSongs)
      ? playlist.playedSongs.map((s) => ({
          name: s?.name || "",
          artist: s?.artist || "",
          uri: typeof s?.uri === "string" ? s.uri : "",
        }))
      : [],
    imageUrl: effectivePlaylistCoverUrl(typeof playlist.imageUrl === "string" ? playlist.imageUrl : ""),
  };
}

/**
 * Merges entries that point at the same Spotify playlist (e.g. slug id + imported Spotify id).
 * Normalizes `id` to the Spotify playlist id when a URL is available.
 */
function dedupePlaylistsBySpotifyReference(list) {
  /** @type {Record<string, string>} */
  const idRemap = {};
  /** @type {Map<string, ReturnType<typeof mapRawPlaylist>[]>} */
  const groups = new Map();
  for (const p of list) {
    const sid = spotifyApiPlaylistId(p);
    const key = sid ? `sp:${sid}` : `raw:${String(p.id)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(p);
  }
  const out = [];
  for (const [, group] of groups) {
    if (group.length === 1) {
      const only = group[0];
      const sid = spotifyApiPlaylistId(only);
      const normalized = { ...only };
      if (sid && normalized.id !== sid) {
        idRemap[String(normalized.id)] = sid;
        normalized.id = sid;
        if (!normalized.uri) normalized.uri = `spotify:playlist:${sid}`;
        if (!String(normalized.playlistUrl || "").trim()) {
          normalized.playlistUrl = `https://open.spotify.com/playlist/${sid}`;
        }
      }
      out.push(normalized);
      continue;
    }
    const sid = group.map((g) => spotifyApiPlaylistId(g)).find(Boolean) || null;
    const canonicalId = sid || group[0].id;
    for (const g of group) {
      if (g.id !== canonicalId) idRemap[String(g.id)] = canonicalId;
    }
    const base =
      group.find((g) => g.id === sid) ||
      group.find((g) => isLikelySpotifyPlaylistId(g.id)) ||
      group[0];
    const merged = { ...base, id: canonicalId };
    merged.trackCount = Math.max(...group.map((g) => Number(g.trackCount) || 0));
    merged.imageUrl =
      group.map((g) => g.imageUrl).find((u) => typeof u === "string" && u.trim()) || merged.imageUrl || "";
    merged.name =
      group.map((g) => g.name).find((n) => n && String(n).trim()) || merged.name;
    merged.spotifyName =
      group.map((g) => g.spotifyName).find((n) => n && String(n).trim()) || merged.spotifyName;
    merged.playlistUrl =
      (typeof merged.playlistUrl === "string" && merged.playlistUrl.trim()
        ? merged.playlistUrl
        : "") ||
      (sid ? `https://open.spotify.com/playlist/${sid}` : base.playlistUrl);
    merged.uri = merged.uri || (sid ? `spotify:playlist:${sid}` : base.uri);
    const seen = new Set();
    const songs = [];
    for (const g of group) {
      for (const s of g.playedSongs || []) {
        const k = `${normalizeTrackKey(s.name, s.artist)}::${String(s.uri || "")}`;
        if (seen.has(k)) continue;
        seen.add(k);
        songs.push(s);
      }
    }
    merged.playedSongs = songs;
    out.push(merged);
  }
  return { playlists: out, idRemap };
}

function hydrateAndDedupe() {
  const raw = localStorage.getItem(STORAGE_KEY);
  const list = safeJsonParse(raw, []);
  if (!Array.isArray(list)) return { playlists: [], idRemap: {} };
  const mapped = list.map(mapRawPlaylist);
  return dedupePlaylistsBySpotifyReference(mapped);
}

/**
 * Map a UI selection id (Spotify id or stored row id) to the playlist row after dedupe —
 * needed so `persistSettings` saves an id that exists in `playlists`.
 */
export function resolvePlaylistEntryFromSelection(list, playlistId) {
  const raw = String(playlistId || "").trim();
  if (!raw || !Array.isArray(list)) return null;

  const direct = list.find((p) => p.id === raw);
  if (direct) return direct;

  const rawAsSpotify = isLikelySpotifyPlaylistId(raw) ? raw : null;
  const parsedFromRaw = parsePlaylistId(raw);
  const spotifyHint = rawAsSpotify || parsedFromRaw;
  if (spotifyHint) {
    const bySpotify = list.find(
      (p) => spotifyApiPlaylistId(p) === spotifyHint || String(p.id).trim() === spotifyHint,
    );
    if (bySpotify) return bySpotify;
  }

  // Local mode can select config slugs (e.g. "80s-hits") even when stored rows
  // were canonicalized to Spotify IDs after dedupe/import. Bridge that here.
  const tracksData = getPlaylistTracksData(raw);
  const spotifyFromTracksData = parsePlaylistId(
    String(tracksData?.spotifyPlaylistUrl || "").trim(),
  );
  if (spotifyFromTracksData) {
    const byTracksDataSpotify = list.find(
      (p) =>
        spotifyApiPlaylistId(p) === spotifyFromTracksData ||
        String(p.id).trim() === spotifyFromTracksData,
    );
    if (byTracksDataSpotify) return byTracksDataSpotify;
  }

  return null;
}

function createSpotifyGamesStore() {
  const token = ref(getStoredToken());
  const { playlists: initialPlaylists, idRemap } = hydrateAndDedupe();
  const playlists = ref(initialPlaylists);

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const prev = raw ? JSON.parse(raw) : [];
    if (JSON.stringify(prev) !== JSON.stringify(playlists.value)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(playlists.value));
    }
  } catch {
    /* ignore */
  }

  const settings = safeJsonParse(localStorage.getItem(SETTINGS_STORAGE_KEY), {});
  const savedActivePlaylistId = String(settings?.activePlaylistId || "").trim();
  const remappedActive = idRemap[savedActivePlaylistId] || savedActivePlaylistId;
  const initialActivePlaylistId =
    remappedActive && playlists.value.some((p) => p.id === remappedActive)
      ? remappedActive
      : playlists.value[0]?.id || "";
  const activePlaylistId = ref(initialActivePlaylistId);
  const nowPlaying = ref(null);
  const isPlaying = ref(false);
  const playbackProgressMs = ref(0);
  const playbackStarted = ref(false);
  const loading = ref(false);
  const error = ref("");
  const minPlaybackSeconds = ref(0);
  const randomStartEnabled = ref(false);
  const initialGridSize = Number(settings?.gridSize) === 4 ? 4 : 5;
  const gridSize = ref(initialGridSize);
  const initialBingoGameType =
    BINGO_GAME_MODE_IDS.includes(String(settings?.bingoGameType)) &&
    isBingoGameModeSupportedForGridSize(settings.bingoGameType, initialGridSize)
      ? String(settings.bingoGameType)
      : "standard";
  const bingoGameType = ref(initialBingoGameType);
  /** When true, `playActivePlaylist` shuffles track order; when false, Spotify playlist order is preserved. */
  const playbackShuffle = ref(settings?.playbackShuffle !== false);
  const lastTrackKeyByPlaylist = ref({});
  /** Current track URI used for per-song timers (not title/artist — avoids duplicate-name bugs). */
  const activeSessionTrackUri = ref("");
  /** Last Spotify `progress_ms` for the active URI; detects backward jumps (replay / duplicate track). */
  const lastReportedProgressMs = ref(null);
  const activeTrackSessionStartMs = ref(0);
  const sessionPlaylistId = ref("");
  const sessionTrackUris = ref(new Set());
  const sessionTrackOrder = ref([]);
  const sessionTrackIndex = ref(-1);
  /** Zero-based playlist index chosen by user as the target for the next Next-button press (does not play immediately). */
  const pendingNextTrackIndex = ref(null);
  let pollTimer = null;
  let pollActive = false;
  let visibilityHandler = null;
  let lastPollTickMs = Date.now();
  /** After user-driven playback actions, poll faster for a short window. */
  let fastPollUntil = 0;

  const POLL_MS_FAST = 1500;
  const POLL_MS_PLAYING = 3000;
  const POLL_MS_IDLE = 6000;
  const POLL_MS_HIDDEN = 30000;
  const FAST_POLL_WINDOW_MS = 15000;

  function clearPendingNextTrack() {
    pendingNextTrackIndex.value = null;
  }

  /** Toggle off if same row is clicked again. */
  function selectPendingNextTrack(zeroBasedIndex) {
    const i = Math.floor(Number(zeroBasedIndex));
    if (Number.isNaN(i) || i < 0) {
      clearPendingNextTrack();
      return;
    }
    if (pendingNextTrackIndex.value === i) clearPendingNextTrack();
    else pendingNextTrackIndex.value = i;
  }

  const activePlaylist = computed(() =>
    playlists.value.find((playlist) => playlist.id === activePlaylistId.value) || null
  );

  const verifyState = computed(() => {
    const rawCards = localStorage.getItem(LAST_CARDS_KEY);
    const cards = safeJsonParse(rawCards, []);
    if (!Array.isArray(cards) || !cards.length) {
      return { status: "empty", matched: 0, required: 0 };
    }

    const required = new Set();
    for (const card of cards) {
      if (!Array.isArray(card)) continue;
      for (const item of card) {
        if ((item?.text || "").toUpperCase() === "FREE") continue;
        required.add(normalizeCardItem(item));
      }
    }

    const played = new Set(
      (activePlaylist.value?.playedSongs || []).map((song) => normalizeTrackKey(song.name, song.artist))
    );

    let matched = 0;
    for (const key of required) {
      if (played.has(key)) matched += 1;
    }

    const status = required.size > 0 && matched === required.size ? "pass" : "fail";
    return { status, matched, required: required.size };
  });

  function persistPlaylists() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(playlists.value));
  }

  function persistSettings() {
    const activeId = String(activePlaylistId.value || "").trim();
    const resolved = resolvePlaylistEntryFromSelection(playlists.value, activeId);
    const persistedActive =
      resolved?.id ||
      (activeId && playlists.value.some((p) => p.id === activeId) ? activeId : "") ||
      playlists.value[0]?.id ||
      "";
    localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({
        minPlaybackSeconds: 0,
        randomStartEnabled: false,
        playbackShuffle: Boolean(playbackShuffle.value),
        bingoGameType: BINGO_GAME_MODE_IDS.includes(String(bingoGameType.value))
          ? String(bingoGameType.value)
          : "standard",
        gridSize: Number(gridSize.value) === 4 ? 4 : 5,
        activePlaylistId: persistedActive,
      })
    );
  }

  if (savedActivePlaylistId !== initialActivePlaylistId) {
    persistSettings();
  }

  function setBingoGameType(id) {
    const next = String(id || "").trim();
    if (!BINGO_GAME_MODE_IDS.includes(next)) return;
    if (!isBingoGameModeSupportedForGridSize(next, gridSize.value)) return;
    bingoGameType.value = next;
    persistSettings();
  }

  function setGridSize(size) {
    const next = Number(size) === 4 ? 4 : 5;
    gridSize.value = next;
    if (!isBingoGameModeSupportedForGridSize(bingoGameType.value, next)) {
      bingoGameType.value = "standard";
    }
    persistSettings();
  }

  function setPlaybackShuffle(enabled) {
    playbackShuffle.value = Boolean(enabled);
    persistSettings();
  }

  function setPlaylistTitle(playlistId, title) {
    const pl = playlists.value.find((playlist) => playlist.id === playlistId);
    if (!pl) return;
    const next = String(title || "").trim();
    if (!next) return;
    pl.name = next;
    if (!pl.spotifyName) {
      pl.spotifyName = next;
    }
    persistPlaylists();
  }

  function ensurePlaylistHistory(playlistId) {
    const playlist = playlists.value.find((item) => item.id === playlistId);
    if (!playlist) return null;
    if (!Array.isArray(playlist.playedSongs)) playlist.playedSongs = [];
    return playlist;
  }

  /** Align session index with Spotify’s current track when both refer to the same playlist order. */
  function syncSessionTrackIndexFromNowPlaying() {
    const currentUri = String(nowPlaying.value?.uri || "");
    if (currentUri && sessionTrackOrder.value.length) {
      const idx = sessionTrackOrder.value.findIndex((u) => u === currentUri);
      if (idx >= 0) sessionTrackIndex.value = idx;
    }
  }

  function getPlaybackPollDelayMs() {
    if (typeof document !== "undefined" && document.hidden) return POLL_MS_HIDDEN;
    if (Date.now() < fastPollUntil) return POLL_MS_FAST;
    if (isPlaying.value) return POLL_MS_PLAYING;
    return POLL_MS_IDLE;
  }

  /** Call after playback-changing actions so polling stays responsive without hammering the API. */
  function requestResponsivePlaybackPoll() {
    fastPollUntil = Date.now() + FAST_POLL_WINDOW_MS;
    if (!pollActive) return;
    if (pollTimer != null) {
      window.clearTimeout(pollTimer);
      pollTimer = null;
    }
    schedulePlaybackPollTick();
  }

  function schedulePlaybackPollTick() {
    if (!pollActive) return;
    const delay = getPlaybackPollDelayMs();
    pollTimer = window.setTimeout(runPlaybackPollTick, delay);
  }

  async function runPlaybackPollTick() {
    pollTimer = null;
    if (!pollActive) return;
    try {
      const now = Date.now();
      const elapsed = Math.min(now - lastPollTickMs, 15000);
      lastPollTickMs = now;
      if (isPlaying.value && nowPlaying.value?.duration_ms) {
        playbackProgressMs.value = Math.min(
          playbackProgressMs.value + elapsed,
          Number(nowPlaying.value.duration_ms) || playbackProgressMs.value,
        );
      }

      await refreshPlayback();
    } catch {
      // keep UI usable even with transient API errors
    }
    if (pollActive) schedulePlaybackPollTick();
  }

  async function addPlaylistFromInput(input) {
    const playlistId = parsePlaylistId((input || "").trim());
    if (!playlistId) throw new Error("Enter a Spotify playlist URL or playlist ID.");
    if (
      playlists.value.some(
        (playlist) =>
          playlist.id === playlistId ||
          parsePlaylistId(String(playlist.playlistUrl || "").trim()) === playlistId,
      )
    ) {
      activePlaylistId.value = playlistId;
      persistSettings();
      return;
    }

    loading.value = true;
    try {
      const [meta, tracks] = await Promise.all([
        fetchPlaylistMeta(playlistId, token.value),
        fetchPlaylistTracks(playlistId, token.value).catch(() => []),
      ]);
      const trackCount = tracks.length || Number(meta.tracks?.total) || 0;
      playlists.value.unshift({
        id: meta.id,
        name: meta.name,
        spotifyName: meta.name,
        playlistUrl: `https://open.spotify.com/playlist/${meta.id}`,
        uri: meta.uri,
        trackCount,
        playedSongs: [],
        imageUrl: playlistSpecifiedCoverImageUrl(meta),
      });
      activePlaylistId.value = meta.id;
      persistPlaylists();
      persistSettings();
    } finally {
      loading.value = false;
    }
  }

  /** Adds a playlist for local mode from bundled `src/data/playlists/<id>.json` (title + Spotify URL). */
  function addLocalDemoPlaylist(playlistId) {
    const id = String(playlistId || "").trim();
    if (!id || playlists.value.some((p) => p.id === id)) return;

    const trackData = getPlaylistTracksData(id);
    if (!trackData || typeof trackData !== "object") return;

    const title = String(trackData.title || "").trim() || id;
    const url = String(trackData.spotifyPlaylistUrl || "").trim();
    const spotifyId = parsePlaylistId(url);
    if (
      spotifyId &&
      playlists.value.some(
        (p) => p.id === spotifyId || parsePlaylistId(String(p.playlistUrl || "").trim()) === spotifyId,
      )
    ) {
      return;
    }
    const fromJson = Array.isArray(trackData?.tracks) ? trackData.tracks.length : 0;
    playlists.value.push({
      id,
      name: title,
      spotifyName: title,
      playlistUrl: spotifyId ? `https://open.spotify.com/playlist/${spotifyId}` : url || "",
      uri: spotifyId ? `spotify:playlist:${spotifyId}` : "",
      trackCount: fromJson || 0,
      playedSongs: [],
      imageUrl: resolvePlaylistImagePath(trackData.image) || "",
    });
    persistPlaylists();
  }

  function selectPlaylist(playlistId) {
    const resolved = resolvePlaylistEntryFromSelection(playlists.value, playlistId);
    const canonicalId = resolved?.id || String(playlistId || "").trim();
    activePlaylistId.value = canonicalId;
    if (canonicalId) lastTrackKeyByPlaylist.value[canonicalId] = "";
    ensurePlaylistHistory(canonicalId);
    clearPendingNextTrack();
    persistSettings();
  }

  function resetPlaylist(playlistId) {
    const playlist = ensurePlaylistHistory(playlistId);
    if (!playlist) return;
    playlist.playedSongs = [];
    lastTrackKeyByPlaylist.value[playlistId] = "";
    if (activePlaylistId.value === playlistId) {
      nowPlaying.value = null;
      isPlaying.value = false;
      playbackProgressMs.value = 0;
      playbackStarted.value = false;
      clearPendingNextTrack();
    }
    persistPlaylists();
  }

  async function resetPlaylistAndStop(playlistId) {
    try {
      await pausePlayback(token.value, getPreferredSpotifyDeviceId());
    } catch {
      // Ignore pause failures (e.g., no active device) and still reset state.
    }
    resetPlaylist(playlistId);
  }

  function removePlaylist(playlistId) {
    const index = playlists.value.findIndex((playlist) => playlist.id === playlistId);
    if (index === -1) return;
    playlists.value.splice(index, 1);
    delete lastTrackKeyByPlaylist.value[playlistId];
    if (activePlaylistId.value === playlistId) {
      activePlaylistId.value = playlists.value[0]?.id || "";
      nowPlaying.value = null;
      isPlaying.value = false;
    }
    persistPlaylists();
    persistSettings();
  }

  function recordCurrentTrack(playback) {
    if (!playback?.is_playing) return;
    if (!playback?.item || !activePlaylist.value) return;
    const itemUri = String(playback.item.uri || "");
    const isCurrentGameSession =
      sessionPlaylistId.value === activePlaylist.value.id &&
      sessionTrackUris.value instanceof Set &&
      sessionTrackUris.value.has(itemUri);
    if (!isCurrentGameSession) return;
    const name = playback.item.name || "";
    const artist = playback.item.artists?.[0]?.name || "";
    const key = normalizeTrackKey(name, artist);
    if (!key) return;
    if (lastTrackKeyByPlaylist.value[activePlaylist.value.id] === key) return;
    lastTrackKeyByPlaylist.value[activePlaylist.value.id] = key;
    const playlist = ensurePlaylistHistory(activePlaylist.value.id);
    if (!playlist) return;
    if (playlist.playedSongs.some((song) => normalizeTrackKey(song.name, song.artist) === key)) return;
    playlist.playedSongs.push({ name, artist, uri: itemUri });
    persistPlaylists();
  }

  /**
   * Start playback at a specific track from the active playlist’s “played” history.
   * Restores session URIs after refresh when needed so recording / verification still behave.
   */
  async function playPlayedSong(trackUri) {
    if (!activePlaylist.value) throw new Error("Choose a playlist first.");
    const uri = String(trackUri || "").trim();
    if (!uri.startsWith("spotify:track:")) throw new Error("This song has no saved Spotify link. Play new rounds to capture track links.");

    error.value = "";
    loading.value = true;
    try {
      requestResponsivePlaybackPoll();
      if (sessionPlaylistId.value !== activePlaylist.value.id || sessionTrackUris.value.size === 0) {
        const uris = await fetchPlaylistTrackUris(activePlaylist.value.id, token.value);
        sessionPlaylistId.value = activePlaylist.value.id;
        sessionTrackUris.value = new Set(uris);
        sessionTrackOrder.value = [...uris];
      }
      if (!sessionTrackUris.value.has(uri)) {
        throw new Error("That track is not in this playlist.");
      }
      sessionTrackIndex.value = sessionTrackOrder.value.findIndex((u) => u === uri);
      await playTrackUris(token.value, [uri], getPreferredSpotifyDeviceId());
      playbackStarted.value = true;
      await refreshPlayback();
    } finally {
      loading.value = false;
    }
  }

  async function ensureSessionTrackOrder() {
    if (!activePlaylist.value) throw new Error("Choose a playlist first.");
    const pid = activePlaylist.value.id;
    if (sessionPlaylistId.value !== pid || sessionTrackOrder.value.length === 0) {
      const uris = await fetchPlaylistTrackUris(pid, token.value);
      if (!uris.length) throw new Error("No playable tracks found for this playlist.");
      sessionPlaylistId.value = pid;
      sessionTrackUris.value = new Set(uris);
      sessionTrackOrder.value = [...uris];
      if (sessionTrackIndex.value >= uris.length) {
        sessionTrackIndex.value = Math.max(0, uris.length - 1);
      }
    }
  }

  /** Next index to play after the last recorded played song (by URI), or 0. */
  function deriveNextIndexAfterPlayed(playlist, orderUris) {
    const played = playlist?.playedSongs || [];
    if (!played.length || !orderUris.length) return 0;
    for (let i = played.length - 1; i >= 0; i -= 1) {
      const uri = played[i]?.uri;
      if (typeof uri === "string" && uri.startsWith("spotify:track:")) {
        const idx = orderUris.findIndex((u) => u === uri);
        if (idx >= 0) return Math.min(idx + 1, orderUris.length - 1);
      }
    }
    return Math.min(played.length, orderUris.length - 1);
  }

  /** Play main control: resume if paused on a playlist track; otherwise play correct next/current track without restarting at 1. */
  async function playOrResumeGamePlayback() {
    if (!activePlaylist.value) throw new Error("Choose a playlist first.");
    error.value = "";
    loading.value = true;
    try {
      requestResponsivePlaybackPoll();
      await ensureSessionTrackOrder();
      await refreshPlayback();

      const order = sessionTrackOrder.value;
      const currentUri = String(nowPlaying.value?.uri || "");
      const idxOfCurrent = currentUri ? order.findIndex((u) => u === currentUri) : -1;

      if (!isPlaying.value && idxOfCurrent >= 0) {
        sessionTrackIndex.value = idxOfCurrent;
        await resumePlayback(token.value, getPreferredSpotifyDeviceId());
        playbackStarted.value = true;
        await refreshPlayback();
        return;
      }

      let startIndex = 0;
      if (idxOfCurrent >= 0) {
        startIndex = idxOfCurrent;
      } else if (
        sessionTrackIndex.value >= 0 &&
        sessionTrackIndex.value < order.length &&
        sessionPlaylistId.value === activePlaylist.value.id
      ) {
        startIndex = sessionTrackIndex.value;
      } else {
        startIndex = deriveNextIndexAfterPlayed(activePlaylist.value, order);
      }

      sessionTrackIndex.value = startIndex;
      await playTrackUris(token.value, [order[startIndex]], getPreferredSpotifyDeviceId());
      playbackStarted.value = true;
      await refreshPlayback();
    } finally {
      loading.value = false;
    }
  }

  /** Jump to a track by zero-based index in playlist order (user-selected row). */
  async function playTrackAtIndex(zeroBasedIndex) {
    if (!activePlaylist.value) throw new Error("Choose a playlist first.");
    clearPendingNextTrack();
    error.value = "";
    loading.value = true;
    try {
      requestResponsivePlaybackPoll();
      await ensureSessionTrackOrder();
      const order = sessionTrackOrder.value;
      const index = Math.floor(Number(zeroBasedIndex));
      if (index < 0 || index >= order.length) throw new Error("Invalid track selection.");
      sessionTrackIndex.value = index;
      await playTrackUris(token.value, [order[index]], getPreferredSpotifyDeviceId());
      playbackStarted.value = true;
      await refreshPlayback();
    } finally {
      loading.value = false;
    }
  }

  async function refreshPlayback() {
    const playback = await fetchCurrentPlayback(token.value);
    nowPlaying.value = playback?.item || null;
    isPlaying.value = Boolean(playback?.is_playing);
    const currProgress = Number(playback?.progress_ms) || 0;
    playbackProgressMs.value = currProgress;
    const itemUri = playback?.item?.uri ? String(playback.item.uri) : "";
    if (itemUri && sessionTrackOrder.value.length) {
      const idx = sessionTrackOrder.value.findIndex((uri) => uri === itemUri);
      if (idx >= 0) sessionTrackIndex.value = idx;
    }

    if (!itemUri) {
      activeSessionTrackUri.value = "";
      lastReportedProgressMs.value = null;
      activeTrackSessionStartMs.value = 0;
    } else if (itemUri !== activeSessionTrackUri.value) {
      activeSessionTrackUri.value = itemUri;
      activeTrackSessionStartMs.value = currProgress;
      lastReportedProgressMs.value = currProgress;
    } else {
      const prev = lastReportedProgressMs.value;
      if (prev != null && currProgress + 1500 < prev) {
        activeTrackSessionStartMs.value = currProgress;
      }
      lastReportedProgressMs.value = currProgress;
    }
    recordCurrentTrack(playback);
  }

  async function playActivePlaylist() {
    if (!activePlaylist.value) throw new Error("Choose a playlist first.");
    clearPendingNextTrack();
    error.value = "";
    loading.value = true;
    try {
      requestResponsivePlaybackPoll();
      await ensureSessionTrackOrder();
      if (!sessionTrackOrder.value.length) {
        throw new Error("No playable tracks found for this playlist.");
      }
      sessionTrackIndex.value = 0;
      await playTrackUris(token.value, [sessionTrackOrder.value[0]], getPreferredSpotifyDeviceId());
      playbackStarted.value = true;
      await refreshPlayback();
    } finally {
      loading.value = false;
    }
  }

  async function pause() {
    error.value = "";
    requestResponsivePlaybackPoll();
    await pausePlayback(token.value, getPreferredSpotifyDeviceId());
    await refreshPlayback();
  }

  async function next() {
    error.value = "";
    if (!activePlaylist.value) throw new Error("Choose a playlist first.");
    requestResponsivePlaybackPoll();
    await ensureSessionTrackOrder();
    syncSessionTrackIndexFromNowPlaying();

    const jump = pendingNextTrackIndex.value;
    if (jump != null) {
      const j = Math.floor(Number(jump));
      pendingNextTrackIndex.value = null;
      if (j >= 0 && j < sessionTrackOrder.value.length) {
        sessionTrackIndex.value = j;
        await playTrackUris(
          token.value,
          [sessionTrackOrder.value[j]],
          getPreferredSpotifyDeviceId()
        );
        playbackStarted.value = true;
        await refreshPlayback();
        return;
      }
    }

    if (sessionTrackIndex.value >= sessionTrackOrder.value.length - 1) return;
    sessionTrackIndex.value += 1;
    await playTrackUris(
      token.value,
      [sessionTrackOrder.value[sessionTrackIndex.value]],
      getPreferredSpotifyDeviceId()
    );
    await refreshPlayback();
  }

  async function previous() {
    error.value = "";
    if (!activePlaylist.value) throw new Error("Choose a playlist first.");
    requestResponsivePlaybackPoll();
    await ensureSessionTrackOrder();
    syncSessionTrackIndexFromNowPlaying();

    if (sessionTrackIndex.value <= 0) {
      sessionTrackIndex.value = 0;
    } else {
      sessionTrackIndex.value -= 1;
    }
    await playTrackUris(
      token.value,
      [sessionTrackOrder.value[sessionTrackIndex.value]],
      getPreferredSpotifyDeviceId()
    );
    await refreshPlayback();
  }

  async function setRandomStartEnabled(enabled) {
    randomStartEnabled.value = false;
    persistSettings();
  }

  async function setMinPlaybackSeconds(seconds) {
    minPlaybackSeconds.value = 0;
    persistSettings();
  }

  function startPolling() {
    stopPolling();
    pollActive = true;
    lastPollTickMs = Date.now();
    fastPollUntil = Date.now() + FAST_POLL_WINDOW_MS;
    visibilityHandler = () => {
      if (!document.hidden) requestResponsivePlaybackPoll();
    };
    document.addEventListener("visibilitychange", visibilityHandler);
    schedulePlaybackPollTick();
  }

  function stopPolling() {
    pollActive = false;
    if (pollTimer != null) {
      window.clearTimeout(pollTimer);
      pollTimer = null;
    }
    if (visibilityHandler) {
      document.removeEventListener("visibilitychange", visibilityHandler);
      visibilityHandler = null;
    }
  }

  function setPlaylistCoverImage(playlistId, url) {
    const pl = playlists.value.find((p) => p.id === playlistId);
    if (!pl) return;
    pl.imageUrl = typeof url === "string" ? url : "";
    persistPlaylists();
  }

  async function refreshPlaylistCoverFromSpotify(playlistId) {
    if (!token.value) return;
    const pl = playlists.value.find((p) => p.id === playlistId);
    const apiId =
      pl ? spotifyApiPlaylistId(pl) : isLikelySpotifyPlaylistId(playlistId) ? playlistId : null;
    if (!apiId) {
      throw new Error("This playlist has no Spotify ID — open it from the Spotify import on the Games page.");
    }
    const meta = await fetchPlaylistMeta(apiId, token.value);
    setPlaylistCoverImage(playlistId, playlistSpecifiedCoverImageUrl(meta));
    const total = Number(meta?.tracks?.total);
    if (pl && Number.isFinite(total) && total >= 0 && pl.trackCount !== total) {
      pl.trackCount = total;
      persistPlaylists();
    }
  }

  /** Refresh `imageUrl` from Spotify when the playlist has cover artwork (`images` non-empty). */
  /**
   * Applies playlist row order from the game UI (drag-reorder). Updates session playback order
   * so Next / pending-next stay aligned. Optional `pendingTrackUri` remaps “queue as next” after reorder.
   */
  function applyGamePlaylistReorder(orderedUris, options = {}) {
    if (!activePlaylist.value) return;
    const pid = activePlaylist.value.id;
    const uris = orderedUris.filter((u) => typeof u === "string" && u.startsWith("spotify:track:"));
    if (!uris.length) return;

    const prevOrder = [...sessionTrackOrder.value];
    const piBefore = pendingNextTrackIndex.value;

    sessionPlaylistId.value = pid;
    sessionTrackOrder.value = [...uris];
    sessionTrackUris.value = new Set(uris);

    const currUri = String(nowPlaying.value?.uri || "");
    if (currUri && uris.includes(currUri)) {
      sessionTrackIndex.value = uris.indexOf(currUri);
    }

    if (Object.prototype.hasOwnProperty.call(options, "pendingTrackUri")) {
      const hint = options.pendingTrackUri;
      if (typeof hint === "string" && hint && uris.includes(hint)) {
        pendingNextTrackIndex.value = uris.indexOf(hint);
      } else {
        pendingNextTrackIndex.value = null;
      }
    } else {
      let pendingUri = null;
      if (piBefore != null && prevOrder.length && piBefore >= 0 && piBefore < prevOrder.length) {
        pendingUri = prevOrder[piBefore];
      }
      if (pendingUri && uris.includes(pendingUri)) {
        pendingNextTrackIndex.value = uris.indexOf(pendingUri);
      } else {
        pendingNextTrackIndex.value = null;
      }
    }
  }

  async function ensurePlaylistCoverImages() {
    if (!token.value) return;
    let changed = false;
    for (let i = 0; i < playlists.value.length; i += 1) {
      const pl = playlists.value[i];
      if (i > 0) await new Promise((r) => setTimeout(r, 120));
      const apiId = spotifyApiPlaylistId(pl);
      if (!apiId) continue;
      try {
        const meta = await fetchPlaylistMeta(apiId, token.value);
        const url = playlistSpecifiedCoverImageUrl(meta);
        const next = url || "";
        if (pl.imageUrl !== next) {
          pl.imageUrl = next;
          changed = true;
        }
        const total = Number(meta?.tracks?.total);
        if (Number.isFinite(total) && total >= 0 && pl.trackCount !== total) {
          pl.trackCount = total;
          changed = true;
        }
      } catch {
        // ignore
      }
    }
    if (changed) persistPlaylists();
  }

  function buildGamesPayload() {
    return {
      games: playlists.value.map((playlist) => ({
        spotifyPlaylistUrl:
          playlist.playlistUrl || `https://open.spotify.com/playlist/${playlist.id}`,
        title: playlist.name || "",
      })),
    };
  }

  async function importGamesPayload(payload) {
    if (!payload || !Array.isArray(payload.games)) {
      throw new Error('Invalid games file format. Expected: { "games": [...] }');
    }

    loading.value = true;
    try {
      const nextPlaylists = [];
      for (const game of payload.games) {
        const source = String(game?.spotifyPlaylistUrl || "").trim();
        const playlistId = parsePlaylistId(source);
        if (!playlistId) continue;
        if (nextPlaylists.some((playlist) => playlist.id === playlistId)) continue;
        const [meta, tracks] = await Promise.all([
          fetchPlaylistMeta(playlistId, token.value),
          fetchPlaylistTracks(playlistId, token.value).catch(() => []),
        ]);
        const trackCount = tracks.length || Number(meta.tracks?.total) || 0;
        nextPlaylists.push({
          id: meta.id,
          name: String(game?.title || meta.name || "").trim() || meta.name || "Untitled Playlist",
          spotifyName: meta.name || "Untitled Playlist",
          playlistUrl: `https://open.spotify.com/playlist/${meta.id}`,
          uri: meta.uri,
          trackCount,
          playedSongs: [],
          imageUrl: playlistSpecifiedCoverImageUrl(meta),
        });
      }

      playlists.value = nextPlaylists;
      activePlaylistId.value = nextPlaylists[0]?.id || "";
      persistPlaylists();
      persistSettings();
    } finally {
      loading.value = false;
    }
  }

  return {
    token,
    playlists,
    activePlaylist,
    activePlaylistId,
    bingoGameType,
    setBingoGameType,
    gridSize,
    setGridSize,
    nowPlaying,
    isPlaying,
    playbackProgressMs,
    playbackStarted,
    loading,
    error,
    minPlaybackSeconds,
    randomStartEnabled,
    playbackShuffle,
    setPlaybackShuffle,
    setPlaylistTitle,
    verifyState,
    addPlaylistFromInput,
    addLocalDemoPlaylist,
    selectPlaylist,
    resetPlaylist,
    resetPlaylistAndStop,
    removePlaylist,
    refreshPlayback,
    playActivePlaylist,
    playOrResumeGamePlayback,
    playTrackAtIndex,
    pendingNextTrackIndex,
    selectPendingNextTrack,
    clearPendingNextTrack,
    pause,
    next,
    previous,
    playPlayedSong,
    setRandomStartEnabled,
    setMinPlaybackSeconds,
    buildGamesPayload,
    importGamesPayload,
    ensurePlaylistCoverImages,
    setPlaylistCoverImage,
    refreshPlaylistCoverFromSpotify,
    startPolling,
    stopPolling,
    applyGamePlaylistReorder,
    bumpPlaybackPolling: requestResponsivePlaybackPoll,
  };
}

/** Single shared store — multiple `useSpotifyGames()` calls must not fork playlist/token state. */
let spotifyGamesStore = null;

export function useSpotifyGames() {
  if (!spotifyGamesStore) {
    spotifyGamesStore = createSpotifyGamesStore();
  }
  return spotifyGamesStore;
}
