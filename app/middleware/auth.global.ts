// Every page needs a signed-in user except those marked `definePageMeta({ public: true })`.
// `guestOnly` public pages (sign-in, sign-up) send signed-in users home.
// A user with a temporary password is held on the change-password page until they set their own.
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
  if (to.meta.admin && user.value?.role !== 'admin') return navigateTo('/')
})
