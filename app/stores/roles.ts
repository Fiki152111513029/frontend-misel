import * as roleService from '~/services/role.service'
import { ApiError } from '~/types/api'
import type { AssignPermissionsInput, CreateRoleInput, Role, UpdateRoleInput } from '~/types/role'

export const useRolesStore = defineStore('roles', () => {
  const items = ref<Role[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const search = ref('')

  const filteredItems = computed(() => {
    const term = search.value.trim().toLowerCase()
    if (!term) return items.value
    return items.value.filter(
      (r) =>
        r.name.toLowerCase().includes(term) ||
        (r.description ?? '').toLowerCase().includes(term),
    )
  })

  async function loadRoles() {
    loading.value = true
    error.value = null
    try {
      items.value = await roleService.fetchRoles()
    } catch (e) {
      error.value = e instanceof ApiError ? e.message : 'Failed to load roles'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function addRole(input: CreateRoleInput) {
    return roleService.createRole(input)
  }

  async function editRole(id: string, input: UpdateRoleInput) {
    return roleService.updateRole(id, input)
  }

  async function removeRole(id: string) {
    return roleService.deleteRole(id)
  }

  async function assignPermissions(id: string, input: AssignPermissionsInput) {
    return roleService.assignRolePermissions(id, input)
  }

  return {
    items,
    loading,
    error,
    search,
    filteredItems,
    loadRoles,
    addRole,
    editRole,
    removeRole,
    assignPermissions,
  }
})
