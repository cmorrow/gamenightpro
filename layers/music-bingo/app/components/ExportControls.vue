<template>
  <div class="flex w-full flex-wrap items-center gap-3 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-card)] px-5 py-3">
    <div class="min-w-0 flex-1">
      <span class="text-sm font-semibold text-slate-200">{{ cardCount }} card{{ cardCount !== 1 ? "s" : "" }} generated</span>
    </div>
    <div class="flex flex-wrap gap-2.5">
      <button
        class="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300/35 bg-emerald-950/40 px-4 py-2 text-sm font-semibold text-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="exporting"
        @click="handlePng"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="m21 15-5-5L5 21" />
        </svg>
        Export PNG{{ cardCount > 1 ? " (ZIP)" : "" }}
      </button>
      <button
        class="inline-flex items-center gap-1.5 rounded-lg border border-rose-300/35 bg-rose-950/35 px-4 py-2 text-sm font-semibold text-rose-200 disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="exporting"
        @click="handlePdf"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path
            d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
          />
          <polyline points="14 2 14 8 20 8" />
          <line x1="9" y1="13" x2="15" y2="13" />
          <line x1="9" y1="17" x2="15" y2="17" />
          <polyline points="9 9 10 9" />
        </svg>
        Export PDF
      </button>
    </div>
    <div v-if="exporting" class="flex items-center gap-1.5 text-sm text-slate-300">
      <span class="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-500 border-t-slate-100"></span>
      Generating{{
        exportType === "png" ? " PNG" : " PDF"
      }}…
    </div>
    <div v-if="exportError" class="w-full rounded-md bg-rose-950/35 px-2.5 py-1.5 text-xs text-rose-300">{{ exportError }}</div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useExport } from "../composables/useExport.js";

const props = defineProps({
  cardCount: { type: Number, required: true },
  getCardElements: { type: Function, required: true },
  cardTitle: { type: String, default: "" },
  paperSize: { type: String, default: "letter" },
  orientation: { type: String, default: "landscape" },
  /** When true, each root is a full preview page (header + cards); one PDF/PNG page per root. */
  exportFullPages: { type: Boolean, default: false },
});

const { exportPng, exportPdf } = useExport();
const exporting = ref(false);
const exportType = ref("");
const exportError = ref("");

async function run(type, fn, ...extra) {
  exporting.value = true;
  exportType.value = type;
  exportError.value = "";
  try {
    const els = props.getCardElements();
    const fullPage = props.exportFullPages ? { fullPage: true } : {};
    if (type === "png") {
      await fn(els, props.cardTitle || "bingo-card", fullPage);
    } else {
      await fn(els, props.cardTitle || "bingo-card", ...extra, fullPage);
    }
  } catch (e) {
    exportError.value = `Export failed: ${e.message}`;
    console.error(e);
  } finally {
    exporting.value = false;
    exportType.value = "";
  }
}

function handlePng() {
  run("png", exportPng);
}
function handlePdf() {
  run("pdf", exportPdf, props.paperSize);
}
</script>
