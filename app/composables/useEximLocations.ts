import { fetchEximLocation as fetchEximLocationSvc } from '~/services/exim-location.service'
import { ApiError } from '~/types/api'
import type {
  CreateEximLocationInput,
  EximLocationQuery,
  UpdateEximLocationInput,
} from '~/types/exim-location'

export function useEximLocations() {
  const store = useEximLocationsStore()
  const toast = useToast()

  async function fetchEximLocations(query?: Partial<EximLocationQuery>) {
    if (query) store.setFilters(query)
    try {
      await store.loadEximLocations()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to load EXIM locations')
    }
  }

  async function fetchEximLocation(id: string) {
    try {
      return await fetchEximLocationSvc(id)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to load EXIM location')
      return null
    }
  }

  async function createEximLocation(input: CreateEximLocationInput) {
    try {
      await store.addEximLocation(input)
      toast.success('EXIM Location created successfully')
      await fetchEximLocations()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to create EXIM location')
      return false
    }
  }

  async function updateEximLocation(id: string, input: UpdateEximLocationInput) {
    try {
      await store.editEximLocation(id, input)
      toast.success('EXIM Location updated successfully')
      await fetchEximLocations()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to update EXIM location')
      return false
    }
  }

  async function deleteEximLocation(id: string) {
    try {
      await store.removeEximLocation(id)
      toast.success('EXIM Location deleted successfully')
      await fetchEximLocations()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to delete EXIM location')
      return false
    }
  }

  return {
    items: computed(() => store.items),
    meta: computed(() => store.meta),
    loading: computed(() => store.loading),
    filters: computed(() => store.filters),
    fetchEximLocations,
    fetchEximLocation,
    createEximLocation,
    updateEximLocation,
    deleteEximLocation,
    setFilters: store.setFilters,
  }
}
