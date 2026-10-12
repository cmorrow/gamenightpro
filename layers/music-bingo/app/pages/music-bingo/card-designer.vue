<template>
  <div
    class="local-layout flex min-h-full min-w-0 flex-1 flex-col bg-[#0b0e14] text-zinc-100"
  >
    <LocalHeader
      title="Local Card Designer"
      subtitle="Build printable bingo cards from text, CSV, TXT, JSON, or Spotify."
    >
      <RouterLink
        :to="{ name: 'mb-home' }"
        class="local-btn local-btn--outline-muted inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition hover:bg-white/5"
      >
        Back to Local
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
          <path d="M9 18V5l12-2v13" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="6" cy="18" r="3" stroke="currentColor" stroke-width="1.75"/>
          <circle cx="18" cy="16" r="3" stroke="currentColor" stroke-width="1.75"/>
        </svg>
        Playlists
      </RouterLink>
      <RouterLink
        :to="{ name: 'mb-audience' }"
        target="_blank"
        rel="noopener noreferrer"
        class="local-btn local-btn--gradient inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white no-underline shadow-lg transition hover:brightness-110"
      >
        <svg
          class="h-4 w-4 shrink-0 opacity-95"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <rect x="2" y="4" width="20" height="14" rx="2" stroke="currentColor" stroke-width="1.75"/>
          <path d="M8 21h8" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>
          <path d="M12 17v4" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>
        </svg>
        Audience Screen
      </RouterLink>
    </LocalHeader>

    <main class="flex min-h-0 min-w-0 flex-1 flex-col">
      <div
        class="mx-auto flex w-full max-w-[1520px] min-h-0 flex-1 flex-col px-4 pb-6 pt-6 md:px-6 md:pb-8 md:pt-8"
      >
        <div
          class="grid min-h-0 flex-1 grid-cols-1 gap-6 lg:grid-cols-[420px_1fr] lg:gap-8"
        >
          <aside
            class="min-h-0 overflow-y-auto rounded-xl border border-white/[0.08] bg-[#0f1219]/90 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.35)] md:p-5"
          >
            <BingoInput
              :spotify-token="spotifyToken"
              :default-header-image="defaultHeaderImage"
              @generate="handleGenerate"
              @theme-change="currentTheme = $event"
              @title-change="currentTitle = $event || 'Music Bingo'"
              @header-image-change="currentHeaderImage = $event || ''"
              @show-bingo-row-change="currentShowBingoRow = $event"
              @grid-size-change="currentGridSize = $event"
              @font-scale-change="currentTextScale = $event"
              @free-space-change="currentHasFreeSpace = $event"
              @spotify-connected="spotifyToken = $event"
            />
            <div
              v-if="genError"
              class="mt-4 rounded-lg border border-rose-300/40 bg-rose-950/30 px-3 py-2 text-sm font-medium text-rose-300"
            >
              {{ genError }}
            </div>
          </aside>

          <section
            class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-[#0f1219]/90 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
          >
            <template v-if="cards.length">
              <div class="shrink-0 border-b border-white/[0.06] px-5 pb-3 pt-4">
                <div class="flex items-center justify-between gap-3">
                  <p class="m-0 text-sm font-semibold text-slate-200">
                    {{ cards.length }} card{{
                      cards.length !== 1 ? "s" : ""
                    }}
                    generated
                  </p>
                  <a
                    v-if="generatedPdfUrl"
                    :href="generatedPdfUrl"
                    :download="generatedPdfFilename"
                    class="inline-flex items-center gap-1.5 rounded-lg border border-rose-300/35 bg-rose-950/35 px-4 py-2 text-sm font-semibold text-rose-200"
                  >
                    Download PDF
                  </a>
                </div>
              </div>

              <div
                class="relative flex flex-1 flex-col items-center gap-8 overflow-y-auto px-2 py-6 sm:px-4"
              >
                <PrintableBingoPages
                  ref="printPagesRef"
                  :cards="firstPageCards"
                  :title="currentTitle"
                  :paper-size="currentPaperSize"
                  :theme="currentTheme"
                  :header-image="currentHeaderImage"
                  :show-bingo-row="currentShowBingoRow"
                  :grid-size="currentGridSize"
                  :text-scale="currentTextScale"
                />

                <div
                  v-if="isGeneratingPdf"
                  class="absolute inset-0 z-20 flex items-center justify-center bg-black/45"
                >
                  <div
                    class="rounded-xl border border-white/20 bg-slate-900/95 px-5 py-4 text-center text-sm font-semibold text-slate-100 shadow-xl"
                  >
                    <span
                      class="mb-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-500 border-t-slate-100"
                    ></span>
                    <div>Generating preview and PDF...</div>
                  </div>
                </div>
              </div>
            </template>

            <div
              v-else
              class="flex flex-1 flex-col items-center justify-center gap-4 overflow-y-auto px-6 py-8"
            >
              <p
                class="m-0 text-[11px] font-bold uppercase tracking-[0.07em] text-slate-400"
              >
                Full page preview (landscape letter, 2 cards)
              </p>
              <div class="w-full max-w-[980px]">
                <PrintableBingoPages
                  :cards="previewPageCards"
                  :title="currentTitle"
                  paper-size="letter"
                  :theme="currentTheme"
                  :header-image="currentHeaderImage"
                  :show-bingo-row="currentShowBingoRow"
                  :grid-size="currentGridSize"
                  :text-scale="currentTextScale"
                />
              </div>
              <p class="m-0 text-center text-sm text-slate-400">
                Add your word list and click <strong>Generate Cards</strong> to
                get started.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
    <div
      class="pointer-events-none fixed -left-[200vw] top-0 z-[-1] w-[980px] opacity-0"
    >
      <PrintableBingoPages
        ref="hiddenPrintPagesRef"
        :cards="cards"
        :title="currentTitle"
        :paper-size="currentPaperSize"
        :theme="currentTheme"
        :header-image="currentHeaderImage"
        :show-bingo-row="currentShowBingoRow"
        :grid-size="currentGridSize"
        :text-scale="currentTextScale"
      />
    </div>
  </div>
</template>

<script setup>
definePageMeta({ name: "mb-card-designer", layout: "music-bingo" });

import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import LocalHeader from "../../components/LocalHeader.vue";
import BingoInput from "../../components/BingoInput.vue";
import PrintableBingoPages from "../../components/PrintableBingoPages.vue";
import { useBingoCards } from "../../composables/useBingoCards.js";
import { useExport } from "../../composables/useExport.js";
import { DEFAULT_THEME } from "../../themes/index.js";
import {
  getStoredToken,
  handleSpotifyCallback,
} from "../../composables/useSpotify.js";
import defaultHeaderImage from "../../assets/img/cards/header-olive-tree-music-bingo.png";

const SAMPLE_SONGS = [
  { text: "Take On Me", sub: "a-ha" },
  { text: "Careless Whisper", sub: "George Michael" },
  { text: "Purple Rain", sub: "Prince" },
  { text: "Jump", sub: "Van Halen" },
  { text: "Beat It", sub: "Michael Jackson" },
  { text: "Billie Jean", sub: "Michael Jackson" },
  { text: "The Final Countdown", sub: "Europe" },
  { text: "Like a Virgin", sub: "Madonna" },
  { text: "Another One Bites the Dust", sub: "Queen" },
  { text: "I Wanna Dance With Somebody", sub: "Whitney Houston" },
  { text: "Don't Stop Believin'", sub: "Journey" },
  { text: "Walk Like an Egyptian", sub: "The Bangles" },
  { text: "Time After Time", sub: "Cyndi Lauper" },
  { text: "Total Eclipse of the Heart", sub: "Bonnie Tyler" },
  { text: "Sweet Dreams", sub: "Eurythmics" },
  { text: "Down Under", sub: "Men at Work" },
  { text: "Girls Just Want to Have Fun", sub: "Cyndi Lauper" },
  { text: "Wake Me Up Before You Go-Go", sub: "Wham!" },
  { text: "Eye of the Tiger", sub: "Survivor" },
  { text: "Livin' on a Prayer", sub: "Bon Jovi" },
  { text: "Never Gonna Give You Up", sub: "Rick Astley" },
  { text: "With or Without You", sub: "U2" },
  { text: "I Love Rock 'N Roll", sub: "Joan Jett" },
  { text: "Africa", sub: "Toto" },
  { text: "Sweet Child O' Mine", sub: "Guns N' Roses" },
  { text: "Summer of '69", sub: "Bryan Adams" },
  { text: "Every Breath You Take", sub: "The Police" },
  { text: "Don't You (Forget About Me)", sub: "Simple Minds" },
  { text: "Jessie's Girl", sub: "Rick Springfield" },
  { text: "Maneater", sub: "Hall & Oates" },
  { text: "Hungry Like the Wolf", sub: "Duran Duran" },
  { text: "Faith", sub: "George Michael" },
  { text: "Come On Eileen", sub: "Dexys Midnight Runners" },
  { text: "Rock You Like a Hurricane", sub: "Scorpions" },
  { text: "Pour Some Sugar on Me", sub: "Def Leppard" },
  { text: "Footloose", sub: "Kenny Loggins" },
  { text: "You Shook Me All Night Long", sub: "AC/DC" },
  { text: "Karma Chameleon", sub: "Culture Club" },
  { text: "Love Shack", sub: "The B-52's" },
  { text: "Everybody Wants to Rule the World", sub: "Tears for Fears" },
  { text: "The Power of Love", sub: "Huey Lewis & The News" },
  { text: "Nothing's Gonna Stop Us Now", sub: "Starship" },
  { text: "Here I Go Again", sub: "Whitesnake" },
  { text: "Crazy Little Thing Called Love", sub: "Queen" },
  { text: "Let's Dance", sub: "David Bowie" },
  { text: "Take My Breath Away", sub: "Berlin" },
  { text: "Mickey", sub: "Toni Basil" },
  { text: "Walking on Sunshine", sub: "Katrina and the Waves" },
  { text: "Rosanna", sub: "Toto" },
  { text: "Bette Davis Eyes", sub: "Kim Carnes" },
];

const STORAGE_KEY = "bingo_last_generated_cards";
const LOCAL_PRINT_PREFILL_KEY = "bingo_local_print_prefill";
const { cards, error: genError, generateCards } = useBingoCards();
const { createPdfBlob } = useExport();

const printPagesRef = ref(null);
const hiddenPrintPagesRef = ref(null);
const currentTitle = ref("Music Bingo");
const currentHeaderImage = ref("");
const currentPaperSize = ref("letter");
const currentShowBingoRow = ref(false);
const currentGridSize = ref(5);
const currentTheme = ref(DEFAULT_THEME);
const currentTextScale = ref(1);
const currentHasFreeSpace = ref(true);
const spotifyToken = ref(getStoredToken());
const isGeneratingPdf = ref(false);
const generatedPdfUrl = ref("");
const generatedPdfFilename = ref("");

onBeforeUnmount(() => {
  if (generatedPdfUrl.value) URL.revokeObjectURL(generatedPdfUrl.value);
});

onMounted(async () => {
  if (window.location.search.includes("code=")) {
    try {
      await handleSpotifyCallback();
      spotifyToken.value = getStoredToken();
    } catch (e) {
      console.error("Spotify callback failed:", e);
    }
  }
  applyLocalPrintPrefill();
});

watch(
  cards,
  (newCards) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newCards));
  },
  { deep: true },
);

