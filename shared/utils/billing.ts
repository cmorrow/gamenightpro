/**
 * `exempt`: accounts an admin created (no Stripe billing). `none`: signed up but never finished checkout.
 * The rest mirror Stripe's subscription statuses.
 */
export type BillingStatus =
  | 'exempt' | 'none'
  | 'trialing' | 'active' | 'past_due' | 'unpaid' | 'canceled'
  | 'incomplete' | 'incomplete_expired' | 'paused'

// past_due keeps access while Stripe retries the card; Stripe moves it to unpaid or canceled if retries fail.
const ACCESS: BillingStatus[] = ['exempt', 'trialing', 'active', 'past_due']

export function hasBillingAccess(status: BillingStatus | undefined) {
  // Sessions issued before billing existed carry no status; treat them like admin-created accounts.
  return !status || ACCESS.includes(status)
}
