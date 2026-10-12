<script setup lang="ts">
const { brand } = useAppConfig()
useHead({ titleTemplate: t => (t ? `${t} · ${brand.appName}` : brand.appName) })
</script>

<template>
  <div class="flex min-h-dvh flex-col bg-app text-fg">
    <slot />
  </div>
</template>
