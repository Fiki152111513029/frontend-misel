import { ApiError } from '~/types/api'
import type { ReleaseWarehouseCartTaskInput, WarehouseCartTaskQuery } from '~/types/warehouse-cart-task'

export function useWarehouseCartTasks() {
  const store = useWarehouseCartTasksStore()
  const toast = useToast()

  async function fetchWarehouseCartTasks(query?: Partial<WarehouseCartTaskQuery>) {
    if (query) store.setFilters(query)
    try {
      await store.loadWarehouseCartTasks()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to load warehouse cart tasks')
    }
  }

  async function releaseWarehouseCartTask(input: ReleaseWarehouseCartTaskInput) {
    try {
      const task = await store.releaseWarehouseCartTask(input)
      toast.success(`Cart task ${task.taskId} released successfully`)
      await fetchWarehouseCartTasks()
      return task
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to release warehouse cart task')
      return null
    }
  }

  async function fetchWarehouseCartTaskOperators() {
    try {
      await store.loadOperators()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to load operators')
    }
  }

  return {
    items: computed(() => store.items),
    meta: computed(() => store.meta),
    loading: computed(() => store.loading),
    filters: computed(() => store.filters),
    operators: computed(() => store.operators),
    fetchWarehouseCartTasks,
    releaseWarehouseCartTask,
    fetchWarehouseCartTaskOperators,
    setFilters: store.setFilters,
  }
}
