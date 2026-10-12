<script setup lang="ts">
definePageMeta({ admin: true })
useHead({ title: 'Users' })

const { user: me } = useUserSession()
const { data: users, refresh } = await useFetch('/api/users', { default: () => [] })

const form = reactive({ name: '', email: '', role: 'host' as 'host' | 'admin', password: '' })
const error = ref('')
const notice = ref('')
const pending = ref(false)

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  const bytes = crypto.getRandomValues(new Uint8Array(14))
  form.password = Array.from(bytes, b => chars[b % chars.length]).join('')
}
generatePassword()

async function createUser() {
  error.value = notice.value = ''
  pending.value = true
  try {
    await $fetch('/api/users', { method: 'POST', body: form })
    notice.value = `Created ${form.email}. Temporary password: ${form.password} (they must change it at first sign-in).`
    Object.assign(form, { name: '', email: '', role: 'host' })
    generatePassword()
    await refresh()
  }
  catch (err) {
    error.value = apiErrorMessage(err)
  }
  finally {
    pending.value = false
  }
}

async function resetPassword(id: string, email: string) {
  generatePassword()
  const password = form.password
  if (!confirm(`Reset the password for ${email}?`)) return
  try {
    await $fetch(`/api/users/${id}/reset-password`, { method: 'POST', body: { password } })
    notice.value = `Temporary password for ${email}: ${password}`
    generatePassword()
  }
  catch (err) {
    error.value = apiErrorMessage(err)
  }
}

async function removeUser(id: string, email: string) {
  if (!confirm(`Delete ${email}? This cannot be undone.`)) return
  try {
    await $fetch(`/api/users/${id}`, { method: 'DELETE' })
    await refresh()
  }
  catch (err) {
    error.value = apiErrorMessage(err)
  }
}
</script>

<template>
  <AppHeader title="Users" subtitle="Add hosts and manage who can sign in." />
  <main class="page">
    <div class="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr] lg:gap-8">
      <AppPanel title="Add a user" subtitle="They'll set their own password at first sign-in.">
        <template #icon><AppIcon name="plus" class="h-5 w-5" /></template>
        <form class="space-y-4" @submit.prevent="createUser">
          <div><label class="label" for="name">Name</label><input id="name" v-model="form.name" class="input" required></div>
          <div><label class="label" for="email">Email</label><input id="email" v-model="form.email" class="input" type="email" required></div>
          <div>
            <label class="label" for="role">Role</label>
            <select id="role" v-model="form.role" class="input"><option value="host">Host</option><option value="admin">Admin</option></select>
          </div>
          <div>
            <label class="label" for="pw">Temporary password</label>
            <div class="flex gap-2">
              <input id="pw" v-model="form.password" class="input font-mono" required minlength="10">
              <button type="button" class="btn-ghost" @click="generatePassword">New</button>
            </div>
          </div>
          <p v-if="error" class="alert-error" role="alert">{{ error }}</p>
          <p v-if="notice" class="alert-success">{{ notice }}</p>
          <button class="btn-primary w-full" type="submit" :disabled="pending">Add user</button>
        </form>
      </AppPanel>

      <AppPanel :title="`${users.length} ${users.length === 1 ? 'user' : 'users'}`" subtitle="Everyone who can sign in.">
        <template #icon><AppIcon name="users" class="h-5 w-5" /></template>
        <div class="-mx-5 overflow-x-auto md:-mx-6">
          <table class="w-full text-left text-sm">
            <thead class="border-b border-line text-xs uppercase tracking-wider text-subtle">
              <tr><th class="px-5 py-3 md:px-6">Name</th><th class="px-3 py-3">Email</th><th class="px-3 py-3">Role</th><th class="px-3 py-3">Status</th><th class="px-5 md:px-6" /></tr>
            </thead>
            <tbody>
              <tr v-for="u in users" :key="u.id" class="border-b border-line last:border-0">
                <td class="px-5 py-3 font-medium text-fg-strong md:px-6">{{ u.name }}</td>
                <td class="px-3 py-3 text-muted">{{ u.email }}</td>
                <td class="px-3 py-3 capitalize">{{ u.role }}</td>
                <td class="px-3 py-3">
                  <span class="rounded-full px-2.5 py-1 text-xs font-medium" :class="u.mustChangePassword ? 'bg-amber-500/15 text-amber-500' : 'bg-success/15 text-success'">
                    {{ u.mustChangePassword ? 'Temporary password' : 'Active' }}
                  </span>
                </td>
                <td class="whitespace-nowrap px-5 py-3 text-right md:px-6">
                  <button class="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-accent-fg hover:bg-accent/10" @click="resetPassword(u.id, u.email)">Reset password</button>
                  <button v-if="u.id !== me?.id" class="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-danger hover:bg-danger/10" @click="removeUser(u.id, u.email)">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </AppPanel>
    </div>
  </main>
</template>
