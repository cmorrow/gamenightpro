import { z } from 'zod'

const querySchema = z.object({ sync: z.literal('1').optional() })

// Billing summary for the signed-in user. ?sync=1 re-reads the subscription from Stripe
// (after a 3-D Secure step, or a redirect back), so the page is right even if the webhook is slow.
export default defineEventHandler(async (event) => {
  const { user: sessionUser } = await requireUserSession(event)
  const { sync } = await getValidatedQuery(event, querySchema.parse)
  let user = await getUserById(sessionUser.id)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Please sign in again' })

  if (sync && user.billing?.subscriptionId) {
    user = (await syncSubscription(user.billing.subscriptionId)) ?? user
  }
  return toPublicBilling(user)
})
