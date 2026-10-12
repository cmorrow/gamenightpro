import { z } from 'zod'

const signupSchema = z.object({
  name: z.string().trim().min(1, 'Enter your name').max(100),
  email: emailSchema,
  password: passwordSchema,
})

// Starts Stripe Checkout for the monthly plan. Signed-out visitors send { name, email, password }
// and get a host account (signed in) first; signed-in users send nothing.
export default defineEventHandler(async (event) => {
  const stripe = useStripe() // fail before creating an account if billing isn't configured
  const config = useRuntimeConfig()
  const session = await getUserSession(event)

  let user
  if (session.user) {
    user = await getUserById(session.user.id)
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Please sign in again' })
  }
  else {
    const body = await readValidatedBody(event, signupSchema.parse)
    user = await createUser({ ...body, role: 'host', mustChangePassword: false })
  }

  if (user.billing && hasBillingAccess(user.billing.status)) {
    throw createError({ statusCode: 409, statusMessage: 'You already have a subscription. Manage it from Billing.' })
  }

  let customer
  try {
    customer = await ensureCustomer(user)
  }
  catch (err) {
    // Without a Stripe customer the new account would look admin-created (free), so undo it.
    if (!session.user) await deleteUser(user)
    throw err
  }
  if (!session.user) await replaceUserSession(event, { user: toSessionUser(user), loggedInAt: Date.now() })

  const origin = siteOrigin(event)
  const checkout = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer,
    client_reference_id: user.id,
    line_items: [{ price: config.stripe.priceId, quantity: 1 }],
    // Collect the card now even during the trial, so billing starts automatically when it ends.
    payment_method_collection: 'always',
    allow_promotion_codes: true,
    subscription_data: {
      metadata: { userId: user.id },
      ...(user.billing?.hadTrial ? {} : { trial_period_days: PLAN.trialDays }),
    },
    success_url: `${origin}/account/billing?checkout={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/account/billing?checkout=canceled`,
  })
  return { url: checkout.url! }
})
