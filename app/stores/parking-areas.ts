import * as parkingAreaService from '~/services/parking-area.service'
import { ApiError } from '~/types/api'
import type {
  ParkingArea,
  ParkingAreaListMeta,
  ParkingAreaQuery,
  CreateParkingAreaInput,
  UpdateParkingAreaInput,
} from '~/types/parking-area'

export const useParkingAreasStore = defineStore('parking-areas', () => {
  const items = ref<ParkingArea[]>([])
  const meta = ref<ParkingAreaListMeta>({ total: 0, page: 1, limit: 10, totalPages: 0 })
  const loading = ref(false)
  const error = ref<string | null>(null)
  const filters = ref<ParkingAreaQuery>({
    page: 1,
    limit: 10,
    search: '',
    sortBy: 'name',
    sortOrder: 'asc',
  })

  async function loadParkingAreas() {
    loading.value = true
    error.value = null
    try {
      const result = await parkingAreaService.fetchParkingAreas(filters.value)
      items.value = result.items
      meta.value = result.meta
    } catch (e) {
      error.value = e instanceof ApiError ? e.message : 'Failed to load parking areas'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function addParkingArea(input: CreateParkingAreaInput) {
    return parkingAreaService.createParkingArea(input)
  }

  async function editParkingArea(id: string, input: UpdateParkingAreaInput) {
    return parkingAreaService.updateParkingArea(id, input)
  }

  async function removeParkingArea(id: string) {
    return parkingAreaService.deleteParkingArea(id)
  }

  function setFilters(patch: Partial<ParkingAreaQuery>) {
    filters.value = { ...filters.value, ...patch }
  }

  return {
    items,
    meta,
    loading,
    error,
    filters,
    loadParkingAreas,
    addParkingArea,
    editParkingArea,
    removeParkingArea,
    setFilters,
  }
})
