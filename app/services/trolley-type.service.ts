import type {
  TrolleyType,
  TrolleyTypeListResult,
  TrolleyTypeQuery,
  CreateTrolleyTypeInput,
  UpdateTrolleyTypeInput,
} from '~/types/trolley-type'

export async function fetchTrolleyTypes(
  query: TrolleyTypeQuery = {},
): Promise<TrolleyTypeListResult> {
  const { $http } = useNuxtApp()
  return (await $http.get('/trolley-types', {
    params: query,
  })) as TrolleyTypeListResult
}

export async function fetchTrolleyType(id: string): Promise<TrolleyType> {
  const { $http } = useNuxtApp()
  return (await $http.get(`/trolley-types/${id}`)) as TrolleyType
}

export async function createTrolleyType(
  input: CreateTrolleyTypeInput,
): Promise<TrolleyType> {
  const { $http } = useNuxtApp()
  return (await $http.post('/trolley-types', input)) as TrolleyType
}

export async function updateTrolleyType(
  id: string,
  input: UpdateTrolleyTypeInput,
): Promise<TrolleyType> {
  const { $http } = useNuxtApp()
  return (await $http.put(`/trolley-types/${id}`, input)) as TrolleyType
}

export async function deleteTrolleyType(id: string): Promise<null> {
  const { $http } = useNuxtApp()
  return (await $http.delete(`/trolley-types/${id}`)) as null
}
