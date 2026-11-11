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

  async function bulkDeleteWarehouseLocations(ids: string[]) {
    try {
      const result = await store.removeWarehouseLocations(ids)
      // The count comes from the server, not from how many were ticked:
      // a row someone else removed while the selection sat on screen is
      // reported as missing rather than counted as deleted.
      toast.success(
        result.missing > 0
          ? `${result.deleted} of ${result.deleted + result.missing} warehouse locations deleted — the rest were already gone`
          : `${result.deleted} warehouse locations deleted successfully`,
      )
      await fetchWarehouseLocations()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to delete the selected warehouse locations')
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
    bulkDeleteWarehouseLocations,
    setFilters: store.setFilters,
  }
}
