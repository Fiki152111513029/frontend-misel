import * as permissionService from '~/services/permission.service'
import { ApiError } from '~/types/api'
import type { CreatePermissionInput, Permission, UpdatePermissionInput } from '~/types/permission'

export const usePermissionsStore = defineStore('permissions', () => {
  const items = ref<Permission[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const search = ref('')

  const filteredItems = computed(() => {
    const term = search.value.trim().toLowerCase()
    if (!term) return items.value
    return items.value.filter(
      (p) =>
        p.code.toLowerCase().includes(term) ||
        p.name.toLowerCase().includes(term) ||
        (p.description ?? '').toLowerCase().includes(term),
    )
  })

  async function loadPermissions() {
    loading.value = true
    error.value = null
    try {
      items.value = await permissionService.fetchPermissions()
    } catch (e) {
      error.value = e instanceof ApiError ? e.message : 'Failed to load permissions'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function addPermission(input: CreatePermissionInput) {
    return permissionService.createPermission(input)
  }

  async function editPermission(id: string, input: UpdatePermissionInput) {
    return permissionService.updatePermission(id, input)
  }

  async function removePermission(id: string) {
    return permissionService.deletePermission(id)
  }

  return {
    items,
    loading,
    error,
    search,
    filteredItems,
    loadPermissions,
    addPermission,
    editPermission,
    removePermission,
  }
})
