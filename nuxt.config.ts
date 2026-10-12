import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  devtools: { enabled: true },
  modules: ['nuxt-auth-utils'],
  css: ['~/assets/css/main.css'],
  vite: { plugins: [tailwindcss()] },

  // Game screens are client-only so they can run offline; auth pages are SSR-free too for a simple SWA deploy.
  ssr: false,

  runtimeConfig: {
    seedAdminEmail: 'admin@gamenight.local',
    seedAdminPassword: '',
    storageDriver: '',
    azureStorageConnectionString: '',
    session: {
      name: 'cp-session',
      maxAge: 60 * 60 * 24 * 30, // 30 days, so a host who signed in at home can run an event offline
    },
  },

  nitro: {
    // Local dev and tests keep data in .data/db. Azure overrides this in server/plugins/storage.ts.
    storage: { db: { driver: 'fs', base: './.data/db' } },
    azure: {
      config: {
        platform: { apiRuntime: 'node:22' },
        globalHeaders: {
          'X-Content-Type-Options': 'nosniff',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
          'X-Frame-Options': 'DENY',
        },
      },
    },
  },
})
