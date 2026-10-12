<template>
  <div
    class="local-layout flex min-h-full min-w-0 flex-1 flex-col bg-[#0b0e14] text-zinc-100"
  >
    <LocalHeader
      :title="`Print Cards — ${editTitle || playlistId}`"
      subtitle="Edit song titles and generate printable bingo cards."
    >
      <RouterLink
        :to="{ name: 'mb-home' }"
        class="local-btn local-btn--outline-muted inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition hover:bg-white/5"
      >
        <svg
          class="h-4 w-4 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M19 12H5M12 19l-7-7 7-7"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        Back Home
      </RouterLink>
      <RouterLink
        :to="{ name: 'mb-playlists' }"
        class="local-btn local-btn--outline-muted inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition hover:bg-white/5"
      >
        <svg
          class="h-4 w-4 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M9 18V5l12-2v13"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <circle
            cx="6"
            cy="18"
            r="3"
            stroke="currentColor"
            stroke-width="1.75"
          />
          <circle
            cx="18"
            cy="16"
            r="3"
            stroke="currentColor"
            stroke-width="1.75"
          />
        </svg>
        Playlists
      </RouterLink>
    </LocalHeader>

    <main class="flex min-h-0 min-w-0 flex-1 flex-col">
      <!-- Playlist not found -->
      <div
        v-if="!rawData"
        class="mx-auto flex w-full max-w-[900px] flex-1 flex-col items-center justify-center gap-4 px-4 py-16"
      >
        <p class="text-lg font-bold text-rose-300">Playlist not found</p>
        <p class="text-sm text-[#9ca3af]">
          No JSON data found for
          <code class="rounded bg-black/40 px-1 py-0.5 text-xs">{{
            playlistId
          }}</code
          >. Run
          <code class="rounded bg-black/40 px-1 py-0.5 text-xs"
            >pnpm seed-playlists</code
          >
          or add the playlist via the Playlist Builder.
        </p>
        <RouterLink
          :to="{ name: 'mb-playlists' }"
          class="local-btn local-btn--outline-muted rounded-xl px-4 py-2.5 text-sm font-semibold"
        >
          Go to Playlist Builder
        </RouterLink>
      </div>

      <!-- Editor -->
      <div
        v-else
        class="mx-auto grid w-full max-w-[1520px] flex-1 gap-6 px-4 pb-8 pt-6 md:px-6 lg:grid-cols-[360px_1fr] lg:gap-8"
      >
        <!-- Left: cover + print options -->
        <aside class="flex flex-col gap-5">
          <!-- Cover image -->
          <div
            class="overflow-hidden rounded-xl border border-white/[0.08] bg-[#0f1219]/90 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
          >
            <div
              class="relative aspect-square w-full overflow-hidden"
              :class="coverUrl ? '' : coverClass"
            >
              <img
                v-if="coverUrl"
                :src="coverUrl"
                :alt="editTitle"
                class="h-full w-full object-cover"
              />
              <div
                v-else
                class="flex h-full w-full items-center justify-center text-4xl font-black text-white/60 select-none"
              >
                ♪
              </div>
            </div>
            <div class="px-4 py-3">
              <label
                class="block text-xs font-bold uppercase tracking-[0.12em] text-[#c084fc]"
                >Playlist title</label
              >
              <input
                v-model="editTitle"
                type="text"
                class="mt-1.5 w-full rounded-md border border-white/15 bg-[#0b0e14] px-3 py-2 text-sm font-semibold text-white outline-none focus:border-[#a855f7]/60"
                placeholder="Playlist title"
              />
            </div>
          </div>

          <!-- Playlist switcher -->
          <div
            class="rounded-xl border border-white/[0.08] bg-[#0f1219]/90 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
          >
            <label
              class="mb-1.5 block text-sm font-bold uppercase tracking-[0.12em] text-[#c084fc]"
              >Playlist</label
            >
            <select
              :value="playlistId"
              class="w-full rounded-md border border-white/15 bg-[#0b0e14] px-3 py-2 text-sm text-white outline-none focus:border-[#a855f7]/60"
              @change="switchPlaylist($event.target.value)"
            >
              <option v-for="pl in allPlaylists" :key="pl.id" :value="pl.id">
                {{ pl.name }}
              </option>
            </select>
          </div>

          <!-- Print options -->
          <PrintOptionsPanel
            variant="single"
            v-model:headerImage="headerImage"
            v-model:pageCount="pageCount"
            v-model:gridSize="gridSize"
            v-model:hasFreeSpace="hasFreeSpace"
            v-model:footerTitle="footerTitle"
            v-model:events="events"
            :download-disabled="notEnoughTracks || pdfBusy"
            :download-label="`Download PDF (${cardCount} cards / ${pageCount} pages)`"
            :pdf-busy="pdfBusy"
            :pdf-progress="pdfProgress"
            :pdf-error="pdfError"
            @download="requestDownload"
          >
            <template #before-download>
              <p
                v-if="notEnoughTracks"
                class="rounded-md border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-xs text-amber-200"
              >
                Need at least {{ minTracks }} songs for
                {{
                  gridSize === 4
                    ? "4×4"
                    : `5×5${hasFreeSpace ? " (with free space)" : ""}`
                }}. Currently have {{ validTrackCount }}.
              </p>
              <button
                type="button"
                class="local-btn local-btn--outline-muted inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-45"
                :disabled="notEnoughTracks"
                @click="togglePreview"
              >
                <svg
                  class="h-4 w-4 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <rect
                    x="3"
                    y="4"
                    width="18"
                    height="16"
                    rx="2"
                    stroke="currentColor"
                    stroke-width="1.75"
                  />
                  <path
                    d="M3 10h18"
                    stroke="currentColor"
                    stroke-width="1.75"
                  />
                  <path
                    d="M8 15h8"
                    stroke="currentColor"
                    stroke-width="1.75"
                    stroke-linecap="round"
                  />
                </svg>
                {{ previewVisible ? "Hide Preview" : "Preview Cards" }}
              </button>
            </template>
          </PrintOptionsPanel>
        </aside>

        <!-- Right: song list editor -->
        <section class="flex flex-col gap-4">
          <div
            class="rounded-xl border border-white/[0.08] bg-[#0f1219]/90 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
          >
            <div
              class="flex items-center justify-between gap-4 border-b border-white/[0.06] px-5 py-4"
            >
              <div>
                <h2 class="text-base font-bold text-white">
                  Songs
                  <span class="ml-1.5 text-sm font-normal text-[#9ca3af]"
                    >({{ validTrackCount }} valid)</span
                  >
                </h2>
                <p class="mt-0.5 text-xs text-[#64748b]">
                  Edit song titles. Artist names are shown but not printed on
                  cards.
                </p>
              </div>
              <div class="flex items-center gap-2">
                <p
                  v-if="saveStatus === 'saved'"
                  class="text-xs font-semibold text-emerald-400"
                >
                  Saved ✓
                </p>
                <p
                  v-if="saveStatus === 'error'"
                  class="text-xs font-semibold text-rose-400"
                >
                  {{ saveError }}
                </p>
                <button
                  type="button"
                  class="local-btn local-btn--outline-muted inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition hover:bg-white/5"
                  @click="addTrack"
                >
                  + Add song
                </button>
                <button
                  type="button"
                  class="local-btn local-btn--gradient inline-flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-white shadow transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45"
                  :disabled="saveStatus === 'saving'"
                  @click="save"
                >
                  {{ saveStatus === "saving" ? "Saving…" : "Save to JSON" }}
                </button>
              </div>
            </div>

            <div class="max-h-[calc(100vh-18rem)] overflow-y-auto px-4 py-3">
              <div
                v-for="(track, idx) in editTracks"
                :key="idx"
                class="track-row group flex items-center gap-2 border-b border-white/[0.04] py-1.5 last:border-0"
              >
                <span class="w-7 shrink-0 text-right text-xs text-[#4b5563]">{{
                  idx + 1
                }}</span>
                <input
                  v-model="track.name"
                  type="text"
                  :placeholder="`Song ${idx + 1}`"
                  class="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-2 py-1 text-sm outline-none focus:border-[#a855f7]/40 focus:bg-[#0b0e14]"
                  :class="track.doNotPrint ? 'text-[#6b7280]' : 'text-white'"
                />
                <span
                  class="shrink-0 truncate text-sm text-[#4b5563] group-focus-within:text-[#6b7280] md:w-40"
                  >{{ track.artist }}</span
                >
                <button
                  type="button"
                  class="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide transition"
                  :class="
                    track.doNotPrint
                      ? 'bg-amber-500/15 text-amber-300'
                      : 'text-[#374151] opacity-0 hover:text-[#9ca3af] group-hover:opacity-100'
                  "
                  :aria-label="`${track.doNotPrint ? 'Allow printing' : 'Do not print'} song ${idx + 1}`"
                  :title="track.doNotPrint ? 'Excluded from printed cards — click to allow printing' : 'Mark as do not print'"
                  @click="track.doNotPrint = !track.doNotPrint"
                >
                  {{ track.doNotPrint ? "Not printed" : "Print" }}
                </button>
                <button
                  type="button"
                  class="shrink-0 rounded p-1 text-[#374151] opacity-0 transition hover:text-rose-400 group-hover:opacity-100"
                  aria-label="Remove song"
                  @click="removeTrack(idx)"
                >
                  <svg
                    class="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M18 6L6 18M6 6l12 12"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Card preview (lazy) -->
          <div
            v-if="previewVisible"
            class="rounded-xl border border-white/[0.08] bg-[#0f1219]/90 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
          >
            <div class="mb-3 flex items-center gap-3">
              <p
                class="text-xs font-bold uppercase tracking-[0.12em] text-[#c084fc]"
              >
                Card Preview (2 sample cards)
              </p>
              <span
                v-if="previewEmptyCellCount > 0"
                class="rounded bg-rose-500/20 px-2 py-0.5 text-xs font-semibold text-rose-300"
                >⚠ {{ previewEmptyCellCount }} empty
                {{ previewEmptyCellCount === 1 ? "cell" : "cells" }} on card
                1</span
              >
              <span
                v-else
                class="rounded bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-400"
                >✓ All cells filled</span
              >
            </div>
            <PrintableBingoPages
              ref="previewPagesRef"
              :cards="previewCards"
              :title="editTitle"
              paper-size="letter"
              :theme="DEFAULT_THEME"
              :header-image="headerImage"
              :show-bingo-row="false"
              :grid-size="gridSize"
              :footer-title="footerTitle"
              :events="events"
            />
          </div>
        </section>
      </div>
    </main>

    <!-- Validation warning modal -->
    <PrintValidationModal
      v-if="showValidationModal"
      :issues="validationIssues"
      @proceed="confirmDownload"
      @cancel="showValidationModal = false"
    />

    <!-- Off-screen render target for PDF generation -->
    <Teleport to="body">
      <div
        v-if="pdfCards.length"
        class="pointer-events-none fixed left-[-9999px] top-0 z-[-1] w-[min(900px,100vw)]"
        aria-hidden="true"
      >
        <PrintableBingoPages
          ref="pdfPagesRef"
          :cards="pdfCards"
          :title="editTitle"
          paper-size="letter"
          :theme="DEFAULT_THEME"
          :header-image="headerImage"
          :show-bingo-row="false"
          :grid-size="gridSize"
          :footer-title="footerTitle"
          :events="events"
        />
      </div>
    </Teleport>
  </div>
