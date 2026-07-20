import type {
  CreateQuarantineLineInput,
  QuarantineLine,
  QuarantineLineListResult,
  QuarantineLineQuery,
  UpdateQuarantineLineInput,
} from '~/types/quarantine-line'

export async function fetchQuarantineLines(
  query: QuarantineLineQuery = {},
): Promise<QuarantineLineListResult> {
  const { $http } = useNuxtApp()
  return (await $http.get('/quarantine-lines', { params: query })) as QuarantineLineListResult
}

export async function fetchQuarantineLine(id: string): Promise<QuarantineLine> {
  const { $http } = useNuxtApp()
  return (await $http.get(`/quarantine-lines/${id}`)) as QuarantineLine
}

export async function createQuarantineLine(
  input: CreateQuarantineLineInput,
): Promise<QuarantineLine> {
  const { $http } = useNuxtApp()
  return (await $http.post('/quarantine-lines', input)) as QuarantineLine
}

export async function updateQuarantineLine(
  id: string,
  input: UpdateQuarantineLineInput,
): Promise<QuarantineLine> {
  const { $http } = useNuxtApp()
  return (await $http.put(`/quarantine-lines/${id}`, input)) as QuarantineLine
}

export async function deleteQuarantineLine(id: string): Promise<null> {
  const { $http } = useNuxtApp()
  return (await $http.delete(`/quarantine-lines/${id}`)) as null
}
