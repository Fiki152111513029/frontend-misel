import { ApiError } from '~/types/api'
import type { CreateRequestBoxInput, RequestBoxQuery } from '~/types/request-box'

export function useRequestBoxes() {
  const store = useRequestBoxesStore()
  const toast = useToast()

  async function fetchRequestBoxes(query?: Partial<RequestBoxQuery>) {
    if (query) store.setFilters(query)
    try {
      await store.loadRequestBoxes()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to load request boxes')
    }
  }

  async function createRequestBox(input: CreateRequestBoxInput) {
    try {
      await store.addRequestBox(input)
      toast.success('Request Box created successfully')
      await fetchRequestBoxes()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to create request box')
      return false
    }
  }

  async function deleteRequestBox(id: string) {
    try {
      await store.removeRequestBox(id)
      toast.success('Request Box deleted successfully')
      await fetchRequestBoxes()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to delete request box')
      return false
    }
  }

  return {
    items: computed(() => store.items),
    meta: computed(() => store.meta),
    loading: computed(() => store.loading),
    filters: computed(() => store.filters),
    fetchRequestBoxes,
    createRequestBox,
    deleteRequestBox,
    setFilters: store.setFilters,
  }
}
