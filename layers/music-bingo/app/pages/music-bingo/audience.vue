<template>
  <div
    class="audience-local h-screen overflow-hidden flex w-full min-w-0 flex-col bg-[radial-gradient(circle_at_top,#0a1f46_0%,#040a1d_55%,#020611_100%)] text-slate-100"
  >
    <main
      class="flex h-full min-h-0 w-full min-w-0 flex-col px-5 pb-4 pt-4 md:px-8 md:pb-6 md:pt-6"
    >
      <p
        v-if="!activePlaylist"
        class="mb-4 shrink-0 rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-center text-sm text-amber-100/95"
      >
        No playlist saved yet — add one under
        <strong class="text-white">Playlists</strong> to show cover art and
        title here.
      </p>

      <!-- main grid: fills all remaining height -->
      <div
        class="min-h-0 flex-1 grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-stretch"
      >
        <!-- left column -->
        <div class="flex min-h-0 flex-col gap-4 lg:col-span-4">
          <!-- logo + cover art: sized to image, no growth -->
          <section
            v-if="activePlaylist"
            class="flex shrink-0 flex-col rounded-xl border border-[#24355b] bg-[#040c20]/88 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] md:p-5"
          >
            <div class="flex shrink-0 items-center gap-3">
              <RouterLink
                to="/music-bingo"
                class="shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#040a1d] rounded-sm"
              >
                <img
                  :src="logoSrc"
                  alt="Music Bingo"
                  class="h-16 w-auto object-contain"
                />
              </RouterLink>
              <p
                class="text-4xl font-bold uppercase tracking-[0.14em] text-violet-300/95 leading-tight"
              >
                {{ activePlaylist.name }}
              </p>
            </div>

            <!-- cover image: natural aspect ratio -->
            <div
              class="mt-3 aspect-square w-full overflow-hidden rounded-xl border border-[#2f456f] bg-slate-900"
            >
              <img
                v-if="coverSrc"
                :src="coverSrc"
                alt=""
                class="h-full w-full object-cover"
                loading="lazy"
                @error="coverFailed = true"
              />
              <div
                v-else
                class="flex h-full w-full items-center justify-center bg-[linear-gradient(145deg,#4f46e5_0%,#0f172a_55%,#701a75_100%)] text-7xl"
                aria-hidden="true"
              >
                🎵
              </div>
            </div>
          </section>

          <!-- winning pattern block: fills remaining height -->
          <section
            class="flex-1 min-h-0 rounded-2xl border border-[#273c65] bg-[#060f25]/90 px-5 py-4 shadow-[0_0_0_1px_rgba(125,146,192,0.12),0_20px_48px_rgba(0,0,0,0.45)]"
          >
            <p
              class="text-base font-bold uppercase tracking-[0.18em] text-violet-300 mb-2"
            >
              Winning pattern
            </p>
            <p class="text-4xl font-bold text-white mb-2">
              {{ patternMeta.label }}
            </p>
            <p class="text-3xl text-slate-300">
              {{ patternMeta.description }}
            </p>
          </section>
        </div>

        <!-- right column: bingo diagram -->
        <section
          class="flex min-h-0 flex-col rounded-2xl border border-[#24355b] bg-[#040c20]/88 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] md:p-5 lg:col-span-8"
        >
          <div
            ref="diagramScaleRef"
            class="audience__diagram-scale min-h-0 min-w-0 flex-1"
          >
            <div
              class="audience__diagram-inner audience__diagram-wrap"
              :style="diagramLayoutStyle"
            >
              <div
                class="audience__bingo-card-grid"
                :style="bingoCardGridStyle"
              >
                <div class="audience__diagram-panel">
                  <BingoWinPatternDiagram
                    :mode="bingoGameType"
                    :grid-size="gridSize"
                    :cell-px="diagramCellPx"
                    :gap-px="0"
                    :show-free-center="false"
                    :flash-on-mode-change="true"
                    class="audience__diagram"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup>
definePageMeta({ name: "mb-audience", layout: "music-bingo" });

import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import {
  resolvePlaylistEntryFromSelection,
  useSpotifyGames,
} from "../../composables/useSpotifyGames.js";
import { effectivePlaylistCoverUrl } from "../../composables/useSpotify.js";
import {
  bingoModeMeta,
  BINGO_GAME_MODE_IDS,
} from "../../data/bingoWinPatterns.js";
import { resolveConfiguredPlaylistCover } from "../../data/localPlaylists.js";
import BingoWinPatternDiagram from "../../components/BingoWinPatternDiagram.vue";
import logoSrc from "../../assets/img/music-bingo-logo.png";

function _parseSpotifyId(url) {
  const m = String(url || "").match(/playlist\/([A-Za-z0-9]{22})/i);
  return m?.[1] || "";
}