</template>

<script setup>
definePageMeta({ name: "mb-playlists-id-print", layout: "music-bingo" });
import { playlistApiFetch } from "../../../../data/playlistStore.js";

import { computed, nextTick, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import LocalHeader from "../../../../components/LocalHeader.vue";
import PrintOptionsPanel from "../../../../components/PrintOptionsPanel.vue";
import PrintableBingoPages from "../../../../components/PrintableBingoPages.vue";
import PrintValidationModal from "../../../../components/PrintValidationModal.vue";
import { useBingoCards } from "../../../../composables/useBingoCards.js";
import { useExport } from "../../../../composables/useExport.js";
import { usePrintOptions } from "../../../../composables/usePrintOptions.js";
import { validateTracks, hasValidationIssues } from "../../../../composables/usePrintValidation.js";
import { DEFAULT_THEME } from "../../../../themes/index.js";
import {
  getPlaylistTracksData,
  getAllPlaylistsFromFiles,
} from "../../../../data/playlistTracks.js";
import { gradientForPlaylistId } from "../../../../data/localPlaylists.js";
import {
  resolvePlaylistImage,
} from "../../../../composables/useLocalPlaylists.js";
import {
  getStoredToken,
  fetchPlaylistMeta,
  parsePlaylistId,
  playlistSpecifiedCoverImageUrl,
} from "../../../../composables/useSpotify.js";

const route = useRoute();
const router = useRouter();
const playlistId = computed(() => String(route.params.id || "").trim());

const allPlaylists = computed(() => getAllPlaylistsFromFiles());

function switchPlaylist(id) {
  if (id === playlistId.value) return;
  router.push({ name: "mb-playlists-id-print", params: { id } });
}

const rawData = computed(() => getPlaylistTracksData(playlistId.value));

const editTitle = ref("");
const editTracks = ref([]);

watch(
  rawData,
  (data) => {
    editTitle.value = String(data?.title || "").trim() || playlistId.value;
    editTracks.value = Array.isArray(data?.tracks)
      ? data.tracks.map((t) => ({
          name: String(t.name || ""),
          artist: String(t.artist || ""),
          doNotPrint: !!t.doNotPrint,
        }))
      : [];
  },
  { immediate: true },
);

const spotifyImageMap = ref({});

const coverUrl = computed(
  () =>
    resolvePlaylistImage(rawData.value?.image) ||
    spotifyImageMap.value[playlistId.value] ||
    "",
);
const coverClass = computed(() => gradientForPlaylistId(playlistId.value));

async function fetchSpotifyCover() {
  const token = getStoredToken();
  const spotifyPlaylistUrl = rawData.value?.spotifyPlaylistUrl;
  if (!token || resolvePlaylistImage(rawData.value?.image) || !spotifyPlaylistUrl) return;
  const spotifyId = parsePlaylistId(spotifyPlaylistUrl);
  if (!spotifyId) return;
  try {
    const meta = await fetchPlaylistMeta(spotifyId, token);
    const url = playlistSpecifiedCoverImageUrl(meta);
    if (url) spotifyImageMap.value = { ...spotifyImageMap.value, [playlistId.value]: url };
  } catch {
    // silently skip — gradient placeholder will show
  }
}

watch(rawData, fetchSpotifyCover);
onMounted(fetchSpotifyCover);

// ── Print options ──────────────────────────────────────────────────────────
const {
  headerImage,
  pageCount,
  cardCount,
  gridSize,
  hasFreeSpace,
  footerTitle,
  events,
  minTracks,
} = usePrintOptions();

const printableTracks = computed(() =>
  editTracks.value.filter((t) => t.name.trim() && !t.doNotPrint),
);
const validTrackCount = computed(() => printableTracks.value.length);
const notEnoughTracks = computed(() => validTrackCount.value < minTracks.value);

function bingoItems() {
  return printableTracks.value.map((t) => ({ text: t.name, sub: t.artist }));
}

// ── Track editing ──────────────────────────────────────────────────────────
function addTrack() {
  editTracks.value.push({ name: "", artist: "", doNotPrint: false });
}

function removeTrack(idx) {
  editTracks.value.splice(idx, 1);
}

// ── Save ───────────────────────────────────────────────────────────────────
const saveStatus = ref("idle"); // idle | saving | saved | error
const saveError = ref("");

async function save() {
  saveStatus.value = "saving";
  saveError.value = "";
  const payload = {
    title: editTitle.value.trim() || playlistId.value,
    id: playlistId.value,
    image: rawData.value?.image || "",
    spotifyPlaylistUrl: rawData.value?.spotifyPlaylistUrl || "",
    tracksDataUrl: `src/data/playlists/${playlistId.value}.json`,
    tracks: editTracks.value
      .filter((t) => t.name.trim())
      .map((t) => ({
        name: t.name.trim(),
        artist: t.artist.trim(),
        ...(t.doNotPrint ? { doNotPrint: true } : {}),
      })),
  };
  try {
    const res = await playlistApiFetch("/api/write-playlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: playlistId.value, data: payload }),
    });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || "Write failed");
    saveStatus.value = "saved";
    setTimeout(() => {
      if (saveStatus.value === "saved") saveStatus.value = "idle";
    }, 3000);
  } catch (e) {
    saveStatus.value = "error";
    saveError.value = e?.message || String(e);
  }
}

