import type {
  CreateEmptyPalletLocationInput,
  EmptyPalletLocation,
  EmptyPalletLocationListResult,
  EmptyPalletLocationQuery,
  UpdateEmptyPalletLocationInput,
} from '~/types/empty-pallet-location'

export async function fetchEmptyPalletLocations(
  query: EmptyPalletLocationQuery = {},
): Promise<EmptyPalletLocationListResult> {
  const { $http } = useNuxtApp()
  return (await $http.get('/empty-pallet-locations', {
    params: query,
  })) as EmptyPalletLocationListResult
}

export async function fetchEmptyPalletLocation(id: string): Promise<EmptyPalletLocation> {
  const { $http } = useNuxtApp()
  return (await $http.get(`/empty-pallet-locations/${id}`)) as EmptyPalletLocation
}

export async function createEmptyPalletLocation(
  input: CreateEmptyPalletLocationInput,
): Promise<EmptyPalletLocation> {
  const { $http } = useNuxtApp()
  return (await $http.post('/empty-pallet-locations', input)) as EmptyPalletLocation
}

export async function updateEmptyPalletLocation(
  id: string,
  input: UpdateEmptyPalletLocationInput,
): Promise<EmptyPalletLocation> {
  const { $http } = useNuxtApp()
  return (await $http.put(`/empty-pallet-locations/${id}`, input)) as EmptyPalletLocation
}

export async function deleteEmptyPalletLocation(id: string): Promise<null> {
  const { $http } = useNuxtApp()
  return (await $http.delete(`/empty-pallet-locations/${id}`)) as null
}