import {
  useLocalPlaylists,
  resolvePlaylistImage,
} from "../../composables/useLocalPlaylists.js";
const { playlists: _localPlaylists } = useLocalPlaylists();
const _allLocalPlaylists = _localPlaylists.value.filter(
  (p) => p?.id && p?.image,
);

const localPlaylistImageById = Object.fromEntries(
  _allLocalPlaylists
    .map((p) => [p.id, resolvePlaylistImage(p.image)])
    .filter(([, url]) => url),
);

const localPlaylistImageBySpotifyId = Object.fromEntries(
  _allLocalPlaylists
    .map((p) => [
      _parseSpotifyId(p.spotifyPlaylistUrl),
      resolvePlaylistImage(p.image),
    ])
    .filter(([id, url]) => id && url),
);

const PLAYLISTS_STORAGE_KEY = "spotify_games_playlists";
const SETTINGS_STORAGE_KEY = "spotify_games_settings";
const POLL_MS = 5000;

const { activePlaylist, activePlaylistId, bingoGameType, gridSize, playlists } =
  useSpotifyGames();

const coverFailed = ref(false);
let syncTimer = null;

/** Scale the bingo grid to fit the preview panel with true 5x6 card proportions. */
const diagramScaleRef = ref(null);
const diagramCellPx = ref(56);

const diagramLayoutStyle = computed(() => ({
  "--diagram-cell": `${diagramCellPx.value}px`,
  width: `${diagramCellPx.value * gridSize.value}px`,
  height: `${diagramCellPx.value * gridSize.value}px`,
}));

const bingoCardGridStyle = computed(() => ({
  "--audience-cols": gridSize.value,
}));

let diagramResizeObserver = null;

function measureDiagramSquare() {
  const el = diagramScaleRef.value;
  if (!el) return;
  const { width, height } = el.getBoundingClientRect();
  const maxCellByWidth = Math.floor(width / gridSize.value);
  const maxCellByHeight = Math.floor(height / gridSize.value);
  const nextCell = Math.min(maxCellByWidth, maxCellByHeight);
  diagramCellPx.value = Math.max(20, nextCell);
}

function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function normalizePlaylist(playlist) {
  return {
    id: playlist?.id,
    name: String(
      playlist?.name || playlist?.spotifyName || "Untitled Playlist",
    ),
    spotifyName: String(
      playlist?.spotifyName || playlist?.name || "Untitled Playlist",
    ),
    playlistUrl:
      playlist?.playlistUrl ||
      `https://open.spotify.com/playlist/${playlist?.id}`,
    uri: playlist?.uri,
    trackCount: Number(playlist?.trackCount) || 0,
    playedSongs: Array.isArray(playlist?.playedSongs)
      ? playlist.playedSongs.map((song) => ({
          name: song?.name || "",
          artist: song?.artist || "",
          uri: typeof song?.uri === "string" ? song.uri : "",
        }))
      : [],
    imageUrl: effectivePlaylistCoverUrl(
      typeof playlist?.imageUrl === "string" ? playlist.imageUrl : "",
    ),
  };
}

/** Sync playlists + winning pattern + active playlist id from localStorage (no Spotify API). */
function syncLocalAudienceState() {
  const parsedPlaylists = safeJsonParse(
    localStorage.getItem(PLAYLISTS_STORAGE_KEY),
    [],
  );
  if (Array.isArray(parsedPlaylists)) {
    playlists.value = parsedPlaylists.map(normalizePlaylist);
  }

  const settings = safeJsonParse(
    localStorage.getItem(SETTINGS_STORAGE_KEY),
    {},
  );
  const nextGameType =
    typeof settings?.bingoGameType === "string" ? settings.bingoGameType : "";
  if (nextGameType && BINGO_GAME_MODE_IDS.includes(nextGameType)) {
    bingoGameType.value = nextGameType;
  }

  gridSize.value = Number(settings?.gridSize) === 4 ? 4 : 5;

  const savedActive = String(settings?.activePlaylistId || "").trim();
  const resolvedActive = resolvePlaylistEntryFromSelection(
    playlists.value,
    savedActive,
  );
  if (resolvedActive?.id) {
    activePlaylistId.value = resolvedActive.id;
  } else if (!playlists.value.some((p) => p.id === activePlaylistId.value)) {
    activePlaylistId.value = playlists.value[0]?.id || "";
  }
}

const coverSrc = computed(() => {
  if (coverFailed.value) return "";
  const pl = activePlaylist.value;
  if (!pl) return "";
  const localImg =
    localPlaylistImageById[pl.id] ||
    localPlaylistImageBySpotifyId[_parseSpotifyId(pl.playlistUrl)] ||
    localPlaylistImageBySpotifyId[pl.id];
  if (localImg) return localImg;
  const spotifyUrl = effectivePlaylistCoverUrl(pl.imageUrl);
  if (typeof spotifyUrl === "string" && spotifyUrl.trim()) return spotifyUrl;
  return resolveConfiguredPlaylistCover(pl.id, pl.name) || "";
});

