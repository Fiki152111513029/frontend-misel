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
      const task = await store.releaseTask(input)
      toast.success(`Task ${task.taskId} released successfully`)
      await fetchTasks()
      return task
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to release task')
      return null
    }
  }

  return {
    items: computed(() => store.items),
    meta: computed(() => store.meta),
    loading: computed(() => store.loading),
    filters: computed(() => store.filters),
    fetchTasks,
    releaseTask,
    setFilters: store.setFilters,
  }
}
