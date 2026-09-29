import { fetchCustomTaskRuns } from '~/services/custom-task.service'
import { ApiError } from '~/types/api'
import type {
  CustomTaskRun,
  CustomTaskRunListMeta,
  CustomTaskRunQuery,
} from '~/types/custom-task'

export const useCustomTaskRunsStore = defineStore('custom-task-runs', () => {
  const items = ref<CustomTaskRun[]>([])
  const meta = ref<CustomTaskRunListMeta>({ total: 0, page: 1, limit: 10, totalPages: 0 })
  const loading = ref(false)
  const error = ref<string | null>(null)
  const filters = ref<CustomTaskRunQuery>({
    page: 1,
    limit: 10,
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })

  async function loadRuns() {
    loading.value = true
    error.value = null
    try {
      const result = await fetchCustomTaskRuns(filters.value)
      items.value = result.items
      meta.value = result.meta
    } catch (e) {
      error.value = e instanceof ApiError ? e.message : 'Failed to load custom tasks'
      throw e
    } finally {
      loading.value = false
    }
  }

  function setFilters(patch: Partial<CustomTaskRunQuery>) {
    filters.value = { ...filters.value, ...patch }
  }

  return { items, meta, loading, error, filters, loadRuns, setFilters }
})
