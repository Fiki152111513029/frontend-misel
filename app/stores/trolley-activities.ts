import * as trolleyActivityService from '~/services/trolley-activity.service'
import { ApiError } from '~/types/api'
import type {
  TrolleyActivity,
  TrolleyActivityListMeta,
  TrolleyActivityQuery,
} from '~/types/trolley-activity'

export const useTrolleyActivitiesStore = defineStore('trolley-activities', () => {
  const items = ref<TrolleyActivity[]>([])
  const meta = ref<TrolleyActivityListMeta>({ total: 0, page: 1, limit: 10, totalPages: 0 })
  const loading = ref(false)
  const error = ref<string | null>(null)
  const filters = ref<TrolleyActivityQuery>({ page: 1, limit: 10 })

  async function loadTrolleyActivities() {
    loading.value = true
    error.value = null
    try {
      const result = await trolleyActivityService.fetchTrolleyActivities(filters.value)
      items.value = result.items
      meta.value = result.meta
    } catch (e) {
      error.value = e instanceof ApiError ? e.message : 'Failed to load trolley activities'
      throw e
    } finally {
      loading.value = false
    }
  }

  function setFilters(patch: Partial<TrolleyActivityQuery>) {
    filters.value = { ...filters.value, ...patch }
  }

  return {
    items,
    meta,
    loading,
    error,
    filters,
    loadTrolleyActivities,
    setFilters,
  }
})