// ── Card preview (lazy) ────────────────────────────────────────────────────
const previewVisible = ref(false);
const {
  cards: previewCards,
  generateCards: generatePreviewCards,
  clearCards: clearPreviewCards,
} = useBingoCards();
const previewEmptyCellCount = computed(
  () =>
    (previewCards.value[0] ?? []).filter(
      (c) => c.text !== "FREE" && !String(c.text ?? "").trim(),
    ).length,
);

function togglePreview() {
  if (previewVisible.value) {
    previewVisible.value = false;
    clearPreviewCards();
    return;
  }
  generatePreviewCards(bingoItems(), {
    count: 2,
    hasFreeSpace: hasFreeSpace.value,
    gridSize: gridSize.value,
  });
  previewVisible.value = true;
}

// Regenerate preview when grid size or free space toggle changes while visible
watch([gridSize, hasFreeSpace], () => {
  if (!previewVisible.value || notEnoughTracks.value) return;
  generatePreviewCards(bingoItems(), {
    count: 2,
    hasFreeSpace: hasFreeSpace.value,
    gridSize: gridSize.value,
  });
});

// ── PDF download ───────────────────────────────────────────────────────────
const pdfBusy = ref(false);
const pdfError = ref("");
const pdfProgress = ref({ current: 0, total: 0 });
const pdfPagesRef = ref(null);
const {
  cards: pdfCards,
  generateCards: generatePdfCards,
  clearCards: clearPdfCards,
} = useBingoCards();
const { createPdfBlob } = useExport();

