import * as productionLineService from '~/services/production-line.service'
import { ApiError } from '~/types/api'
import type {
  CreateProductionLineInput,
  ProductionLine,
  ProductionLineListMeta,
  ProductionLineQuery,
  UpdateProductionLineInput,
} from '~/types/production-line'

export const useProductionLinesStore = defineStore('production-lines', () => {
  const items = ref<ProductionLine[]>([])
  const meta = ref<ProductionLineListMeta>({ total: 0, page: 1, limit: 10, totalPages: 0 })
  const loading = ref(false)
  const error = ref<string | null>(null)
  const filters = ref<ProductionLineQuery>({
    page: 1,
    limit: 10,
    search: '',
    sortBy: 'name',
    sortOrder: 'asc',
  })

  async function loadProductionLines() {
    loading.value = true
    error.value = null
    try {
      const result = await productionLineService.fetchProductionLines(filters.value)
      items.value = result.items
      meta.value = result.meta
    } catch (e) {
      error.value = e instanceof ApiError ? e.message : 'Failed to load production lines'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function addProductionLine(input: CreateProductionLineInput) {
    return productionLineService.createProductionLine(input)
  }

  async function editProductionLine(id: string, input: UpdateProductionLineInput) {
    return productionLineService.updateProductionLine(id, input)
  }

  async function removeProductionLine(id: string) {
    return productionLineService.deleteProductionLine(id)
  }

  function setFilters(patch: Partial<ProductionLineQuery>) {
    filters.value = { ...filters.value, ...patch }
  }

  return {
    items,
    meta,
    loading,
    error,
    filters,
    loadProductionLines,
    addProductionLine,
    editProductionLine,
    removeProductionLine,
    setFilters,
  }
})
