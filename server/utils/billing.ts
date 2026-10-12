import Stripe from 'stripe'
import type { H3Event } from 'h3'
import type { BillingStatus } from '#shared/utils/billing'
import type { UserRecord } from './users'

export interface BillingRecord {
  customerId: string
  subscriptionId: string | null
  status: Exclude<BillingStatus, 'exempt'>
  trialEnd: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  /** One free trial per account, even if they cancel and come back. */
  hadTrial: boolean
}

const db = () => useStorage('db')
const customerKey = (customerId: string) => `stripeCustomer:${customerId}`

let client: Stripe | undefined

/** Throws 503 until the Stripe keys are set, so the app runs without billing in dev. */
export function useStripe() {
  if (!isBillingConfigured()) {
    throw createError({ statusCode: 503, statusMessage: 'Billing is not set up yet' })
  }
  client ??= new Stripe(useRuntimeConfig().stripe.secretKey)
  return client
}

export function isBillingConfigured() {
  const { stripe, public: { stripePublishableKey } } = useRuntimeConfig()
  return !!(stripe.secretKey && stripe.priceId && stripePublishableKey)
}

export function billingStatusOf(user: UserRecord): BillingStatus {
  return user.billing?.status ?? 'exempt'
}

/** Public base URL for Stripe redirects. NUXT_SITE_URL wins over the request host (proxies can rewrite it). */
export function siteOrigin(event: H3Event) {
  return useRuntimeConfig().siteUrl.replace(/\/$/, '') || getRequestURL(event).origin
}

export async function getUserByStripeCustomer(customerId: string) {
  const id = await db().getItem<string>(customerKey(customerId))
  return id ? getUserById(id) : null
}

/** Returns the user's Stripe customer, creating it (and the lookup used by webhooks) on first checkout. */
export async function ensureCustomer(user: UserRecord) {
  if (user.billing) return user.billing.customerId
  const customer = await useStripe().customers.create({
    email: user.email,
    name: user.name,
    metadata: { userId: user.id },
  })
  user.billing = {
    customerId: customer.id,
    subscriptionId: null,
    status: 'none',
    trialEnd: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    hadTrial: false,
  }
  await db().setItem(customerKey(customer.id), user.id)
  await saveUser(user)
  return customer.id
}

const STRIPE_STATUSES = ['trialing', 'active', 'past_due', 'unpaid', 'canceled', 'incomplete', 'incomplete_expired', 'paused'] as const
// Stripe may add statuses; an unknown one is treated as no access until we handle it.
const toStatus = (s: string): BillingRecord['status'] =>
  (STRIPE_STATUSES as readonly string[]).includes(s) ? s as BillingRecord['status'] : 'incomplete'

const iso = (seconds: number | null | undefined) => seconds ? new Date(seconds * 1000).toISOString() : null

/**
 * Re-reads the subscription from Stripe and stores its state on the owning user.
 * Fetching instead of trusting the event payload makes out-of-order and retried webhooks harmless.
 */
export async function syncSubscription(subscriptionId: string) {
  const sub = await useStripe().subscriptions.retrieve(subscriptionId)
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
  const user = await getUserByStripeCustomer(customerId)
  if (!user?.billing) {
    console.warn(`[billing] No user for Stripe customer ${customerId}; ignoring subscription ${sub.id}`)
    return null
  }
  // A late event for an old, ended subscription must not overwrite a newer live one.
  const current = user.billing
  if (current.subscriptionId && current.subscriptionId !== sub.id
    && hasBillingAccess(current.status) && !hasBillingAccess(toStatus(sub.status))) {
    return user
  }
  const status = toStatus(sub.status)
  const item = sub.items.data[0]
  user.billing = {
    ...current,
    subscriptionId: sub.id,
    status,
    trialEnd: iso(sub.trial_end),
    currentPeriodEnd: iso(item?.current_period_end),
    cancelAtPeriodEnd: sub.cancel_at_period_end || !!sub.cancel_at,
    hadTrial: current.hadTrial || !!sub.trial_start,
  }
  await saveUser(user)
  return user
}

/** Stops billing and drops the customer lookup. Used when an admin deletes an account. */
export async function removeBilling(billing: BillingRecord) {
  if (billing.subscriptionId && hasBillingAccess(billing.status)) {
    await useStripe().subscriptions.cancel(billing.subscriptionId)
  }
  await db().removeItem(customerKey(billing.customerId))
}

export function toPublicBilling(user: UserRecord) {
  const b = user.billing
  return {
    status: billingStatusOf(user),
    trialEnd: b?.trialEnd ?? null,
    currentPeriodEnd: b?.currentPeriodEnd ?? null,
    cancelAtPeriodEnd: b?.cancelAtPeriodEnd ?? false,
    trialAvailable: !b?.hadTrial,
    configured: isBillingConfigured(),
  }
}
