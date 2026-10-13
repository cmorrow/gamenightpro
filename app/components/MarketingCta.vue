<script setup lang="ts">
// Closing call to action shared by the public pages.
defineProps<{ title?: string }>();
</script>

<template>
  <section class="mx-auto w-full max-w-[1200px] px-4 py-16 md:px-6">
    <div class="panel hero-glow text-center">
      <h2 class="text-2xl font-bold text-fg-strong md:text-3xl">
        {{ title ?? "Ready for your next game night?" }}
      </h2>
      <p class="mx-auto mt-3 max-w-xl text-muted">
        Try unlimited Music Bingo free for {{ SINGLE_GAME_PLAN.trialDays }} days,
        then {{ formatPrice(SINGLE_GAME_PLAN.priceMonthly) }}/month. Unlimited
        events, players and printable cards. Cancel anytime before the trial ends.
      </p>
      <div class="mt-6 flex flex-wrap justify-center gap-3">
        <NuxtLink to="/signup" class="btn-primary px-6 py-3 text-base"
          >Start {{ SINGLE_GAME_PLAN.trialDays }}-day free trial</NuxtLink
        >
        <NuxtLink to="/pricing" class="btn-ghost px-6 py-3 text-base"
          >See pricing</NuxtLink
        >
      </div>
    </div>
  </section>
</template>
