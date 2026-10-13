// Every page needs a signed-in user except those marked `definePageMeta({ public: true })`.
// `guestOnly` public pages (sign-in, sign-up) send signed-in users home.
// A user with a temporary password is held on the change-password page until they set their own.
// A self-serve host without a live subscription (trial ended, canceled, checkout abandoned) is sent to Billing.
export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn, user } = useUserSession()

  if (loggedIn.value && user.value?.mustChangePassword && to.path !== '/account/password') {
    return navigateTo('/account/password')
  }
  if (to.meta.public) {
    if (loggedIn.value && to.meta.guestOnly) return navigateTo('/')
    return
  }
  if (!loggedIn.value) {
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
  }
  if (!hasBillingAccess(user.value?.billingStatus) && !to.path.startsWith('/account')) {
    return navigateTo('/account/billing')
  }
  if (to.meta.admin && user.value?.role !== 'admin') return navigateTo('/')
})
