import {
  lookupCustomTask as lookupCustomTaskSvc,
  releaseCustomTask as releaseCustomTaskSvc,
} from '~/services/custom-task.service'
import { ApiError } from '~/types/api'
import { cancelCustomTaskRun as cancelCustomTaskRunSvc } from '~/services/custom-task.service'
import type { CustomTaskRunQuery } from '~/types/custom-task'

export function useCustomTasks() {
  const toast = useToast()

  async function lookupCustomTask(code: string) {
    try {
      return await lookupCustomTaskSvc(code)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to look up that code')
      return null
    }
  }

  async function releaseCustomTask(code: string) {
    try {
      return await releaseCustomTaskSvc(code)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to submit the task')
      return null
    }
  }

  return { lookupCustomTask, releaseCustomTask }
}

// The All Tasks > Custom Tasks history. Polled by that page so a task that
// is still running updates its status without a manual refresh.
export function useCustomTaskRuns() {
  const store = useCustomTaskRunsStore()
  const toast = useToast()

  async function fetchRuns(query?: Partial<CustomTaskRunQuery>) {
    if (query) store.setFilters(query)
    try {
      await store.loadRuns()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to load custom tasks')
    }
  }

  // The background poll: same request, but it leaves the table showing what
  // it already has and stays quiet on failure. A toast every few seconds
  // while the backend is briefly unreachable would be worse than the stale
  // rows it is warning about — the next tick recovers on its own.
  async function refreshRuns() {
    try {
      await store.loadRuns({ silent: true })
    } catch {
      // Non-fatal — this tick keeps the previous rows.
    }
  }

  async function cancelRun(id: string) {
    try {
      const run = await cancelCustomTaskRunSvc(id)
      toast.success(`Custom task ${run.code} cancelled`)
      await fetchRuns()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to cancel that task')
      return false
    }
  }

  return {
    items: computed(() => store.items),
    meta: computed(() => store.meta),
    loading: computed(() => store.loading),
    filters: computed(() => store.filters),
    fetchRuns,
    refreshRuns,
    cancelRun,
    setFilters: store.setFilters,
  }
}
