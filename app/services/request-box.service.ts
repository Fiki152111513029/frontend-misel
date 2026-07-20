import type {
  CreateRequestBoxInput,
  RequestBox,
  RequestBoxListResult,
  RequestBoxQuery,
} from '~/types/request-box'

export async function fetchRequestBoxes(
  query: RequestBoxQuery = {},
): Promise<RequestBoxListResult> {
  const { $http } = useNuxtApp()
  return (await $http.get('/request-boxes', { params: query })) as RequestBoxListResult
}

export async function createRequestBox(input: CreateRequestBoxInput): Promise<RequestBox> {
  const { $http } = useNuxtApp()
  return (await $http.post('/request-boxes', input)) as RequestBox
}

export async function deleteRequestBox(id: string): Promise<null> {
  const { $http } = useNuxtApp()
  return (await $http.delete(`/request-boxes/${id}`)) as null
}
