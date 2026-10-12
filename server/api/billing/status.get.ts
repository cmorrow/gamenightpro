import { z } from 'zod'

const querySchema = z.object({ checkout: z.string().startsWith('cs_').optional() })

// Billing summary for the signed-in user. After Checkout, Stripe redirects back with
// ?checkout=cs_...; syncing it here means the page is right even if the webhook is slow.
export default defineEventHandler(async (event) => {
  const { user: sessionUser } = await requireUserSession(event)
  const { checkout } = await getValidatedQuery(event, querySchema.parse)
  let user = await getUserById(sessionUser.id)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Please sign in again' })

  if (checkout && user.billing) {
    const cs = await useStripe().checkout.sessions.retrieve(checkout)
    const subscription = typeof cs.subscription === 'string' ? cs.subscription : cs.subscription?.id
    if (cs.customer === user.billing.customerId && subscription) {
      user = (await syncSubscription(subscription)) ?? user
    }
  }
  return toPublicBilling(user)
})
