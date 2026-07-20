import type {
  CreateProductionLineAreaInput,
  ProductionLineArea,
  ProductionLineAreaListResult,
  ProductionLineAreaQuery,
  UpdateProductionLineAreaInput,
} from '~/types/production-line-area'

export async function fetchProductionLineAreas(
  query: ProductionLineAreaQuery = {},
): Promise<ProductionLineAreaListResult> {
  const { $http } = useNuxtApp()
  return (await $http.get('/production-line-areas', {
    params: query,
  })) as ProductionLineAreaListResult
}

export async function fetchProductionLineArea(id: string): Promise<ProductionLineArea> {
  const { $http } = useNuxtApp()
  return (await $http.get(`/production-line-areas/${id}`)) as ProductionLineArea
}

export async function createProductionLineArea(
  input: CreateProductionLineAreaInput,
): Promise<ProductionLineArea> {
  const { $http } = useNuxtApp()
  return (await $http.post('/production-line-areas', input)) as ProductionLineArea
}

export async function updateProductionLineArea(
  id: string,
  input: UpdateProductionLineAreaInput,
): Promise<ProductionLineArea> {
  const { $http } = useNuxtApp()
  return (await $http.put(`/production-line-areas/${id}`, input)) as ProductionLineArea
}

export async function deleteProductionLineArea(id: string): Promise<null> {
  const { $http } = useNuxtApp()
  return (await $http.delete(`/production-line-areas/${id}`)) as null
}

export async function reorderProductionLineAreas(
  items: { id: string; order: number }[],
): Promise<null> {
  const { $http } = useNuxtApp()
  return (await $http.patch('/production-line-areas/reorder', { items })) as null
}
