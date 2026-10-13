<script setup lang="ts">
const { brand } = useAppConfig()
const year = new Date().getFullYear()
</script>

<template>
  <footer class="mt-auto border-t border-line">
    <div class="mx-auto flex w-full max-w-[1200px] flex-col gap-4 px-4 py-8 text-sm text-subtle md:flex-row md:items-center md:px-6">
      <p class="md:mr-auto">© {{ year }} {{ brand.appName }}</p>
      <nav class="flex flex-wrap gap-5" aria-label="Footer">
        <NuxtLink to="/features" class="hover:text-fg">Features</NuxtLink>
        <NuxtLink to="/pricing" class="hover:text-fg">Pricing</NuxtLink>
        <NuxtLink to="/login" class="hover:text-fg">Sign in</NuxtLink>
      </nav>
    </div>
  </footer>
</template>
