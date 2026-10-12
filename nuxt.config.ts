import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  devtools: { enabled: true },
  modules: ['nuxt-auth-utils'],
  css: ['~/assets/css/main.css'],

  app: {
    head: {
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap' },
      ],
      // Apply the saved theme before first paint so light-theme users don't see a dark flash.
      script: [{ innerHTML: `try{if(localStorage.getItem('theme')==='light')document.documentElement.dataset.theme='light'}catch(e){}` }],
    },
  },
  vite: { plugins: [tailwindcss()] },

  // Game screens are client-only so they can run offline; auth pages are SSR-free too for a simple SWA deploy.
  ssr: false,

  runtimeConfig: {
    seedAdminEmail: 'admin@gamenight.local',
    seedAdminPassword: '',
    storageDriver: '',
    azureStorageConnectionString: '',
    // Billing (see server/api/billing/start-trial.post.ts). Empty until Stripe is set up.
    stripeSecretKey: '',
    stripePriceId: '',
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
