import { findRequiredPermission } from '~/utils/navMenu'

// Enforces the same permission NAV_MENUS already declares for the sidebar
// (see utils/navMenu.ts) at the route level, so a role without a menu's
// permission can't just type the URL directly either. Runs after
// auth.global.ts (alphabetical global-middleware order: auth, then
// permission), which already guarantees a token for any /dashboard route.
export default defineNuxtRouteMiddleware((to) => {
  if (!to.path.startsWith('/dashboard')) return
  if (import.meta.server) return

  const requiredPermission = findRequiredPermission(to.path)
  if (!requiredPermission) return

  const { user, hasPermission, logout } = useAuth()
  if (!user.value) return
  if (hasPermission(requiredPermission)) return

  // /dashboard itself now requires dashboard.read too, so it's no longer a
  // safe universal fallback — a role with none of the permissions below it
  // (e.g. a freshly-created Supervisor with nothing granted yet) would
  // otherwise bounce back and forth between the blocked route and /dashboard
  // forever. If /dashboard is also out of reach, there's nowhere left to
  // send this user — log them out instead of looping.
  if (to.path === '/dashboard' || !hasPermission('dashboard.read')) {
    logout()
    return navigateTo('/login')
  }
  return navigateTo('/dashboard')
})
