import * as trolleyCategoryService from '~/services/trolley-category.service'
import { ApiError } from '~/types/api'
import type {
  CreateTrolleyCategoryInput,
  TrolleyCategory,
  TrolleyCategoryListMeta,
  TrolleyCategoryQuery,
  UpdateTrolleyCategoryInput,
} from '~/types/trolley-category'

export const useTrolleyCategoriesStore = defineStore('trolley-categories', () => {
  const items = ref<TrolleyCategory[]>([])
  const meta = ref<TrolleyCategoryListMeta>({ total: 0, page: 1, limit: 10, totalPages: 0 })
  const loading = ref(false)
  const error = ref<string | null>(null)
  const filters = ref<TrolleyCategoryQuery>({
    page: 1,
    limit: 10,
    search: '',
    sortBy: 'name',
    sortOrder: 'asc',
  })

  async function loadTrolleyCategories() {
    loading.value = true
    error.value = null
    try {
      const result = await trolleyCategoryService.fetchTrolleyCategories(filters.value)
      items.value = result.items
      meta.value = result.meta
    } catch (e) {
      error.value = e instanceof ApiError ? e.message : 'Failed to load trolley categories'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function addTrolleyCategory(input: CreateTrolleyCategoryInput) {
    return trolleyCategoryService.createTrolleyCategory(input)
  }

  async function editTrolleyCategory(id: string, input: UpdateTrolleyCategoryInput) {
    return trolleyCategoryService.updateTrolleyCategory(id, input)
  }

  async function removeTrolleyCategory(id: string) {
    return trolleyCategoryService.deleteTrolleyCategory(id)
  }

  function setFilters(patch: Partial<TrolleyCategoryQuery>) {
    filters.value = { ...filters.value, ...patch }
  }

  return {
    items,
    meta,
    loading,
    error,
    filters,
    loadTrolleyCategories,
    addTrolleyCategory,
    editTrolleyCategory,
    removeTrolleyCategory,
    setFilters,
  }
})
