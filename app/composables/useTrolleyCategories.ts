import { fetchTrolleyCategory as fetchTrolleyCategorySvc } from '~/services/trolley-category.service'
import { ApiError } from '~/types/api'
import type {
  CreateTrolleyCategoryInput,
  TrolleyCategoryQuery,
  UpdateTrolleyCategoryInput,
} from '~/types/trolley-category'

export function useTrolleyCategories() {
  const store = useTrolleyCategoriesStore()
  const toast = useToast()

  async function fetchTrolleyCategories(query?: Partial<TrolleyCategoryQuery>) {
    if (query) store.setFilters(query)
    try {
      await store.loadTrolleyCategories()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to load trolley categories')
    }
  }

  async function fetchTrolleyCategory(id: string) {
    try {
      return await fetchTrolleyCategorySvc(id)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to load trolley category')
      return null
    }
  }

  async function createTrolleyCategory(input: CreateTrolleyCategoryInput) {
    try {
      await store.addTrolleyCategory(input)
      toast.success('Trolley Category created successfully')
      await fetchTrolleyCategories()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to create trolley category')
      return false
    }
  }

  async function updateTrolleyCategory(id: string, input: UpdateTrolleyCategoryInput) {
    try {
      await store.editTrolleyCategory(id, input)
      toast.success('Trolley Category updated successfully')
      await fetchTrolleyCategories()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to update trolley category')
      return false
    }
  }

  async function deleteTrolleyCategory(id: string) {
    try {
      await store.removeTrolleyCategory(id)
      toast.success('Trolley Category deleted successfully')
      await fetchTrolleyCategories()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to delete trolley category')
      return false
    }
  }

  return {
    items: computed(() => store.items),
    meta: computed(() => store.meta),
    loading: computed(() => store.loading),
    filters: computed(() => store.filters),
    fetchTrolleyCategories,
    fetchTrolleyCategory,
    createTrolleyCategory,
    updateTrolleyCategory,
    deleteTrolleyCategory,
    setFilters: store.setFilters,
  }
}
