import type {
  CreateWarehouseLineLocationInput,
  WarehouseLineLocation,
  WarehouseLineLocationListResult,
  WarehouseLineLocationQuery,
  UpdateWarehouseLineLocationInput,
} from '~/types/warehouse-line-location'

export async function fetchWarehouseLineLocations(
  query: WarehouseLineLocationQuery = {},
): Promise<WarehouseLineLocationListResult> {
  const { $http } = useNuxtApp()
  return (await $http.get('/warehouse-line-locations', {
    params: query,
  })) as WarehouseLineLocationListResult
}

export async function fetchWarehouseLineLocation(id: string): Promise<WarehouseLineLocation> {
  const { $http } = useNuxtApp()
  return (await $http.get(`/warehouse-line-locations/${id}`)) as WarehouseLineLocation
}

export async function createWarehouseLineLocation(
  input: CreateWarehouseLineLocationInput,
): Promise<WarehouseLineLocation> {
  const { $http } = useNuxtApp()
  return (await $http.post('/warehouse-line-locations', input)) as WarehouseLineLocation
}

export async function updateWarehouseLineLocation(
  id: string,
  input: UpdateWarehouseLineLocationInput,
): Promise<WarehouseLineLocation> {
  const { $http } = useNuxtApp()
  return (await $http.put(`/warehouse-line-locations/${id}`, input)) as WarehouseLineLocation
}

export async function deleteWarehouseLineLocation(id: string): Promise<null> {
  const { $http } = useNuxtApp()
  return (await $http.delete(`/warehouse-line-locations/${id}`)) as null
}
