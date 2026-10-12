<script setup lang="ts">
useHead({ title: 'Billing' })
const route = useRoute()
const { fetch: refreshSession } = useUserSession()

// Stripe sends people back here with ?checkout=cs_... (finished) or ?checkout=canceled.
const checkoutId = typeof route.query.checkout === 'string' && route.query.checkout.startsWith('cs_') ? route.query.checkout : undefined
const canceled = route.query.checkout === 'canceled'

const { data: billing, error: loadError } = await useFetch('/api/billing/status', { query: { checkout: checkoutId } })
// The status call may have just activated the subscription; refresh the session so the route guard lets them in.
if (checkoutId) await refreshSession()

const error = ref('')
const pending = ref(false)

const STATUS_LABEL: Record<BillingStatus, string> = {
  exempt: 'Included with your account',
  none: 'No subscription',
  trialing: 'Free trial',
  active: 'Active',
  past_due: 'Payment failed',
  unpaid: 'Unpaid',
  canceled: 'Canceled',
  incomplete: 'Waiting for payment',
  incomplete_expired: 'Expired',
  paused: 'Paused',
}

const hasAccess = computed(() => hasBillingAccess(billing.value?.status))
const canSubscribe = computed(() => billing.value?.configured && !hasAccess.value)
const canManage = computed(() => billing.value?.configured && billing.value.status !== 'exempt' && billing.value.status !== 'none')
const formatDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : ''

const nextStep = computed(() => {
  const b = billing.value
  if (!b) return ''
  if (b.status === 'trialing') {
    return b.cancelAtPeriodEnd
      ? `Your trial ends ${formatDate(b.trialEnd)} and will not renew.`
      : `Your trial ends ${formatDate(b.trialEnd)}. Your card will be charged $${PLAN.monthlyPrice} then, unless you cancel first.`
  }
  if (b.status === 'active') {
    return b.cancelAtPeriodEnd
      ? `Your plan ends ${formatDate(b.currentPeriodEnd)} and will not renew.`
      : `Renews ${formatDate(b.currentPeriodEnd)} for $${PLAN.monthlyPrice}.`
  }
  if (b.status === 'past_due') return 'We could not charge your card. Update it in Manage billing to keep hosting.'
  if (b.status === 'exempt') return 'Your account was set up by an admin and is not billed.'
  return b.trialAvailable
    ? `Start your ${PLAN.trialDays}-day free trial. Add a card now; you won't be charged until the trial ends.`
    : 'Subscribe to keep hosting games.'
})

async function go(endpoint: '/api/billing/checkout' | '/api/billing/portal') {
  error.value = ''
  pending.value = true
  try {
    const { url } = await $fetch(endpoint, { method: 'POST' })
    await navigateTo(url, { external: true })
  }
  catch (err) {
    error.value = apiErrorMessage(err)
    pending.value = false
  }
}
</script>

<template>
  <AppHeader title="Billing" :subtitle="`${PLAN.name}, $${PLAN.monthlyPrice} a month.`" />
  <main class="page">
    <div class="max-w-xl space-y-4">
      <p v-if="checkoutId && hasAccess" class="alert-success">You're all set. Thanks for subscribing!</p>
      <p v-else-if="canceled" class="alert-error">Checkout was canceled. You can start again any time.</p>
      <p v-if="loadError || error" class="alert-error">{{ error || apiErrorMessage(loadError) }}</p>

      <AppPanel v-if="billing" title="Your plan" :subtitle="STATUS_LABEL[billing.status]">
        <template #icon><AppIcon name="card" class="h-5 w-5" /></template>
        <p class="text-fg">{{ nextStep }}</p>
        <p v-if="!billing.configured && billing.status !== 'exempt'" class="mt-3 text-sm text-muted">
          Online billing isn't switched on yet. Contact an admin.
        </p>
        <div class="mt-6 flex flex-wrap gap-3">
          <button v-if="canSubscribe" type="button" class="btn-primary" :disabled="pending" @click="go('/api/billing/checkout')">
            {{ billing.trialAvailable ? 'Start free trial' : 'Subscribe' }}
          </button>
          <button v-if="canManage" type="button" class="btn-outline" :disabled="pending" @click="go('/api/billing/portal')">
            Manage billing
          </button>
          <NuxtLink v-if="hasAccess" to="/" class="btn-ghost">Go to games</NuxtLink>
        </div>
      </AppPanel>
    </div>
  </main>
</template>
