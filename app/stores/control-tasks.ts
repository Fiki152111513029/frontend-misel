import * as controlTaskService from '~/services/control-task.service'
import { ApiError } from '~/types/api'
import type {
  ControlTask,
  ControlTaskListMeta,
  ControlTaskQuery,
  CreateControlTaskInput,
  UpdateControlTaskInput,
} from '~/types/control-task'

export const useControlTasksStore = defineStore('control-tasks', () => {
  const items = ref<ControlTask[]>([])
  const meta = ref<ControlTaskListMeta>({ total: 0, page: 1, limit: 10, totalPages: 0 })
  const loading = ref(false)
  const error = ref<string | null>(null)
  const filters = ref<ControlTaskQuery>({
    page: 1,
    limit: 10,
    search: '',
    sortBy: 'abjad',
    sortOrder: 'asc',
  })

  async function loadControlTasks() {
    loading.value = true
    error.value = null
    try {
      const result = await controlTaskService.fetchControlTasks(filters.value)
      items.value = result.items
      meta.value = result.meta
    } catch (e) {
      error.value = e instanceof ApiError ? e.message : 'Failed to load control tasks'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function addControlTask(input: CreateControlTaskInput) {
    return controlTaskService.createControlTask(input)
  }

  async function editControlTask(id: string, input: UpdateControlTaskInput) {
    return controlTaskService.updateControlTask(id, input)
  }

  async function removeControlTask(id: string) {
    return controlTaskService.deleteControlTask(id)
  }

  function setFilters(patch: Partial<ControlTaskQuery>) {
    filters.value = { ...filters.value, ...patch }
  }

  return {
    items,
    meta,
    loading,
    error,
    filters,
    loadControlTasks,
    addControlTask,
    editControlTask,
    removeControlTask,
    setFilters,
  }
})
