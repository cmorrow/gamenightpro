<template>
  <div class="flex items-center justify-center p-8 text-slate-300">
    Connecting to Spotify…
  </div>
</template>

<script setup>
// Spotify sends the host back here after sign-in. The music-bingo layout finishes the
// token exchange and then returns to the music bingo home page.
definePageMeta({ name: "mb-spotify-callback", layout: "music-bingo" });
</script>
