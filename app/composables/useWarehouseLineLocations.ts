import { fetchWarehouseLineLocation as fetchWarehouseLineLocationSvc } from '~/services/warehouse-line-location.service'
import { ApiError } from '~/types/api'
import type {
  CreateWarehouseLineLocationInput,
  WarehouseLineLocationQuery,
  UpdateWarehouseLineLocationInput,
} from '~/types/warehouse-line-location'

export function useWarehouseLineLocations() {
  const store = useWarehouseLineLocationsStore()
  const toast = useToast()

  async function fetchWarehouseLineLocations(query?: Partial<WarehouseLineLocationQuery>) {
    if (query) store.setFilters(query)
    try {
      await store.loadWarehouseLineLocations()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to load warehouse line locations')
    }
  }

  async function fetchWarehouseLineLocation(id: string) {
    try {
      return await fetchWarehouseLineLocationSvc(id)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to load warehouse line location')
      return null
    }
  }

  async function createWarehouseLineLocation(input: CreateWarehouseLineLocationInput) {
    try {
      await store.addWarehouseLineLocation(input)
      toast.success('Warehouse Line Location created successfully')
      await fetchWarehouseLineLocations()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to create warehouse line location')
      return false
    }
  }

  async function updateWarehouseLineLocation(
    id: string,
    input: UpdateWarehouseLineLocationInput,
  ) {
    try {
      await store.editWarehouseLineLocation(id, input)
      toast.success('Warehouse Line Location updated successfully')
      await fetchWarehouseLineLocations()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to update warehouse line location')
      return false
    }
  }

  async function deleteWarehouseLineLocation(id: string) {
    try {
      await store.removeWarehouseLineLocation(id)
      toast.success('Warehouse Line Location deleted successfully')
      await fetchWarehouseLineLocations()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to delete warehouse line location')
      return false
    }
  }

  return {
    items: computed(() => store.items),
    meta: computed(() => store.meta),
    loading: computed(() => store.loading),
    filters: computed(() => store.filters),
    fetchWarehouseLineLocations,
    fetchWarehouseLineLocation,
    createWarehouseLineLocation,
    updateWarehouseLineLocation,
    deleteWarehouseLineLocation,
    setFilters: store.setFilters,
  }
}
