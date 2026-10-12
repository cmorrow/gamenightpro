<script setup lang="ts">
// Section header: wordmark on the left, the section's title in the middle, its actions
// and the settings menu on the right. Each section (home, music bingo, trivia…) renders
// its own, passing a title/subtitle and any action buttons in the default slot.
defineProps<{ title: string, subtitle?: string }>()

const { brand } = useAppConfig()
const { user, clear } = useUserSession()
const { theme, toggleTheme } = useTheme()

const open = ref(false)
const menuRef = ref<HTMLElement>()
onClickOutside(menuRef, () => (open.value = false))

async function signOut() {
  open.value = false
  await clear()
  await navigateTo('/login')
}
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-line bg-header backdrop-blur-sm">
    <div class="mx-auto grid w-full max-w-[1520px] items-center gap-4 px-4 py-4 md:px-6 md:py-5 lg:grid-cols-[1fr_auto_1fr]">
      <NuxtLink to="/" class="flex justify-center lg:justify-start" :aria-label="`${brand.appName} home`">
        <slot name="logo">
          <span class="wordmark text-2xl md:text-3xl">{{ brand.appName }}</span>
        </slot>
      </NuxtLink>

      <div class="text-center">
        <h1 class="text-2xl font-bold tracking-tight text-fg-strong md:text-3xl">{{ title }}</h1>
        <p v-if="subtitle" class="mt-1 text-sm text-muted md:text-base">{{ subtitle }}</p>
      </div>

      <div class="flex flex-wrap items-center justify-center gap-3 lg:justify-end">
        <slot />

        <div ref="menuRef" class="relative">
          <button type="button" class="btn-icon" :class="{ 'bg-fg/10 text-fg-strong': open }" aria-label="Settings" :aria-expanded="open" @click="open = !open">
            <AppIcon name="settings" class="h-5 w-5" />
          </button>
          <Transition
            enter-active-class="transition duration-100 ease-out" enter-from-class="opacity-0 scale-95" enter-to-class="opacity-100 scale-100"
            leave-active-class="transition duration-75 ease-in" leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-95"
          >
            <div v-if="open" class="menu absolute right-0 top-[calc(100%+0.5rem)] w-56 origin-top-right" role="menu">
              <p class="truncate px-4 pb-2 pt-1.5 text-xs text-subtle">{{ user?.email }}</p>
              <NuxtLink to="/" class="menu-item" role="menuitem" @click="open = false"><AppIcon name="home" class="h-4 w-4 text-accent" />Home</NuxtLink>
              <NuxtLink to="/account" class="menu-item" role="menuitem" @click="open = false"><AppIcon name="user" class="h-4 w-4 text-accent" />Account</NuxtLink>
              <NuxtLink v-if="user?.role === 'admin'" to="/admin/users" class="menu-item" role="menuitem" @click="open = false"><AppIcon name="users" class="h-4 w-4 text-accent" />Users</NuxtLink>
              <button type="button" class="menu-item" role="menuitem" @click="toggleTheme">
                <AppIcon :name="theme === 'dark' ? 'sun' : 'moon'" class="h-4 w-4 text-accent" />
                {{ theme === 'dark' ? 'Light theme' : 'Dark theme' }}
              </button>
              <div class="my-1 border-t border-line" />
              <button type="button" class="menu-item" role="menuitem" @click="signOut"><AppIcon name="logout" class="h-4 w-4 text-accent" />Sign out</button>
            </div>
          </Transition>
        </div>
      </div>
    </div>
    <slot name="status" />
  </header>
</template>
