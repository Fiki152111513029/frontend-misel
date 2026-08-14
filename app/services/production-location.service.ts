import type {
  CreateProductionLocationInput,
  ProductionLocation,
  ProductionLocationListResult,
  ProductionLocationQuery,
  UpdateProductionLocationInput,
} from '~/types/production-location'

export async function fetchProductionLocations(
  query: ProductionLocationQuery = {},
): Promise<ProductionLocationListResult> {
  const { $http } = useNuxtApp()
  return (await $http.get('/production-locations', {
    params: query,
  })) as ProductionLocationListResult
}

export async function fetchProductionLocation(id: string): Promise<ProductionLocation> {
  const { $http } = useNuxtApp()
  return (await $http.get(`/production-locations/${id}`)) as ProductionLocation
}

export async function createProductionLocation(
  input: CreateProductionLocationInput,
): Promise<ProductionLocation> {
  const { $http } = useNuxtApp()
  return (await $http.post('/production-locations', input)) as ProductionLocation
}

export async function updateProductionLocation(
  id: string,
  input: UpdateProductionLocationInput,
): Promise<ProductionLocation> {
  const { $http } = useNuxtApp()
  return (await $http.put(`/production-locations/${id}`, input)) as ProductionLocation
}

export async function deleteProductionLocation(id: string): Promise<null> {
  const { $http } = useNuxtApp()
  return (await $http.delete(`/production-locations/${id}`)) as null
}
