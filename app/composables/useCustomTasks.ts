import {
  lookupCustomTask as lookupCustomTaskSvc,
  releaseCustomTask as releaseCustomTaskSvc,
} from '~/services/custom-task.service'
import { ApiError } from '~/types/api'
import type { CustomTaskRunQuery } from '~/types/custom-task'

export function useCustomTasks() {
  const toast = useToast()

  async function lookupCustomTask(abjad: string) {
    try {
      return await lookupCustomTaskSvc(abjad)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to look up that code')
      return null
    }
  }

  async function releaseCustomTask(abjad: string) {
    try {
      return await releaseCustomTaskSvc(abjad)
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

  return {
    items: computed(() => store.items),
    meta: computed(() => store.meta),
    loading: computed(() => store.loading),
    filters: computed(() => store.filters),
    fetchRuns,
    setFilters: store.setFilters,
  }
}
