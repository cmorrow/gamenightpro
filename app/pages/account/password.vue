<script setup lang="ts">
useHead({ title: 'Change password' })
const { user, fetch: refreshSession } = useUserSession()

const forced = computed(() => !!user.value?.mustChangePassword)
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const error = ref('')
const done = ref(false)
const pending = ref(false)

async function submit() {
  error.value = ''
  if (newPassword.value !== confirmPassword.value) {
    error.value = 'The new passwords do not match'
    return
  }
  pending.value = true
  try {
    await $fetch('/api/auth/change-password', {
      method: 'POST',
      body: { currentPassword: currentPassword.value, newPassword: newPassword.value },
    })
    const wasForced = forced.value
    await refreshSession()
    if (wasForced) return navigateTo('/')
    done.value = true
    currentPassword.value = newPassword.value = confirmPassword.value = ''
  }
  catch (err) {
    error.value = apiErrorMessage(err)
  }
  finally {
    pending.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-sm" :class="forced ? 'mt-16' : ''">
    <h1 class="text-2xl font-bold">{{ forced ? 'Set your password' : 'Change password' }}</h1>
    <p v-if="forced" class="mt-1 text-slate-500 dark:text-slate-400">You signed in with a temporary password. Choose your own to continue.</p>
    <form class="card mt-6 space-y-4" @submit.prevent="submit">
      <input type="email" :value="user?.email" autocomplete="username" class="hidden" readonly>
      <div>
        <label class="label" for="current">{{ forced ? 'Temporary password' : 'Current password' }}</label>
        <input id="current" v-model="currentPassword" class="input" type="password" autocomplete="current-password" required>
      </div>
      <div>
        <label class="label" for="new">New password</label>
        <input id="new" v-model="newPassword" class="input" type="password" autocomplete="new-password" minlength="10" required>
        <p class="mt-1 text-xs text-slate-500">At least 10 characters.</p>
      </div>
      <div>
        <label class="label" for="confirm">Confirm new password</label>
        <input id="confirm" v-model="confirmPassword" class="input" type="password" autocomplete="new-password" required>
      </div>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <p v-if="done" class="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">Password updated.</p>
      <button class="btn w-full" type="submit" :disabled="pending">{{ pending ? 'Saving…' : 'Save password' }}</button>
    </form>
  </div>
</template>
