import { fetchWarehouseOperatorLocation as fetchWarehouseOperatorLocationSvc } from '~/services/warehouse-operator-location.service'
import { ApiError } from '~/types/api'
import type {
  CreateWarehouseOperatorLocationInput,
  WarehouseOperatorLocationQuery,
  UpdateWarehouseOperatorLocationInput,
} from '~/types/warehouse-operator-location'

export function useWarehouseOperatorLocations() {
  const store = useWarehouseOperatorLocationsStore()
  const toast = useToast()

  async function fetchWarehouseOperatorLocations(
    query?: Partial<WarehouseOperatorLocationQuery>,
  ) {
    if (query) store.setFilters(query)
    try {
      await store.loadWarehouseOperatorLocations()
    } catch (e) {
      toast.error(
        e instanceof ApiError ? e.message : 'Failed to load warehouse operator locations',
      )
    }
  }

  async function fetchWarehouseOperatorLocation(id: string) {
    try {
      return await fetchWarehouseOperatorLocationSvc(id)
    } catch (e) {
      toast.error(
        e instanceof ApiError ? e.message : 'Failed to load warehouse operator location',
      )
      return null
    }
  }

  async function createWarehouseOperatorLocation(input: CreateWarehouseOperatorLocationInput) {
    try {
      await store.addWarehouseOperatorLocation(input)
      toast.success('Warehouse Operator Location created successfully')
      await fetchWarehouseOperatorLocations()
      return true
    } catch (e) {
      toast.error(
        e instanceof ApiError ? e.message : 'Failed to create warehouse operator location',
      )
      return false
    }
  }

  async function updateWarehouseOperatorLocation(
    id: string,
    input: UpdateWarehouseOperatorLocationInput,
  ) {
    try {
      await store.editWarehouseOperatorLocation(id, input)
      toast.success('Warehouse Operator Location updated successfully')
      await fetchWarehouseOperatorLocations()
      return true
    } catch (e) {
      toast.error(
        e instanceof ApiError ? e.message : 'Failed to update warehouse operator location',
      )
      return false
    }
  }

  async function deleteWarehouseOperatorLocation(id: string) {
    try {
      await store.removeWarehouseOperatorLocation(id)
      toast.success('Warehouse Operator Location deleted successfully')
      await fetchWarehouseOperatorLocations()
      return true
    } catch (e) {
      toast.error(
        e instanceof ApiError ? e.message : 'Failed to delete warehouse operator location',
      )
      return false
    }
  }

  async function fetchAvailableOperators(excludeId?: string) {
    try {
      await store.loadAvailableOperators(excludeId)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to load available operators')
    }
  }

  return {
    items: computed(() => store.items),
    meta: computed(() => store.meta),
    loading: computed(() => store.loading),
    filters: computed(() => store.filters),
    availableOperators: computed(() => store.availableOperators),
    fetchWarehouseOperatorLocations,
    fetchWarehouseOperatorLocation,
    createWarehouseOperatorLocation,
    updateWarehouseOperatorLocation,
    deleteWarehouseOperatorLocation,
    fetchAvailableOperators,
    setFilters: store.setFilters,
  }
}
