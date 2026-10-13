<script setup lang="ts">
import { differentiators, games } from "~/data/features";

definePageMeta({ public: true, layout: "marketing" });
useHead({ title: "Features" });
</script>

<template>
  <section class="hero-glow">
    <div class="section pb-8 text-center md:pb-10">
      <p class="eyebrow">Features</p>
      <h1
        class="mx-auto mt-4 max-w-3xl text-4xl font-extrabold tracking-tight text-fg-strong md:text-5xl"
      >
        Everything for an unlimited Music Bingo night
      </h1>
      <p class="mx-auto mt-4 max-w-2xl text-lg text-muted">
        The Music Bingo subscription includes unlimited events, players and
        printable cards. Bingo and Trivia are coming soon. Features marked
        <span class="badge badge-new">New</span> are ones you won't find in most
        hosting tools.
      </p>
      <nav class="mt-8 flex flex-wrap justify-center gap-2" aria-label="Games">
        <a v-for="g in games" :key="g.id" :href="`#${g.id}`" class="btn-ghost"
          ><AppIcon :name="g.icon" class="h-4 w-4 text-accent-fg" />{{
            g.name
          }}</a
        >
      </nav>
    </div>
  </section>

  <section
    v-for="g in games"
    :id="g.id"
    :key="g.id"
    class="section scroll-mt-20 border-t border-line"
  >
    <div class="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <div>
        <div
          class="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent-fg"
        >
          <AppIcon :name="g.icon" class="h-7 w-7" />
        </div>
        <h2
          class="mt-5 flex flex-wrap items-center gap-3 text-3xl font-bold tracking-tight text-fg-strong"
        >
          {{ g.name }}
          <span v-if="g.status === 'soon'" class="badge">Coming soon</span>
        </h2>
        <p class="mt-3 text-muted">{{ g.pitch }}</p>
      </div>
      <ul class="grid gap-4 sm:grid-cols-2">
        <li v-for="f in g.features" :key="f.title" class="panel p-5 md:p-5">
          <h3
            class="flex flex-wrap items-center gap-2 font-semibold text-fg-strong"
          >
            {{ f.title }}
            <span v-if="f.isNew" class="badge badge-new"
              ><AppIcon name="sparkles" class="h-3 w-3" />New</span
            >
          </h3>
          <p class="mt-1.5 text-sm text-muted">{{ f.body }}</p>
        </li>
      </ul>
    </div>
  </section>

  <section class="section border-t border-line">
    <div class="mx-auto max-w-2xl text-center">
      <p class="eyebrow">Every game includes</p>
      <h2 class="mt-3 text-3xl font-bold tracking-tight text-fg-strong">
        The platform around the games
      </h2>
    </div>
    <div class="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <div v-for="d in differentiators" :key="d.title" class="panel">
        <div
          class="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent-fg"
        >
          <AppIcon :name="d.icon" class="h-5 w-5" />
        </div>
        <h3 class="mt-4 font-semibold text-fg-strong">{{ d.title }}</h3>
        <p class="mt-1 text-sm text-muted">{{ d.body }}</p>
      </div>
    </div>
  </section>

  <MarketingCta />
</template>
