import * as warehouseLocationService from '~/services/warehouse-location.service'
import { ApiError } from '~/types/api'
import type {
  CreateWarehouseLocationInput,
  UpdateWarehouseLocationInput,
  WarehouseLocation,
  WarehouseLocationListMeta,
  WarehouseLocationQuery,
} from '~/types/warehouse-location'

export const useWarehouseLocationsStore = defineStore('warehouse-locations', () => {
  const items = ref<WarehouseLocation[]>([])
  const meta = ref<WarehouseLocationListMeta>({ total: 0, page: 1, limit: 10, totalPages: 0 })
  const loading = ref(false)
  const error = ref<string | null>(null)
  const filters = ref<WarehouseLocationQuery>({
    page: 1,
    limit: 10,
    search: '',
    sortBy: 'name',
    sortOrder: 'asc',
  })

  async function loadWarehouseLocations() {
    loading.value = true
    error.value = null
    try {
      const result = await warehouseLocationService.fetchWarehouseLocations(filters.value)
      items.value = result.items
      meta.value = result.meta
    } catch (e) {
      error.value = e instanceof ApiError ? e.message : 'Failed to load warehouse locations'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function addWarehouseLocation(input: CreateWarehouseLocationInput) {
    return warehouseLocationService.createWarehouseLocation(input)
  }

  async function editWarehouseLocation(id: string, input: UpdateWarehouseLocationInput) {
    return warehouseLocationService.updateWarehouseLocation(id, input)
  }

  async function removeWarehouseLocation(id: string) {
    return warehouseLocationService.deleteWarehouseLocation(id)
  }

  function setFilters(patch: Partial<WarehouseLocationQuery>) {
    filters.value = { ...filters.value, ...patch }
  }

  return {
    items,
    meta,
    loading,
    error,
    filters,
    loadWarehouseLocations,
    addWarehouseLocation,
    editWarehouseLocation,
    removeWarehouseLocation,
    setFilters,
  }
})
