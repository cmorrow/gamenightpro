<script setup lang="ts">
const { theme, toggleTheme } = useTheme()
</script>

<template>
  <button type="button" class="btn-icon" :aria-label="theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'" @click="toggleTheme">
    <AppIcon :name="theme === 'dark' ? 'sun' : 'moon'" class="h-5 w-5" />
  </button>
</template>
