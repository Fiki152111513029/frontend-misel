import * as productionLocationService from '~/services/production-location.service'
import { ApiError } from '~/types/api'
import type {
  CreateProductionLocationInput,
  ProductionLocation,
  ProductionLocationListMeta,
  ProductionLocationQuery,
  UpdateProductionLocationInput,
} from '~/types/production-location'

export const useProductionLocationsStore = defineStore('production-locations', () => {
  const items = ref<ProductionLocation[]>([])
  const meta = ref<ProductionLocationListMeta>({ total: 0, page: 1, limit: 10, totalPages: 0 })
  const loading = ref(false)
  const error = ref<string | null>(null)
  const filters = ref<ProductionLocationQuery>({
    page: 1,
    limit: 10,
    search: '',
    sortBy: 'name',
    sortOrder: 'asc',
  })

  async function loadProductionLocations() {
    loading.value = true
    error.value = null
    try {
      const result = await productionLocationService.fetchProductionLocations(filters.value)
      items.value = result.items
      meta.value = result.meta
    } catch (e) {
      error.value = e instanceof ApiError ? e.message : 'Failed to load production locations'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function addProductionLocation(input: CreateProductionLocationInput) {
    return productionLocationService.createProductionLocation(input)
  }

  async function editProductionLocation(id: string, input: UpdateProductionLocationInput) {
    return productionLocationService.updateProductionLocation(id, input)
  }

  async function removeProductionLocation(id: string) {
    return productionLocationService.deleteProductionLocation(id)
  }

  function setFilters(patch: Partial<ProductionLocationQuery>) {
    filters.value = { ...filters.value, ...patch }
  }

  return {
    items,
    meta,
    loading,
    error,
    filters,
    loadProductionLocations,
    addProductionLocation,
    editProductionLocation,
    removeProductionLocation,
    setFilters,
  }
})
