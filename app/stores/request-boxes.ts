import * as requestBoxService from '~/services/request-box.service'
import { ApiError } from '~/types/api'
import type {
  CreateRequestBoxInput,
  RequestBox,
  RequestBoxListMeta,
  RequestBoxQuery,
} from '~/types/request-box'

export const useRequestBoxesStore = defineStore('request-boxes', () => {
  const items = ref<RequestBox[]>([])
  const meta = ref<RequestBoxListMeta>({ total: 0, page: 1, limit: 10, totalPages: 0 })
  const loading = ref(false)
  const error = ref<string | null>(null)
  const filters = ref<RequestBoxQuery>({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })

  async function loadRequestBoxes() {
    loading.value = true
    error.value = null
    try {
      const result = await requestBoxService.fetchRequestBoxes(filters.value)
      items.value = result.items
      meta.value = result.meta
    } catch (e) {
      error.value = e instanceof ApiError ? e.message : 'Failed to load request boxes'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function addRequestBox(input: CreateRequestBoxInput) {
    return requestBoxService.createRequestBox(input)
  }

  async function removeRequestBox(id: string) {
    return requestBoxService.deleteRequestBox(id)
  }

  function setFilters(patch: Partial<RequestBoxQuery>) {
    filters.value = { ...filters.value, ...patch }
  }

  return {
    items,
    meta,
    loading,
    error,
    filters,
    loadRequestBoxes,
    addRequestBox,
    removeRequestBox,
    setFilters,
  }
})
