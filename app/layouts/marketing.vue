<template>
  <div class="flex min-h-dvh flex-col bg-app text-fg">
    <MarketingHeader />
    <main class="flex-1">
      <slot />
    </main>
    <MarketingFooter />
  </div>
</template>
