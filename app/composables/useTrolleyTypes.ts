import { fetchTrolleyType as fetchTrolleyTypeSvc } from '~/services/trolley-type.service'
import { ApiError } from '~/types/api'
import type {
  TrolleyTypeQuery,
  CreateTrolleyTypeInput,
  UpdateTrolleyTypeInput,
} from '~/types/trolley-type'

export function useTrolleyTypes() {
  const store = useTrolleyTypesStore()
  const toast = useToast()

  async function fetchTrolleyTypes(query?: Partial<TrolleyTypeQuery>) {
    if (query) store.setFilters(query)
    try {
      await store.loadTrolleyTypes()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to load trolley types')
    }
  }

  async function fetchTrolleyType(id: string) {
    try {
      return await fetchTrolleyTypeSvc(id)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to load trolley type')
      return null
    }
  }

  async function createTrolleyType(input: CreateTrolleyTypeInput) {
    try {
      await store.addTrolleyType(input)
      toast.success('Trolley Type created successfully')
      await fetchTrolleyTypes()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to create trolley type')
      return false
    }
  }

  async function updateTrolleyType(id: string, input: UpdateTrolleyTypeInput) {
    try {
      await store.editTrolleyType(id, input)
      toast.success('Trolley Type updated successfully')
      await fetchTrolleyTypes()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to update trolley type')
      return false
    }
  }

  async function deleteTrolleyType(id: string) {
    try {
      await store.removeTrolleyType(id)
      toast.success('Trolley Type deleted successfully')
      await fetchTrolleyTypes()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to delete trolley type')
      return false
    }
  }

  return {
    items: computed(() => store.items),
    meta: computed(() => store.meta),
    loading: computed(() => store.loading),
    filters: computed(() => store.filters),
    fetchTrolleyTypes,
    fetchTrolleyType,
    createTrolleyType,
    updateTrolleyType,
    deleteTrolleyType,
    setFilters: store.setFilters,
  }
}
