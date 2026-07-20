import { fetchUser as fetchUserSvc } from '~/services/user.service'
import { ApiError } from '~/types/api'
import type { CreateUserInput, UpdateUserInput } from '~/types/user'

export function useUsers() {
  const store = useUsersStore()
  const toast = useToast()

  async function fetchUsers() {
    try {
      await store.loadUsers()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to load users')
    }
  }

  async function fetchUser(id: string) {
    try {
      return await fetchUserSvc(id)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to load user')
      return null
    }
  }

  async function createUser(input: CreateUserInput) {
    try {
      await store.addUser(input)
      toast.success('User created successfully')
      await fetchUsers()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to create user')
      return false
    }
  }

  async function updateUser(id: string, input: UpdateUserInput) {
    try {
      await store.editUser(id, input)
      toast.success('User updated successfully')
      await fetchUsers()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to update user')
      return false
    }
  }

  async function deleteUser(id: string) {
    try {
      await store.removeUser(id)
      toast.success('User deleted successfully')
      await fetchUsers()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to delete user')
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
    fetchUsers,
    fetchUser,
    createUser,
    updateUser,
    deleteUser,
  }
}
