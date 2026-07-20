import { fetchRole as fetchRoleSvc } from '~/services/role.service'
import { ApiError } from '~/types/api'
import type { AssignPermissionsInput, CreateRoleInput, UpdateRoleInput } from '~/types/role'

export function useRoles() {
  const store = useRolesStore()
  const toast = useToast()

  async function fetchRoles() {
    try {
      await store.loadRoles()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to load roles')
    }
  }

  async function fetchRole(id: string) {
    try {
      return await fetchRoleSvc(id)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to load role')
      return null
    }
  }

  async function createRole(input: CreateRoleInput) {
    try {
      await store.addRole(input)
      toast.success('Role created successfully')
      await fetchRoles()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to create role')
      return false
    }
  }

  async function updateRole(id: string, input: UpdateRoleInput) {
    try {
      await store.editRole(id, input)
      toast.success('Role updated successfully')
      await fetchRoles()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to update role')
      return false
    }
  }

  async function deleteRole(id: string) {
    try {
      await store.removeRole(id)
      toast.success('Role deleted successfully')
      await fetchRoles()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to delete role')
      return false
    }
  }

  async function assignPermissions(id: string, input: AssignPermissionsInput) {
    try {
      await store.assignPermissions(id, input)
      toast.success('Role permissions updated successfully')
      await fetchRoles()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to update role permissions')
      return false
    }
  }

  return {
    items: computed(() => store.filteredItems),
    loading: computed(() => store.loading),
    search: computed({
      get: () => store.search,
      set: (value: string) => (store.search = value),
    }),
    fetchRoles,
    fetchRole,
    createRole,
    updateRole,
    deleteRole,
    assignPermissions,
  }
}
