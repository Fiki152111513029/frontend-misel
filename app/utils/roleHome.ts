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

/** The built-in fallback for a role name, shown as a hint in the Roles form. */
export function getBuiltInRoleHome(role: string | undefined | null): string {
  return (role ? BUILT_IN_ROLE_HOME[role] : undefined) ?? DEFAULT_HOME
}
