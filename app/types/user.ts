export type UserPriority = 4 | 6 | 8

export interface User {
  id: string
  username: string
  email: string | null
  fullName: string
  roleId: string
  isActive: boolean
  priority: UserPriority
  createdAt: string
  updatedAt: string
}

export interface CreateUserInput {
  username: string
  email?: string
  password: string
  fullName: string
  roleId: string
  isActive?: boolean
  priority?: UserPriority
}

export interface UpdateUserInput {
  email?: string
  password?: string
  fullName?: string
  roleId?: string
  isActive?: boolean
  priority?: UserPriority
}

export interface UserFormValues {
  username: string
  email: string
  password: string
  fullName: string
  roleId: string
  isActive: boolean
  priority: UserPriority
}
