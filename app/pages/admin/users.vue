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
  <div>
    <h1 class="text-2xl font-bold">Users</h1>

    <form class="card mt-6 grid gap-4 sm:grid-cols-2" @submit.prevent="createUser">
      <h2 class="font-semibold sm:col-span-2">Add a user</h2>
      <div><label class="label" for="name">Name</label><input id="name" v-model="form.name" class="input" required></div>
      <div><label class="label" for="email">Email</label><input id="email" v-model="form.email" class="input" type="email" required></div>
      <div>
        <label class="label" for="role">Role</label>
        <select id="role" v-model="form.role" class="input"><option value="host">Host</option><option value="admin">Admin</option></select>
      </div>
      <div>
        <label class="label" for="pw">Temporary password</label>
        <div class="flex gap-2"><input id="pw" v-model="form.password" class="input font-mono" required minlength="10"><button type="button" class="btn-ghost" @click="generatePassword">New</button></div>
      </div>
      <p v-if="error" class="error sm:col-span-2" role="alert">{{ error }}</p>
      <p v-if="notice" class="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 sm:col-span-2 dark:bg-green-950 dark:text-green-300">{{ notice }}</p>
      <div class="sm:col-span-2"><button class="btn" type="submit" :disabled="pending">Add user</button></div>
    </form>

    <div class="card mt-6 overflow-x-auto p-0">
      <table class="w-full text-left text-sm">
        <thead class="border-b border-slate-200 text-slate-500 dark:border-slate-700">
          <tr><th class="p-3">Name</th><th class="p-3">Email</th><th class="p-3">Role</th><th class="p-3">Status</th><th class="p-3" /></tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u.id" class="border-b border-slate-100 last:border-0 dark:border-slate-800">
            <td class="p-3">{{ u.name }}</td>
            <td class="p-3">{{ u.email }}</td>
            <td class="p-3 capitalize">{{ u.role }}</td>
            <td class="p-3">{{ u.mustChangePassword ? 'Temporary password' : 'Active' }}</td>
            <td class="whitespace-nowrap p-3 text-right">
              <button class="btn-ghost text-xs" @click="resetPassword(u.id, u.email)">Reset password</button>
              <button v-if="u.id !== me?.id" class="btn-ghost text-xs text-red-600" @click="removeUser(u.id, u.email)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
