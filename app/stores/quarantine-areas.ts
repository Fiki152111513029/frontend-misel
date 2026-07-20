import * as quarantineAreaService from '~/services/quarantine-area.service'
import { ApiError } from '~/types/api'
import type {
  CreateQuarantineAreaInput,
  QuarantineArea,
  QuarantineAreaListMeta,
  QuarantineAreaQuery,
  UpdateQuarantineAreaInput,
} from '~/types/quarantine-area'

export const useQuarantineAreasStore = defineStore('quarantine-areas', () => {
  const items = ref<QuarantineArea[]>([])
  const meta = ref<QuarantineAreaListMeta>({ total: 0, page: 1, limit: 10, totalPages: 0 })
  const loading = ref(false)
  const error = ref<string | null>(null)
  const filters = ref<QuarantineAreaQuery>({
    page: 1,
    limit: 10,
    search: '',
    sortBy: 'name',
    sortOrder: 'asc',
  })

  async function loadQuarantineAreas() {
    loading.value = true
    error.value = null
    try {
      const result = await quarantineAreaService.fetchQuarantineAreas(filters.value)
      items.value = result.items
      meta.value = result.meta
    } catch (e) {
      error.value = e instanceof ApiError ? e.message : 'Failed to load quarantine areas'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function addQuarantineArea(input: CreateQuarantineAreaInput) {
    return quarantineAreaService.createQuarantineArea(input)
  }

  async function editQuarantineArea(id: string, input: UpdateQuarantineAreaInput) {
    return quarantineAreaService.updateQuarantineArea(id, input)
  }

  async function removeQuarantineArea(id: string) {
    return quarantineAreaService.deleteQuarantineArea(id)
  }

  function setFilters(patch: Partial<QuarantineAreaQuery>) {
    filters.value = { ...filters.value, ...patch }
  }

  return {
    items,
    meta,
    loading,
    error,
    filters,
    loadQuarantineAreas,
    addQuarantineArea,
    editQuarantineArea,
    removeQuarantineArea,
    setFilters,
  }
})
