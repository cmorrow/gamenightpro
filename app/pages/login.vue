<script setup lang="ts">
definePageMeta({ public: true })
useHead({ title: 'Sign in' })

const { brand } = useAppConfig()
const { fetch: refreshSession } = useUserSession()
const route = useRoute()

const email = ref('')
const password = ref('')
const error = ref('')
const pending = ref(false)

async function submit() {
  error.value = ''
  pending.value = true
  try {
    const { user } = await $fetch('/api/auth/login', { method: 'POST', body: { email: email.value, password: password.value } })
    await refreshSession()
    const redirect = typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/') ? route.query.redirect : '/'
    await navigateTo(user.mustChangePassword ? '/account/password' : redirect)
  }
  catch (err) {
    error.value = apiErrorMessage(err)
    password.value = ''
  }
  finally {
    pending.value = false
  }
}
</script>

<template>
  <div class="mx-auto mt-16 max-w-sm">
    <div class="mb-8 text-center">
      <h1 class="text-3xl font-bold">{{ brand.appName }}</h1>
      <p class="mt-1 text-slate-500 dark:text-slate-400">{{ brand.tagline }}</p>
    </div>
    <form class="card space-y-4" @submit.prevent="submit">
      <div>
        <label class="label" for="email">Email</label>
        <input id="email" v-model="email" class="input" type="email" autocomplete="username" required autofocus>
      </div>
      <div>
        <label class="label" for="password">Password</label>
        <input id="password" v-model="password" class="input" type="password" autocomplete="current-password" required>
      </div>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <button class="btn w-full" type="submit" :disabled="pending">{{ pending ? 'Signing in…' : 'Sign in' }}</button>
    </form>
    <p class="mt-4 text-center text-sm text-slate-500">Need an account? Ask your admin to add you.</p>
  </div>
</template>
