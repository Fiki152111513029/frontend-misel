import { fetchParkingArea as fetchParkingAreaSvc } from '~/services/parking-area.service'
import { ApiError } from '~/types/api'
import type {
  ParkingAreaQuery,
  CreateParkingAreaInput,
  UpdateParkingAreaInput,
} from '~/types/parking-area'

export function useParkingAreas() {
  const store = useParkingAreasStore()
  const toast = useToast()

  async function fetchParkingAreas(query?: Partial<ParkingAreaQuery>) {
    if (query) store.setFilters(query)
    try {
      await store.loadParkingAreas()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to load parking areas')
    }
  }

  async function fetchParkingArea(id: string) {
    try {
      return await fetchParkingAreaSvc(id)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to load parking area')
      return null
    }
  }

  async function createParkingArea(input: CreateParkingAreaInput) {
    try {
      await store.addParkingArea(input)
      toast.success('Parking Area created successfully')
      await fetchParkingAreas()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to create parking area')
      return false
    }
  }

  async function updateParkingArea(id: string, input: UpdateParkingAreaInput) {
    try {
      await store.editParkingArea(id, input)
      toast.success('Parking Area updated successfully')
      await fetchParkingAreas()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to update parking area')
      return false
    }
  }

  async function deleteParkingArea(id: string) {
    try {
      await store.removeParkingArea(id)
      toast.success('Parking Area deleted successfully')
      await fetchParkingAreas()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to delete parking area')
      return false
    }
  }

  return {
    items: computed(() => store.items),
    meta: computed(() => store.meta),
    loading: computed(() => store.loading),
    filters: computed(() => store.filters),
    fetchParkingAreas,
    fetchParkingArea,
    createParkingArea,
    updateParkingArea,
    deleteParkingArea,
    setFilters: store.setFilters,
  }
}
