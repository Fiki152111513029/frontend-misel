import type {
  AvailableOperator,
  CreateWarehouseOperatorLocationInput,
  WarehouseOperatorLocation,
  WarehouseOperatorLocationListResult,
  WarehouseOperatorLocationQuery,
  UpdateWarehouseOperatorLocationInput,
} from '~/types/warehouse-operator-location'

export async function fetchWarehouseOperatorLocations(
  query: WarehouseOperatorLocationQuery = {},
): Promise<WarehouseOperatorLocationListResult> {
  const { $http } = useNuxtApp()
  return (await $http.get('/warehouse-operator-locations', {
    params: query,
  })) as WarehouseOperatorLocationListResult
}

export async function fetchWarehouseOperatorLocation(
  id: string,
): Promise<WarehouseOperatorLocation> {
  const { $http } = useNuxtApp()
  return (await $http.get(`/warehouse-operator-locations/${id}`)) as WarehouseOperatorLocation
}

export async function createWarehouseOperatorLocation(
  input: CreateWarehouseOperatorLocationInput,
): Promise<WarehouseOperatorLocation> {
  const { $http } = useNuxtApp()
  return (await $http.post('/warehouse-operator-locations', input)) as WarehouseOperatorLocation
}

export async function updateWarehouseOperatorLocation(
  id: string,
  input: UpdateWarehouseOperatorLocationInput,
): Promise<WarehouseOperatorLocation> {
  const { $http } = useNuxtApp()
  return (await $http.put(
    `/warehouse-operator-locations/${id}`,
    input,
  )) as WarehouseOperatorLocation
}

export async function deleteWarehouseOperatorLocation(id: string): Promise<null> {
  const { $http } = useNuxtApp()
  return (await $http.delete(`/warehouse-operator-locations/${id}`)) as null
}

export async function fetchAvailableOperators(excludeId?: string): Promise<AvailableOperator[]> {
  const { $http } = useNuxtApp()
  return (await $http.get('/warehouse-operator-locations/available-operators', {
    params: excludeId ? { excludeId } : {},
  })) as AvailableOperator[]
}
