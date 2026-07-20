import * as emptyPalletLocationService from '~/services/empty-pallet-location.service'
import { ApiError } from '~/types/api'
import type {
  CreateEmptyPalletLocationInput,
  EmptyPalletLocation,
  EmptyPalletLocationListMeta,
  EmptyPalletLocationQuery,
  UpdateEmptyPalletLocationInput,
} from '~/types/empty-pallet-location'

export const useEmptyPalletLocationsStore = defineStore('empty-pallet-locations', () => {
  const items = ref<EmptyPalletLocation[]>([])
  const meta = ref<EmptyPalletLocationListMeta>({ total: 0, page: 1, limit: 10, totalPages: 0 })
  const loading = ref(false)
  const error = ref<string | null>(null)
  const filters = ref<EmptyPalletLocationQuery>({
    page: 1,
    limit: 10,
    search: '',
    sortBy: 'name',
    sortOrder: 'asc',
  })

  async function loadEmptyPalletLocations() {
    loading.value = true
    error.value = null
    try {
      const result = await emptyPalletLocationService.fetchEmptyPalletLocations(filters.value)
      items.value = result.items
      meta.value = result.meta
    } catch (e) {
      error.value = e instanceof ApiError ? e.message : 'Failed to load empty pallet locations'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function addEmptyPalletLocation(input: CreateEmptyPalletLocationInput) {
    return emptyPalletLocationService.createEmptyPalletLocation(input)
  }

  async function editEmptyPalletLocation(id: string, input: UpdateEmptyPalletLocationInput) {
    return emptyPalletLocationService.updateEmptyPalletLocation(id, input)
  }

  async function removeEmptyPalletLocation(id: string) {
    return emptyPalletLocationService.deleteEmptyPalletLocation(id)
  }

  function setFilters(patch: Partial<EmptyPalletLocationQuery>) {
    filters.value = { ...filters.value, ...patch }
  }

  return {
    items,
    meta,
    loading,
    error,
    filters,
    loadEmptyPalletLocations,
    addEmptyPalletLocation,
    editEmptyPalletLocation,
    removeEmptyPalletLocation,
    setFilters,
  }
})
