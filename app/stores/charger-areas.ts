import * as chargerAreaService from '~/services/charger-area.service'
import { ApiError } from '~/types/api'
import type {
  ChargerArea,
  ChargerAreaListMeta,
  ChargerAreaQuery,
  CreateChargerAreaInput,
  UpdateChargerAreaInput,
} from '~/types/charger-area'

export const useChargerAreasStore = defineStore('charger-areas', () => {
  const items = ref<ChargerArea[]>([])
  const meta = ref<ChargerAreaListMeta>({ total: 0, page: 1, limit: 10, totalPages: 0 })
  const loading = ref(false)
  const error = ref<string | null>(null)
  const filters = ref<ChargerAreaQuery>({
    page: 1,
    limit: 10,
    search: '',
    sortBy: 'name',
    sortOrder: 'asc',
  })

  async function loadChargerAreas() {
    loading.value = true
    error.value = null
    try {
      const result = await chargerAreaService.fetchChargerAreas(filters.value)
      items.value = result.items
      meta.value = result.meta
    } catch (e) {
      error.value = e instanceof ApiError ? e.message : 'Failed to load charger areas'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function addChargerArea(input: CreateChargerAreaInput) {
    return chargerAreaService.createChargerArea(input)
  }

  async function editChargerArea(id: string, input: UpdateChargerAreaInput) {
    return chargerAreaService.updateChargerArea(id, input)
  }

  async function removeChargerArea(id: string) {
    return chargerAreaService.deleteChargerArea(id)
  }

  function setFilters(patch: Partial<ChargerAreaQuery>) {
    filters.value = { ...filters.value, ...patch }
  }

  return {
    items,
    meta,
    loading,
    error,
    filters,
    loadChargerAreas,
    addChargerArea,
    editChargerArea,
    removeChargerArea,
    setFilters,
  }
})
