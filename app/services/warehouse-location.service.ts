import type {
  CreateWarehouseLocationInput,
  UpdateWarehouseLocationInput,
  WarehouseLocation,
  WarehouseLocationListResult,
  WarehouseLocationQuery,
} from '~/types/warehouse-location'

export async function fetchWarehouseLocations(
  query: WarehouseLocationQuery = {},
): Promise<WarehouseLocationListResult> {
  const { $http } = useNuxtApp()
  return (await $http.get('/warehouse-locations', {
    params: query,
  })) as WarehouseLocationListResult
}

export async function fetchWarehouseLocation(id: string): Promise<WarehouseLocation> {
  const { $http } = useNuxtApp()
  return (await $http.get(`/warehouse-locations/${id}`)) as WarehouseLocation
}

export async function createWarehouseLocation(
  input: CreateWarehouseLocationInput,
): Promise<WarehouseLocation> {
  const { $http } = useNuxtApp()
  return (await $http.post('/warehouse-locations', input)) as WarehouseLocation
}

export async function updateWarehouseLocation(
  id: string,
  input: UpdateWarehouseLocationInput,
): Promise<WarehouseLocation> {
  const { $http } = useNuxtApp()
  return (await $http.put(`/warehouse-locations/${id}`, input)) as WarehouseLocation
}

export async function deleteWarehouseLocation(id: string): Promise<null> {
  const { $http } = useNuxtApp()
  return (await $http.delete(`/warehouse-locations/${id}`)) as null
}
