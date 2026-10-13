<script setup lang="ts">
// "/" is the landing page for visitors and the game picker for signed-in hosts.
definePageMeta({ public: true, layout: false })

const { loggedIn } = useUserSession()
const { brand } = useAppConfig()
useHead(() => ({ title: loggedIn.value ? 'Home' : '', meta: [{ name: 'description', content: brand.tagline }] }))
</script>

<template>
  <NuxtLayout v-if="loggedIn" name="default"><HostHome /></NuxtLayout>
  <NuxtLayout v-else name="marketing"><LandingPage /></NuxtLayout>
</template>
