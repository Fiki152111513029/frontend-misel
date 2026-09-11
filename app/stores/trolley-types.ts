import * as trolleyTypeService from '~/services/trolley-type.service'
import { ApiError } from '~/types/api'
import type {
  TrolleyType,
  TrolleyTypeListMeta,
  TrolleyTypeQuery,
  CreateTrolleyTypeInput,
  UpdateTrolleyTypeInput,
} from '~/types/trolley-type'

export const useTrolleyTypesStore = defineStore('trolleyTypes', () => {
  const items = ref<TrolleyType[]>([])
  const meta = ref<TrolleyTypeListMeta>({ total: 0, page: 1, limit: 10, totalPages: 0 })
  const loading = ref(false)
  const error = ref<string | null>(null)
  const filters = ref<TrolleyTypeQuery>({
    page: 1,
    limit: 10,
    search: '',
    sortBy: 'name',
    sortOrder: 'asc',
  })

  async function loadTrolleyTypes() {
    loading.value = true
    error.value = null
    try {
      const result = await trolleyTypeService.fetchTrolleyTypes(filters.value)
      items.value = result.items
      meta.value = result.meta
    } catch (e) {
      error.value = e instanceof ApiError ? e.message : 'Failed to load trolley types'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function addTrolleyType(input: CreateTrolleyTypeInput) {
    return trolleyTypeService.createTrolleyType(input)
  }

  async function editTrolleyType(id: string, input: UpdateTrolleyTypeInput) {
    return trolleyTypeService.updateTrolleyType(id, input)
  }

  async function removeTrolleyType(id: string) {
    return trolleyTypeService.deleteTrolleyType(id)
  }

  function setFilters(patch: Partial<TrolleyTypeQuery>) {
    filters.value = { ...filters.value, ...patch }
  }

  return {
    items,
    meta,
    loading,
    error,
    filters,
    loadTrolleyTypes,
    addTrolleyType,
    editTrolleyType,
    removeTrolleyType,
    setFilters,
  }
})
