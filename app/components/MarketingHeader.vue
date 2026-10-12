<script setup lang="ts">
// Header for the public pages (landing, features, pricing, sign-up). Signed-in users
// see "Open app" instead of the sign-in and trial buttons.
const { brand } = useAppConfig()
const { loggedIn } = useUserSession()
const route = useRoute()

const links = [
  { to: '/features', label: 'Features' },
  { to: '/pricing', label: 'Pricing' },
]

const open = ref(false)
watch(() => route.fullPath, () => (open.value = false))
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-line bg-header backdrop-blur-sm">
    <div class="mx-auto flex w-full max-w-[1200px] items-center gap-4 px-4 py-4 md:px-6">
      <NuxtLink to="/" class="mr-auto" :aria-label="`${brand.appName} home`">
        <span class="wordmark text-2xl">{{ brand.appName }}</span>
      </NuxtLink>

      <nav class="hidden items-center gap-1 md:flex" aria-label="Main">
        <NuxtLink v-for="l in links" :key="l.to" :to="l.to" class="nav-link" active-class="nav-link-active">{{ l.label }}</NuxtLink>
      </nav>

      <div class="hidden items-center gap-3 md:flex">
        <ThemeToggle />
        <template v-if="loggedIn">
          <NuxtLink to="/" class="btn-primary">Open app</NuxtLink>
        </template>
        <template v-else>
          <NuxtLink to="/login" class="btn-ghost">Sign in</NuxtLink>
          <NuxtLink to="/signup" class="btn-primary">Start free trial</NuxtLink>
        </template>
      </div>

      <button type="button" class="btn-icon md:hidden" :aria-expanded="open" aria-controls="mobile-nav" aria-label="Menu" @click="open = !open">
        <AppIcon :name="open ? 'close' : 'menu'" class="h-5 w-5" />
      </button>
    </div>

    <nav v-if="open" id="mobile-nav" class="border-t border-line px-4 pb-4 pt-2 md:hidden" aria-label="Main">
      <NuxtLink v-for="l in links" :key="l.to" :to="l.to" class="menu-item rounded-xl">{{ l.label }}</NuxtLink>
      <div class="mt-3 flex items-center gap-3">
        <ThemeToggle />
        <NuxtLink v-if="loggedIn" to="/" class="btn-primary flex-1">Open app</NuxtLink>
        <template v-else>
          <NuxtLink to="/login" class="btn-ghost flex-1">Sign in</NuxtLink>
          <NuxtLink to="/signup" class="btn-primary flex-1">Start free trial</NuxtLink>
        </template>
      </div>
    </nav>
  </header>
</template>
