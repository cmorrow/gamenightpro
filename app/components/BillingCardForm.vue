<script setup lang="ts">
import { loadStripe } from '@stripe/stripe-js'
import type { Appearance, Stripe, StripeElements } from '@stripe/stripe-js'

// On-site card entry (Stripe Payment Element). Card numbers go straight to Stripe in its iframe
// and never touch our servers. The parent calls `subscribe()` from its own submit button.

let stripePromise: Promise<Stripe | null> | undefined

const config = useRuntimeConfig()
const { theme } = useTheme()
const { fetch: refreshSession } = useUserSession()

const host = ref<HTMLElement>()
const ready = ref(false)
const unavailable = ref(!config.public.stripePublishableKey)
let stripe: Stripe | null = null
let elements: StripeElements | undefined

/** Reads the app's theme tokens so the card fields match the page in dark and light. */
function appearance(): Appearance {
  const css = getComputedStyle(document.documentElement)
  const v = (name: string) => css.getPropertyValue(name).trim()
  return {
    theme: theme.value === 'dark' ? 'night' : 'stripe',
    variables: {
      colorPrimary: v('--accent'),
      colorBackground: v('--panel-2'),
      colorText: v('--fg'),
      colorTextSecondary: v('--muted'),
      colorDanger: v('--danger'),
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      borderRadius: '12px',
    },
  }
}

onMounted(async () => {
  if (unavailable.value) return
  stripePromise ??= loadStripe(config.public.stripePublishableKey)
  stripe = await stripePromise
  if (!stripe || !host.value) {
    unavailable.value = true
    return
  }
  // Deferred intent: the form shows now; the SetupIntent is created on submit, after the account exists.
  elements = stripe.elements({
    mode: 'setup',
    currency: 'usd',
    paymentMethodTypes: ['card'],
    fonts: [{ cssSrc: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap' }],
    appearance: appearance(),
  })
  // The card fields include country and postal code, which Stripe Tax uses for the tax rate.
  const payment = elements.create('payment', { layout: 'tabs', fields: { billingDetails: { address: { country: 'auto', postalCode: 'auto' } } } })
  payment.on('ready', () => { ready.value = true })
  payment.mount(host.value)
})

watch(theme, () => nextTick(() => elements?.update({ appearance: appearance() })))

const fail = (statusMessage: string) => ({ data: { statusMessage } })

/**
 * Saves the card and starts the subscription. Pass `signup` from the sign-up page to create the
 * account first. Throws an error `apiErrorMessage()` can read; returns the new billing summary.
 */
async function subscribe(signup?: { name: string, email: string, password: string }) {
  if (!stripe || !elements) throw fail('Online payment is not available right now.')

  const { error: invalid } = await elements.submit()
  if (invalid) throw fail(invalid.message ?? 'Check your card details.')

  const { clientSecret } = await $fetch('/api/billing/setup', { method: 'POST', body: signup })
  // From here the visitor is signed in, so a retry after a declined card reuses the account.
  await refreshSession()

  const { error: declined, setupIntent } = await stripe.confirmSetup({
    elements,
    clientSecret,
    confirmParams: { return_url: `${location.origin}/account/billing` },
    redirect: 'if_required', // cards only; 3-D Secure opens in a modal instead of leaving the page
  })
  if (declined || !setupIntent) throw fail(declined?.message ?? 'Your card could not be saved.')

  let { billing, clientSecret: paymentSecret } = await $fetch('/api/billing/activate', {
    method: 'POST',
    body: { setupIntent: setupIntent.id },
  })
  if (paymentSecret) {
    const { error: authFailed } = await stripe.handleNextAction({ clientSecret: paymentSecret })
    if (authFailed) throw fail(authFailed.message ?? 'Your bank did not approve the payment.')
    billing = await $fetch('/api/billing/status', { query: { sync: '1' } })
  }
  await refreshSession() // lets the route guard see the new subscription
  return billing
}

defineExpose({ subscribe, ready })
</script>

<template>
  <div>
    <div class="mb-2 flex items-center justify-between">
      <span class="label mb-0">Card details</span>
      <span class="flex items-center gap-1.5 text-xs text-subtle"><AppIcon name="lock" class="h-3.5 w-3.5" />Secured by Stripe</span>
    </div>
    <p v-if="unavailable" class="rounded-xl border border-line px-4 py-3 text-sm text-muted">
      Online payment isn't switched on yet.
    </p>
    <template v-else>
      <div ref="host" />
      <div v-if="!ready" class="h-[180px] animate-pulse rounded-xl bg-fg/5" aria-label="Loading card form" />
    </template>
  </div>
</template>
