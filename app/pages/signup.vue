<script setup lang="ts">
definePageMeta({ public: true, guestOnly: true, layout: 'marketing' })
useHead({ title: 'Start your free trial' })

const price = formatPrice(PLAN.priceMonthly)
const trialEnds = new Date(Date.now() + PLAN.trialDays * 24 * 60 * 60 * 1000)
  .toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

const form = reactive({ name: '', email: '', password: '', agree: false })
const error = ref('')
const pending = ref(false)

async function submit() {
  error.value = ''
  pending.value = true
  try {
    // Creates the account, signs it in and returns a Stripe Checkout URL (7-day trial, card required).
    const res = await $fetch<{ url?: string }>('/api/billing/checkout', {
      method: 'POST',
      body: { name: form.name, email: form.email, password: form.password },
    })
    if (typeof res?.url !== 'string') throw createError({ statusCode: 404 })
    await navigateTo(res.url, { external: true })
  }
  catch (err) {
    // 404 until the billing API ships; 503 until Stripe keys are configured.
    const status = (err as { statusCode?: number }).statusCode
    error.value = status === 404 || status === 503
      ? 'Online sign-up opens soon. Ask your admin for an account in the meantime.'
      : apiErrorMessage(err)
  }
  finally {
    pending.value = false
  }
}
</script>

<template>
  <section class="hero-glow">
    <div class="mx-auto grid w-full max-w-[1100px] gap-10 px-4 py-12 md:px-6 md:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:items-start">
      <div class="lg:pt-6">
        <p class="eyebrow">{{ PLAN.trialDays }}-day free trial</p>
        <h1 class="mt-4 text-4xl font-extrabold tracking-tight text-fg-strong md:text-5xl">Start hosting free</h1>
        <p class="mt-4 max-w-lg text-lg text-muted">Full access to Music Bingo, Bingo and Trivia. You won't be charged until {{ trialEnds }}.</p>
        <ul class="mt-8 space-y-3">
          <li v-for="item in PLAN.includes" :key="item" class="flex gap-3 text-fg">
            <AppIcon name="check" class="mt-1 h-4 w-4 shrink-0 text-success" />{{ item }}
          </li>
        </ul>
      </div>

      <form class="panel space-y-4" @submit.prevent="submit">
        <div>
          <label class="label" for="name">Your name</label>
          <input id="name" v-model="form.name" class="input" autocomplete="name" required maxlength="100">
        </div>
        <div>
          <label class="label" for="email">Email</label>
          <input id="email" v-model="form.email" class="input" type="email" autocomplete="email" required>
        </div>
        <div>
          <label class="label" for="password">Password</label>
          <input id="password" v-model="form.password" class="input" type="password" autocomplete="new-password" minlength="10" required aria-describedby="password-hint">
          <p id="password-hint" class="mt-1.5 text-xs text-subtle">At least 10 characters.</p>
        </div>

        <CardEntryPlaceholder />

        <div class="rounded-xl bg-fg/5 px-4 py-3 text-sm">
          <div class="flex justify-between"><span class="text-muted">Due today</span><span class="font-semibold text-fg-strong">{{ formatPrice(0) }}</span></div>
          <div class="mt-1 flex justify-between"><span class="text-muted">From {{ trialEnds }}</span><span class="text-fg">{{ price }}/month</span></div>
        </div>

        <label class="flex gap-3 text-sm text-muted">
          <input v-model="form.agree" type="checkbox" class="mt-0.5 h-4 w-4 shrink-0 accent-[var(--accent)]" required>
          <span>I understand my card is billed {{ price }} each month after the {{ PLAN.trialDays }}-day trial unless I cancel before it ends.</span>
        </label>

        <p v-if="error" class="alert-error" role="alert">{{ error }}</p>
        <button class="btn-primary w-full py-3 text-base" type="submit" :disabled="pending">{{ pending ? 'Starting…' : 'Continue to payment' }}</button>
        <p class="text-center text-sm text-subtle">Already have an account? <NuxtLink to="/login" class="font-semibold text-accent-fg hover:underline">Sign in</NuxtLink></p>
      </form>
    </div>
  </section>
</template>
