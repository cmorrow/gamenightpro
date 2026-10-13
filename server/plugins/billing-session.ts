// The session cookie is written at sign-in, but webhooks change billing later.
// Refresh billingStatus whenever the client fetches its session so the route guard sees the current state.
export default defineNitroPlugin(() => {
  sessionHooks.hook('fetch', async (session) => {
    if (!session.user) return
    const user = await getUserById(session.user.id)
    if (user) session.user.billingStatus = billingStatusOf(user)
  })
})
