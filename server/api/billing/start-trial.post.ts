import { z } from 'zod'

const bodySchema = z.object({
  name: z.string().trim().min(1, 'Enter your name').max(100),
  email: emailSchema,
  password: passwordSchema,
})

// Self sign-up with a free trial. The sign-up page posts here.
//
// Checkout hook: until Stripe is configured (NUXT_STRIPE_SECRET_KEY and NUXT_STRIPE_PRICE_ID),
// this validates the form and replies 503 so no unpaid accounts get created. The Stripe
// integration replaces the 503 with: create the user (role 'host', mustChangePassword false),
// create a Stripe Checkout Session in subscription mode with
// subscription_data.trial_period_days = PLAN.trialDays and payment_method_collection 'always'
// (card required, billed automatically when the trial ends), then return { checkoutUrl }
// for the page to redirect to. A webhook route keeps the subscription status in sync.
export default defineEventHandler(async (event) => {
  await readValidatedBody(event, bodySchema.parse)

  const { stripeSecretKey, stripePriceId } = useRuntimeConfig(event)
  if (!stripeSecretKey || !stripePriceId) {
    throw createError({ statusCode: 503, statusMessage: 'Online sign-up opens soon. Ask your admin for an account in the meantime.' })
  }

  throw createError({ statusCode: 501, statusMessage: 'Checkout is not wired up yet.' })
})
