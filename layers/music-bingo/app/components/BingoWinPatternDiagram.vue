<template>
  <div
    class="pattern-diagram"
    :style="{
      '--cell': `${cellPx}px`,
      '--gap': `${gapPx}px`,
      '--cols': gridSize,
    }"
  >
    <div class="pattern-diagram__grid" role="img" :aria-label="ariaLabel">
      <div
        v-for="i in cellCount"
        :key="i - 1"
        class="pattern-diagram__cell"
        :class="{
          'pattern-diagram__cell--on': isWinCell(i - 1),
          'pattern-diagram__cell--free': showFreeCenter && i - 1 === freeIndex,
          'pattern-diagram__cell--flash': flashIndices.has(i - 1),
        }"
      />
    </div>
    <p v-if="hint" class="pattern-diagram__hint">{{ hint }}</p>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from "vue";

const props = defineProps({
  /** standard | four-corners(plus sign) | corners | blackout | x | wine-glass | border */
  mode: { type: String, default: "standard" },
  gridSize: { type: Number, default: 5 },
  /** Visual size of each cell in CSS px */
  cellPx: { type: Number, default: 52 },
  gapPx: { type: Number, default: 10 },
  /** Highlight center as FREE (5×5 only) */
  showFreeCenter: { type: Boolean, default: true },
  /** Flash newly highlighted cells when mode changes */
  flashOnModeChange: { type: Boolean, default: false },
});

const cellCount = computed(() => props.gridSize * props.gridSize);
const freeIndex = computed(() => (props.gridSize === 5 ? 12 : -1));
const flashIndices = ref(new Set());
const previousWinIndices = ref([]);
let flashTimer = null;

const hint = computed(() => {
  if (props.mode === "standard") {
    return "Example: any row, column, or diagonal — not only this one.";
  }
  return "";
});

const ariaLabel = computed(() => {
  const m = props.mode;
  if (m === "none")
    return `${props.gridSize} by ${props.gridSize} grid.`;
  if (m === "standard")
    return "Five by five grid; one full row highlighted as an example winning line.";
  if (m === "four-corners")
    return "Five by five grid; plus-sign pattern highlighted (center row and column).";
  if (m === "corners")
    return "Five by five grid; four corner cells highlighted.";
  if (m === "blackout") return "Five by five grid; all cells highlighted.";
  if (m === "x") return "Five by five grid; both diagonals highlighted.";
  if (m === "wine-glass")
    return "Five by five grid; wine glass shape highlighted (top row, narrowing rim, stem, and base).";
  if (m === "border")
    return "Grid with the outer border of cells highlighted.";
  return "Bingo pattern grid.";
});

function isWinCell(i) {
  const n = props.gridSize;
  const r = Math.floor(i / n);
  const c = i % n;
  switch (props.mode) {
    case "none":
      return false;
    case "standard":
      return r === 2;
    case "four-corners":
      return r === Math.floor(n / 2) || c === Math.floor(n / 2);
    case "corners":
      return (r === 0 || r === n - 1) && (c === 0 || c === n - 1);
    case "blackout":
      return true;
    case "x":
      return r === c || r + c === n - 1;
    case "wine-glass": {
      const mid = Math.floor(n / 2);
      if (r === 0) return true;
      if (r === 1 || r === n - 1) return c >= 1 && c <= n - 2;
      return c === mid;
    }
    case "border":
      return r === 0 || r === n - 1 || c === 0 || c === n - 1;
    default:
      return r === 2;
  }
}

function getWinIndices() {
  const indices = [];
  for (let i = 0; i < cellCount.value; i += 1) {
    if (isWinCell(i)) indices.push(i);
  }
  return indices;
}

watch(
  () => [props.mode, props.gridSize],
  () => {
    const nextWinIndices = getWinIndices();
    const previousSet = new Set(previousWinIndices.value);
    previousWinIndices.value = nextWinIndices;

    if (!props.flashOnModeChange) return;
    if (!previousSet.size) return;

    const newlyHighlighted = nextWinIndices.filter(
      (index) => !previousSet.has(index),
    );
    flashIndices.value = new Set(newlyHighlighted);
    if (flashTimer) window.clearTimeout(flashTimer);
    flashTimer = window.setTimeout(() => {
      flashIndices.value = new Set();
      flashTimer = null;
    }, 700);
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  if (flashTimer) {
    window.clearTimeout(flashTimer);
    flashTimer = null;
  }
});
</script>

<style scoped>
.pattern-diagram {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.pattern-diagram__grid {
  display: grid;
  grid-template-columns: repeat(var(--cols), var(--cell));
  gap: var(--gap);
  padding: 0.75rem;
  border-radius: 1.25rem;
  background: rgba(15, 23, 42, 0.65);
  border: 1px solid rgba(148, 163, 184, 0.25);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06),
    0 20px 50px rgba(0, 0, 0, 0.45);
}

.pattern-diagram__cell {
  width: var(--cell);
  height: var(--cell);
  border-radius: 0.5rem;
  background: rgba(51, 65, 85, 0.55);
  border: 1px solid rgba(100, 116, 139, 0.35);
  transition: background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.pattern-diagram__cell--on {
  background: linear-gradient(
    145deg,
    rgba(56, 189, 248, 0.85),
    rgba(106, 109, 250, 0.9)
  );
  border-color: rgba(125, 211, 252, 1);
  box-shadow: 0 0 20px rgba(56, 189, 248, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.25);
}

.pattern-diagram__cell--flash {
  animation: pattern-cell-flash 700ms ease-out;
}

.pattern-diagram__cell--free.pattern-diagram__cell--on {
  background: linear-gradient(
    145deg,
    rgba(250, 204, 21, 0.9),
    rgba(245, 158, 11, 0.95)
  );
  border-color: rgba(253, 224, 71, 0.7);
  box-shadow: 0 0 18px rgba(250, 204, 21, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

@keyframes pattern-cell-flash {
  0% {
    box-shadow: 0 0 0 rgba(244, 114, 182, 0),
      inset 0 1px 0 rgba(255, 255, 255, 0.25);
    filter: brightness(1);
  }
  30% {
    box-shadow: 0 0 30px rgba(244, 114, 182, 0.95),
      0 0 52px rgba(192, 132, 252, 0.65),
      inset 0 1px 0 rgba(255, 255, 255, 0.45);
    filter: brightness(1.25);
  }
  100% {
    box-shadow: 0 0 20px rgba(56, 189, 248, 0.35),
      inset 0 1px 0 rgba(255, 255, 255, 0.25);
    filter: brightness(1);
  }
}

.pattern-diagram__cell--free:not(.pattern-diagram__cell--on) {
  background: rgba(254, 243, 199, 0.35);
  border-color: rgba(250, 204, 21, 0.45);
  box-shadow: inset 0 0 0 2px rgba(250, 204, 21, 0.2);
}

.pattern-diagram__hint {
  margin: 0;
  max-width: 28rem;
  text-align: center;
  font-size: 0.95rem;
  line-height: 1.45;
  color: rgba(148, 163, 184, 0.95);
}
</style>
