import { fetchQuarantineLine as fetchQuarantineLineSvc } from '~/services/quarantine-line.service'
import { ApiError } from '~/types/api'
import type {
  CreateQuarantineLineInput,
  QuarantineLineQuery,
  UpdateQuarantineLineInput,
} from '~/types/quarantine-line'

export function useQuarantineLines() {
  const store = useQuarantineLinesStore()
  const toast = useToast()

  async function fetchQuarantineLines(query?: Partial<QuarantineLineQuery>) {
    if (query) store.setFilters(query)
    try {
      await store.loadQuarantineLines()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to load quarantine lines')
    }
  }

  async function fetchQuarantineLine(id: string) {
    try {
      return await fetchQuarantineLineSvc(id)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to load quarantine line')
      return null
    }
  }

  async function createQuarantineLine(input: CreateQuarantineLineInput) {
    try {
      await store.addQuarantineLine(input)
      toast.success('Quarantine Line created successfully')
      await fetchQuarantineLines()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to create quarantine line')
      return false
    }
  }

  async function updateQuarantineLine(id: string, input: UpdateQuarantineLineInput) {
    try {
      await store.editQuarantineLine(id, input)
      toast.success('Quarantine Line updated successfully')
      await fetchQuarantineLines()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to update quarantine line')
      return false
    }
  }

  async function deleteQuarantineLine(id: string) {
    try {
      await store.removeQuarantineLine(id)
      toast.success('Quarantine Line deleted successfully')
      await fetchQuarantineLines()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to delete quarantine line')
      return false
    }
  }

  return {
    items: computed(() => store.items),
    meta: computed(() => store.meta),
    loading: computed(() => store.loading),
    filters: computed(() => store.filters),
    fetchQuarantineLines,
    fetchQuarantineLine,
    createQuarantineLine,
    updateQuarantineLine,
    deleteQuarantineLine,
    setFilters: store.setFilters,
  }
}
