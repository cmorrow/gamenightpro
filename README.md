# GameNight Pro

Starter platform for hosting music bingo, bingo and trivia. Nuxt 4 SPA + Nuxt server routes, deployed to Azure Static Web Apps (Free) with the API as SWA managed Functions.

The name is provisional. Rename it in `app/app.config.ts` (`brand.appName`); nothing else hard-codes it.

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000
```

On first sign-in with no users, an admin is created:

- Email: `admin@gamenight.local`
- Password (dev only): `GameNight-Admin-2026`

You must choose a new password on first sign-in. Data is stored as files in `.data/db` (git-ignored); delete that folder to start over.

## Look and feel

Dark theme by default, matching the Music Bingo app (near-black background, purple accents, purple-to-pink gradient buttons). A light theme is optional: the settings menu or the Account page switches it, and the choice is saved per browser.

- Colors are tokens in `app/assets/css/main.css` (`:root` for dark, `[data-theme="light"]` for light). Use the semantic classes (`bg-panel`, `text-muted`, `border-line`, `text-accent-fg`…) rather than raw colors so both themes work.
- Each section renders its own `<AppHeader title subtitle>` with action buttons in its default slot (like Music Bingo's Print Cards / Audience Screen), plus a shared settings menu.
- `<AppPanel title subtitle>` with an `#icon` slot gives the numbered-step panel look.
- Shared buttons: `btn-primary` (gradient), `btn-outline`, `btn-ghost`, `btn-icon`.

## What's here

| Area | Files |
|---|---|
| Public pages: landing, features, pricing, trial sign-up | `app/pages/index.vue` (landing when signed out), `features.vue`, `pricing.vue`, `signup.vue`, `app/layouts/marketing.vue`. Copy in `app/data/features.ts`; price and trial length in `shared/utils/plan.ts` |
| Checkout hook (Stripe goes here) | `server/api/billing/start-trial.post.ts`; returns 503 until `NUXT_STRIPE_SECRET_KEY` and `NUXT_STRIPE_PRICE_ID` are set |
| Sign in, forced password change, account page | `app/pages/login.vue`, `app/pages/account/*` |
| Route guard (login required, temp password, admin-only) | `app/middleware/auth.global.ts` |
| Admin user management (add, reset password, delete) | `app/pages/admin/users.vue`, `server/api/users/*` |
| Auth API | `server/api/auth/login.post.ts`, `change-password.post.ts`; sign-out uses nuxt-auth-utils' built-in `DELETE /api/_auth/session` |
| User store | `server/utils/users.ts` (Nitro storage `db`), `server/plugins/storage.ts` |

Security: scrypt password hashes and encrypted HttpOnly session cookies (`nuxt-auth-utils`), 30-day sessions so hosts stay signed in offline, emails normalized to lowercase and unique, generic login errors, 15-minute lockout after 5 failed attempts, 10-character minimum passwords. Each user gets a `tenantId`; game data will be scoped by it.

Not yet: self sign-up, email verification and forgot-password emails (need Azure Communication Services), per-IP rate limiting.

## Deploy to Azure

1. Create a Static Web App (Free plan) linked to this GitHub repo with "Custom" build; the workflow in `.github/workflows/azure-swa.yml` builds with `npm run build:azure`.
2. Create a Storage Account (Standard LRS). User records go in Table Storage (table `appdata`), a few cents a month.
3. In the Static Web App's Environment variables, set:
   - `NUXT_SESSION_PASSWORD`: 32+ random characters (`openssl rand -base64 32`)
   - `NUXT_SEED_ADMIN_EMAIL` and `NUXT_SEED_ADMIN_PASSWORD`: the first admin (remove the password after first sign-in)
   - `NUXT_STORAGE_DRIVER=azure-storage-table`
   - `NUXT_AZURE_STORAGE_CONNECTION_STRING`: from the Storage Account's Access keys

Switching to Cosmos DB later only changes `server/plugins/storage.ts`.
