import type {
  AssignPermissionsInput,
  CreateRoleInput,
  Role,
  UpdateRoleInput,
} from '~/types/role'

export async function fetchRoles(): Promise<Role[]> {
  const { $http } = useNuxtApp()
  return (await $http.get('/roles')) as Role[]
}

export async function fetchRole(id: string): Promise<Role> {
  const { $http } = useNuxtApp()
  return (await $http.get(`/roles/${id}`)) as Role
}

export async function createRole(input: CreateRoleInput): Promise<Role> {
  const { $http } = useNuxtApp()
  return (await $http.post('/roles', input)) as Role
}

export async function updateRole(id: string, input: UpdateRoleInput): Promise<Role> {
  const { $http } = useNuxtApp()
  return (await $http.patch(`/roles/${id}`, input)) as Role
}

export async function deleteRole(id: string): Promise<null> {
  const { $http } = useNuxtApp()
  return (await $http.delete(`/roles/${id}`)) as null
}

export async function assignRolePermissions(
  id: string,
  input: AssignPermissionsInput,
): Promise<Role> {
  const { $http } = useNuxtApp()
  return (await $http.patch(`/roles/${id}/permissions`, input)) as Role
}
