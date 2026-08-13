import * as trolleyService from '~/services/trolley.service'
import { ApiError } from '~/types/api'
import type {
  CreateTrolleyInput,
  Trolley,
  TrolleyListMeta,
  TrolleyQuery,
  UpdateTrolleyInput,
} from '~/types/trolley'

export const useTrolleysStore = defineStore('trolleys', () => {
  const items = ref<Trolley[]>([])
  const meta = ref<TrolleyListMeta>({ total: 0, page: 1, limit: 10, totalPages: 0 })
  const loading = ref(false)
  const error = ref<string | null>(null)
  const filters = ref<TrolleyQuery>({
    page: 1,
    limit: 10,
    search: '',
    sortBy: 'name',
    sortOrder: 'asc',
  })

  async function loadTrolleys() {
    loading.value = true
    error.value = null
    try {
      const result = await trolleyService.fetchTrolleys(filters.value)
      items.value = result.items
      meta.value = result.meta
    } catch (e) {
      error.value = e instanceof ApiError ? e.message : 'Failed to load trolleys'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function addTrolley(input: CreateTrolleyInput) {
    return trolleyService.createTrolley(input)
  }

  async function editTrolley(id: string, input: UpdateTrolleyInput) {
    return trolleyService.updateTrolley(id, input)
  }

  async function removeTrolley(id: string) {
    return trolleyService.deleteTrolley(id)
  }

  function setFilters(patch: Partial<TrolleyQuery>) {
    filters.value = { ...filters.value, ...patch }
  }

  return {
    items,
    meta,
    loading,
    error,
    filters,
    loadTrolleys,
    addTrolley,
    editTrolley,
    removeTrolley,
    setFilters,
  }
})
