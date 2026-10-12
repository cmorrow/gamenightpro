<template>
  <header
    class="local-header shrink-0 border-b border-white/[0.08] bg-[#0b0e14]/95 backdrop-blur-sm"
  >
    <div
      class="local-header-inner mx-auto grid w-full max-w-[1520px] content-center gap-6 px-4 py-5 md:px-6 lg:grid-cols-[auto_1fr_auto] lg:items-start"
    >
      <div class="flex shrink-0 flex-col items-center gap-2 lg:items-start">
        <NuxtLink
          to="/"
          class="text-xs font-semibold text-[#9ca3af] hover:text-white"
        >&larr; All games</NuxtLink>
        <RouterLink
          to="/music-bingo"
          class="flex shrink-0 justify-center lg:justify-start"
          aria-label="Music Bingo home"
        >
          <img
            src="../assets/img/music-bingo-logo.png"
            alt="Music Bingo"
            class="h-24 w-auto"
          />
        </RouterLink>
      </div>

      <div class="text-center lg:pt-1">
        <h1 class="text-2xl font-bold tracking-tight text-white md:text-3xl">
          <slot name="title">{{ title }}</slot>
        </h1>
        <p v-if="subtitle" class="mt-1 text-sm text-[#9ca3af] md:text-base">
          {{ subtitle }}
        </p>
      </div>

      <div
        class="flex flex-wrap items-center justify-center gap-3 lg:justify-end"
      >
        <slot />

        <!-- Settings cog menu -->
        <div class="relative" ref="settingsMenuRef">
          <button
            type="button"
            class="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[#9ca3af] transition hover:bg-white/10 hover:text-white"
            :class="{ 'bg-white/10 text-white': settingsOpen }"
            aria-label="Settings"
            @click="settingsOpen = !settingsOpen"
          >
            <svg
              class="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M12 15a3 3 0 100-6 3 3 0 000 6z"
                stroke="currentColor"
                stroke-width="1.75"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
                stroke="currentColor"
                stroke-width="1.75"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>

          <Transition
            enter-active-class="transition duration-100 ease-out"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition duration-75 ease-in"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-95"
          >
            <div
              v-if="settingsOpen"
              class="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-48 origin-top-right rounded-xl border border-white/10 bg-[#0f1219] py-1 shadow-[0_16px_48px_rgba(0,0,0,0.55)]"
              role="menu"
            >
              <RouterLink
                to="/music-bingo/card-designer"
                class="flex items-center gap-3 px-4 py-2.5 text-sm text-[#d1d5db] transition hover:bg-white/6 hover:text-white"
                role="menuitem"
                @click="settingsOpen = false"
              >
                <svg
                  class="h-4 w-4 shrink-0 text-[#a855f7]"
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
                Card Designer
              </RouterLink>
              <RouterLink
                :to="{ name: 'mb-playlists' }"
                class="flex items-center gap-3 px-4 py-2.5 text-sm text-[#d1d5db] transition hover:bg-white/6 hover:text-white"
                role="menuitem"
                @click="settingsOpen = false"
              >
                <svg
                  class="h-4 w-4 shrink-0 text-[#a855f7]"
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
                  <circle cx="6" cy="18" r="3" stroke="currentColor" stroke-width="1.75" />
                  <circle cx="18" cy="16" r="3" stroke="currentColor" stroke-width="1.75" />
                </svg>
                Manage Playlists
              </RouterLink>
              <RouterLink
                to="/music-bingo/settings"
                class="flex items-center gap-3 px-4 py-2.5 text-sm text-[#d1d5db] transition hover:bg-white/6 hover:text-white"
                role="menuitem"
                @click="settingsOpen = false"
              >
                <svg
                  class="h-4 w-4 shrink-0 text-[#a855f7]"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M12 15a3 3 0 100-6 3 3 0 000 6z"
                    stroke="currentColor"
                    stroke-width="1.75"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <path
                    d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
                    stroke="currentColor"
                    stroke-width="1.75"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                App Settings
              </RouterLink>
            </div>
          </Transition>
        </div>
      </div>
    </div>

    <slot name="status" />
  </header>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";

defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: "" },
});

const settingsOpen = ref(false);
const settingsMenuRef = ref(null);

function handleClickOutside(e) {
  if (settingsMenuRef.value && !settingsMenuRef.value.contains(e.target)) {
    settingsOpen.value = false;
  }
}

onMounted(() => document.addEventListener("mousedown", handleClickOutside));
onUnmounted(() =>
  document.removeEventListener("mousedown", handleClickOutside),
);
</script>
