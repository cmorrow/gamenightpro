<template>
  <div
    class="mb-app flex h-screen flex-col overflow-hidden"
    :class="{ 'pointer-events-none select-none': spotifyReauthModalOpen }"
  >
    <div class="mb-page flex min-h-0 flex-1 flex-col">
      <slot />
    </div>
  </div>
  <div
    v-if="spotifyReauthModalOpen"
    class="fixed inset-0 z-120 flex items-center justify-center bg-[#020617]/80 p-4 backdrop-blur-[2px]"
    role="dialog"
    aria-modal="true"
    aria-labelledby="spotify-reauth-title"
  >
    <div
      class="w-full max-w-md rounded-2xl border border-white/15 bg-[#0f172a] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.6)]"
    >
      <h2 id="spotify-reauth-title" class="text-xl font-extrabold text-white">
        Spotify authorization required
      </h2>
      <p class="mt-2 text-sm leading-relaxed text-slate-300">
        Your Spotify session expired. Authorize again to continue using playback
        and playlist actions.
      </p>
      <p v-if="spotifyReauthError" class="mt-3 text-sm text-rose-300">
        {{ spotifyReauthError }}
      </p>
      <button
        type="button"
        class="mt-5 w-full rounded-xl bg-(--brand-success) px-4 py-3 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="spotifyReauthBusy"
        @click="onAuthorizeSpotify"
      >
        {{ spotifyReauthBusy ? "Redirecting..." : "Authorize Spotify" }}
      </button>
    </div>
  </div>
</template>

<script setup>
// Full-screen shell for every music bingo page (replaces the old App.vue).
import { onMounted, onUnmounted, ref, watch } from "vue";
import {
  SPOTIFY_REAUTH_REQUIRED_EVENT,
  getStoredToken,
  handleSpotifyCallback,
  startSpotifyAuth,
} from "../composables/useSpotify.js";
import { loadHostPlaylists } from "../data/playlistStore.js";

const route = useRoute();
const { user } = useUserSession();
const spotifyReauthModalOpen = ref(false);
const spotifyReauthBusy = ref(false);
const spotifyReauthError = ref("");

const PAGE_TITLES_BY_ROUTE_NAME = {
  "mb-home": "Music Bingo",
  "mb-audience": "Audience",
  "mb-card-designer": "Card Designer",
  "mb-game": "Active Game",
  "mb-print": "Print Cards",
  "mb-playlists": "Playlists",
  "mb-playlists-id": "Playlist",
  "mb-playlists-id-print": "Print Cards",
  "mb-settings": "Settings",
};

useHead({
  title: () => PAGE_TITLES_BY_ROUTE_NAME[route.name] || "Music Bingo",
});

// The host's own playlists (cached for offline use, refreshed from the server).
watch(
  () => user.value?.id,
  (id) => {
    if (id) loadHostPlaylists(id);
  },
  { immediate: true },
);

function openSpotifyReauthModal() {
  spotifyReauthError.value = "";
  spotifyReauthBusy.value = false;
  spotifyReauthModalOpen.value = true;
}

async function onAuthorizeSpotify() {
  spotifyReauthError.value = "";
  spotifyReauthBusy.value = true;
  try {
    await startSpotifyAuth({ usePopup: false });
  } catch (error) {
    spotifyReauthBusy.value = false;
    spotifyReauthError.value =
      error?.message || "Spotify authorization failed.";
  }
}

async function handleCallbackIfPresent() {
  const query = window.location.search;
  if (!query.includes("code=") && !query.includes("error=")) return;
  try {
    const handled = await handleSpotifyCallback();
    if (handled && getStoredToken()) {
      spotifyReauthModalOpen.value = false;
      spotifyReauthError.value = "";
      spotifyReauthBusy.value = false;
    }
    if (route.name === "mb-spotify-callback") {
      await navigateTo("/music-bingo", { replace: true });
    }
  } catch (error) {
    openSpotifyReauthModal();
    spotifyReauthError.value =
      error?.message || "Spotify authorization failed.";
  }
}

onMounted(async () => {
  window.addEventListener(
    SPOTIFY_REAUTH_REQUIRED_EVENT,
    openSpotifyReauthModal,
  );
  await handleCallbackIfPresent();
});

onUnmounted(() => {
  window.removeEventListener(
    SPOTIFY_REAUTH_REQUIRED_EVENT,
    openSpotifyReauthModal,
  );
});
</script>

<style>
/* Each page's root fills the screen and scrolls, as it did under the old RouterView. */
.mb-page > * {
  display: flex;
  min-height: 0;
  flex: 1 1 0%;
  flex-direction: column;
  overflow-x: hidden;
  overflow-y: auto;
}
</style>
