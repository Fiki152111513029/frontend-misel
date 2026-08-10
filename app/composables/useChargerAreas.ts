import { fetchChargerArea as fetchChargerAreaSvc } from '~/services/charger-area.service'
import { ApiError } from '~/types/api'
import type {
  ChargerAreaQuery,
  CreateChargerAreaInput,
  UpdateChargerAreaInput,
} from '~/types/charger-area'

export function useChargerAreas() {
  const store = useChargerAreasStore()
  const toast = useToast()

  async function fetchChargerAreas(query?: Partial<ChargerAreaQuery>) {
    if (query) store.setFilters(query)
    try {
      await store.loadChargerAreas()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to load charger areas')
    }
  }

  async function fetchChargerArea(id: string) {
    try {
      return await fetchChargerAreaSvc(id)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to load charger area')
      return null
    }
  }

  async function createChargerArea(input: CreateChargerAreaInput) {
    try {
      await store.addChargerArea(input)
      toast.success('Charger Area created successfully')
      await fetchChargerAreas()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to create charger area')
      return false
    }
  }

  async function updateChargerArea(id: string, input: UpdateChargerAreaInput) {
    try {
      await store.editChargerArea(id, input)
      toast.success('Charger Area updated successfully')
      await fetchChargerAreas()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to update charger area')
      return false
    }
  }

  async function deleteChargerArea(id: string) {
    try {
      await store.removeChargerArea(id)
      toast.success('Charger Area deleted successfully')
      await fetchChargerAreas()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to delete charger area')
      return false
    }
  }

  return {
    items: computed(() => store.items),
    meta: computed(() => store.meta),
    loading: computed(() => store.loading),
    filters: computed(() => store.filters),
    fetchChargerAreas,
    fetchChargerArea,
    createChargerArea,
    updateChargerArea,
    deleteChargerArea,
    setFilters: store.setFilters,
  }
}
