import { fetchProductionLocation as fetchProductionLocationSvc } from '~/services/production-location.service'
import { ApiError } from '~/types/api'
import type {
  CreateProductionLocationInput,
  ProductionLocationQuery,
  UpdateProductionLocationInput,
} from '~/types/production-location'

export function useProductionLocations() {
  const store = useProductionLocationsStore()
  const toast = useToast()

  async function fetchProductionLocations(query?: Partial<ProductionLocationQuery>) {
    if (query) store.setFilters(query)
    try {
      await store.loadProductionLocations()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to load production locations')
    }
  }

  async function fetchProductionLocation(id: string) {
    try {
      return await fetchProductionLocationSvc(id)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to load production location')
      return null
    }
  }

  async function createProductionLocation(input: CreateProductionLocationInput) {
    try {
      await store.addProductionLocation(input)
      toast.success('Production Location created successfully')
      await fetchProductionLocations()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to create production location')
      return false
    }
  }

  async function updateProductionLocation(id: string, input: UpdateProductionLocationInput) {
    try {
      await store.editProductionLocation(id, input)
      toast.success('Production Location updated successfully')
      await fetchProductionLocations()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to update production location')
      return false
    }
  }

  async function deleteProductionLocation(id: string) {
    try {
      await store.removeProductionLocation(id)
      toast.success('Production Location deleted successfully')
      await fetchProductionLocations()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to delete production location')
      return false
    }
  }

  async function bulkDeleteProductionLocations(ids: string[]) {
    try {
      const result = await store.removeProductionLocations(ids)
      // The count comes from the server, not from how many were ticked:
      // a row someone else removed while the selection sat on screen is
      // reported as missing rather than counted as deleted.
      toast.success(
        result.missing > 0
          ? `${result.deleted} of ${result.deleted + result.missing} production locations deleted — the rest were already gone`
          : `${result.deleted} production locations deleted successfully`,
      )
      await fetchProductionLocations()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to delete the selected production locations')
      return false
    }
  }

  return {
    items: computed(() => store.items),
    meta: computed(() => store.meta),
    loading: computed(() => store.loading),
    filters: computed(() => store.filters),
    fetchProductionLocations,
    fetchProductionLocation,
    createProductionLocation,
    updateProductionLocation,
    deleteProductionLocation,
    bulkDeleteProductionLocations,
    setFilters: store.setFilters,
  }
}
