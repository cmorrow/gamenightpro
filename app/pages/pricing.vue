<script setup lang="ts">
definePageMeta({ public: true, layout: 'marketing' })
useHead({ title: 'Pricing' })

const { brand } = useAppConfig()

const faqs = [
  { q: 'Do I need a card for the free trial?', a: `Yes. Add a card to start. Nothing is charged for ${SINGLE_GAME_PLAN.trialDays} days; after that, your subscription renews at ${formatPrice(SINGLE_GAME_PLAN.priceMonthly)} per month unless you cancel.` },
  { q: 'How do I cancel?', a: `Cancel anytime from your Account page. Cancel during the trial and you're never charged; cancel later and you keep access until the end of the month you've paid for.` },
  { q: 'Are there limits or extra fees?', a: 'No caps, per-player fees, per-event fees or card limits. Run unlimited Music Bingo events with unlimited players and print as many cards as each game needs.' },
  { q: 'Do I need internet at the venue?', a: 'No. Prepare your Music Bingo games at home and the event runs offline. Sign-in and importing new playlists need a connection.' },
  { q: 'Do my players need an account or an app?', a: 'No. Players use printed cards, and games played on phones run in the browser with nothing to install.' },
  { q: 'Where does the music come from?', a: 'You play songs from the player you already use, like Spotify, Apple Music or your DJ software. Playlists can be imported from Spotify and YouTube links.' },
]
</script>

<template>
  <section class="hero-glow">
    <div class="section pb-10 text-center md:pb-12">
      <p class="eyebrow">Pricing</p>
      <h1 class="mx-auto mt-4 max-w-3xl text-4xl font-extrabold tracking-tight text-fg-strong md:text-5xl">Unlimited Music Bingo. One monthly price.</h1>
      <p class="mx-auto mt-4 max-w-xl text-lg text-muted">Try {{ brand.appName }} free for {{ SINGLE_GAME_PLAN.trialDays }} days. No caps, no overages, no contracts.</p>
    </div>
  </section>

  <section class="mx-auto w-full max-w-[1200px] px-4 md:px-6">
    <div class="mx-auto max-w-md">
      <article class="panel flex flex-col border-accent/40 p-6 md:p-8">
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-xl font-bold text-fg-strong">{{ SINGLE_GAME_PLAN.name }}</h2>
          <span class="badge badge-new">{{ SINGLE_GAME_PLAN.trialDays }}-day free trial</span>
        </div>
        <p class="mt-5 flex items-baseline gap-1.5">
          <span class="text-5xl font-extrabold tracking-tight text-fg-strong">{{ formatPrice(SINGLE_GAME_PLAN.priceMonthly) }}</span>
          <span class="text-muted">/ month</span>
        </p>
        <p class="mt-1 text-sm text-subtle">Billed monthly after your trial. Cancel anytime.</p>

        <NuxtLink to="/signup" class="btn-primary mt-6 w-full py-3 text-base">Start free trial</NuxtLink>

        <ul class="mt-6 space-y-3">
          <li v-for="item in SINGLE_GAME_PLAN.includes" :key="item" class="flex gap-3 text-sm text-fg">
            <AppIcon name="check" class="mt-0.5 h-4 w-4 shrink-0 text-success" />{{ item }}
          </li>
        </ul>
        <NuxtLink to="/features#music-bingo" class="mt-6 block text-center text-sm font-semibold text-accent-fg hover:underline">Explore Music Bingo →</NuxtLink>
      </article>
    </div>
  </section>

  <section class="section">
    <h2 class="text-center text-2xl font-bold tracking-tight text-fg-strong md:text-3xl">Questions</h2>
    <div class="mx-auto mt-8 max-w-3xl divide-y divide-line rounded-xl border border-line bg-panel">
      <details v-for="f in faqs" :key="f.q" class="group px-5 py-4">
        <summary class="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-fg-strong">
          {{ f.q }}
          <AppIcon name="plus" class="h-4 w-4 shrink-0 text-muted transition group-open:rotate-45" />
        </summary>
        <p class="mt-2 text-sm text-muted">{{ f.a }}</p>
      </details>
    </div>
  </section>

  <MarketingCta title="Start hosting tonight" />
</template>
