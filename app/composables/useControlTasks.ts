import { ApiError } from '~/types/api'
import {
  fetchControlTask as fetchControlTaskSvc,
  fetchRouteOptions as fetchRouteOptionsSvc,
} from '~/services/control-task.service'
import type {
  ControlTaskQuery,
  CreateControlTaskInput,
  RouteOption,
  UpdateControlTaskInput,
} from '~/types/control-task'

export function useControlTasks() {
  const store = useControlTasksStore()
  const toast = useToast()

  async function fetchControlTasks(query?: Partial<ControlTaskQuery>) {
    if (query) store.setFilters(query)
    try {
      await store.loadControlTasks()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to load control tasks')
    }
  }

  async function fetchControlTask(id: string) {
    try {
      return await fetchControlTaskSvc(id)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to load control task')
      return null
    }
  }

  async function createControlTask(input: CreateControlTaskInput) {
    try {
      await store.addControlTask(input)
      toast.success('Control Task created successfully')
      await fetchControlTasks()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to create control task')
      return false
    }
  }

  async function updateControlTask(id: string, input: UpdateControlTaskInput) {
    try {
      await store.editControlTask(id, input)
      toast.success('Control Task updated successfully')
      await fetchControlTasks()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to update control task')
      return false
    }
  }

  async function deleteControlTask(id: string) {
    try {
      await store.removeControlTask(id)
      toast.success('Control Task deleted successfully')
      await fetchControlTasks()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to delete control task')
      return false
    }
  }

  return {
    items: computed(() => store.items),
    meta: computed(() => store.meta),
    loading: computed(() => store.loading),
    filters: computed(() => store.filters),
    fetchControlTasks,
    fetchControlTask,
    createControlTask,
    updateControlTask,
    deleteControlTask,
    setFilters: store.setFilters,
  }
}

// The legs a route can be built from, Production and Warehouse together.
// Kept separate from useControlTasks() because only the form needs them.
export function useRouteOptions() {
  const toast = useToast()
  const production = ref<RouteOption[]>([])
  const warehouse = ref<RouteOption[]>([])

  const byCode = computed(() => {
    const map = new Map<string, RouteOption>()
    for (const option of [...production.value, ...warehouse.value]) {
      map.set(option.iRaypleLocationCode, option)
    }
    return map
  })

  async function fetchRouteOptions() {
    try {
      const result = await fetchRouteOptionsSvc()
      production.value = result.production
      warehouse.value = result.warehouse
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to load route options')
    }
  }

  return { production, warehouse, byCode, fetchRouteOptions }
}
