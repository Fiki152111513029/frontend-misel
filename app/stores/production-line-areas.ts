import * as productionLineAreaService from '~/services/production-line-area.service'
import { ApiError } from '~/types/api'
import type {
  CreateProductionLineAreaInput,
  ProductionLineArea,
  ProductionLineAreaListMeta,
  ProductionLineAreaQuery,
  UpdateProductionLineAreaInput,
} from '~/types/production-line-area'

export const useProductionLineAreasStore = defineStore('production-line-areas', () => {
  const items = ref<ProductionLineArea[]>([])
  const meta = ref<ProductionLineAreaListMeta>({ total: 0, page: 1, limit: 10, totalPages: 0 })
  const loading = ref(false)
  const error = ref<string | null>(null)
  const filters = ref<ProductionLineAreaQuery>({
    page: 1,
    limit: 10,
    search: '',
    sortBy: 'order',
    sortOrder: 'asc',
  })

  async function loadProductionLineAreas() {
    loading.value = true
    error.value = null
    try {
      const result = await productionLineAreaService.fetchProductionLineAreas(filters.value)
      items.value = result.items
      meta.value = result.meta
    } catch (e) {
      error.value = e instanceof ApiError ? e.message : 'Failed to load production line areas'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function addProductionLineArea(input: CreateProductionLineAreaInput) {
    return productionLineAreaService.createProductionLineArea(input)
  }

  async function editProductionLineArea(id: string, input: UpdateProductionLineAreaInput) {
    return productionLineAreaService.updateProductionLineArea(id, input)
  }

  async function removeProductionLineArea(id: string) {
    return productionLineAreaService.deleteProductionLineArea(id)
  }

  async function reorderProductionLineAreas(items: { id: string; order: number }[]) {
    return productionLineAreaService.reorderProductionLineAreas(items)
  }

  function setFilters(patch: Partial<ProductionLineAreaQuery>) {
    filters.value = { ...filters.value, ...patch }
  }

  return {
    items,
    meta,
    loading,
    error,
    filters,
    loadProductionLineAreas,
    addProductionLineArea,
    editProductionLineArea,
    removeProductionLineArea,
    reorderProductionLineAreas,
    setFilters,
  }
})
