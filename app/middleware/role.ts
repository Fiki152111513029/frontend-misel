import { getRoleHomePath } from '~/utils/roleHome'

// Restricts a page to a set of roles listed in its own `definePageMeta({
// middleware: 'role', allowedRoles: [...] })` — auth.global.ts already
// guarantees a token exists for any /dashboard route by the time this runs,
// so a missing user here just means the client hasn't hydrated yet.
export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return

  const allowedRoles = to.meta.allowedRoles as string[] | undefined
  if (!allowedRoles || allowedRoles.length === 0) return

  const { user } = useAuth()
  if (!user.value) return
  if (allowedRoles.includes(user.value.role)) return

  return navigateTo(getRoleHomePath(user.value.role))
})
