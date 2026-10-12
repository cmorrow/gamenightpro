<template>
  <div class="block w-full max-h-full max-w-[min(var(--card-max-width,480px),100%)] overflow-hidden rounded-xl bg-white" :style="scaledTextVars">
    <div v-if="props.headerImage" class="relative h-[75px] w-full shrink-0 overflow-hidden">
      <img :src="props.headerImage" alt="" class="block h-full w-full object-cover" />
      <span v-if="props.showNumber" class="absolute bottom-1 right-2 text-[11px] font-normal text-white/85 drop-shadow">#{{ props.number }}</span>
    </div>

    <div class="grid w-full" :style="gridStyle">
      <template v-if="props.showBingoRow && !props.headerImage">
        <div
          v-for="(letter, i) in columnHeaders"
          :key="letter"
          class="py-2.5 text-center tracking-[0.05em]"
          :class="[bingoHeaderCellClass(i), props.compact ? 'text-sm py-1.5 font-normal' : 'text-[20px] font-normal']"
        >{{ letter }}</div>
      </template>

      <div
        v-for="(cell, idx) in cells"
        :key="idx"
          class="flex aspect-square min-h-0 flex-col items-center justify-center gap-px overflow-hidden border-l border-t border-black bg-white p-1"
        :class="{
          [cellColClass(idx)]: true,
          'rounded-tl-xl': isFirstRow(idx) && isFirstCol(idx),
          'rounded-tr-xl': isFirstRow(idx) && isLastCol(idx),
          'rounded-bl-xl': isLastRow(idx) && isFirstCol(idx),
          'rounded-br-xl': isLastRow(idx) && isLastCol(idx),
          'border-r': isLastCol(idx),
          'border-b': isLastRow(idx),
        }"
      >
        <template v-if="cell.text === 'FREE'">
          <span
            class="max-w-full overflow-hidden text-center text-[18px] font-bold tracking-[.05em]"
            :class="props.blackInk ? 'text-black' : 'text-black'"
          >FREE</span>
        </template>
        <template v-else>
          <span
            class="max-w-full whitespace-normal text-center text-[length:var(--cell-text-size,15px)] font-normal leading-(--cell-text-leading,1.15) wrap-normal [word-break:normal]"
            :class="{ 'text-black': props.blackInk }"
          >
            <template v-for="(run, runIdx) in getWordRuns(cell.text)" :key="`${idx}-t-${runIdx}`">
              <span
                v-if="!run.isSpace"
                class="inline-block whitespace-nowrap align-baseline"
                :style="[
                  run.scale < 1 ? { fontSize: `calc(var(--cell-text-size,15px) * ${run.scale})` } : null,
                  run.long ? { marginLeft: '3px', marginRight: '3px' } : null,
                ]"
              >{{ run.text }}</span>
              <template v-else>{{ run.text }}</template>
            </template>
          </span>
          <span
            v-if="props.showArtist && cell.sub"
            class="max-w-full whitespace-normal text-center text-[length:var(--cell-sub-size,10px)] font-normal leading-[1.1] wrap-normal [word-break:normal]"
            :class="{ 'text-black': props.blackInk }"
          >
            <template v-for="(run, runIdx) in getWordRuns(cell.sub, true)" :key="`${idx}-s-${runIdx}`">
              <span
                v-if="!run.isSpace"
                class="inline-block whitespace-nowrap align-baseline"
                :style="[
                  run.scale < 1 ? { fontSize: `calc(var(--cell-sub-size,10px) * ${run.scale})` } : null,
                  run.long ? { marginLeft: '3px', marginRight: '3px' } : null,
                ]"
              >{{ run.text }}</span>
              <template v-else>{{ run.text }}</template>
            </template>
          </span>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { getCardTextVars, getCellContentPx, CHAR_WIDTH_FACTOR } from "./textSizing.js";

