<template>
  <div class="flex flex-col items-center gap-8">
    <div
      v-for="(page, pi) in pages"
      :key="pi"
      :ref="(el) => setPrintPageRef(el, pi)"
      class="card-gen-print-page relative flex w-full max-w-none flex-col border-0 bg-white p-0 shadow-none"
      :style="{ aspectRatio: pageAspectRatio }"
    >
      <div class="flex min-h-0 flex-1 flex-col justify-center">
        <div
          v-if="props.headerImage"
          class="cards-layout-row flex min-w-0 items-end justify-center gap-[0.6%] pb-1 pt-0.5"
          :class="page.length === 1 ? 'single-page-cards' : 'double-page-cards'"
          :style="{ '--card-max-width': cardWidthPx + 'px', ...hPadStyle }"
        >
          <div class="flex min-h-0 min-w-0 flex-[1_1_0] flex-col items-start justify-center">
            <div class="h-[115px] overflow-hidden">
              <img
                :src="props.headerImage"
                alt=""
                class="block h-[115px] w-auto object-contain object-left"
              />
            </div>
          </div>
          <div class="flex min-h-0 min-w-0 flex-[1_1_0] items-end justify-end">
            <h2
              v-if="hasTitle"
              class="m-0 max-w-full break-words text-right leading-tight text-slate-900"
              :style="titleLineStyle"
            >
              {{ title }}
            </h2>
          </div>
        </div>
        <div v-else-if="hasTitle" class="w-full pb-0.5 pt-0.5" :style="hPadStyle">
          <h2 class="m-0 text-left leading-tight text-slate-900" :style="titleLineStyle">
            {{ title }}
          </h2>
        </div>
        <div
          class="cards-layout-row flex min-w-0 items-start justify-center gap-[0.6%] pb-1"
          :class="page.length === 1 ? 'single-page-cards' : 'double-page-cards'"
          :style="{ '--card-max-width': cardWidthPx + 'px', ...hPadStyle }"
        >
          <div
            v-for="(card, ci) in page"
            :key="ci"
            class="flex min-h-0 min-w-0 flex-[1_1_0] flex-col items-stretch justify-center gap-1"
          >
            <div class="flex min-h-0 flex-1 items-center justify-center">
              <component
                :is="theme.component"
                :cells="card"
                :title="title"
                :number="pi * cardsPerPage + ci + 1"
                :show-number="false"
                :compact="false"
                header-image=""
                :show-artist="false"
                :show-bingo-row="showBingoRow"
                :grid-size="gridSize"
                :text-scale="textScale"
                black-ink
              />
            </div>
            <p
              v-if="cards.length > 1"
              class="m-0 shrink-0 text-right text-[11px] font-normal tabular-nums text-slate-500"
            >
              #{{ pi * cardsPerPage + ci + 1 }}
            </p>
          </div>
        </div>
        <div
          v-if="hasFooter"
          class="mt-5 flex w-full flex-col gap-1 pb-0.5 text-left"
          :style="hPadStyle"
        >
          <p
            class="print-footer-line m-0 font-bold text-slate-900"
            :style="footerTitleLineStyle"
          >
            {{ footerTitle }}
          </p>
          <div class="print-footer-events" :style="footerEventsGridStyle">
            <p
              v-for="(line, li) in eventLines"
              :key="li"
              class="print-footer-line m-0 font-normal text-slate-800"
              :style="footerEventLineStyle"
            >
              {{ line }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";

const TITLE_FONT_SIZE_PX = 28;
const FOOTER_FONT_SIZE_PX = 18;
const FOOTER_EVENT_FONT_SIZE_PX = 16;

function formatEventLine(event) {
  const date = String(event?.date || "").trim();
  const time = String(event?.time || "").trim();
  const title = String(event?.title || "").trim();
  const dateTitle = [date, title].filter(Boolean).join(" — ");
  return [dateTitle, time].filter(Boolean).join(" · ");
}

const PAPER_DIMS = {
  letter: [8.5, 11],
  "letter-borderless": [8.5, 11],
  "11x14": [11, 14],
  "11x17": [11, 17],
};

const PRINT_LAYOUTS = {
  letter: { margin: 0.25, gap: 0.03 },
  "letter-borderless": { margin: 0.08, gap: 0.025 },
  "11x14": { margin: 0.2, gap: 0.05 },
  "11x17": { margin: 0.2, gap: 0.05 },
};

const props = defineProps({
  cards: { type: Array, required: true },
  title: { type: String, default: "Music Bingo" },
  paperSize: { type: String, default: "letter" },
  theme: { type: Object, required: true },
  headerImage: { type: String, default: "" },
  showBingoRow: { type: Boolean, default: false },
  gridSize: { type: Number, default: 5 },
  textScale: { type: Number, default: 1 },
  footerTitle: { type: String, default: "Upcoming Events" },
  events: { type: Array, default: () => [] },
});

const cardsPerPage = 2;

const printPageRoots = ref([]);

watch(
  () => props.cards.length,
  () => {
    printPageRoots.value = [];
  },
);

function setPrintPageRef(el, pi) {
  if (el) printPageRoots.value[pi] = el;
}

const pages = computed(() => {
  const result = [];
  const list = props.cards || [];
  for (let i = 0; i < list.length; i += cardsPerPage) {
    result.push(list.slice(i, i + cardsPerPage));
  }
  return result;
});

const pageAspectRatio = computed(() => {
  const [pw, ph] = PAPER_DIMS[props.paperSize] ?? PAPER_DIMS.letter;
  const w = Math.max(pw, ph);
  const h = Math.min(pw, ph);
  return `${w} / ${h}`;
});

const layout = computed(() => PRINT_LAYOUTS[props.paperSize] ?? PRINT_LAYOUTS.letter);

const cardWidthPx = computed(() => {
  const [pw, ph] = PAPER_DIMS[props.paperSize] ?? PAPER_DIMS.letter;
  const longestSide = Math.max(pw, ph);
  const printableW = longestSide - layout.value.margin * 2 - layout.value.gap;
  const perCard = printableW / 2;
  return Math.round(perCard * 96);
});

const hPadStyle = computed(() => {
  const [pw, ph] = PAPER_DIMS[props.paperSize] ?? PAPER_DIMS.letter;
  const longestSide = Math.max(pw, ph);
  const pct = `${((layout.value.margin / longestSide) * 100).toFixed(3)}%`;
  return { paddingLeft: pct, paddingRight: pct };
});

const hasTitle = computed(() => String(props.title || "").trim().length > 0);

const eventLines = computed(() =>
  (props.events || []).map(formatEventLine).filter((line) => line.length > 0),
);
const hasFooter = computed(() => eventLines.value.length > 0);

const titleLineStyle = computed(() => ({
  fontSize: `${TITLE_FONT_SIZE_PX}px`,
  fontWeight: 800,
}));
const footerTitleLineStyle = computed(() => ({
  fontSize: `${FOOTER_FONT_SIZE_PX}px`,
  lineHeight: "1.6rem",
}));
const footerEventLineStyle = computed(() => ({
  fontSize: `${FOOTER_EVENT_FONT_SIZE_PX}px`,
  lineHeight: "1.6rem",
}));
const footerEventsGridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${Math.max(1, Math.ceil(eventLines.value.length / 2))}, auto)`,
}));

function getPrintPageRoots() {
  return pages.value.map((_, pi) => printPageRoots.value[pi]).filter(Boolean);
}

defineExpose({ getPrintPageRoots });
</script>

<style scoped>
.cards-layout-row {
  width: 100%;
}

.double-page-cards > div {
  max-width: calc(50% - 0.3%);
}

.print-footer-events {
  display: grid;
  grid-template-rows: repeat(2, auto);
  grid-auto-flow: column;
  column-gap: 1.5rem;
  row-gap: 0.25rem;
  justify-content: start;
}
</style>
