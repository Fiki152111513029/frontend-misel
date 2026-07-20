import * as quarantineLineService from '~/services/quarantine-line.service'
import { ApiError } from '~/types/api'
import type {
  CreateQuarantineLineInput,
  QuarantineLine,
  QuarantineLineListMeta,
  QuarantineLineQuery,
  UpdateQuarantineLineInput,
} from '~/types/quarantine-line'

export const useQuarantineLinesStore = defineStore('quarantine-lines', () => {
  const items = ref<QuarantineLine[]>([])
  const meta = ref<QuarantineLineListMeta>({ total: 0, page: 1, limit: 10, totalPages: 0 })
  const loading = ref(false)
  const error = ref<string | null>(null)
  const filters = ref<QuarantineLineQuery>({
    page: 1,
    limit: 10,
    search: '',
    sortBy: 'name',
    sortOrder: 'asc',
  })

  async function loadQuarantineLines() {
    loading.value = true
    error.value = null
    try {
      const result = await quarantineLineService.fetchQuarantineLines(filters.value)
      items.value = result.items
      meta.value = result.meta
    } catch (e) {
      error.value = e instanceof ApiError ? e.message : 'Failed to load quarantine lines'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function addQuarantineLine(input: CreateQuarantineLineInput) {
    return quarantineLineService.createQuarantineLine(input)
  }

  async function editQuarantineLine(id: string, input: UpdateQuarantineLineInput) {
    return quarantineLineService.updateQuarantineLine(id, input)
  }

  async function removeQuarantineLine(id: string) {
    return quarantineLineService.deleteQuarantineLine(id)
  }

  function setFilters(patch: Partial<QuarantineLineQuery>) {
    filters.value = { ...filters.value, ...patch }
  }

  return {
    items,
    meta,
    loading,
    error,
    filters,
    loadQuarantineLines,
    addQuarantineLine,
    editQuarantineLine,
    removeQuarantineLine,
    setFilters,
  }
})
