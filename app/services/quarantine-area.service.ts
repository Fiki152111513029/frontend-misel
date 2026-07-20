import type {
  CreateQuarantineAreaInput,
  QuarantineArea,
  QuarantineAreaListResult,
  QuarantineAreaQuery,
  UpdateQuarantineAreaInput,
} from '~/types/quarantine-area'

export async function fetchQuarantineAreas(
  query: QuarantineAreaQuery = {},
): Promise<QuarantineAreaListResult> {
  const { $http } = useNuxtApp()
  return (await $http.get('/quarantine-areas', { params: query })) as QuarantineAreaListResult
}

export async function fetchQuarantineArea(id: string): Promise<QuarantineArea> {
  const { $http } = useNuxtApp()
  return (await $http.get(`/quarantine-areas/${id}`)) as QuarantineArea
}

export async function createQuarantineArea(
  input: CreateQuarantineAreaInput,
): Promise<QuarantineArea> {
  const { $http } = useNuxtApp()
  return (await $http.post('/quarantine-areas', input)) as QuarantineArea
}

export async function updateQuarantineArea(
  id: string,
  input: UpdateQuarantineAreaInput,
): Promise<QuarantineArea> {
  const { $http } = useNuxtApp()
  return (await $http.put(`/quarantine-areas/${id}`, input)) as QuarantineArea
}

export async function deleteQuarantineArea(id: string): Promise<null> {
  const { $http } = useNuxtApp()
  return (await $http.delete(`/quarantine-areas/${id}`)) as null
}
