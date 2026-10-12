<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
      @click.self="emit('cancel')"
    >
      <div
        class="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-amber-500/30 bg-[#0f1219] shadow-[0_24px_80px_rgba(0,0,0,0.5)]"
      >
        <div
          class="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4"
        >
          <svg
            class="h-5 w-5 shrink-0 text-amber-300"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a1.5 1.5 0 001.29 2.25h17.78A1.5 1.5 0 0022.18 18L13.71 3.86a1.5 1.5 0 00-2.42 0z"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <p class="text-sm font-bold text-white">
            Check songs before printing
          </p>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div
            v-for="entry in issues"
            :key="entry.title"
            class="mb-4 last:mb-0"
          >
            <p
              v-if="issues.length > 1"
              class="mb-1.5 text-xs font-bold uppercase tracking-[0.1em] text-[#c084fc]"
            >
              {{ entry.title }}
            </p>

            <div
              v-if="entry.duplicates.length"
              class="mb-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2"
            >
              <p class="text-xs font-semibold text-rose-200">
                Duplicate songs found
              </p>
              <ul class="mt-1 list-inside list-disc text-xs text-rose-100/90">
                <li v-for="name in entry.duplicates" :key="name">
                  {{ name }}
                </li>
              </ul>
            </div>

            <div
              v-if="entry.flagged.length"
              class="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2"
            >
              <p class="text-xs font-semibold text-amber-200">
                Titles mention "remastered" or a year
              </p>
              <ul class="mt-1 list-inside list-disc text-xs text-amber-100/90">
                <li v-for="name in entry.flagged" :key="name">{{ name }}</li>
              </ul>
            </div>
          </div>
        </div>

        <div
          class="flex items-center justify-end gap-2 border-t border-white/[0.06] px-5 py-4"
        >
          <button
            type="button"
            class="local-btn local-btn--outline-muted rounded-xl px-4 py-2 text-sm font-semibold transition hover:bg-white/5"
            @click="emit('cancel')"
          >
            Cancel
          </button>
          <button
            type="button"
            class="local-btn local-btn--gradient rounded-xl px-4 py-2 text-sm font-semibold text-white shadow transition hover:brightness-110"
            @click="emit('proceed')"
          >
            Continue Generating
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
defineProps({
  // Array of { title, duplicates: string[], flagged: string[] }
  issues: { type: Array, required: true },
});

const emit = defineEmits(["proceed", "cancel"]);
</script>
