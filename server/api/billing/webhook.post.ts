import type Stripe from 'stripe'

const SUBSCRIPTION_EVENTS = new Set<Stripe.Event.Type>([
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'customer.subscription.paused',
  'customer.subscription.resumed',
])

// Stripe calls this on subscription changes (trial started, renewed, payment failed, canceled).
// Point a Stripe webhook endpoint at https://<site>/api/billing/webhook and set NUXT_STRIPE_WEBHOOK_SECRET.
export default defineEventHandler(async (event) => {
  const stripe = useStripe()
  const secret = useRuntimeConfig().stripe.webhookSecret
  const signature = getHeader(event, 'stripe-signature')
  const payload = await readRawBody(event, false)
  if (!secret || !signature || !payload) throw createError({ statusCode: 400, statusMessage: 'Missing signature' })

  let stripeEvent: Stripe.Event
  try {
    stripeEvent = await stripe.webhooks.constructEventAsync(payload, signature, secret)
  }
  catch {
    throw createError({ statusCode: 400, statusMessage: 'Invalid signature' })
  }

  if (SUBSCRIPTION_EVENTS.has(stripeEvent.type)) {
    await syncSubscription((stripeEvent.data.object as Stripe.Subscription).id)
  }
  return { received: true }
})
