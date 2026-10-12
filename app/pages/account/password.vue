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
  <AppHeader v-if="!forced" title="Change password" subtitle="Use at least 10 characters." />
  <div :class="forced ? 'relative flex flex-1 items-center justify-center px-4 py-12' : 'page'">
    <ThemeToggle v-if="forced" class="absolute right-4 top-4 md:right-6 md:top-5" />
    <div class="w-full max-w-sm" :class="forced ? '' : 'mx-auto'">
      <div v-if="forced" class="mb-6 text-center">
        <h1 class="text-2xl font-bold text-fg-strong">Set your password</h1>
        <p class="mt-1 text-muted">You signed in with a temporary password. Choose your own to continue.</p>
      </div>
      <form class="panel space-y-4" @submit.prevent="submit">
        <input type="email" :value="user?.email" autocomplete="username" class="hidden" readonly>
        <div>
          <label class="label" for="current">{{ forced ? 'Temporary password' : 'Current password' }}</label>
          <input id="current" v-model="currentPassword" class="input" type="password" autocomplete="current-password" required>
        </div>
        <div>
          <label class="label" for="new">New password</label>
          <input id="new" v-model="newPassword" class="input" type="password" autocomplete="new-password" minlength="10" required>
          <p class="mt-1.5 text-xs text-subtle">At least 10 characters.</p>
        </div>
        <div>
          <label class="label" for="confirm">Confirm new password</label>
          <input id="confirm" v-model="confirmPassword" class="input" type="password" autocomplete="new-password" required>
        </div>
        <p v-if="error" class="alert-error" role="alert">{{ error }}</p>
        <p v-if="done" class="alert-success">Password updated.</p>
        <button class="btn-primary w-full" type="submit" :disabled="pending">{{ pending ? 'Saving…' : 'Save password' }}</button>
      </form>
    </div>
  </div>
</template>
