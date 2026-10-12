<script setup lang="ts">
const { brand } = useAppConfig()
const { loggedIn, user, clear } = useUserSession()

useHead({ titleTemplate: t => (t ? `${t} · ${brand.appName}` : brand.appName) })

async function signOut() {
  await clear()
  await navigateTo('/login')
}
</script>

<template>
  <div class="min-h-dvh bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
    <header v-if="loggedIn && !user?.mustChangePassword" class="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <nav class="mx-auto flex max-w-5xl items-center gap-2 px-4 py-3">
        <NuxtLink to="/" class="mr-auto text-lg font-bold">{{ brand.appName }}</NuxtLink>
        <NuxtLink v-if="user?.role === 'admin'" to="/admin/users" class="btn-ghost">Users</NuxtLink>
        <NuxtLink to="/account" class="btn-ghost">Account</NuxtLink>
        <button class="btn-ghost" @click="signOut">Sign out</button>
      </nav>
    </header>
    <main class="mx-auto max-w-5xl px-4 py-8">
      <slot />
    </main>
  </div>
</template>
