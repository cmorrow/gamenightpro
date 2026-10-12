<script setup lang="ts">
useHead({ title: 'Billing' })
const route = useRoute()
const { fetch: refreshSession } = useUserSession()

// Stripe only sends people back here (with ?setup_intent=...) if their bank's check needed a full redirect.
const returned = typeof route.query.setup_intent === 'string'
const { data: billing, error: loadError } = await useFetch('/api/billing/status', { query: returned ? { sync: '1' } : {} })
if (returned) await refreshSession()

const error = ref('')
const pending = ref(false)
const subscribed = ref(false)
const cardForm = ref<{ subscribe: () => Promise<typeof billing.value> }>()

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
      : `Your trial ends ${formatDate(b.trialEnd)}. Your card will be charged ${formatPrice(PLAN.priceMonthly)} then, unless you cancel first.`
  }
  if (b.status === 'active') {
    return b.cancelAtPeriodEnd
      ? `Your plan ends ${formatDate(b.currentPeriodEnd)} and will not renew.`
      : `Renews ${formatDate(b.currentPeriodEnd)} for ${formatPrice(PLAN.priceMonthly)}.`
  }
  if (b.status === 'past_due') return 'We could not charge your card. Update it in Manage billing to keep hosting.'
  if (b.status === 'exempt') return 'Your account was set up by an admin and is not billed.'
  return b.trialAvailable
    ? `Start your ${PLAN.trialDays}-day free trial. Add a card now; you won't be charged until the trial ends.`
    : 'Subscribe to keep hosting games.'
})

async function subscribe() {
  error.value = ''
  pending.value = true
  try {
    billing.value = await cardForm.value!.subscribe()
    subscribed.value = true
  }
  catch (err) {
    error.value = apiErrorMessage(err)
  }
  finally {
    pending.value = false
  }
}

async function manage() {
  error.value = ''
  pending.value = true
  try {
    const { url } = await $fetch('/api/billing/portal', { method: 'POST' })
    await navigateTo(url, { external: true })
  }
  catch (err) {
    error.value = apiErrorMessage(err)
    pending.value = false
  }
}
</script>

<template>
  <AppHeader title="Billing" :subtitle="`${PLAN.name}, ${formatPrice(PLAN.priceMonthly)} a month.`" />
  <main class="page">
    <div class="max-w-xl space-y-4">
      <p v-if="subscribed && hasAccess" class="alert-success">You're all set. Thanks for subscribing!</p>
      <p v-if="loadError || error" class="alert-error">{{ error || apiErrorMessage(loadError) }}</p>

      <AppPanel v-if="billing" title="Your plan" :subtitle="STATUS_LABEL[billing.status]">
        <template #icon><AppIcon name="settings" class="h-5 w-5" /></template>
        <p class="text-fg">{{ nextStep }}</p>
        <p v-if="!billing.configured && billing.status !== 'exempt'" class="mt-3 text-sm text-muted">
          Online billing isn't switched on yet. Contact an admin.
        </p>
        <form v-if="canSubscribe" class="mt-6 space-y-4" @submit.prevent="subscribe">
          <BillingCardForm ref="cardForm" />
          <button type="submit" class="btn-primary w-full" :disabled="pending">
            {{ pending ? 'Saving…' : billing.trialAvailable ? 'Start free trial' : `Subscribe for ${formatPrice(PLAN.priceMonthly)}/month` }}
          </button>
        </form>
        <div class="mt-6 flex flex-wrap gap-3">
          <button v-if="canManage" type="button" class="btn-outline" :disabled="pending" @click="manage">
            Manage billing
          </button>
          <NuxtLink v-if="hasAccess" to="/" class="btn-ghost">Go to games</NuxtLink>
        </div>
      </AppPanel>
    </div>
  </main>
</template>
