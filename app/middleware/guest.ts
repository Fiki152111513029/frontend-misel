export default defineNuxtRouteMiddleware(() => {
  const token =
    import.meta.client &&
    (localStorage.getItem('auth_token') ||
      sessionStorage.getItem('auth_token'))

  if (token) {
    return navigateTo('/dashboard')
  }
})
