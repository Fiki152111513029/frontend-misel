import { findRequiredPermission } from '~/utils/navMenu'
import { getRoleHomePath } from '~/utils/roleHome'

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

  // Send them to their own landing page rather than assuming /dashboard.
  // /dashboard requires dashboard.read like any other route, so it is not a
  // safe universal fallback: a role that can reach some pages but not that
  // one (Fleet Overview only, say, or a Supervisor granted just Trolley
  // Activities) would otherwise be bounced somewhere it is equally barred
  // from, or thrown out entirely.
  const home = getRoleHomePath(user.value.role, user.value.landingPath)
  if (home !== to.path) {
    const homePermission = findRequiredPermission(home)
    // An unlisted path carries no permission of its own, so it is reachable.
    if (!homePermission || hasPermission(homePermission)) {
      return navigateTo(home)
    }
  }

  // The landing page is the blocked route itself, or is barred too — there
  // is nowhere left to send this user, so log them out instead of looping.
  logout()
  return navigateTo('/login')
})
