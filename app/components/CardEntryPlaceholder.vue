<script setup lang="ts">
// Stand-in for the payment step on the sign-up page. The Stripe integration replaces it
// (Stripe Checkout redirect, or an embedded Payment Element) so card numbers never touch our servers.
</script>

<template>
  <div class="rounded-xl border-2 border-dashed border-line-strong p-4">
    <div class="flex items-center gap-3">
      <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-fg">
        <AppIcon name="card" class="h-5 w-5" />
      </div>
      <div class="min-w-0">
        <p class="font-semibold text-fg-strong">Card details</p>
        <p class="text-sm text-muted">Entered securely with Stripe on the next step.</p>
      </div>
      <AppIcon name="lock" class="ml-auto h-4 w-4 shrink-0 text-subtle" />
    </div>
  </div>
</template>