// ── Pre-download validation ────────────────────────────────────────────────
const showValidationModal = ref(false);
const validationIssues = ref([]);

function requestDownload() {
  const result = validateTracks(editTracks.value);
  if (hasValidationIssues(result)) {
    validationIssues.value = [
      {
        title: editTitle.value.trim() || playlistId.value,
        duplicates: result.duplicates,
        flagged: result.flagged,
      },
    ];
    showValidationModal.value = true;
    return;
  }
  downloadPdf();
}

function confirmDownload() {
  showValidationModal.value = false;
  downloadPdf();
}

async function downloadPdf() {
  pdfBusy.value = true;
  pdfError.value = "";
  pdfProgress.value = { current: 0, total: 0 };
  clearPdfCards();
  const count = Math.max(
    1,
    Math.min(99, Math.floor(Number(cardCount.value)) || 1),
  );
  generatePdfCards(bingoItems(), {
    count,
    hasFreeSpace: hasFreeSpace.value,
    gridSize: gridSize.value,
  });
  try {
    await nextTick();
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    );
    const roots = pdfPagesRef.value?.getPrintPageRoots?.() ?? [];
    if (!roots.length) throw new Error("Could not prepare pages for PDF.");
    const title = `${
      editTitle.value.trim() || playlistId.value
    }_${count}_cards`;
    pdfProgress.value = { current: 0, total: roots.length };
    const { blob, filename } = await createPdfBlob(roots, title, "letter", {
      fullPage: true,
      onProgress: (current, total) => {
        pdfProgress.value = { current, total };
      },
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    pdfError.value = e?.message || String(e);
  } finally {
    pdfBusy.value = false;
    clearPdfCards();
  }
}
</script>
