import { fileURLToPath } from 'node:url'

// Music Bingo module. Nuxt picks up every folder in layers/ automatically.
export default defineNuxtConfig({
  css: [fileURLToPath(new URL('./app/assets/music-bingo.css', import.meta.url))],

  runtimeConfig: {
    public: {
      // Optional integrations for importing playlists. Leave empty to hide those options.
      spotifyClientId: '',
      spotifyRedirectUri: '', // default: <origin>/music-bingo/spotify-callback
      youtubeApiKey: '',
    },
  },

  nitro: {
    // Uploaded cover images. Local dev keeps them in .data/mbfiles; Azure uses Blob Storage
    // (see server/plugins/music-bingo-storage.ts) because Table Storage rows are capped at 1 MB.
    storage: { mbfiles: { driver: 'fs', base: './.data/mbfiles' } },
  },
})
