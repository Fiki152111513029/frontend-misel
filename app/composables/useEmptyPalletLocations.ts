import { fetchEmptyPalletLocation as fetchEmptyPalletLocationSvc } from '~/services/empty-pallet-location.service'
import { ApiError } from '~/types/api'
import type {
  CreateEmptyPalletLocationInput,
  EmptyPalletLocationQuery,
  UpdateEmptyPalletLocationInput,
} from '~/types/empty-pallet-location'

export function useEmptyPalletLocations() {
  const store = useEmptyPalletLocationsStore()
  const toast = useToast()

  async function fetchEmptyPalletLocations(query?: Partial<EmptyPalletLocationQuery>) {
    if (query) store.setFilters(query)
    try {
      await store.loadEmptyPalletLocations()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to load empty pallet locations')
    }
  }

  async function fetchEmptyPalletLocation(id: string) {
    try {
      return await fetchEmptyPalletLocationSvc(id)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to load empty pallet location')
      return null
    }
  }

  async function createEmptyPalletLocation(input: CreateEmptyPalletLocationInput) {
    try {
      await store.addEmptyPalletLocation(input)
      toast.success('Empty Pallet Location created successfully')
      await fetchEmptyPalletLocations()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to create empty pallet location')
      return false
    }
  }

  async function updateEmptyPalletLocation(id: string, input: UpdateEmptyPalletLocationInput) {
    try {
      await store.editEmptyPalletLocation(id, input)
      toast.success('Empty Pallet Location updated successfully')
      await fetchEmptyPalletLocations()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to update empty pallet location')
      return false
    }
  }

  async function deleteEmptyPalletLocation(id: string) {
    try {
      await store.removeEmptyPalletLocation(id)
      toast.success('Empty Pallet Location deleted successfully')
      await fetchEmptyPalletLocations()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to delete empty pallet location')
      return false
    }
  }

  return {
    items: computed(() => store.items),
    meta: computed(() => store.meta),
    loading: computed(() => store.loading),
    filters: computed(() => store.filters),
    fetchEmptyPalletLocations,
    fetchEmptyPalletLocation,
    createEmptyPalletLocation,
    updateEmptyPalletLocation,
    deleteEmptyPalletLocation,
    setFilters: store.setFilters,
  }
}