function saveSongListJson(songList) {
  const payload = JSON.stringify(
    { ...songList, exportedAt: new Date().toISOString() },
    null,
    2,
  );
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const safeName = (songList.title || "songs").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  a.download = `${safeName}-songs.json`;
  a.click();
  URL.revokeObjectURL(url);
}

async function handleGenerate({
  items,
  count,
  gridSize,
  hasFreeSpace,
  showBingoRow,
  fontScale,
  title,
  headerImage,
  paperSize,
  autoExportPdf,
  theme,
  songList,
}) {
  isGeneratingPdf.value = true;
  currentTitle.value = title;
  currentHeaderImage.value = headerImage || "";
  currentPaperSize.value = paperSize || "letter";
  currentGridSize.value = Number(gridSize) === 5 ? 5 : 4;
  currentHasFreeSpace.value = Boolean(hasFreeSpace);
  currentShowBingoRow.value = Boolean(showBingoRow);
  currentTextScale.value = Number(fontScale) || 1;
  currentTheme.value = theme || DEFAULT_THEME;
  generateCards(items, {
    count,
    hasFreeSpace,
    gridSize: currentGridSize.value,
  });

  if (songList && !genError.value) {
    saveSongListJson(songList);
  }

  if (generatedPdfUrl.value) {
    URL.revokeObjectURL(generatedPdfUrl.value);
    generatedPdfUrl.value = "";
    generatedPdfFilename.value = "";
  }

  if (!autoExportPdf || genError.value) {
    isGeneratingPdf.value = false;
    return;
  }

  try {
    await nextTick();
    const pageRoots = getAllPrintPageRoots();
    if (!pageRoots.length) return;
    const { blob, filename } = await createPdfBlob(
      pageRoots,
      currentTitle.value || "bingo-cards",
      currentPaperSize.value,
      { fullPage: true },
    );
    generatedPdfUrl.value = URL.createObjectURL(blob);
    generatedPdfFilename.value = filename;
    const autoDownloadLink = document.createElement("a");
    autoDownloadLink.href = generatedPdfUrl.value;
    autoDownloadLink.download = generatedPdfFilename.value;
    autoDownloadLink.click();
  } finally {
    isGeneratingPdf.value = false;
  }
}

