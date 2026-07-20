import type {
  BoxType,
  BoxTypeListResult,
  BoxTypeQuery,
  CreateBoxTypeInput,
  UpdateBoxTypeInput,
} from '~/types/box-type'

export async function fetchBoxTypes(query: BoxTypeQuery = {}): Promise<BoxTypeListResult> {
  const { $http } = useNuxtApp()
  return (await $http.get('/box-types', { params: query })) as BoxTypeListResult
}

export async function fetchBoxType(id: string): Promise<BoxType> {
  const { $http } = useNuxtApp()
  return (await $http.get(`/box-types/${id}`)) as BoxType
}

export async function createBoxType(input: CreateBoxTypeInput): Promise<BoxType> {
  const { $http } = useNuxtApp()
  return (await $http.post('/box-types', input)) as BoxType
}

export async function updateBoxType(id: string, input: UpdateBoxTypeInput): Promise<BoxType> {
  const { $http } = useNuxtApp()
  return (await $http.put(`/box-types/${id}`, input)) as BoxType
}

export async function deleteBoxType(id: string): Promise<null> {
  const { $http } = useNuxtApp()
  return (await $http.delete(`/box-types/${id}`)) as null
}
