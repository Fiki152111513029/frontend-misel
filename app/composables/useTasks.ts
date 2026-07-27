import { ApiError } from '~/types/api'
import type { ReleaseTaskInput, TaskQuery } from '~/types/task'

export function useTasks() {
  const store = useTasksStore()
  const toast = useToast()

  async function fetchTasks(query?: Partial<TaskQuery>) {
    if (query) store.setFilters(query)
    try {
      await store.loadTasks()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to load tasks')
    }
  }

  async function releaseTask(input: ReleaseTaskInput) {
    try {
      const result = await store.releaseTask(input)
      toast.success(`Task ${result.task.taskId} released successfully`)
      await fetchTasks()
      return result
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to release task')
      return null
    }
  }

  async function fetchTaskOperators() {
    try {
      await store.loadOperators()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to load operators')
    }
  }

  async function cancelTask(id: string) {
    try {
      const task = await store.cancelTask(id)
      toast.success(`Task ${task.taskId} cancelled`)
      await fetchTasks()
      return task
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to cancel task')
      return null
    }
  }

  return {
    items: computed(() => store.items),
    meta: computed(() => store.meta),
    loading: computed(() => store.loading),
    filters: computed(() => store.filters),
    operators: computed(() => store.operators),
    fetchTasks,
    releaseTask,
    fetchTaskOperators,
    cancelTask,
    setFilters: store.setFilters,
  }
}
