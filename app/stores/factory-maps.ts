import * as factoryMapService from '~/services/factory-map.service'
import { ApiError } from '~/types/api'
import type {
  CreateFactoryMapInput,
  FactoryMap,
  FactoryMapListMeta,
  FactoryMapQuery,
  UpdateFactoryMapInput,
} from '~/types/factory-map'

export const useFactoryMapsStore = defineStore('factory-maps', () => {
  const items = ref<FactoryMap[]>([])
  const meta = ref<FactoryMapListMeta>({ total: 0, page: 1, limit: 10, totalPages: 0 })
  const loading = ref(false)
  const error = ref<string | null>(null)
  const filters = ref<FactoryMapQuery>({
    page: 1,
    limit: 10,
    search: '',
    sortBy: 'name',
    sortOrder: 'asc',
  })

  async function loadFactoryMaps() {
    loading.value = true
    error.value = null
    try {
      const result = await factoryMapService.fetchFactoryMaps(filters.value)
      items.value = result.items
      meta.value = result.meta
    } catch (e) {
      error.value = e instanceof ApiError ? e.message : 'Failed to load factory maps'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function addFactoryMap(input: CreateFactoryMapInput) {
    return factoryMapService.createFactoryMap(input)
  }

  async function editFactoryMap(id: string, input: UpdateFactoryMapInput) {
    return factoryMapService.updateFactoryMap(id, input)
  }

  async function removeFactoryMap(id: string) {
    return factoryMapService.deleteFactoryMap(id)
  }

  function setFilters(patch: Partial<FactoryMapQuery>) {
    filters.value = { ...filters.value, ...patch }
  }

  return {
    items,
    meta,
    loading,
    error,
    filters,
    loadFactoryMaps,
    addFactoryMap,
    editFactoryMap,
    removeFactoryMap,
    setFilters,
  }
})
