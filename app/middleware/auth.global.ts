// Every page needs a signed-in user except those marked `definePageMeta({ public: true })`.
// A user with a temporary password is held on the change-password page until they set their own.
// A self-serve host without a live subscription (trial ended, canceled, checkout abandoned) is sent to Billing.
export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn, user } = useUserSession()

  if (to.meta.public) {
    if (loggedIn.value && to.path === '/login') return navigateTo('/')
    return
  }
  if (!loggedIn.value) {
    return navigateTo({ path: '/login', query: to.fullPath !== '/' ? { redirect: to.fullPath } : {} })
  }
  if (user.value?.mustChangePassword && to.path !== '/account/password') {
    return navigateTo('/account/password')
  }
  if (!hasBillingAccess(user.value?.billingStatus) && !to.path.startsWith('/account')) {
    return navigateTo('/account/billing')
  }
  if (to.meta.admin && user.value?.role !== 'admin') return navigateTo('/')
})
