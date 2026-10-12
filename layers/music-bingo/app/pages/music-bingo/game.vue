<template>
  <main class="game-page flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
    <section class="game-shell">
      <div
        v-if="!spotifyToken"
        class="rounded-2xl border border-emerald-400/40 bg-slate-900/80 p-5 text-slate-100"
      >
        <p class="mb-3 text-base">
          Spotify Premium is required to play tracks from this app.
        </p>
        <button
          class="rounded-xl bg-[var(--brand-success)] px-4 py-2 font-bold text-white disabled:opacity-60"
          :disabled="!clientIdConfigured"
          @click="connectSpotify"
        >
          Authorize with Spotify
        </button>
      </div>

      <template v-else-if="activePlaylist">
        <header class="game-header">
          <div class="flex min-w-0 items-center gap-3">
            <RouterLink
              to="/music-bingo"
              class="shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-main,#0f172a)] rounded-sm"
            >
              <img
                src="../../assets/img/music-bingo-logo.png"
                alt="Music Bingo"
                class="h-12 w-auto shrink-0"
              />
            </RouterLink>
            <div class="min-w-0">
              <h1 class="truncate text-2xl font-bold text-white">
                {{ activePlaylist.name }}
              </h1>
              <p class="text-sm text-slate-300">
                <span class="mr-4">{{ playerCount }} players</span>
                <span>{{ selectedGameTypeLabel }}</span>
              </p>
            </div>
          </div>
          <div class="flex flex-wrap items-center justify-end gap-2">
            <RouterLink
              to="/music-bingo/audience"
              target="_blank"
              rel="noopener noreferrer"
              class="game-action-btn audience"
              >Audience Screen</RouterLink
            >
            <button
              class="game-action-btn end-game"
              :disabled="loading"
              @click="onEndGame"
            >
              End Game
            </button>
            <button class="game-action-btn verify" @click="onVerifyWinner">
              Verify Winner
            </button>
            <button class="game-icon-btn" title="Game settings">
              <span aria-hidden="true">⚙</span>
            </button>
          </div>
        </header>

        <section class="game-body">
          <aside class="left-panel">
            <div class="left-panel-scroll">
              <div class="panel-title">Playlist Cover</div>
              <div class="art-card">
                <img
                  v-if="playlistCardCoverSrc(activePlaylist)"
                  :src="playlistCardCoverSrc(activePlaylist)"
                  alt=""
                  class="h-full w-full object-contain"
                  @error="onPlaylistCoverImageError(activePlaylist.id)"
                />
                <div
                  v-else
                  class="h-full w-full bg-gradient-to-br from-fuchsia-500/35 via-indigo-500/30 to-slate-950"
                />
              </div>
              <h2 class="truncate text-2xl font-extrabold text-white">
                {{ activePlaylist.name }}
              </h2>
              <p class="text-lg text-slate-300">
                {{ playlistTableRows.length }} songs
              </p>

              <div class="divider" />

              <div class="panel-title">Game Info</div>
              <div class="info-row">
                <span>Game Type</span><span>{{ selectedGameTypeLabel }}</span>
              </div>
              <div class="info-row">
                <span>Winning Pattern</span
                ><span>{{ selectedWinningPatternLabel }}</span>
              </div>
              <div class="mt-2">
                <label
                  for="winningPattern"
                  class="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-400"
                  >Change winning pattern</label
                >
                <select
                  id="winningPattern"
                  :value="bingoGameType"
                  class="w-full rounded-lg border border-blue-300/35 bg-slate-900/80 px-2.5 py-2 text-sm text-slate-100 outline-none"
                  @change="onWinningPatternChange"
                >
                  <option
                    v-for="pattern in winningPatternOptions"
                    :key="pattern.id"
                    :value="pattern.id"
                  >
                    {{ pattern.label }}
                  </option>
                </select>
              </div>
              <div class="info-row">
                <span>Players</span><span>{{ playerCount }}</span>
              </div>
            </div>
          </aside>

          <section class="playlist-panel">
            <div class="playlist-head">
              <p class="uppercase tracking-[0.18em] text-fuchsia-300 text-sm">
                Playlist ({{ playlistTableRows.length }} songs)
              </p>
              <p class="text-xs text-slate-400 text-right">
                <span class="block">Song Counter: {{ playbackCounter }}</span>
                <span class="text-slate-500"
                  >Drag
                  <span class="text-slate-400">⠿</span> on unplayed rows to
                  reorder</span
                >
              </p>
            </div>
            <div class="playlist-table-wrap">
              <table class="playlist-table">
                <thead>
                  <tr>
                    <th class="w-9"></th>
                    <th class="w-8"></th>
                    <th class="w-12">#</th>
                    <th>Song</th>
                    <th>Artist</th>
                    <th class="w-20 text-right">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(track, idx) in playlistTableRows"
                    :key="track.uri || `${track.name}:${track.artist}:${idx}`"
                    class="playlist-row"
                    :class="{
                      current: isCurrentTrack(track),
                      played: isPlayedTrack(track),
                      'pending-next': pendingNextTrackIndex === idx,
                      'source-dragging': playlistDragSourceIndex === idx,
                      'drag-over':
                        playlistDragOverIndex === idx &&
                        playlistRowDraggable(track),
                    }"
                    role="button"
                    tabindex="0"
                    title="Queue as next track (press Next to play). Click again to clear."
                    @click="onPlaylistRowClick(idx)"
                    @keydown.enter.prevent="onPlaylistRowClick(idx)"
                    @keydown.space.prevent="onPlaylistRowClick(idx)"
                    @dragover="onPlaylistRowDragOver($event, idx)"
                    @dragleave="onPlaylistRowDragLeave(idx)"
                    @drop.prevent="onPlaylistRowDrop($event, idx)"
                  >
                    <td class="playlist-drag-cell" @click.stop>
                      <span
                        v-if="playlistRowDraggable(track)"
                        class="drag-handle"
                        draggable="true"
                        title="Drag to reorder (unplayed only)"
                        aria-label="Drag to reorder"
                        @dragstart="onPlaylistDragStart($event, idx)"
                        @dragend="onPlaylistDragEnd"
                      >
                        ⠿
                      </span>
                    </td>
                    <td class="text-center text-sm">
                      {{ isPlayedTrack(track) ? "✓" : "" }}
                    </td>
                    <td>{{ idx + 1 }}</td>
                    <td class="font-medium text-white">{{ track.name }}</td>
                    <td>{{ track.artist }}</td>
                    <td class="text-right">{{ track.durationLabel }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </section>

        <footer class="transport-bar">
          <button
            class="transport-icon"
            :disabled="loading"
            title="Previous song"
            @click="onPrevious"
          >
            ⏮
          </button>
          <button
            class="transport-play"
            :disabled="loading"
            :title="isPlaying ? 'Pause playback' : 'Start playback'"
            @click="onTogglePlayPause"
          >
            {{ isPlaying ? "❚❚" : "▶" }}
          </button>
          <button
            class="transport-icon"
            :disabled="loading"
            title="Next song"
            @click="onNext"
          >
            ⏭
          </button>
          <button class="transport-icon" title="Repeat (coming soon)">↻</button>
          <div class="transport-time">{{ playbackCounter }}</div>
          <input
            type="range"
            min="0"
            max="100"
            :value="playbackProgressPercent"
            class="seek-slider"
            title="Playback progress"
          />
          <div class="volume-wrap">
            <span>🔊</span>
            <input
              v-model.number="uiVolume"
              type="range"
              min="0"
              max="100"
              class="volume-slider"
              title="Volume"
            />
            <span>{{ uiVolume }}%</span>
          </div>
        </footer>

        <Teleport to="body">
          <div
            v-if="verifyWinnerModalOpen"
            class="verify-modal-overlay"
            role="dialog"
            aria-modal="true"
            aria-label="Verify winner"
            @click.self="closeVerifyWinnerModal"
          >
            <section class="verify-modal-panel">
              <div class="verify-modal-header">
                <h2 class="text-2xl font-bold text-white">Verify Winner</h2>
                <button
                  type="button"
                  class="verify-modal-close"
                  @click="closeVerifyWinnerModal"
                >
                  Close
                </button>
              </div>
              <p class="mt-1 text-sm text-slate-300">
                Showing songs played so far ({{
                  playedSongsForVerification.length
                }}). Selected for verification:
                <span class="font-semibold text-fuchsia-200">{{
                  verifyWinnerSelectedCount
                }}</span>
              </p>
              <div
                class="mt-4 rounded-xl border border-blue-300/25 bg-slate-950/65 p-3"
              >
                <p
                  class="text-sm font-semibold"
                  :class="
                    verifyState.status === 'pass'
                      ? 'text-green-300'
                      : 'text-rose-300'
                  "
                >
                  {{
                    verifyState.status === "pass"
                      ? `PASS (${verifyState.matched}/${verifyState.required} matches)`
                      : `IN PROGRESS (${verifyState.matched}/${verifyState.required} matches)`
                  }}
                </p>
              </div>
              <div class="verify-modal-list-wrap">
                <ul
                  v-if="playedSongsForVerification.length"
                  class="verify-modal-list"
                >
                  <li
                    v-for="(song, idx) in playedSongsForVerification"
                    :key="`${song.uri || 'nouri'}:${song.name}:${
                      song.artist
                    }:${idx}`"
                    class="verify-modal-row"
                    :class="{
                      'verify-modal-row--selected': isVerifyWinnerSongSelected(
                        idx,
                      ),
                    }"
                  >
                    <label class="verify-modal-row-label">
                      <input
                        type="checkbox"
                        class="verify-modal-input"
                        :checked="isVerifyWinnerSongSelected(idx)"
                        :aria-label="`Include ${song.name} in verification`"
                        @change="toggleVerifyWinnerSong(idx)"
                      />
                      <span class="verify-modal-check-ui" aria-hidden="true">
                        <svg
                          class="verify-modal-check-svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            class="verify-modal-check-path"
                            stroke="currentColor"
                            stroke-width="2.6"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </span>
                      <span class="verify-modal-order">{{ idx + 1 }}</span>
                      <span class="verify-modal-track">
                        <span class="verify-modal-title">{{
                          song.name
                        }}</span>
                        <span class="verify-modal-dash">–</span>
                        <span class="verify-modal-artist">{{
                          song.artist || "Unknown artist"
                        }}</span>
                      </span>
                    </label>
                  </li>
                </ul>
                <p v-else class="py-8 text-center text-slate-400">
                  No songs have been played yet.
                </p>
              </div>
            </section>
          </div>
        </Teleport>
      </template>

      <section
        v-else
        class="rounded-xl border border-[var(--border-soft)] bg-[var(--surface-card)] p-4 text-[var(--text-muted)]"
      >
        Select or add a playlist to open playback controls.
      </section>

      <p v-if="errorMessage" class="mt-3 text-sm text-rose-300">
        {{ errorMessage }}
      </p>
      <p v-if="cardGenerationError" class="mt-2 text-sm text-rose-300">
        {{ cardGenerationError }}
      </p>

      <div
        class="pointer-events-none fixed left-[-9999px] top-0 z-0 w-[1000px]"
        aria-hidden="true"
      >
        <div class="grid w-full grid-cols-2 gap-2.5 p-1">
          <ThemeDefault
            v-for="(card, index) in generatedCards"
            :key="`print-${index}`"
            :ref="(el) => setPrintCardRef(el, index)"
            :cells="card"
            :title="`${
              activePlaylist?.name || 'Music Bingo'
            } - ${selectedGameTypeLabel}`"
            :number="index + 1"
            :show-number="true"
            :compact="false"
            :header-image="''"
            :show-artist="false"
            :show-bingo-row="false"
            :grid-size="GAME_CARD_GRID_SIZE"
            black-ink
          />
        </div>
      </div>
    </section>
  </main>
</template>

<script setup>
definePageMeta({ name: "mb-game", layout: "music-bingo" });

import {
  computed,
  onMounted,
  onUnmounted,
  ref,
  nextTick,
  watch,
} from "vue";
import { useRouter } from "vue-router";
import { useSpotifyGames } from "../../composables/useSpotifyGames.js";
import {
  hasClientId,
  startSpotifyAuth,
  getStoredToken,
  handleSpotifyCallback,
  fetchPlaylistTracks,
  effectivePlaylistCoverUrl,
  parsePlaylistId,
} from "../../composables/useSpotify.js";
import {
  useLocalPlaylists,
  resolvePlaylistImage,
} from "../../composables/useLocalPlaylists.js";
import {
  BINGO_GAME_MODE_IDS,
  BINGO_GAME_MODES,
} from "../../data/bingoWinPatterns.js";
import { useBingoCards } from "../../composables/useBingoCards.js";
import { useExport } from "../../composables/useExport.js";
import { getFirstConfiguredPlaylistId } from "../../data/localPlaylists.js";
import ThemeDefault from "../../themes/ThemeDefault.vue";

const router = useRouter();

const DETAILS_BRIDGE_KEY = "bingo_details_bridge";

function consumeDetailsBridge() {
  const raw = sessionStorage.getItem(DETAILS_BRIDGE_KEY);
  if (!raw) return null;
  sessionStorage.removeItem(DETAILS_BRIDGE_KEY);
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

const playlistInput = ref("");
const playlistSearch = ref("");
const errorMessage = ref("");
const cardGenerationError = ref("");
const generatingCards = ref(false);
const playerCount = ref(1);
const clientIdConfigured = hasClientId();
const spotifyToken = ref(getStoredToken());
const generatedCardRefs = ref([]);
const cardsPerPage = 2;
const GAME_CARD_GRID_SIZE = 5;

const {
  cards: generatedCards,
  generateCards: generateGameCards,
  error: bingoCardsInternalError,
} = useBingoCards();
const { openPdfForPrint, createPdfBlob } = useExport();

const generatedPdfFilename = ref("");
const generatedPdfUrl = ref("");

const {
  token: gamesToken,
  playlists,
  activePlaylist,
  activePlaylistId,
  nowPlaying,
  isPlaying,
  playbackProgressMs,
  playbackStarted,
  loading,
  setPlaybackShuffle,
  verifyState,
  addPlaylistFromInput,
  addLocalDemoPlaylist,
  selectPlaylist,
  resetPlaylistAndStop,
  removePlaylist,
  refreshPlayback,
  playActivePlaylist,
  playOrResumeGamePlayback,
  pendingNextTrackIndex,
  selectPendingNextTrack,
  pause,
  next,
  previous,
  playPlayedSong,
  buildGamesPayload,
  importGamesPayload,
  ensurePlaylistCoverImages,
  startPolling,
  stopPolling,
  bingoGameType,
  setBingoGameType,
  applyGamePlaylistReorder,
} = useSpotifyGames();

const playlistCoverImageFailedIds = ref({});
const playlistTracks = ref([]);
const uiVolume = ref(75);
const verifyWinnerModalOpen = ref(false);
/** Indices of songs checked in the Verify Winner modal (Set for stable toggles). */
const verifyWinnerSelectedIndices = ref(new Set());

const verifyWinnerSelectedCount = computed(
  () => verifyWinnerSelectedIndices.value.size,
);

function isVerifyWinnerSongSelected(idx) {
  return verifyWinnerSelectedIndices.value.has(idx);
}

function toggleVerifyWinnerSong(idx) {
  const next = new Set(verifyWinnerSelectedIndices.value);
  if (next.has(idx)) next.delete(idx);
  else next.add(idx);
  verifyWinnerSelectedIndices.value = next;
}

/** Bundled cover from `src/data/playlists/<id>.json`, matched by JSON id or Spotify playlist id. */
const { getPlaylistById, playlists: localPlaylists } = useLocalPlaylists();
function localPlaylistCoverSrc(playlist) {
  if (!playlist) return "";
  const spotifyId =
    parsePlaylistId(String(playlist.playlistUrl || "").trim()) || playlist.id;
  const local =
    getPlaylistById(playlist.id) ||
    localPlaylists.value.find(
      (p) => parsePlaylistId(String(p.spotifyPlaylistUrl || "").trim()) === spotifyId,
    );
  return resolvePlaylistImage(local?.image);
}

function playlistCardCoverSrc(playlist) {
  const url =
    localPlaylistCoverSrc(playlist) || effectivePlaylistCoverUrl(playlist?.imageUrl);
  if (!url || playlistCoverImageFailedIds.value[playlist.id]) return "";
  return url;
}

function onPlaylistCoverImageError(playlistId) {
  playlistCoverImageFailedIds.value = {
    ...playlistCoverImageFailedIds.value,
    [playlistId]: true,
  };
}

const playbackCounter = computed(() => {
  const totalMs = Number(nowPlaying.value?.duration_ms) || 0;
  if (!totalMs) return "--:-- / --:--";
  const currentMs = Math.min(Number(playbackProgressMs.value) || 0, totalMs);
  return `${formatMs(currentMs)} / ${formatMs(totalMs)}`;
});
const filteredPlaylists = computed(() => {
  const sorted = [...playlists.value].sort((a, b) =>
    (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" }),
  );
  const query = playlistSearch.value.trim().toLowerCase();
  if (!query) return sorted;
  return sorted.filter((playlist) =>
    (playlist.name || "").toLowerCase().includes(query),
  );
});
const selectedGameTypeLabel = computed(() => "Music Bingo");
const winningPatternOptions = BINGO_GAME_MODES;
const selectedWinningPatternLabel = computed(
  () =>
    winningPatternOptions.find((pattern) => pattern.id === bingoGameType.value)
      ?.label || "One line",
);
const playbackProgressPercent = computed(() => {
  const duration = Number(nowPlaying.value?.duration_ms) || 0;
  if (!duration) return 0;
  return Math.min(
    100,
    Math.max(
      0,
      Math.round((Number(playbackProgressMs.value) / duration) * 100),
    ),
  );
});
const playedTrackKeys = computed(
  () =>
    new Set(
      (activePlaylist.value?.playedSongs || []).map(
        (song) =>
          `${(song.name || "").trim().toLowerCase()}::${(song.artist || "")
            .trim()
            .toLowerCase()}`,
      ),
    ),
);
const playedSongsForVerification = computed(
  () => activePlaylist.value?.playedSongs || [],
);
const playlistTableRows = computed(() =>
  playlistTracks.value.map((track) => ({
    ...track,
    durationLabel:
      Number(track.duration_ms) > 0
        ? formatMs(Number(track.duration_ms))
        : "--:--",
  })),
);

function formatMs(ms) {
  if (!ms) return "0:00";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function normalizeTrackKey(name, artist) {
  return `${(name || "").trim().toLowerCase()}::${(artist || "")
    .trim()
    .toLowerCase()}`;
}

function isCurrentTrack(track) {
  if (!nowPlaying.value) return false;
  return (
    normalizeTrackKey(track.name, track.artist) ===
    normalizeTrackKey(
      nowPlaying.value.name,
      nowPlaying.value.artists?.[0]?.name || "",
    )
  );
}

function isPlayedTrack(track) {
  return playedTrackKeys.value.has(normalizeTrackKey(track.name, track.artist));
}

function onVerifyWinner() {
  verifyWinnerSelectedIndices.value = new Set();
  verifyWinnerModalOpen.value = true;
}

function closeVerifyWinnerModal() {
  verifyWinnerModalOpen.value = false;
}

function onWinningPatternChange(event) {
  const next = String(event?.target?.value || "");
  if (!BINGO_GAME_MODE_IDS.includes(next)) return;
  setBingoGameType(next);
}

async function hydratePlaylistTracks() {
  if (!activePlaylist.value || !gamesToken.value) {
    playlistTracks.value = [];
    return;
  }
  try {
    const tracks = await fetchPlaylistTracks(
      activePlaylist.value.id,
      gamesToken.value,
    );
    playlistTracks.value = tracks.map((track) => ({
      name: track.text,
      artist: track.sub,
      duration_ms: Number(track.duration_ms) || 0,
      uri: typeof track.uri === "string" ? track.uri : "",
    }));
    errorMessage.value = "";
    const syncedUris = playlistTracks.value
      .map((t) => t.uri)
      .filter((u) => typeof u === "string" && u.startsWith("spotify:track:"));
    try {
      if (syncedUris.length) applyGamePlaylistReorder(syncedUris);
    } catch {
      /* Session sync must not wipe the loaded track list */
    }
  } catch (err) {
    playlistTracks.value = [];
    errorMessage.value =
      err?.message ||
      "Unable to load playlist tracks from Spotify. Check your connection or sign in again.";
  }
}

async function hydrateAuth() {
  if (window.location.search.includes("code=")) {
    try {
      await handleSpotifyCallback();
      spotifyToken.value = getStoredToken();
      gamesToken.value = spotifyToken.value;
    } catch (error) {
      errorMessage.value = error.message;
    }
  }
}

async function connectSpotify() {
  errorMessage.value = "";
  try {
    await startSpotifyAuth({ usePopup: false });
    spotifyToken.value = getStoredToken();
    gamesToken.value = spotifyToken.value;
    if (spotifyToken.value) {
      if (playlists.value.length) {
        await ensurePlaylistCoverImages();
      }
      await guardAction(refreshPlayback);
      startPolling();
    }
  } catch (e) {
    errorMessage.value = e?.message || "Spotify authorization failed.";
  }
}

async function onAddPlaylist() {
  errorMessage.value = "";
  try {
    await addPlaylistFromInput(playlistInput.value);
    playlistInput.value = "";
  } catch (error) {
    errorMessage.value = error.message;
  }
}

function exportGamesJson() {
  const payload = buildGamesPayload();
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = "games.json";
  link.click();
  URL.revokeObjectURL(href);
}

async function onImportFile(event) {
  errorMessage.value = "";
  const file = event.target?.files?.[0];
  event.target.value = "";
  if (!file) return;
  try {
    const raw = await file.text();
    const parsed = JSON.parse(raw);
    await importGamesPayload(parsed);
  } catch (error) {
    errorMessage.value = error.message || "Unable to import games file.";
  }
}

function onSelectPlaylist(playlistId) {
  selectPlaylist(playlistId);
}

function onClearPlaylistSelection() {
  activePlaylistId.value = "";
}

async function guardAction(action) {
  errorMessage.value = "";
  try {
    await action();
  } catch (error) {
    errorMessage.value = error.message;
  }
}

async function onPlay() {
  await guardAction(playOrResumeGamePlayback);
}

const playlistDraggingFromIndex = ref(null);
const playlistDragOverIndex = ref(null);
const playlistDragSourceIndex = ref(null);
let playlistSuppressClickUntil = 0;
/** Detached drag preview node; removed on dragend. */
let playlistDragGhostEl = null;

function playlistRowDraggable(track) {
  return (
    typeof track.uri === "string" &&
    track.uri.startsWith("spotify:track:") &&
    !isPlayedTrack(track)
  );
}

function isTrackRowPlayedRaw(track) {
  return playedTrackKeys.value.has(normalizeTrackKey(track.name, track.artist));
}

function reorderUnplayedPlaylistTracks(rows, fromIdx, toIdx) {
  const out = [...rows];
  if (fromIdx === toIdx) return out;
  if (
    fromIdx < 0 ||
    toIdx < 0 ||
    fromIdx >= out.length ||
    toIdx >= out.length
  ) {
    return out;
  }
  if (
    isTrackRowPlayedRaw(out[fromIdx]) ||
    isTrackRowPlayedRaw(out[toIdx])
  ) {
    return out;
  }
  const n = out.length;
  const unplayedIndices = [];
  for (let i = 0; i < n; i += 1) {
    if (!isTrackRowPlayedRaw(out[i])) unplayedIndices.push(i);
  }
  const fromRank = unplayedIndices.indexOf(fromIdx);
  const toRank = unplayedIndices.indexOf(toIdx);
  if (fromRank < 0 || toRank < 0) return out;
  const unplayedItems = unplayedIndices.map((i) => out[i]);
  const [moved] = unplayedItems.splice(fromRank, 1);
  unplayedItems.splice(toRank, 0, moved);
  let u = 0;
  for (let i = 0; i < n; i += 1) {
    if (!isTrackRowPlayedRaw(out[i])) {
      out[i] = unplayedItems[u];
      u += 1;
    }
  }
  return out;
}

function onPlaylistDragStart(event, idx) {
  const track = playlistTracks.value[idx];
  if (!track || !playlistRowDraggable(track)) {
    event.preventDefault();
    return;
  }
  playlistDraggingFromIndex.value = idx;
  playlistDragSourceIndex.value = idx;
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("application/x-bingo-row-index", String(idx));
  try {
    event.dataTransfer.setData("text/plain", `${track.name}`);
  } catch {
    /* ignore */
  }

  const row = event.currentTarget?.closest?.("tr");
  if (
    row &&
    typeof event.dataTransfer?.setDragImage === "function"
  ) {
    try {
      const rowRect = row.getBoundingClientRect();
      const offsetX = Math.round(event.clientX - rowRect.left);
      const offsetY = Math.round(event.clientY - rowRect.top);

      const shell = document.createElement("div");
      playlistDragGhostEl = shell;
      shell.className = "playlist-drag-ghost-shell";
      shell.style.width = `${Math.round(rowRect.width)}px`;
      shell.style.boxSizing = "border-box";
      shell.setAttribute("aria-hidden", "true");

      const table = document.createElement("table");
      table.className = "playlist-drag-ghost-table";
      const tbody = document.createElement("tbody");
      const clone = row.cloneNode(true);
      clone.classList.remove("source-dragging", "drag-over");
      clone.querySelectorAll("[draggable]").forEach((el) => {
        el.removeAttribute("draggable");
      });
      tbody.appendChild(clone);
      table.appendChild(tbody);
      shell.appendChild(table);
      shell.style.position = "fixed";
      shell.style.left = "-9999px";
      shell.style.top = "0";
      shell.style.pointerEvents = "none";
      shell.style.zIndex = "2147483647";
      document.body.appendChild(shell);
      void shell.offsetWidth;

      event.dataTransfer.setDragImage(shell, offsetX, offsetY);
    } catch {
      playlistDragGhostEl = null;
    }
  }
}

function onPlaylistDragEnd() {
  if (playlistDragGhostEl?.parentNode) {
    playlistDragGhostEl.parentNode.removeChild(playlistDragGhostEl);
  }
  playlistDragGhostEl = null;
  playlistDragSourceIndex.value = null;
  playlistDraggingFromIndex.value = null;
  playlistDragOverIndex.value = null;
  playlistSuppressClickUntil = Date.now() + 320;
}

function onPlaylistRowDragOver(event, idx) {
  if (playlistDraggingFromIndex.value === null) return;
  const track = playlistTracks.value[idx];
  if (!track || !playlistRowDraggable(track)) return;
  event.preventDefault();
  playlistDragOverIndex.value = idx;
}

function onPlaylistRowDragLeave(idx) {
  if (playlistDragOverIndex.value === idx) playlistDragOverIndex.value = null;
}

function onPlaylistRowDrop(event, idx) {
  let fromIdx = playlistDraggingFromIndex.value;
  if (fromIdx == null && event?.dataTransfer) {
    const s = event.dataTransfer.getData("application/x-bingo-row-index");
    const parsed = Number.parseInt(s, 10);
    if (!Number.isNaN(parsed)) fromIdx = parsed;
  }
  playlistDraggingFromIndex.value = null;
  playlistDragOverIndex.value = null;
  playlistSuppressClickUntil = Date.now() + 320;
  if (fromIdx == null || Number.isNaN(fromIdx) || fromIdx < 0) return;
  if (fromIdx === idx) return;
  const prev = playlistTracks.value;
  if (fromIdx >= prev.length || idx >= prev.length) return;
  const pendingUri =
    pendingNextTrackIndex.value != null
      ? prev[pendingNextTrackIndex.value]?.uri ?? null
      : null;
  const next = reorderUnplayedPlaylistTracks(prev, fromIdx, idx);
  if (next.length !== prev.length) return;
  const unchanged = next.every((t, i) => t === prev[i]);
  if (unchanged) return;
  playlistTracks.value = next;
  const uris = next
    .map((t) => t.uri)
    .filter((u) => typeof u === "string" && u.startsWith("spotify:track:"));
  applyGamePlaylistReorder(uris, { pendingTrackUri: pendingUri });
}

function onPlaylistRowClick(zeroBasedIndex) {
  if (Date.now() < playlistSuppressClickUntil) return;
  selectPendingNextTrack(zeroBasedIndex);
}

async function onPause() {
  await guardAction(pause);
}

async function onTogglePlayPause() {
  if (isPlaying.value) {
    await onPause();
    return;
  }
  await onPlay();
}

async function onNext() {
  await guardAction(next);
}

async function onPrevious() {
  await guardAction(previous);
}

async function onReplayPlayedSong(uri) {
  await guardAction(() => playPlayedSong(uri));
}

async function onEndGame() {
  if (!activePlaylist.value) {
    router.push({ name: "mb-home" });
    return;
  }
  await guardAction(() => resetPlaylistAndStop(activePlaylist.value.id));
  if (!errorMessage.value) {
    router.push({ name: "mb-home" });
  }
}

function setPrintCardRef(el, index) {
  if (el == null) {
    if (generatedCardRefs.value[index] !== undefined) {
      generatedCardRefs.value[index] = null;
    }
    return;
  }
  const root = el.$el;
  generatedCardRefs.value[index] = root instanceof HTMLElement ? root : el;
}

function getGeneratedCardElements(expectedCount) {
  const out = [];
  const n = expectedCount ?? generatedCardRefs.value.length;
  for (let i = 0; i < n; i += 1) {
    const el = generatedCardRefs.value[i];
    if (el) out.push(el);
  }
  return out;
}

async function waitForPrintCardRoots(totalCards) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    await nextTick();
    const els = getGeneratedCardElements(totalCards);
    if (els.length === totalCards) return els;
    await new Promise((r) => requestAnimationFrame(r));
  }
  return getGeneratedCardElements(totalCards);
}

function revokeGeneratedPdfUrl() {
  if (generatedPdfUrl.value) {
    URL.revokeObjectURL(generatedPdfUrl.value);
    generatedPdfUrl.value = "";
  }
  generatedPdfFilename.value = "";
}

function pdfBaseTitleForPlaylist() {
  const name = activePlaylist.value?.name?.trim() || "bingo-cards";
  return `${name} bingo cards`;
}

async function onGenerateCardsForPlayers() {
  cardGenerationError.value = "";
  revokeGeneratedPdfUrl();
  const safePlayers = Math.max(1, Math.floor(Number(playerCount.value) || 1));
  playerCount.value = safePlayers;
  const totalCards = safePlayers * 2;
  generatedCardRefs.value = new Array(totalCards).fill(null);
  if (!activePlaylist.value) {
    cardGenerationError.value = "Select a playlist first.";
    return;
  }
  generatingCards.value = true;
  try {
    const tracks = await fetchPlaylistTracks(
      activePlaylist.value.id,
      gamesToken.value,
    );
    if (!tracks.length) {
      cardGenerationError.value =
        "No playlist tracks available to generate cards.";
      return;
    }
    generateGameCards(tracks, {
      count: totalCards,
      hasFreeSpace: true,
      gridSize: GAME_CARD_GRID_SIZE,
    });
    if (bingoCardsInternalError.value) {
      cardGenerationError.value = bingoCardsInternalError.value;
      return;
    }
    const elements = await waitForPrintCardRoots(totalCards);
    if (elements.length !== totalCards) {
      cardGenerationError.value =
        "Cards rendered incompletely; try generating again.";
      return;
    }
    try {
      const { blob, filename } = await createPdfBlob(
        elements,
        pdfBaseTitleForPlaylist(),
        "letter",
        {
          pageHeader: {
            title: activePlaylist.value?.name || "Music Bingo",
          },
        },
      );
      generatedPdfFilename.value = filename;
      generatedPdfUrl.value = URL.createObjectURL(blob);
    } catch (pdfErr) {
      cardGenerationError.value =
        pdfErr?.message ||
        "Cards were generated but the PDF could not be created.";
    }
  } catch (error) {
    cardGenerationError.value = error.message || "Unable to generate cards.";
  } finally {
    generatingCards.value = false;
  }
}

async function onPrintCards() {
  const elements = getGeneratedCardElements(generatedCards.value.length);
  if (!elements.length) {
    cardGenerationError.value = "Generate cards before printing.";
    return;
  }
  try {
    await openPdfForPrint(elements, "letter", {
      pageHeader: {
        title: activePlaylist.value?.name || "Music Bingo",
      },
    });
  } catch (error) {
    cardGenerationError.value = error.message || "Unable to print cards.";
  }
}

onMounted(async () => {
  await hydrateAuth();
  gamesToken.value = spotifyToken.value;

  const bridge = consumeDetailsBridge();
  if (bridge?.playlistId) {
    selectPlaylist(String(bridge.playlistId));
  }
  if (bridge?.playerCount != null) {
    playerCount.value = Math.max(
      1,
      Math.floor(Number(bridge.playerCount) || 1),
    );
  }
  if (
    bridge?.gameType &&
    BINGO_GAME_MODE_IDS.includes(String(bridge.gameType))
  ) {
    setBingoGameType(String(bridge.gameType));
  }
  if (typeof bridge?.playbackShuffle === "boolean") {
    setPlaybackShuffle(bridge.playbackShuffle);
  }

  if (spotifyToken.value) {
    if (playlists.value.length) {
      await ensurePlaylistCoverImages();
    }
    await guardAction(refreshPlayback);
    startPolling();
  }

  if (bridge?.generateCards) {
    await nextTick();
    await onGenerateCardsForPlayers();
  }
  if (bridge?.autostart) {
    await nextTick();
    await guardAction(playActivePlaylist);
  }

  const defaultPlaylistId = getFirstConfiguredPlaylistId();
  if (defaultPlaylistId) {
    addLocalDemoPlaylist(defaultPlaylistId);
    if (!bridge?.playlistId) {
      selectPlaylist(defaultPlaylistId);
    }
  }
  await hydratePlaylistTracks();
});

onUnmounted(() => {
  stopPolling();
  revokeGeneratedPdfUrl();
});

watch([activePlaylistId, gamesToken], async () => {
  await hydratePlaylistTracks();
});
</script>

<style scoped>
.game-page {
  padding: 0;
}
.game-shell {
  margin: 0 auto;
  width: 100%;
  max-width: 1520px;
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 1.2rem;
  border: 1px solid rgba(138, 86, 255, 0.25);
  background: radial-gradient(
      circle at 8% 6%,
      rgba(123, 54, 255, 0.22),
      transparent 35%
    ),
    radial-gradient(
      circle at 85% 18%,
      rgba(32, 177, 255, 0.16),
      transparent 35%
    ),
    rgba(5, 11, 25, 0.92);
  box-shadow: 0 18px 40px rgba(1, 5, 18, 0.55);
  padding: 1rem;
}
.game-header {
  flex-shrink: 0;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0;
  padding-bottom: 0.9rem;
}
.game-action-btn,
.game-icon-btn {
  border-radius: 0.7rem;
  border: 1px solid rgba(186, 129, 255, 0.55);
  background: linear-gradient(
    180deg,
    rgba(17, 20, 47, 0.94),
    rgba(9, 13, 35, 0.95)
  );
  color: #d5b7ff;
  padding: 0.55rem 0.95rem;
  font-size: 0.84rem;
  font-weight: 700;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.04),
    0 0 0 1px rgba(157, 103, 255, 0.12);
}
.game-action-btn.audience {
  border-color: rgba(134, 89, 255, 0.6);
  color: #d5b7ff;
}
.game-action-btn.end-game {
  border-color: rgba(255, 54, 93, 0.75);
  color: #ff6a8b;
}
.game-action-btn.verify {
  border-color: rgba(197, 124, 255, 0.78);
  background: linear-gradient(90deg, #5b21b6 0%, #7e22ce 46%, #db2777 100%);
  color: #ffffff;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08),
    0 10px 28px rgba(126, 34, 206, 0.35);
}
.game-action-btn:hover,
.game-icon-btn:hover {
  filter: brightness(1.06);
}
.game-icon-btn {
  width: 2.4rem;
  height: 2.4rem;
  display: grid;
  place-items: center;
  padding: 0;
}
.game-body {
  flex: 1 1 0;
  min-height: 0;
  display: grid;
  gap: 0.8rem;
  grid-template-columns: minmax(270px, 355px) minmax(0, 1fr);
  grid-template-rows: minmax(0, 1fr);
  align-items: stretch;
  overflow: hidden;
}
.left-panel,
.playlist-panel {
  border-radius: 0.9rem;
  border: 1px solid rgba(114, 148, 255, 0.24);
  background: rgba(8, 14, 33, 0.9);
  padding: 0.85rem;
  min-height: 0;
  height: 100%;
}
.left-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.left-panel-scroll {
  flex: 1 1 0;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
}
.playlist-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.panel-title {
  margin-bottom: 0.65rem;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #e879f9;
}
.art-card {
  overflow: hidden;
  border-radius: 0.8rem;
  border: 1px solid rgba(129, 163, 255, 0.25);
  aspect-ratio: 1 / 1;
  background: rgba(2, 6, 23, 0.85);
}
.divider {
  margin: 0.8rem 0;
  border-bottom: 1px solid rgba(148, 163, 184, 0.25);
}
.info-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.92rem;
  color: #d7e2f4;
  margin-bottom: 0.4rem;
}
.view-btn {
  margin-top: 0.7rem;
  display: inline-flex;
  justify-content: center;
  width: 100%;
  border-radius: 0.75rem;
  border: 1px solid rgba(209, 112, 255, 0.5);
  background: rgba(33, 17, 57, 0.85);
  color: #e9d5ff;
  padding: 0.65rem;
  font-weight: 700;
}
.playlist-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.45rem;
}
.playlist-table-wrap {
  flex: 1;
  min-height: 0;
  overflow: auto;
  border-radius: 0.75rem;
  border: 1px solid rgba(129, 163, 255, 0.22);
}
.playlist-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.94rem;
}
.playlist-table th,
.playlist-table td {
  padding: 0.58rem 0.6rem;
  border-bottom: 1px solid rgba(100, 116, 139, 0.25);
  color: #c5d0e4;
}
.playlist-table th {
  position: sticky;
  top: 0;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.72rem;
  background: rgba(7, 12, 28, 0.96);
  z-index: 1;
}
.playlist-table tbody tr.playlist-row {
  cursor: pointer;
}
.playlist-drag-cell {
  width: 1.75rem;
  padding-right: 0;
  vertical-align: middle;
  text-align: center;
}
.playlist-table .drag-handle {
  display: inline-grid;
  place-items: center;
  width: 1.35rem;
  cursor: grab;
  color: rgba(148, 163, 184, 0.85);
  font-size: 0.95rem;
  line-height: 1;
  user-select: none;
  touch-action: none;
}
.playlist-table .drag-handle:active {
  cursor: grabbing;
}
.playlist-table tbody tr.playlist-row.drag-over .drag-handle {
  color: rgba(250, 204, 21, 0.95);
}
.playlist-table tbody tr.playlist-row.drag-over {
  box-shadow: inset 0 0 0 2px rgba(96, 165, 250, 0.55);
  background: rgba(59, 130, 246, 0.08);
}
.playlist-table tbody tr.playlist-row:hover {
  background: rgba(148, 163, 184, 0.08);
}
.playlist-table tbody tr.playlist-row.source-dragging {
  opacity: 0.42;
  background: rgba(15, 23, 42, 0.55);
}
.playlist-table tbody tr.playlist-row.pending-next {
  box-shadow: inset 0 0 0 2px rgba(250, 204, 21, 0.65);
  background: rgba(250, 204, 21, 0.08);
}
.playlist-table tr.current {
  background: linear-gradient(
    90deg,
    rgba(150, 46, 255, 0.2),
    rgba(54, 104, 255, 0.08)
  );
  box-shadow: inset 0 0 0 1px rgba(208, 121, 255, 0.75);
}
.playlist-table tr.played td:first-child {
  color: #f0abfc;
}
.transport-bar {
  flex-shrink: 0;
  width: 100%;
  margin-top: 0.75rem;
  border-radius: 1rem;
  border: 1px solid rgba(129, 163, 255, 0.22);
  background: rgba(5, 10, 24, 0.94);
  padding: 0.55rem 0.75rem;
  padding-bottom: max(0.55rem, env(safe-area-inset-bottom, 0px));
  display: flex;
  align-items: center;
  gap: 0.6rem;
  z-index: 2;
}
.verify-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: rgba(2, 6, 23, 0.64);
  backdrop-filter: blur(12px);
}
.verify-modal-panel {
  width: min(920px, 100%);
  max-height: calc(100vh - 4rem);
  border-radius: 1rem;
  border: 1px solid rgba(168, 85, 247, 0.45);
  background: rgba(7, 11, 28, 0.96);
  box-shadow: 0 18px 48px rgba(2, 6, 23, 0.7);
  padding: 1rem;
  display: flex;
  flex-direction: column;
}
.verify-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
.verify-modal-close {
  border: 1px solid rgba(129, 140, 248, 0.5);
  border-radius: 0.7rem;
  background: rgba(30, 41, 59, 0.85);
  color: #e2e8f0;
  padding: 0.45rem 0.85rem;
  font-size: 0.85rem;
  font-weight: 700;
}
.verify-modal-list-wrap {
  margin-top: 0.9rem;
  min-height: 0;
  overflow: auto;
  border-radius: 0.8rem;
  border: 1px solid rgba(129, 163, 255, 0.2);
  background: rgba(2, 6, 23, 0.76);
}
.verify-modal-list {
  margin: 0;
  padding: 0.65rem 0.75rem 1rem;
  list-style: none;
  font-size: 1.125rem;
  line-height: 1.45;
}
.verify-modal-row {
  margin-bottom: 0.45rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(168, 85, 247, 0.55);
  background: rgba(15, 23, 42, 0.35);
  transition:
    box-shadow 160ms ease,
    background 160ms ease,
    border-color 160ms ease;
}
.verify-modal-row:last-child {
  margin-bottom: 0;
}
.verify-modal-row--selected {
  border-color: rgba(168, 85, 247, 0.55);
  background: rgba(88, 28, 135, 0.38);
  box-shadow:
    0 0 9px rgba(168, 85, 247, 0.228),
    0 0 18px rgba(126, 34, 206, 0.132);
}
.verify-modal-row-label {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  cursor: pointer;
  flex: 1;
  min-width: 0;
  padding: 0.55rem 0.7rem;
  border-radius: inherit;
}
.verify-modal-input {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
.verify-modal-check-ui {
  flex-shrink: 0;
  width: 1.375rem;
  height: 1.375rem;
  margin-top: 0.1rem;
  border-radius: 0.38rem;
  border: 2px solid rgba(192, 132, 252, 0.9);
  background: rgba(15, 23, 42, 0.75);
  display: grid;
  place-items: center;
  transition:
    border-color 160ms ease,
    background 160ms ease,
    box-shadow 160ms ease;
}
.verify-modal-input:focus-visible + .verify-modal-check-ui {
  box-shadow: 0 0 0 2px rgba(192, 132, 252, 0.51);
}
.verify-modal-row--selected .verify-modal-input:focus-visible + .verify-modal-check-ui {
  box-shadow:
    0 0 0 2px rgba(233, 212, 255, 0.33),
    0 0 5px rgba(168, 85, 247, 0.27);
}
.verify-modal-row--selected .verify-modal-check-ui {
  border-color: rgba(233, 212, 255, 0.95);
  background: rgba(126, 34, 206, 0.45);
}
.verify-modal-check-svg {
  width: 0.9rem;
  height: 0.9rem;
  color: #faf5ff;
}
.verify-modal-check-path {
  opacity: 0;
  transition: opacity 140ms ease;
}
.verify-modal-row--selected .verify-modal-check-path {
  opacity: 1;
}
.verify-modal-order {
  flex-shrink: 0;
  min-width: 1.65rem;
  text-align: right;
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  font-size: 0.95em;
  color: rgba(216, 180, 254, 0.9);
  padding-top: 0.12rem;
}
.verify-modal-track {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.35rem 0.5rem;
  min-width: 0;
}
.verify-modal-title {
  font-weight: 600;
  color: #f1f5f9;
}
.verify-modal-dash {
  color: rgba(148, 163, 184, 0.7);
}
.verify-modal-artist {
  color: #cbd5e1;
}
.transport-icon,
.transport-play {
  border: 0;
  color: #dbeafe;
  background: rgba(30, 41, 59, 0.9);
  border-radius: 0.78rem;
  min-width: 2.8rem;
  height: 2.5rem;
  padding: 0 0.65rem;
  display: grid;
  place-items: center;
  font-size: 1.05rem;
  transition: box-shadow 160ms ease, border-color 160ms ease, filter 160ms ease;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.05);
}
.transport-play {
  min-width: 3.2rem;
  height: 2.7rem;
  background: radial-gradient(
    circle at center,
    rgba(193, 93, 255, 0.45),
    rgba(88, 28, 135, 0.95)
  );
}
.transport-icon:hover,
.transport-play:hover {
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.95),
    0 0 14px rgba(255, 255, 255, 0.38);
  filter: brightness(1.08);
}
.transport-icon.active {
  color: #f0abfc;
}
.transport-time {
  min-width: 105px;
  text-align: center;
  font-size: 0.84rem;
  color: #cbd5e1;
}
.seek-slider,
.volume-slider {
  accent-color: #a855f7;
}
.seek-slider {
  flex: 0.8;
}
.volume-wrap {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  color: #cbd5e1;
  min-width: 160px;
}
.volume-slider {
  width: 78px;
}
@media (max-width: 1120px) {
  .game-body {
    grid-template-columns: 1fr;
    grid-template-rows: auto minmax(0, 1fr);
  }
}
</style>

<style>
/*
  Drag preview sits in document.body without Vue scoped attrs — styles live here so
  the cloned row matches the playlist table visually.
*/
.playlist-drag-ghost-shell {
  box-sizing: border-box;
  overflow: hidden;
  border-radius: 0.35rem;
  background: rgba(8, 14, 33, 0.97);
  border: 1px solid rgba(129, 163, 255, 0.42);
  box-shadow:
    0 16px 40px rgba(2, 6, 23, 0.72),
    0 0 0 1px rgba(255, 255, 255, 0.06) inset;
}
.playlist-drag-ghost-table {
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
  font-size: 0.94rem;
}
.playlist-drag-ghost-table td {
  padding: 0.58rem 0.6rem;
  border-bottom: 1px solid rgba(100, 116, 139, 0.25);
  color: #c5d0e4;
}
.playlist-drag-ghost-table tbody tr.playlist-row td.font-medium {
  font-weight: 600;
  color: #f1f5f9;
}
.playlist-drag-ghost-table tbody tr.playlist-row.current {
  background: linear-gradient(
    90deg,
    rgba(150, 46, 255, 0.26),
    rgba(54, 104, 255, 0.12)
  );
  box-shadow: inset 0 0 0 1px rgba(208, 121, 255, 0.75);
}
.playlist-drag-ghost-table tbody tr.playlist-row.pending-next {
  box-shadow: inset 0 0 0 2px rgba(250, 204, 21, 0.65);
  background: rgba(250, 204, 21, 0.1);
}
.playlist-drag-ghost-table tbody tr.playlist-row.played td:nth-child(2) {
  color: #f0abfc;
}
.playlist-drag-ghost-table .playlist-drag-cell {
  width: 1.75rem;
  padding-right: 0;
  vertical-align: middle;
  text-align: center;
}
.playlist-drag-ghost-table .drag-handle {
  display: inline-grid;
  place-items: center;
  width: 1.35rem;
  color: rgba(148, 163, 184, 0.85);
  font-size: 0.95rem;
  line-height: 1;
}
</style>
