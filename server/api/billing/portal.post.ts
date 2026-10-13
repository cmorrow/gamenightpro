// Opens Stripe's hosted Customer Portal: update card, see invoices, cancel.
export default defineEventHandler(async (event) => {
  const stripe = useStripe()
  const { user: sessionUser } = await requireUserSession(event)
  const user = await getUserById(sessionUser.id)
  if (!user?.billing) throw createError({ statusCode: 400, statusMessage: 'No billing account yet' })

  const portal = await stripe.billingPortal.sessions.create({
    customer: user.billing.customerId,
    return_url: `${siteOrigin(event)}/account/billing`,
  })
  return { url: portal.url }
})
