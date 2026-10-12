<template>
  <div
    class="rounded-xl border border-white/[0.08] bg-[#0f1219]/90 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
  >
    <h2
      class="mb-4 text-sm font-bold uppercase tracking-[0.12em] text-[#c084fc]"
    >
      Print Options
    </h2>

    <!-- Header image -->
    <div class="mb-4">
      <label class="mb-1.5 block text-sm text-[#9ca3af]">
        Header image
        <span class="text-xs text-[#64748b]">(top-left of cards)</span>
      </label>
      <div class="flex flex-col gap-2">
        <div
          v-if="headerImage"
          class="relative overflow-hidden rounded-lg border border-white/10 bg-black/30"
        >
          <img
            :src="headerImage"
            alt="Header"
            class="max-h-16 w-auto object-contain p-2"
          />
          <button
            type="button"
            class="absolute right-1.5 top-1.5 rounded p-0.5 text-[#9ca3af] hover:text-rose-400"
            aria-label="Remove header image"
            @click="emit('update:headerImage', '')"
          >
            <svg
              class="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
              />
            </svg>
          </button>
        </div>
        <label
          class="local-btn local-btn--outline-muted inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition hover:bg-white/5"
        >
          <svg
            class="h-3.5 w-3.5 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          {{ headerImage ? "Replace image" : "Upload image" }}
          <input
            type="file"
            accept="image/*"
            class="sr-only"
            @change="onFileChange"
          />
        </label>
      </div>
    </div>

    <label class="block text-sm text-[#9ca3af]">
      {{ pagesFieldLabel }}
      <input
        :value="pageCount"
        type="number"
        min="1"
        max="99"
        class="mt-1 w-full rounded-lg border border-white/15 bg-[#0b0e14] px-3 py-2 text-white outline-none focus:border-[#a855f7]/60"
        @input="emit('update:pageCount', Number($event.target.value))"
      />
    </label>
    <p class="mt-1.5 text-xs text-[#64748b]">
      = {{ pageCount * 2 }} cards{{ pagesHintSuffix }} (2 cards per page)
    </p>

    <fieldset class="mt-4 text-sm text-[#9ca3af]">
      <legend class="mb-2 font-medium text-[#e4e4e7]">Grid size</legend>
      <div class="flex flex-wrap gap-4">
        <label class="flex cursor-pointer items-center gap-2">
          <input
            :checked="gridSize === 5"
            type="radio"
            :value="5"
            class="text-[#a855f7]"
            @change="emit('update:gridSize', 5)"
          />
          5 × 5
        </label>
        <label class="flex cursor-pointer items-center gap-2">
          <input
            :checked="gridSize === 4"
            type="radio"
            :value="4"
            class="text-[#a855f7]"
            @change="emit('update:gridSize', 4)"
          />
          4 × 4
        </label>
      </div>
    </fieldset>

    <label
      class="mt-3 flex items-center gap-2.5 text-sm"
      :class="
        gridSize === 4
          ? 'cursor-not-allowed opacity-40'
          : 'cursor-pointer text-[#9ca3af]'
      "
    >
      <input
        :checked="hasFreeSpace"
        type="checkbox"
        class="h-4 w-4 rounded text-[#a855f7]"
        :disabled="gridSize === 4"
        @change="emit('update:hasFreeSpace', $event.target.checked)"
      />
      <span>Free space in center</span>
    </label>

    <!-- Footer events -->
    <div class="mt-4 flex flex-col gap-3">
      <div>
        <label class="mb-1.5 block text-sm text-[#9ca3af]">
          Footer title
          <span class="text-xs text-[#64748b]"
            >(shown above events on printed cards)</span
          >
        </label>
        <input
          :value="footerTitle"
          type="text"
          class="w-full rounded-lg border border-white/15 bg-[#0b0e14] px-3 py-2 text-sm text-white outline-none focus:border-[#a855f7]/60"
          placeholder="Upcoming Events"
          @input="emit('update:footerTitle', $event.target.value)"
        />
      </div>

      <div class="flex items-center justify-between">
        <span class="text-sm text-[#9ca3af]">Events</span>
        <button
          v-if="hasEventContent"
          type="button"
          class="text-xs text-[#9ca3af] underline underline-offset-2 hover:text-white"
          @click="clearEventsEntries"
        >
          Clear events
        </button>
      </div>

      <div class="flex flex-col gap-2">
        <div
          v-for="(event, idx) in events"
          :key="idx"
          class="flex flex-col gap-1.5 rounded-lg border border-white/10 bg-black/20 p-2.5"
        >
          <div class="flex items-center justify-between">
            <span
              class="text-xs font-bold uppercase tracking-widest text-[#64748b]"
              >Event {{ idx + 1 }}</span
            >
            <button
              type="button"
              class="rounded p-1 text-[#374151] transition hover:text-rose-400"
              aria-label="Remove event"
              @click="removeEventAt(idx)"
            >
              <svg
                class="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M18 6L6 18M6 6l12 12"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                />
              </svg>
            </button>
          </div>
          <div class="flex gap-1.5">
            <input
              :value="event.date"
              type="text"
              placeholder="Date"
              class="w-1/2 rounded-lg border border-white/15 bg-[#0b0e14] px-2.5 py-1.5 text-sm text-white outline-none focus:border-[#a855f7]/60"
              @input="updateEventField(idx, 'date', $event.target.value)"
            />
            <input
              :value="event.time"
              type="text"
              placeholder="Time"
              class="w-1/2 rounded-lg border border-white/15 bg-[#0b0e14] px-2.5 py-1.5 text-sm text-white outline-none focus:border-[#a855f7]/60"
              @input="updateEventField(idx, 'time', $event.target.value)"
            />
          </div>
          <input
            :value="event.title"
            type="text"
            placeholder="Event title"
            class="w-full rounded-lg border border-white/15 bg-[#0b0e14] px-2.5 py-1.5 text-sm text-white outline-none focus:border-[#a855f7]/60"
            @input="updateEventField(idx, 'title', $event.target.value)"
          />
        </div>

        <button
          type="button"
          class="local-btn local-btn--outline-muted inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-45"
          :disabled="events.length >= maxEvents"
          @click="addEventEntry"
        >
          + Add event
        </button>
      </div>
    </div>

    <div class="mt-5 flex flex-col gap-2">
      <template v-if="variant === 'batch'">
        <p
          v-if="selectedCount === 0"
          class="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-center text-xs text-[#64748b]"
        >
          Select at least one playlist above
        </p>
        <template v-else>
          <p class="text-xs text-[#9ca3af]">
            Total:
            <span class="font-semibold text-white">{{ totalCards }} cards</span>
            across
            <span class="font-semibold text-white">
              {{ selectedCount }}
              {{ selectedCount === 1 ? "playlist" : "playlists" }}
            </span>
            ({{ totalPages }} pages)
          </p>
          <p
            v-if="blockedCount > 0"
            class="rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-xs text-amber-200"
          >
            {{ blockedCount }}
            {{ blockedCount === 1 ? "playlist" : "playlists" }}
            {{ blockedCount === 1 ? "doesn't" : "don't" }}
            have enough songs and will be skipped.
          </p>
        </template>
      </template>

      <slot name="before-download" />

      <button
        type="button"
        class="local-btn local-btn--gradient inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45"
        :disabled="isDownloadDisabled"
        @click="emit('download')"
      >
        <svg
          class="h-4 w-4 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M6 9V4h12v5M6 14h12v7H6v-7zM8 14v5h8v-5"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        {{ resolvedDownloadLabel }}
      </button>
      <p
        v-if="pdfError"
        class="rounded-lg border border-rose-500/35 bg-rose-500/10 px-3 py-2 text-xs text-rose-200"
      >
        {{ pdfError }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { MAX_EVENTS } from "../composables/usePrintOptions.js";

const props = defineProps({
  headerImage: { type: String, default: "" },
  pageCount: { type: Number, default: 10 },
  gridSize: { type: Number, default: 5 },
  hasFreeSpace: { type: Boolean, default: false },
  footerTitle: { type: String, default: "Upcoming Events" },
  events: { type: Array, default: () => [] },
  variant: { type: String, default: "batch" },
  downloadDisabled: { type: Boolean, default: undefined },
  downloadLabel: { type: String, default: "" },
  selectedCount: { type: Number, default: 0 },
  blockedCount: { type: Number, default: 0 },
  printableCount: { type: Number, default: 0 },
  totalCards: { type: Number, default: 0 },
  totalPages: { type: Number, default: 0 },
  pdfBusy: { type: Boolean, default: false },
  pdfProgress: { type: Object, default: () => ({ current: 0, total: 0 }) },
  pdfError: { type: String, default: "" },
});

const emit = defineEmits([
  "update:headerImage",
  "update:pageCount",
  "update:gridSize",
  "update:hasFreeSpace",
  "update:footerTitle",
  "update:events",
  "download",
]);

const maxEvents = MAX_EVENTS;

function updateEventField(idx, field, value) {
  const next = props.events.map((event, i) =>
    i === idx ? { ...event, [field]: value } : event,
  );
  emit("update:events", next);
}

function addEventEntry() {
  if (props.events.length >= maxEvents) return;
  emit("update:events", [
    ...props.events,
    { date: "", time: "", title: "" },
  ]);
}

function removeEventAt(idx) {
  emit(
    "update:events",
    props.events.filter((_, i) => i !== idx),
  );
}

const hasEventContent = computed(() =>
  props.events.some((event) => event.date || event.time || event.title),
);

function clearEventsEntries() {
  emit("update:events", [{ date: "", time: "", title: "" }]);
}

const pagesFieldLabel = computed(() =>
  props.variant === "single" ? "Pages" : "Pages per playlist",
);

const pagesHintSuffix = computed(() =>
  props.variant === "single" ? "" : " per playlist",
);

const isDownloadDisabled = computed(() => {
  if (props.downloadDisabled !== undefined) return props.downloadDisabled;
  return props.printableCount === 0 || props.pdfBusy;
});

const resolvedDownloadLabel = computed(() => {
  if (props.pdfBusy) {
    return props.pdfProgress.total > 0
      ? `Generating page ${props.pdfProgress.current} of ${props.pdfProgress.total}…`
      : "Preparing…";
  }
  if (props.downloadLabel) return props.downloadLabel;
  if (props.printableCount === 0) return "Select playlists to print";
  return `Download PDF (${props.totalCards} cards / ${props.totalPages} pages)`;
});

function onFileChange(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => emit("update:headerImage", ev.target.result);
  reader.readAsDataURL(file);
  e.target.value = "";
}
</script>
