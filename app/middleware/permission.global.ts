import { findRequiredPermission } from '~/utils/navMenu'
import { resolveHomePath } from '~/utils/roleHome'

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

  // Send them somewhere they can actually open: their configured landing
  // page if it is reachable, else the first page in the nav that is.
  // /dashboard is no safer a guess than any other route — it needs
  // dashboard.read too — so a role without it (Fleet Overview only, say, or
  // a Supervisor granted just Trolley Activities) must not be sent there.
  const home = resolveHomePath(user.value.role, user.value.landingPath, hasPermission)
  if (home && home !== to.path) return navigateTo(home)

  // Either nothing in the nav is open to this role, or the only page that is
  // happens to be the one just blocked — redirecting again would loop, so
  // stop here instead.
  logout()
  return navigateTo('/login')
})
