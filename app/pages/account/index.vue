<script setup lang="ts">
useHead({ title: 'Account' })
const { user } = useUserSession()
const { theme, setTheme } = useTheme()
</script>

<template>
  <AppHeader title="Account" subtitle="Your profile and preferences." />
  <main class="page">
    <div class="grid max-w-4xl gap-6 md:grid-cols-2">
      <AppPanel title="Profile" subtitle="Ask an admin to change your name or email.">
        <template #icon><AppIcon name="user" class="h-5 w-5" /></template>
        <dl class="space-y-3">
          <div><dt class="text-xs uppercase tracking-wider text-subtle">Name</dt><dd class="text-fg-strong">{{ user?.name }}</dd></div>
          <div><dt class="text-xs uppercase tracking-wider text-subtle">Email</dt><dd class="text-fg-strong">{{ user?.email }}</dd></div>
          <div><dt class="text-xs uppercase tracking-wider text-subtle">Role</dt><dd class="capitalize text-fg-strong">{{ user?.role }}</dd></div>
        </dl>
        <div class="mt-6 flex flex-wrap gap-3">
          <NuxtLink to="/account/password" class="btn-outline"><AppIcon name="key" class="h-4 w-4" />Change password</NuxtLink>
          <NuxtLink to="/account/billing" class="btn-ghost"><AppIcon name="settings" class="h-4 w-4" />Billing</NuxtLink>
        </div>
      </AppPanel>

      <AppPanel title="Appearance" subtitle="Saved on this device.">
        <template #icon><AppIcon :name="theme === 'dark' ? 'moon' : 'sun'" class="h-5 w-5" /></template>
        <div class="grid grid-cols-2 gap-3">
          <button
            v-for="opt in (['dark', 'light'] as const)"
            :key="opt"
            type="button"
            class="rounded-xl border-2 p-4 text-left transition"
            :class="theme === opt ? 'border-accent bg-accent-soft' : 'border-line hover:border-line-strong'"
            :aria-pressed="theme === opt"
            @click="setTheme(opt)"
          >
            <AppIcon :name="opt === 'dark' ? 'moon' : 'sun'" class="mb-2 h-5 w-5 text-accent-fg" />
            <span class="block font-semibold capitalize text-fg-strong">{{ opt }}</span>
            <span class="text-xs text-muted">{{ opt === 'dark' ? 'Default' : 'Optional' }}</span>
          </button>
        </div>
      </AppPanel>
    </div>
  </main>
</template>
