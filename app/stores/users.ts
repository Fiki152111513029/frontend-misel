import * as userService from '~/services/user.service'
import { ApiError } from '~/types/api'
import type { CreateUserInput, UpdateUserInput, User } from '~/types/user'

export const useUsersStore = defineStore('users', () => {
  const items = ref<User[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const search = ref('')

  const filteredItems = computed(() => {
    const term = search.value.trim().toLowerCase()
    if (!term) return items.value
    return items.value.filter(
      (u) =>
        u.username.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        u.fullName.toLowerCase().includes(term),
    )
  })

  async function loadUsers() {
    loading.value = true
    error.value = null
    try {
      items.value = await userService.fetchUsers()
    } catch (e) {
      error.value = e instanceof ApiError ? e.message : 'Failed to load users'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function addUser(input: CreateUserInput) {
    return userService.createUser(input)
  }

  async function editUser(id: string, input: UpdateUserInput) {
    return userService.updateUser(id, input)
  }

  async function removeUser(id: string) {
    return userService.deleteUser(id)
  }

  return {
    items,
    loading,
    error,
    search,
    filteredItems,
    loadUsers,
    addUser,
    editUser,
    removeUser,
  }
})