function applyLocalPrintPrefill() {
  let raw = "";
  try {
    raw = sessionStorage.getItem(LOCAL_PRINT_PREFILL_KEY) || "";
    if (!raw) return;
    sessionStorage.removeItem(LOCAL_PRINT_PREFILL_KEY);
  } catch {
    return;
  }
  try {
    const payload = JSON.parse(raw);
    const items = Array.isArray(payload.items) ? payload.items : [];
    if (!items.length) return;
    handleGenerate({
      items,
      count: Math.min(99, Math.max(1, Number(payload.count) || 10)),
      gridSize: Number(payload.gridSize) === 4 ? 4 : 5,
      hasFreeSpace: payload.hasFreeSpace !== false,
      showBingoRow: Boolean(payload.showBingoRow),
      title: String(payload.title || "Music Bingo"),
      headerImage: "",
      paperSize: payload.paperSize || "letter",
      theme: DEFAULT_THEME,
    });
  } catch (e) {
    console.warn("Local print prefill invalid", e);
  }
}

function getPrintPageRoots() {
  return printPagesRef.value?.getPrintPageRoots?.() ?? [];
}

function getAllPrintPageRoots() {
  return hiddenPrintPagesRef.value?.getPrintPageRoots?.() ?? [];
}

const firstPageCards = computed(() => cards.value.slice(0, 2));

const previewPageCards = computed(() => {
  const totalCells = currentGridSize.value * currentGridSize.value;
  const hasCenterFreeSpace =
    currentGridSize.value === 5 && currentHasFreeSpace.value;
  const songsPerCard = hasCenterFreeSpace ? totalCells - 1 : totalCells;
  const totalSongsNeeded = songsPerCard * 2;
  const songs = SAMPLE_SONGS.slice(0, totalSongsNeeded);

  const createCard = (startIndex) => {
    const songSlice = songs
      .slice(startIndex, startIndex + songsPerCard)
      .map((item) => ({ ...item }));
    if (!hasCenterFreeSpace) return songSlice;
    const center = Math.floor(totalCells / 2);
    const card = [...songSlice];
    card.splice(center, 0, { text: "FREE", sub: "" });
    return card;
  };

  return [createCard(0), createCard(songsPerCard)];
});
</script>
