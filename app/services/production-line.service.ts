import type {
  CreateProductionLineInput,
  ProductionLine,
  ProductionLineListResult,
  ProductionLineQuery,
  UpdateProductionLineInput,
} from '~/types/production-line'

export async function fetchProductionLines(
  query: ProductionLineQuery = {},
): Promise<ProductionLineListResult> {
  const { $http } = useNuxtApp()
  return (await $http.get('/production-lines', { params: query })) as ProductionLineListResult
}

export async function fetchProductionLine(id: string): Promise<ProductionLine> {
  const { $http } = useNuxtApp()
  return (await $http.get(`/production-lines/${id}`)) as ProductionLine
}

export async function createProductionLine(
  input: CreateProductionLineInput,
): Promise<ProductionLine> {
  const { $http } = useNuxtApp()
  return (await $http.post('/production-lines', input)) as ProductionLine
}

export async function updateProductionLine(
  id: string,
  input: UpdateProductionLineInput,
): Promise<ProductionLine> {
  const { $http } = useNuxtApp()
  return (await $http.put(`/production-lines/${id}`, input)) as ProductionLine
}

export async function deleteProductionLine(id: string): Promise<null> {
  const { $http } = useNuxtApp()
  return (await $http.delete(`/production-lines/${id}`)) as null
}
