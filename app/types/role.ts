import type { Permission } from './permission'

export interface RolePermissionEntry {
  roleId: string
  permissionId: string
  permission: Permission
}

export interface Role {
  id: string
  name: string
  description: string | null
  /** Page this role lands on after login; null = built-in default for the role name. */
  landingPath: string | null
  createdAt: string
  updatedAt: string
  permissions: RolePermissionEntry[]
}

export interface CreateRoleInput {
  name: string
  description?: string
  /** null clears it, so the role falls back to the built-in default. */
  landingPath?: string | null
}

export type UpdateRoleInput = Partial<CreateRoleInput>

export interface AssignPermissionsInput {
  permissionIds: string[]
}
