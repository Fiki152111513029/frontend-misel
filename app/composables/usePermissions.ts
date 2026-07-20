import { fetchPermission as fetchPermissionSvc } from '~/services/permission.service'
import { ApiError } from '~/types/api'
import type { CreatePermissionInput, UpdatePermissionInput } from '~/types/permission'

export function usePermissions() {
  const store = usePermissionsStore()
  const toast = useToast()

  async function fetchPermissions() {
    try {
      await store.loadPermissions()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to load permissions')
    }
  }

  async function fetchPermission(id: string) {
    try {
      return await fetchPermissionSvc(id)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to load permission')
      return null
    }
  }

  async function createPermission(input: CreatePermissionInput) {
    try {
      await store.addPermission(input)
      toast.success('Permission created successfully')
      await fetchPermissions()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to create permission')
      return false
    }
  }

  async function updatePermission(id: string, input: UpdatePermissionInput) {
    try {
      await store.editPermission(id, input)
      toast.success('Permission updated successfully')
      await fetchPermissions()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to update permission')
      return false
    }
  }

  async function deletePermission(id: string) {
    try {
      await store.removePermission(id)
      toast.success('Permission deleted successfully')
      await fetchPermissions()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to delete permission')
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
    fetchPermissions,
    fetchPermission,
    createPermission,
    updatePermission,
    deletePermission,
  }
}
