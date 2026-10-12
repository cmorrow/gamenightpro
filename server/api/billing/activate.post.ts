import Stripe from 'stripe'
import { z } from 'zod'

const bodySchema = z.object({ setupIntent: z.string().startsWith('seti_') })

// Step 2 of the on-site checkout: once the card is confirmed, start the subscription with it.
// First-time subscribers get the free trial; returning ones are charged now. If their bank
// wants 3-D Secure for that charge, the client gets a secret to finish it with Stripe.js.
export default defineEventHandler(async (event) => {
  const stripe = useStripe()
  const { user: sessionUser } = await requireUserSession(event)
  const { setupIntent } = await readValidatedBody(event, bodySchema.parse)
  const user = await getUserById(sessionUser.id)
  if (!user?.billing) throw createError({ statusCode: 400, statusMessage: 'Start again from the card form' })
  if (hasBillingAccess(user.billing.status)) return { billing: toPublicBilling(user), clientSecret: null }

  const intent = await stripe.setupIntents.retrieve(setupIntent, { expand: ['payment_method'] })
  const paymentMethod = intent.payment_method as Stripe.PaymentMethod | null
  if (intent.customer !== user.billing.customerId || intent.status !== 'succeeded' || !paymentMethod) {
    throw createError({ statusCode: 400, statusMessage: 'Your card was not confirmed. Please try again.' })
  }

  const { automaticTax } = useRuntimeConfig().stripe
  try {
    await stripe.customers.update(user.billing.customerId, {
      invoice_settings: { default_payment_method: paymentMethod.id },
      // Stripe Tax works out the rate from where the customer is: the card form's country and postal code.
      ...(automaticTax && {
        address: toCustomerAddress(paymentMethod.billing_details.address),
        tax: { validate_location: 'immediately' },
      }),
    })
  }
  catch (err) {
    if (err instanceof Stripe.errors.StripeInvalidRequestError && err.code?.startsWith('customer_tax_location')) {
      throw createError({ statusCode: 400, statusMessage: 'Enter your billing country and postal code so we can work out tax.' })
    }
    throw err
  }
  const subscription = await stripe.subscriptions.create({
    customer: user.billing.customerId,
    items: [{ price: useRuntimeConfig().stripe.priceId }],
    default_payment_method: paymentMethod.id,
    ...(automaticTax && { automatic_tax: { enabled: true } }),
    payment_behavior: 'allow_incomplete',
    metadata: { userId: user.id },
    expand: ['latest_invoice.confirmation_secret'],
    ...(user.billing.hadTrial ? {} : { trial_period_days: PLAN.trialDays }),
  }, { idempotencyKey: `subscribe-${setupIntent}` }) // a double submit returns the same subscription

  const updated = (await syncSubscription(subscription.id)) ?? user
  const invoice = subscription.latest_invoice as Stripe.Invoice | null
  return {
    billing: toPublicBilling(updated),
    clientSecret: subscription.status === 'incomplete' ? invoice?.confirmation_secret?.client_secret ?? null : null,
  }
})

function toCustomerAddress(a: Stripe.Address | null): Stripe.AddressParam {
  return {
    country: a?.country ?? undefined,
    postal_code: a?.postal_code ?? undefined,
    state: a?.state ?? undefined,
    city: a?.city ?? undefined,
    line1: a?.line1 ?? undefined,
    line2: a?.line2 ?? undefined,
  }
}
