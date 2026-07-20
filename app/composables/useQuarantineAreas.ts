import { fetchQuarantineArea as fetchQuarantineAreaSvc } from '~/services/quarantine-area.service'
import { ApiError } from '~/types/api'
import type {
  CreateQuarantineAreaInput,
  QuarantineAreaQuery,
  UpdateQuarantineAreaInput,
} from '~/types/quarantine-area'

export function useQuarantineAreas() {
  const store = useQuarantineAreasStore()
  const toast = useToast()

  async function fetchQuarantineAreas(query?: Partial<QuarantineAreaQuery>) {
    if (query) store.setFilters(query)
    try {
      await store.loadQuarantineAreas()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to load quarantine areas')
    }
  }

  async function fetchQuarantineArea(id: string) {
    try {
      return await fetchQuarantineAreaSvc(id)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to load quarantine area')
      return null
    }
  }

  async function createQuarantineArea(input: CreateQuarantineAreaInput) {
    try {
      await store.addQuarantineArea(input)
      toast.success('Quarantine Area created successfully')
      await fetchQuarantineAreas()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to create quarantine area')
      return false
    }
  }

  async function updateQuarantineArea(id: string, input: UpdateQuarantineAreaInput) {
    try {
      await store.editQuarantineArea(id, input)
      toast.success('Quarantine Area updated successfully')
      await fetchQuarantineAreas()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to update quarantine area')
      return false
    }
  }

  async function deleteQuarantineArea(id: string) {
    try {
      await store.removeQuarantineArea(id)
      toast.success('Quarantine Area deleted successfully')
      await fetchQuarantineAreas()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to delete quarantine area')
      return false
    }
  }

  return {
    items: computed(() => store.items),
    meta: computed(() => store.meta),
    loading: computed(() => store.loading),
    filters: computed(() => store.filters),
    fetchQuarantineAreas,
    fetchQuarantineArea,
    createQuarantineArea,
    updateQuarantineArea,
    deleteQuarantineArea,
    setFilters: store.setFilters,
  }
}
