import * as boxTypeService from '~/services/box-type.service'
import { ApiError } from '~/types/api'
import type {
  BoxTypeListMeta,
  BoxTypeQuery,
  BoxType,
  CreateBoxTypeInput,
  UpdateBoxTypeInput,
} from '~/types/box-type'

export const useBoxTypesStore = defineStore('box-types', () => {
  const items = ref<BoxType[]>([])
  const meta = ref<BoxTypeListMeta>({ total: 0, page: 1, limit: 10, totalPages: 0 })
  const loading = ref(false)
  const error = ref<string | null>(null)
  const filters = ref<BoxTypeQuery>({
    page: 1,
    limit: 10,
    search: '',
    sortBy: 'ordering',
    sortOrder: 'asc',
  })

  async function loadBoxTypes() {
    loading.value = true
    error.value = null
    try {
      const result = await boxTypeService.fetchBoxTypes(filters.value)
      items.value = result.items
      meta.value = result.meta
    } catch (e) {
      error.value = e instanceof ApiError ? e.message : 'Failed to load box types'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function addBoxType(input: CreateBoxTypeInput) {
    return boxTypeService.createBoxType(input)
  }

  async function editBoxType(id: string, input: UpdateBoxTypeInput) {
    return boxTypeService.updateBoxType(id, input)
  }

  async function removeBoxType(id: string) {
    return boxTypeService.deleteBoxType(id)
  }

  function setFilters(patch: Partial<BoxTypeQuery>) {
    filters.value = { ...filters.value, ...patch }
  }

  return {
    items,
    meta,
    loading,
    error,
    filters,
    loadBoxTypes,
    addBoxType,
    editBoxType,
    removeBoxType,
    setFilters,
  }
})
