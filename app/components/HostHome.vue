<script setup lang="ts">
// Signed-in home: pick a game to host.
const { user } = useUserSession()

// Placeholders until each game module is plugged in.
const games = [
  { name: 'Music Bingo', icon: 'music', description: 'Cards built from your playlists. Play songs from your own player.', to: '/music-bingo' },
  { name: 'Bingo', icon: 'grid', description: 'Classic number bingo with printable cards.', to: null },
  { name: 'Trivia', icon: 'trivia', description: 'Rounds, questions and a live scoreboard.', to: null },
] as const

// Resolved in script: resolveComponent() inside the template can't find NuxtLink.
const NuxtLink = resolveComponent('NuxtLink')
</script>

<template>
  <AppHeader :title="`Welcome, ${user?.name ?? ''}`" subtitle="Pick a game to host." />
  <main class="page">
    <div class="grid gap-6 md:grid-cols-3">
      <component
        :is="g.to ? NuxtLink : 'div'"
        v-for="g in games"
        :key="g.name"
        :to="g.to ?? undefined"
        class="panel group flex flex-col gap-4"
        :class="g.to ? 'transition hover:border-accent/60' : 'opacity-70'"
      >
        <div class="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent-fg">
          <AppIcon :name="g.icon" class="h-6 w-6" />
        </div>
        <div>
          <h2 class="text-lg font-bold text-fg-strong md:text-xl">{{ g.name }}</h2>
          <p class="mt-1 text-sm text-muted">{{ g.description }}</p>
        </div>
        <p v-if="!g.to" class="mt-auto text-xs font-semibold uppercase tracking-wider text-subtle">Coming soon</p>
        <p v-else class="mt-auto text-sm font-semibold text-accent-fg">Open →</p>
      </component>
    </div>
  </main>
</template>
