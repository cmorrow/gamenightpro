<script setup lang="ts">
useHead({ title: 'Account' })
const { user } = useUserSession()
</script>

<template>
  <div class="max-w-lg">
    <h1 class="text-2xl font-bold">Account</h1>
    <dl class="card mt-6 space-y-3">
      <div><dt class="text-sm text-slate-500">Name</dt><dd>{{ user?.name }}</dd></div>
      <div><dt class="text-sm text-slate-500">Email</dt><dd>{{ user?.email }}</dd></div>
      <div><dt class="text-sm text-slate-500">Role</dt><dd class="capitalize">{{ user?.role }}</dd></div>
    </dl>
    <NuxtLink to="/account/password" class="btn mt-4">Change password</NuxtLink>
  </div>
</template>
