import * as warehouseOperatorLocationService from '~/services/warehouse-operator-location.service'
import { ApiError } from '~/types/api'
import type {
  AvailableOperator,
  CreateWarehouseOperatorLocationInput,
  WarehouseOperatorLocation,
  WarehouseOperatorLocationListMeta,
  WarehouseOperatorLocationQuery,
  UpdateWarehouseOperatorLocationInput,
} from '~/types/warehouse-operator-location'

export const useWarehouseOperatorLocationsStore = defineStore(
  'warehouse-operator-locations',
  () => {
    const items = ref<WarehouseOperatorLocation[]>([])
    const meta = ref<WarehouseOperatorLocationListMeta>({
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    })
    const loading = ref(false)
    const error = ref<string | null>(null)
    const filters = ref<WarehouseOperatorLocationQuery>({
      page: 1,
      limit: 10,
      search: '',
      sortBy: 'name',
      sortOrder: 'asc',
    })
    const availableOperators = ref<AvailableOperator[]>([])

    async function loadWarehouseOperatorLocations() {
      loading.value = true
      error.value = null
      try {
        const result = await warehouseOperatorLocationService.fetchWarehouseOperatorLocations(
          filters.value,
        )
        items.value = result.items
        meta.value = result.meta
      } catch (e) {
        error.value =
          e instanceof ApiError ? e.message : 'Failed to load warehouse operator locations'
        throw e
      } finally {
        loading.value = false
      }
    }

    async function addWarehouseOperatorLocation(input: CreateWarehouseOperatorLocationInput) {
      return warehouseOperatorLocationService.createWarehouseOperatorLocation(input)
    }

    async function editWarehouseOperatorLocation(
      id: string,
      input: UpdateWarehouseOperatorLocationInput,
    ) {
      return warehouseOperatorLocationService.updateWarehouseOperatorLocation(id, input)
    }

    async function removeWarehouseOperatorLocation(id: string) {
      return warehouseOperatorLocationService.deleteWarehouseOperatorLocation(id)
    }

    function setFilters(patch: Partial<WarehouseOperatorLocationQuery>) {
      filters.value = { ...filters.value, ...patch }
    }

    async function loadAvailableOperators(excludeId?: string) {
      availableOperators.value =
        await warehouseOperatorLocationService.fetchAvailableOperators(excludeId)
    }

    return {
      items,
      meta,
      loading,
      error,
      filters,
      availableOperators,
      loadWarehouseOperatorLocations,
      addWarehouseOperatorLocation,
      editWarehouseOperatorLocation,
      removeWarehouseOperatorLocation,
      setFilters,
      loadAvailableOperators,
    }
  },
)
