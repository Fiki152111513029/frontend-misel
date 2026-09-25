import { ApiError } from '~/types/api'
import type { CreateRackInput, RackQuery, UpdateRackInput } from '~/types/rack'
import { fetchRack as fetchRackSvc } from '~/services/rack.service'

export function useRacks() {
  const store = useRacksStore()
  const toast = useToast()

  async function fetchRacks(query?: Partial<RackQuery>) {
    if (query) store.setFilters(query)
    try {
      await store.loadRacks()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to load racks')
    }
  }

  async function fetchRack(id: string) {
    try {
      return await fetchRackSvc(id)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to load rack')
      return null
    }
  }

  async function createRack(input: CreateRackInput) {
    try {
      await store.addRack(input)
      toast.success('Rack created successfully')
      await fetchRacks()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to create rack')
      return false
    }
  }

  async function updateRack(id: string, input: UpdateRackInput) {
    try {
      await store.editRack(id, input)
      toast.success('Rack updated successfully')
      await fetchRacks()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to update rack')
      return false
    }
  }

  async function deleteRack(id: string) {
    try {
      await store.removeRack(id)
      toast.success('Rack deleted successfully')
      await fetchRacks()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to delete rack')
      return false
    }
  }

  return {
    items: computed(() => store.items),
    meta: computed(() => store.meta),
    loading: computed(() => store.loading),
    filters: computed(() => store.filters),
    fetchRacks,
    fetchRack,
    createRack,
    updateRack,
    deleteRack,
    setFilters: store.setFilters,
  }
}
