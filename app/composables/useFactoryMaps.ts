import { fetchFactoryMapById } from '~/services/factory-map.service'
import { ApiError } from '~/types/api'
import type { CreateFactoryMapInput, FactoryMapQuery, UpdateFactoryMapInput } from '~/types/factory-map'

export function useFactoryMaps() {
  const store = useFactoryMapsStore()
  const toast = useToast()

  async function fetchFactoryMaps(query?: Partial<FactoryMapQuery>) {
    if (query) store.setFilters(query)
    try {
      await store.loadFactoryMaps()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to load factory maps')
    }
  }

  async function fetchFactoryMap(id: string) {
    try {
      return await fetchFactoryMapById(id)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to load factory map')
      return null
    }
  }

  async function createFactoryMap(input: CreateFactoryMapInput) {
    try {
      await store.addFactoryMap(input)
      toast.success('Factory map created successfully')
      await fetchFactoryMaps()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to create factory map')
      return false
    }
  }

  async function updateFactoryMap(id: string, input: UpdateFactoryMapInput) {
    try {
      await store.editFactoryMap(id, input)
      toast.success('Factory map updated successfully')
      await fetchFactoryMaps()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to update factory map')
      return false
    }
  }

  async function deleteFactoryMap(id: string) {
    try {
      await store.removeFactoryMap(id)
      toast.success('Factory map deleted successfully')
      await fetchFactoryMaps()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to delete factory map')
      return false
    }
  }

  return {
    items: computed(() => store.items),
    meta: computed(() => store.meta),
    loading: computed(() => store.loading),
    filters: computed(() => store.filters),
    fetchFactoryMaps,
    fetchFactoryMap,
    createFactoryMap,
    updateFactoryMap,
    deleteFactoryMap,
    setFilters: store.setFilters,
  }
}
