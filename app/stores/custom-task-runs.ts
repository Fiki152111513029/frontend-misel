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

  // A background poll must not flip `loading`, or the table drops into its
  // skeleton every few seconds and the page visibly blinks — the Dashboard
  // panels avoid this the same way, by swapping the rows in place and
  // leaving the last known data on screen while a refresh is in flight.
  // Only a first load or a deliberate filter/page change shows the spinner.
  let inFlight = false

  async function loadRuns(options: { silent?: boolean } = {}) {
    // A slow response must not let ticks pile up on top of each other,
    // which would make the rows jump around as they resolve out of order.
    if (options.silent && inFlight) return
    inFlight = true
    if (!options.silent) loading.value = true
    error.value = null
    try {
      const result = await fetchCustomTaskRuns(filters.value)
      items.value = result.items
      meta.value = result.meta
    } catch (e) {
      error.value = e instanceof ApiError ? e.message : 'Failed to load custom tasks'
      throw e
    } finally {
      inFlight = false
      loading.value = false
    }
  }

  function setFilters(patch: Partial<CustomTaskRunQuery>) {
    filters.value = { ...filters.value, ...patch }
  }

  return { items, meta, loading, error, filters, loadRuns, setFilters }
})
