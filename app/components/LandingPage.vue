<script setup lang="ts">
import { differentiators, games } from "~/data/features";

const { brand } = useAppConfig();
</script>

<template>
  <section class="hero-glow">
    <div class="section text-center">
      <p class="eyebrow">Music Bingo for hosts, DJs and venues</p>
      <h1
        class="mx-auto mt-4 max-w-3xl text-4xl font-extrabold tracking-tight text-fg-strong md:text-6xl"
      >
        Run a packed game night <span class="wordmark">from one laptop</span>
      </h1>
      <p class="mx-auto mt-5 max-w-2xl text-lg text-muted">
        {{ brand.appName }} gives you everything you need to run Music Bingo:
        unlimited events, players and printable cards, even when the venue Wi-Fi gives out.
      </p>
      <div class="mt-8 flex flex-wrap justify-center gap-3">
        <NuxtLink to="/signup" class="btn-primary px-6 py-3 text-base"
          >Start {{ PLAN.trialDays }}-day free trial</NuxtLink
        >
        <NuxtLink to="/features" class="btn-ghost px-6 py-3 text-base"
          >See all features</NuxtLink
        >
      </div>
      <p class="mt-4 text-sm text-subtle">
        {{ formatPrice(SINGLE_GAME_PLAN.priceMonthly) }}/month. No caps, no overages. Cancel anytime.
      </p>
    </div>
  </section>

  <section class="section pt-0 md:pt-0">
    <div class="grid gap-6 md:grid-cols-3">
      <NuxtLink
        v-for="g in games"
        :key="g.id"
        :to="`/features#${g.id}`"
        class="panel group flex flex-col gap-4 transition hover:border-accent/60"
      >
        <div class="flex items-center justify-between">
          <div
            class="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent-fg"
          >
            <AppIcon :name="g.icon" class="h-6 w-6" />
          </div>
          <span v-if="g.status === 'soon'" class="badge">Coming soon</span>
        </div>
        <div>
          <h2 class="text-lg font-bold text-fg-strong md:text-xl">
            {{ g.name }}
          </h2>
          <p class="mt-1 text-sm text-muted">{{ g.pitch }}</p>
        </div>
        <p class="mt-auto text-sm font-semibold text-accent-fg">
          Explore {{ g.name }} →
        </p>
      </NuxtLink>
    </div>
  </section>

  <section class="section border-t border-line">
    <div class="mx-auto max-w-2xl text-center">
      <p class="eyebrow">Why hosts switch</p>
      <h2
        class="mt-3 text-3xl font-bold tracking-tight text-fg-strong md:text-4xl"
      >
        Built for real venues
      </h2>
    </div>
    <div class="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <div v-for="d in differentiators" :key="d.title" class="flex gap-4">
        <div
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-fg"
        >
          <AppIcon :name="d.icon" class="h-5 w-5" />
        </div>
        <div>
          <h3 class="font-semibold text-fg-strong">{{ d.title }}</h3>
          <p class="mt-1 text-sm text-muted">{{ d.body }}</p>
        </div>
      </div>
    </div>
  </section>

  <MarketingCta />
</template>
