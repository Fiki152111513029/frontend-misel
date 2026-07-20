import type { CreatePermissionInput, Permission, UpdatePermissionInput } from '~/types/permission'

export async function fetchPermissions(): Promise<Permission[]> {
  const { $http } = useNuxtApp()
  return (await $http.get('/permissions')) as Permission[]
}

export async function fetchPermission(id: string): Promise<Permission> {
  const { $http } = useNuxtApp()
  return (await $http.get(`/permissions/${id}`)) as Permission
}

export async function createPermission(input: CreatePermissionInput): Promise<Permission> {
  const { $http } = useNuxtApp()
  return (await $http.post('/permissions', input)) as Permission
}

export async function updatePermission(
  id: string,
  input: UpdatePermissionInput,
): Promise<Permission> {
  const { $http } = useNuxtApp()
  return (await $http.patch(`/permissions/${id}`, input)) as Permission
}

export async function deletePermission(id: string): Promise<null> {
  const { $http } = useNuxtApp()
  return (await $http.delete(`/permissions/${id}`)) as null
}
