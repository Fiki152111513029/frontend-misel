import { fetchTrolley as fetchTrolleySvc } from '~/services/trolley.service'
import { ApiError } from '~/types/api'
import type {
  CreateTrolleyInput,
  TrolleyQuery,
  UpdateTrolleyInput,
} from '~/types/trolley'

export function useTrolleys() {
  const store = useTrolleysStore()
  const toast = useToast()

  async function fetchTrolleys(query?: Partial<TrolleyQuery>) {
    if (query) store.setFilters(query)
    try {
      await store.loadTrolleys()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to load trolleys')
    }
  }

  async function fetchTrolley(id: string) {
    try {
      return await fetchTrolleySvc(id)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to load trolley')
      return null
    }
  }

  async function createTrolley(input: CreateTrolleyInput) {
    try {
      await store.addTrolley(input)
      toast.success('Trolley created successfully')
      await fetchTrolleys()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to create trolley')
      return false
    }
  }

  async function updateTrolley(id: string, input: UpdateTrolleyInput) {
    try {
      await store.editTrolley(id, input)
      toast.success('Trolley updated successfully')
      await fetchTrolleys()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to update trolley')
      return false
    }
  }

  async function deleteTrolley(id: string) {
    try {
      await store.removeTrolley(id)
      toast.success('Trolley deleted successfully')
      await fetchTrolleys()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to delete trolley')
      return false
    }
  }

  return {
    items: computed(() => store.items),
    meta: computed(() => store.meta),
    loading: computed(() => store.loading),
    filters: computed(() => store.filters),
    fetchTrolleys,
    fetchTrolley,
    createTrolley,
    updateTrolley,
    deleteTrolley,
    setFilters: store.setFilters,
  }
}
