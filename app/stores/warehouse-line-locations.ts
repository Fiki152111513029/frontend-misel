import * as warehouseLineLocationService from '~/services/warehouse-line-location.service'
import { ApiError } from '~/types/api'
import type {
  CreateWarehouseLineLocationInput,
  WarehouseLineLocation,
  WarehouseLineLocationListMeta,
  WarehouseLineLocationQuery,
  UpdateWarehouseLineLocationInput,
} from '~/types/warehouse-line-location'

export const useWarehouseLineLocationsStore = defineStore('warehouse-line-locations', () => {
  const items = ref<WarehouseLineLocation[]>([])
  const meta = ref<WarehouseLineLocationListMeta>({ total: 0, page: 1, limit: 10, totalPages: 0 })
  const loading = ref(false)
  const error = ref<string | null>(null)
  const filters = ref<WarehouseLineLocationQuery>({
    page: 1,
    limit: 10,
    search: '',
    sortBy: 'name',
    sortOrder: 'asc',
  })

  async function loadWarehouseLineLocations() {
    loading.value = true
    error.value = null
    try {
      const result = await warehouseLineLocationService.fetchWarehouseLineLocations(
        filters.value,
      )
      items.value = result.items
      meta.value = result.meta
    } catch (e) {
      error.value = e instanceof ApiError ? e.message : 'Failed to load warehouse line locations'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function addWarehouseLineLocation(input: CreateWarehouseLineLocationInput) {
    return warehouseLineLocationService.createWarehouseLineLocation(input)
  }

  async function editWarehouseLineLocation(id: string, input: UpdateWarehouseLineLocationInput) {
    return warehouseLineLocationService.updateWarehouseLineLocation(id, input)
  }

  async function removeWarehouseLineLocation(id: string) {
    return warehouseLineLocationService.deleteWarehouseLineLocation(id)
  }

  function setFilters(patch: Partial<WarehouseLineLocationQuery>) {
    filters.value = { ...filters.value, ...patch }
  }

  return {
    items,
    meta,
    loading,
    error,
    filters,
    loadWarehouseLineLocations,
    addWarehouseLineLocation,
    editWarehouseLineLocation,
    removeWarehouseLineLocation,
    setFilters,
  }
})
