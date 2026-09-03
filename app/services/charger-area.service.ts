import type {
  ChargerArea,
  ChargerAreaListResult,
  ChargerAreaQuery,
  CreateChargerAreaInput,
  UpdateChargerAreaInput,
} from '~/types/charger-area'

export async function fetchChargerAreas(
  query: ChargerAreaQuery = {},
): Promise<ChargerAreaListResult> {
  const { $http } = useNuxtApp()
  return (await $http.get('/charger-areas', {
    params: query,
  })) as ChargerAreaListResult
}

export async function fetchChargerArea(id: string): Promise<ChargerArea> {
  const { $http } = useNuxtApp()
  return (await $http.get(`/charger-areas/${id}`)) as ChargerArea
}

export async function createChargerArea(
  input: CreateChargerAreaInput,
): Promise<ChargerArea> {
  const { $http } = useNuxtApp()
  return (await $http.post('/charger-areas', input)) as ChargerArea
}

export async function updateChargerArea(
  id: string,
  input: UpdateChargerAreaInput,
): Promise<ChargerArea> {
  const { $http } = useNuxtApp()
  return (await $http.put(`/charger-areas/${id}`, input)) as ChargerArea
}

export async function deleteChargerArea(id: string): Promise<null> {
  const { $http } = useNuxtApp()
  return (await $http.delete(`/charger-areas/${id}`)) as null
}

// Fetches "all" charger areas in one page — used by the Charger Status
// widget to enumerate every hub, same convention as fetchAllShifts().
export async function fetchAllChargerAreas(): Promise<ChargerArea[]> {
  const result = await fetchChargerAreas({ page: 1, limit: 1000, sortBy: 'name', sortOrder: 'asc' })
  return result.items
}
