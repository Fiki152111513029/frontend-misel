// Where a role lands right after login, and where the role-guard
// middleware sends someone bounced off a page they aren't allowed on. Kept
// in one place so login.vue and middleware/role.ts never drift apart.
export function getRoleHomePath(role: string | undefined | null): string {
  if (role === 'Operator') return '/dashboard/operator-trolley-task'
  if (role === 'Warehouse') return '/dashboard/warehouse-trolley-task'
  return '/dashboard'
}