const props = defineProps({
  cells:       { type: Array,   required: true },
  title:       { type: String,  default: '' },
  number:      { type: Number,  default: 1 },
  showNumber:  { type: Boolean, default: true },
  showArtist:  { type: Boolean, default: false },
  showBingoRow: { type: Boolean, default: false },
  gridSize:    { type: Number,  default: 4 },
  compact:     { type: Boolean, default: false },
  headerImage: { type: String,  default: '' },
  blackInk:    { type: Boolean, default: false },
  textScale:   { type: Number,  default: 1 },
})

const n = computed(() => (Number(props.gridSize) === 5 ? 5 : 4));

const columnHeaders = computed(() => ["B", "I", "N", "G", "O"].slice(0, n.value));

const textVars = computed(() =>
  getCardTextVars(props.cells, { gridSize: n.value, showArtist: props.showArtist }),
);

function scalePxVar(value, factor) {
  const num = Number.parseFloat(String(value).replace("px", ""));
  if (!Number.isFinite(num)) return value;
  return `${Math.max(1, Math.round(num * factor * 100) / 100)}px`;
}

const scaledTextVars = computed(() => {
  const factor = Math.max(0.7, Math.min(1.6, Number(props.textScale) || 1));
  return {
    ...textVars.value,
    "--cell-text-size": scalePxVar(textVars.value["--cell-text-size"], factor),
    "--cell-sub-size": scalePxVar(textVars.value["--cell-sub-size"], factor),
    "--free-text-size": scalePxVar(textVars.value["--free-text-size"], factor),
  };
});

const gridStyle = computed(() => {
  const hasBingoRow = props.showBingoRow && !props.headerImage;
  return {
    gridTemplateColumns: `repeat(${n.value}, minmax(0, 1fr))`,
    gridTemplateRows: hasBingoRow
      ? `minmax(0, 0.5fr) repeat(${n.value}, minmax(0, 1fr))`
      : `repeat(${n.value}, minmax(0, 1fr))`,
    gridAutoFlow: "row",
  };
});

function colHeaderClass(index) {
  return ["bg-white", "bg-white", "bg-white", "bg-white", "bg-white"][index % 5];
}

function bingoHeaderCellClass(index) {
  if (props.blackInk) return "bg-white text-black border-black border-r";
  return [colHeaderClass(index), "text-black border-black border-r"].join(" ");
}

function cellColClass(index) {
  return ["border-black", "border-black", "border-black", "border-black", "border-black"][index % n.value];
}

function isLastCol(index) {
  return (index + 1) % n.value === 0;
}

function isFirstCol(index) {
  return index % n.value === 0;
}

function isLastRow(index) {
  return index >= props.cells.length - n.value;
}

function isFirstRow(index) {
  return index < n.value;
}

const WORD_MARGIN_PX = 3;

function getWordRuns(value, isSub = false) {
  const raw = String(value ?? "");
  const parts = raw.split(/(\s+)/);
  const varName = isSub ? "--cell-sub-size" : "--cell-text-size";
  const fontSizePx =
    Number.parseFloat(String(scaledTextVars.value[varName]).replace("px", "")) ||
    (isSub ? 10 : 15);
  // Same content-box calibration used for overall title fitting, minus a
  // little breathing room so a shrunk word never touches the cell edge.
  const availablePx = Math.max(1, getCellContentPx(n.value) - WORD_MARGIN_PX * 2);

  return parts.map((part) => {
    if (!part) return { text: "", isSpace: false, scale: 1, long: false };
    if (/^\s+$/.test(part)) return { text: part, isSpace: true, scale: 1, long: false };
    const estWidthPx = part.length * CHAR_WIDTH_FACTOR * fontSizePx;
    if (estWidthPx <= availablePx) return { text: part, isSpace: false, scale: 1, long: false };
    // Keep the word intact, but shrink it enough to fit on its own line,
    // centered with a 3px margin on each side.
    const scale = Math.max(0.55, availablePx / estWidthPx);
    return { text: part, isSpace: false, scale, long: true };
  });
}
</script>
