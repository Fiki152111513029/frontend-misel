import type {
  CreateTrolleyCategoryInput,
  TrolleyCategory,
  TrolleyCategoryListResult,
  TrolleyCategoryQuery,
  UpdateTrolleyCategoryInput,
} from '~/types/trolley-category'

export async function fetchTrolleyCategories(
  query: TrolleyCategoryQuery = {},
): Promise<TrolleyCategoryListResult> {
  const { $http } = useNuxtApp()
  return (await $http.get('/trolley-categories', {
    params: query,
  })) as TrolleyCategoryListResult
}

export async function fetchTrolleyCategory(id: string): Promise<TrolleyCategory> {
  const { $http } = useNuxtApp()
  return (await $http.get(`/trolley-categories/${id}`)) as TrolleyCategory
}

export async function createTrolleyCategory(
  input: CreateTrolleyCategoryInput,
): Promise<TrolleyCategory> {
  const { $http } = useNuxtApp()
  return (await $http.post('/trolley-categories', input)) as TrolleyCategory
}

export async function updateTrolleyCategory(
  id: string,
  input: UpdateTrolleyCategoryInput,
): Promise<TrolleyCategory> {
  const { $http } = useNuxtApp()
  return (await $http.put(`/trolley-categories/${id}`, input)) as TrolleyCategory
}

export async function deleteTrolleyCategory(id: string): Promise<null> {
  const { $http } = useNuxtApp()
  return (await $http.delete(`/trolley-categories/${id}`)) as null
}
