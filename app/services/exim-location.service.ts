import type {
  CreateEximLocationInput,
  EximLocation,
  EximLocationListResult,
  EximLocationQuery,
  UpdateEximLocationInput,
} from '~/types/exim-location'

export async function fetchEximLocations(
  query: EximLocationQuery = {},
): Promise<EximLocationListResult> {
  const { $http } = useNuxtApp()
  return (await $http.get('/exim-locations', { params: query })) as EximLocationListResult
}

export async function fetchEximLocation(id: string): Promise<EximLocation> {
  const { $http } = useNuxtApp()
  return (await $http.get(`/exim-locations/${id}`)) as EximLocation
}

export async function createEximLocation(
  input: CreateEximLocationInput,
): Promise<EximLocation> {
  const { $http } = useNuxtApp()
  return (await $http.post('/exim-locations', input)) as EximLocation
}

export async function updateEximLocation(
  id: string,
  input: UpdateEximLocationInput,
): Promise<EximLocation> {
  const { $http } = useNuxtApp()
  return (await $http.put(`/exim-locations/${id}`, input)) as EximLocation
}

export async function deleteEximLocation(id: string): Promise<null> {
  const { $http } = useNuxtApp()
  return (await $http.delete(`/exim-locations/${id}`)) as null
}
