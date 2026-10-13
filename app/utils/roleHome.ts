import { findFirstAllowedPath, findRequiredPermission } from '~/utils/navMenu'

// Where a role lands right after login.
//
// An admin can now set this per role in User Management > Roles
// (Role.landingPath). Roles with nothing set keep the original built-in
// behaviour below, so existing installs are unaffected until someone picks
// a page.
const BUILT_IN_ROLE_HOME: Record<string, string> = {
  Operator: '/dashboard/operator-trolley-task',
  Warehouse: '/dashboard/warehouse-trolley-task',
}

const DEFAULT_HOME = '/dashboard'

export function getRoleHomePath(
  role: string | undefined | null,
  landingPath?: string | null,
): string {
  // Guarded the same way the backend validates it: an in-app path only, so
  // a bad value can never turn login into a redirect off to another site.
  if (landingPath && /^\/[A-Za-z0-9\-_/]*$/.test(landingPath)) return landingPath
  return (role ? BUILT_IN_ROLE_HOME[role] : undefined) ?? DEFAULT_HOME
}

/**
 * Where this user should actually land: their configured page if they can
 * open it, otherwise the first page they can.
 *
 * getRoleHomePath answers "where was this role told to go", which is a
 * question about configuration. This answers "where can this user go", which
 * is the question every caller actually has. The two differ whenever a
 * permission is revoked without the landing page being updated to match —
 * and before this existed, that mismatch logged the user straight back out
 * at login, with no way in short of an admin fixing the role.
 *
 * Returns null only when no page in the nav is open to them.
 */
export function resolveHomePath(
  role: string | undefined | null,
  landingPath: string | null | undefined,
  hasPermission: (code: string) => boolean,
): string | null {
  const configured = getRoleHomePath(role, landingPath)
  const required = findRequiredPermission(configured)
  // undefined means the path is not in the nav at all, so it carries no
  // permission of its own and stays reachable — same rule the middleware uses.
  if (!required || hasPermission(required)) return configured
  return findFirstAllowedPath(hasPermission)
}

/** The built-in fallback for a role name, shown as a hint in the Roles form. */
export function getBuiltInRoleHome(role: string | undefined | null): string {
  return (role ? BUILT_IN_ROLE_HOME[role] : undefined) ?? DEFAULT_HOME
}
