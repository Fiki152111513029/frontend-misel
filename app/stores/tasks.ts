import * as taskService from '~/services/task.service'
import { ApiError } from '~/types/api'
import type { ReleaseTaskInput, Task, TaskListMeta, TaskOperatorOption, TaskQuery } from '~/types/task'

export const useTasksStore = defineStore('tasks', () => {
  const items = ref<Task[]>([])
  const meta = ref<TaskListMeta>({ total: 0, page: 1, limit: 10, totalPages: 0 })
  const loading = ref(false)
  const error = ref<string | null>(null)
  const filters = ref<TaskQuery>({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })
  const operators = ref<TaskOperatorOption[]>([])

  async function loadTasks() {
    loading.value = true
    error.value = null
    try {
      const result = await taskService.fetchTasks(filters.value)
      items.value = result.items
      meta.value = result.meta
    } catch (e) {
      error.value = e instanceof ApiError ? e.message : 'Failed to load tasks'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function loadOperators() {
    operators.value = await taskService.fetchTaskOperators()
  }

  async function releaseTask(input: ReleaseTaskInput) {
    return taskService.releaseTask(input)
  }

  async function cancelTask(id: string) {
    return taskService.cancelTask(id)
  }

  function setFilters(patch: Partial<TaskQuery>) {
    filters.value = { ...filters.value, ...patch }
  }

  return {
    items,
    meta,
    loading,
    error,
    filters,
    operators,
    loadTasks,
    loadOperators,
    releaseTask,
    cancelTask,
    setFilters,
  }
})
