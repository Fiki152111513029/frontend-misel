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
  createdAt: string
  updatedAt: string
  permissions: RolePermissionEntry[]
}

export interface CreateRoleInput {
  name: string
  description?: string
}

export type UpdateRoleInput = Partial<CreateRoleInput>

export interface AssignPermissionsInput {
  permissionIds: string[]
}
