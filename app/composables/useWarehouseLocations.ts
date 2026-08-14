import { fetchWarehouseLocation as fetchWarehouseLocationSvc } from '~/services/warehouse-location.service'
import { ApiError } from '~/types/api'
import type {
  CreateWarehouseLocationInput,
  UpdateWarehouseLocationInput,
  WarehouseLocationQuery,
} from '~/types/warehouse-location'

export function useWarehouseLocations() {
  const store = useWarehouseLocationsStore()
  const toast = useToast()

  async function fetchWarehouseLocations(query?: Partial<WarehouseLocationQuery>) {
    if (query) store.setFilters(query)
    try {
      await store.loadWarehouseLocations()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to load warehouse locations')
    }
  }

  async function fetchWarehouseLocation(id: string) {
    try {
      return await fetchWarehouseLocationSvc(id)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to load warehouse location')
      return null
    }
  }

  async function createWarehouseLocation(input: CreateWarehouseLocationInput) {
    try {
      await store.addWarehouseLocation(input)
      toast.success('Warehouse Location created successfully')
      await fetchWarehouseLocations()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to create warehouse location')
      return false
    }
  }

  async function updateWarehouseLocation(id: string, input: UpdateWarehouseLocationInput) {
    try {
      await store.editWarehouseLocation(id, input)
      toast.success('Warehouse Location updated successfully')
      await fetchWarehouseLocations()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to update warehouse location')
      return false
    }
  }

  async function deleteWarehouseLocation(id: string) {
    try {
      await store.removeWarehouseLocation(id)
      toast.success('Warehouse Location deleted successfully')
      await fetchWarehouseLocations()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to delete warehouse location')
      return false
    }
  }

  return {
    items: computed(() => store.items),
    meta: computed(() => store.meta),
    loading: computed(() => store.loading),
    filters: computed(() => store.filters),
    fetchWarehouseLocations,
    fetchWarehouseLocation,
    createWarehouseLocation,
    updateWarehouseLocation,
    deleteWarehouseLocation,
    setFilters: store.setFilters,
  }
}
