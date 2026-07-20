import * as eximLocationService from '~/services/exim-location.service'
import { ApiError } from '~/types/api'
import type {
  CreateEximLocationInput,
  EximLocation,
  EximLocationListMeta,
  EximLocationQuery,
  UpdateEximLocationInput,
} from '~/types/exim-location'

export const useEximLocationsStore = defineStore('exim-locations', () => {
  const items = ref<EximLocation[]>([])
  const meta = ref<EximLocationListMeta>({ total: 0, page: 1, limit: 10, totalPages: 0 })
  const loading = ref(false)
  const error = ref<string | null>(null)
  const filters = ref<EximLocationQuery>({
    page: 1,
    limit: 10,
    search: '',
    sortBy: 'name',
    sortOrder: 'asc',
  })

  async function loadEximLocations() {
    loading.value = true
    error.value = null
    try {
      const result = await eximLocationService.fetchEximLocations(filters.value)
      items.value = result.items
      meta.value = result.meta
    } catch (e) {
      error.value = e instanceof ApiError ? e.message : 'Failed to load EXIM locations'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function addEximLocation(input: CreateEximLocationInput) {
    return eximLocationService.createEximLocation(input)
  }

  async function editEximLocation(id: string, input: UpdateEximLocationInput) {
    return eximLocationService.updateEximLocation(id, input)
  }

  async function removeEximLocation(id: string) {
    return eximLocationService.deleteEximLocation(id)
  }

  function setFilters(patch: Partial<EximLocationQuery>) {
    filters.value = { ...filters.value, ...patch }
  }

  return {
    items,
    meta,
    loading,
    error,
    filters,
    loadEximLocations,
    addEximLocation,
    editEximLocation,
    removeEximLocation,
    setFilters,
  }
})