const patternMeta = computed(() => bingoModeMeta(bingoGameType.value));

const durationLabel = computed(() => {
  const tracks = Number(activePlaylist.value?.trackCount) || 0;
  const totalMin = Math.max(1, Math.round(tracks * 3.3));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (!h) return `~${m}m`;
  if (!m) return `~${h}h`;
  return `~${h}h ${m}m`;
});

watch(
  () =>
    `${activePlaylist.value?.id || ""}::${
      activePlaylist.value?.imageUrl || ""
    }`,
  () => {
    coverFailed.value = false;
  },
);

watch(gridSize, () => {
  nextTick(() => measureDiagramSquare());
});

function onStorage(ev) {
  if (
    !ev.key ||
    ev.key === PLAYLISTS_STORAGE_KEY ||
    ev.key === SETTINGS_STORAGE_KEY
  ) {
    syncLocalAudienceState();
  }
}

function onVisibilityChange() {
  if (document.visibilityState === "visible") syncLocalAudienceState();
}

onMounted(() => {
  syncLocalAudienceState();
  syncTimer = window.setInterval(syncLocalAudienceState, POLL_MS);
  window.addEventListener("storage", onStorage);
  document.addEventListener("visibilitychange", onVisibilityChange);

  diagramResizeObserver = new ResizeObserver(() => measureDiagramSquare());
  nextTick(() => {
    const el = diagramScaleRef.value;
    if (el) {
      diagramResizeObserver.observe(el);
      measureDiagramSquare();
      requestAnimationFrame(() => measureDiagramSquare());
    }
  });
});

onUnmounted(() => {
  if (syncTimer) {
    window.clearInterval(syncTimer);
    syncTimer = null;
  }
  window.removeEventListener("storage", onStorage);
  document.removeEventListener("visibilitychange", onVisibilityChange);

  if (diagramResizeObserver) {
    diagramResizeObserver.disconnect();
    diagramResizeObserver = null;
  }
});
</script>

<style scoped>
.audience__diagram-scale {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.audience__diagram-inner {
  flex: 0 0 auto;
  min-width: 0;
  min-height: 0;
  max-width: 100%;
  max-height: 100%;
}

.audience__bingo-card-grid {
  display: grid;
  height: 100%;
  width: 100%;
  min-width: 0;
  min-height: 0;
  grid-template-columns: repeat(var(--audience-cols, 5), minmax(0, 1fr));
  grid-template-rows: repeat(var(--audience-cols, 5), minmax(0, 1fr));
  gap: 0;
}

.audience__bingo-letter {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  padding: 0;
  font-size: calc(var(--diagram-cell, 56px) * 0.62);
  font-weight: 900;
  line-height: 1;
}

.audience__diagram-panel {
  grid-column: 1 / -1;
  grid-row: 1 / -1;
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
}

.audience__diagram-wrap {
  overflow: hidden;
  border-radius: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.8);
  background: linear-gradient(
    180deg,
    rgba(4, 12, 30, 0.9),
    rgba(3, 9, 24, 0.95)
  );
}

.audience__diagram-wrap :deep(.pattern-diagram) {
  height: 100%;
  width: 100%;
}

.audience__diagram :deep(.pattern-diagram) {
  gap: 0;
  align-items: stretch;
}

.audience__diagram :deep(.pattern-diagram__grid) {
  width: 100%;
  height: 100%;
  grid-template-columns: repeat(var(--audience-cols, 5), minmax(0, 1fr));
  grid-template-rows: repeat(var(--audience-cols, 5), minmax(0, 1fr));
  padding: 0;
  border-radius: 0.65rem;
  border: 0;
  background: linear-gradient(
    180deg,
    rgba(5, 14, 34, 0.96),
    rgba(4, 12, 30, 0.98)
  );
  box-shadow: none;
}

.audience__diagram :deep(.pattern-diagram__cell) {
  width: 100%;
  min-height: 0;
  height: 100%;
  border-radius: 0;
  border: 1px solid rgba(255, 255, 255, 0.8);
  background: rgba(4, 11, 29, 0.9);
}

.audience__diagram :deep(.pattern-diagram__cell--on) {
  background: rgba(140, 67, 250, 0.9);
  border-color: rgba(255, 255, 255, 0.8);
  box-shadow: inset 0 0 18px rgba(233, 120, 255, 0.4),
    0 0 20px rgba(217, 70, 239, 0.52);
}

.audience__diagram
  :deep(.pattern-diagram__cell--free.pattern-diagram__cell--on) {
  background: rgba(140, 67, 250, 0.9);
  border-color: rgba(255, 255, 255, 0.8);
}

.audience__diagram :deep(.pattern-diagram__hint) {
  display: none;
}
</style>
