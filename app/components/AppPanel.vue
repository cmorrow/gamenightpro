<script setup lang="ts">
// Content panel with the numbered/icon heading used across Music Bingo ("1. Select a Playlist").
defineProps<{ title?: string, subtitle?: string }>()
</script>

<template>
  <section class="panel">
    <div v-if="title" class="mb-5 flex gap-4">
      <div v-if="$slots.icon" class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-fg">
        <slot name="icon" />
      </div>
      <div class="min-w-0 self-center">
        <h2 class="text-lg font-bold text-fg-strong md:text-xl">{{ title }}</h2>
        <p v-if="subtitle" class="mt-0.5 text-sm text-muted">{{ subtitle }}</p>
      </div>
    </div>
    <slot />
  </section>
</template>
