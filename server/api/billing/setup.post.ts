import { z } from 'zod'

const signupSchema = z.object({
  name: z.string().trim().min(1, 'Enter your name').max(100),
  email: emailSchema,
  password: passwordSchema,
})

// Step 1 of the on-site checkout: returns a SetupIntent for the card form to confirm.
// Signed-out visitors send { name, email, password } and get a host account (signed in) first;
// signed-in users send nothing, and a retry after a declined card reuses the account.
export default defineEventHandler(async (event) => {
  const stripe = useStripe() // fail before creating an account if billing isn't configured
  const session = await getUserSession(event)

  let user
  let created = false
  if (session.user) {
    user = await getUserById(session.user.id)
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Please sign in again' })
  }
  else {
    const body = await readValidatedBody(event, signupSchema.parse)
    user = await createUser({ ...body, role: 'host', mustChangePassword: false })
    created = true
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
    if (created) await deleteUser(user)
    throw err
  }
  if (created) await replaceUserSession(event, { user: toSessionUser(user), loggedInAt: Date.now() })

  const intent = await stripe.setupIntents.create({
    customer,
    payment_method_types: ['card'],
    usage: 'off_session', // saved for the automatic charge when the trial ends
    metadata: { userId: user.id },
  })
  return { clientSecret: intent.client_secret! }
})
