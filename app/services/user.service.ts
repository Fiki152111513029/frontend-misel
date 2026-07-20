import type { CreateUserInput, UpdateUserInput, User } from '~/types/user'

export async function fetchUsers(): Promise<User[]> {
  const { $http } = useNuxtApp()
  return (await $http.get('/users')) as User[]
}

export async function fetchUser(id: string): Promise<User> {
  const { $http } = useNuxtApp()
  return (await $http.get(`/users/${id}`)) as User
}

export async function createUser(input: CreateUserInput): Promise<User> {
  const { $http } = useNuxtApp()
  return (await $http.post('/users', input)) as User
}

export async function updateUser(id: string, input: UpdateUserInput): Promise<User> {
  const { $http } = useNuxtApp()
  return (await $http.patch(`/users/${id}`, input)) as User
}

export async function deleteUser(id: string): Promise<null> {
  const { $http } = useNuxtApp()
  return (await $http.delete(`/users/${id}`)) as null
}
