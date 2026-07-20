export default defineNuxtRouteMiddleware((to) => {
  if (!to.path.startsWith('/dashboard')) {
    return
  }

  // Token lives in localStorage/sessionStorage, which don't exist during SSR.
  // Skip enforcement on the server and let the client-side re-run of this
  // middleware (during hydration) do the actual check — otherwise every
  // hard reload would redirect to /login even for an already-authenticated
  // user, only to bounce back to /dashboard once the client re-checks.
  if (import.meta.server) {
    return
  }

  const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')

  if (!token) {
    return navigateTo('/login')
  }
})
