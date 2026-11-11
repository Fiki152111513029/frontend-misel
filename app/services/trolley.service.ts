import type {
  BulkDeleteTrolleysResult,
  CreateTrolleyInput,
  Trolley,
  TrolleyListResult,
  TrolleyQuery,
  UpdateTrolleyInput,
} from '~/types/trolley'

export async function fetchTrolleys(
  query: TrolleyQuery = {},
): Promise<TrolleyListResult> {
  const { $http } = useNuxtApp()
  return (await $http.get('/trolleys', {
    params: query,
  })) as TrolleyListResult
}

export async function fetchTrolley(id: string): Promise<Trolley> {
  const { $http } = useNuxtApp()
  return (await $http.get(`/trolleys/${id}`)) as Trolley
}

export async function createTrolley(
  input: CreateTrolleyInput,
): Promise<Trolley> {
  const { $http } = useNuxtApp()
  return (await $http.post('/trolleys', input)) as Trolley
}

export async function updateTrolley(
  id: string,
  input: UpdateTrolleyInput,
): Promise<Trolley> {
  const { $http } = useNuxtApp()
  return (await $http.put(`/trolleys/${id}`, input)) as Trolley
}

export async function deleteTrolley(id: string): Promise<null> {
  const { $http } = useNuxtApp()
  return (await $http.delete(`/trolleys/${id}`)) as null
}

// POST, not DELETE: a request body on DELETE is allowed by the spec but
// dropped or refused by enough proxies and clients not to be worth it.
export async function bulkDeleteTrolleys(
  ids: string[],
): Promise<BulkDeleteTrolleysResult> {
  const { $http } = useNuxtApp()
  return (await $http.post('/trolleys/bulk-delete', { ids })) as BulkDeleteTrolleysResult
}
