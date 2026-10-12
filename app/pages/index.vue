<script setup lang="ts">
useHead({ title: 'Home' })
const { user } = useUserSession()

// Placeholders until each game module is plugged in.
const games = [
  { name: 'Music Bingo', description: 'Cards built from your playlists. Play songs from your own player.', to: '/music-bingo' },
  { name: 'Bingo', description: 'Classic number bingo with printable cards.', to: null as string | null },
  { name: 'Trivia', description: 'Rounds, questions and a live scoreboard.', to: null },
]
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold">Welcome, {{ user?.name }}</h1>
    <p class="mt-1 text-slate-500 dark:text-slate-400">Pick a game to host.</p>
    <div class="mt-6 grid gap-4 sm:grid-cols-3">
      <component :is="g.to ? resolveComponent('NuxtLink') : 'div'" v-for="g in games" :key="g.name" :to="g.to ?? undefined" class="card" :class="g.to ? 'transition hover:border-brand-500' : ''">
        <h2 class="text-lg font-semibold">{{ g.name }}</h2>
        <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">{{ g.description }}</p>
        <p v-if="!g.to" class="mt-4 text-xs font-medium uppercase tracking-wide text-slate-400">Coming soon</p>
      </component>
    </div>
  </div>
</template>
