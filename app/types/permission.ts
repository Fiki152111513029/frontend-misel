export interface Permission {
  id: string
  code: string
  name: string
  description: string | null
}

export interface CreatePermissionInput {
  code: string
  name: string
  description?: string
}

export type UpdatePermissionInput = Partial<CreatePermissionInput>
