import * as warehouseCartTaskService from '~/services/warehouse-cart-task.service'
import { ApiError } from '~/types/api'
import type {
  ReleaseWarehouseCartTaskInput,
  WarehouseCartTask,
  WarehouseCartTaskListMeta,
  WarehouseCartTaskQuery,
} from '~/types/warehouse-cart-task'

export const useWarehouseCartTasksStore = defineStore('warehouseCartTasks', () => {
  const items = ref<WarehouseCartTask[]>([])
  const meta = ref<WarehouseCartTaskListMeta>({ total: 0, page: 1, limit: 10, totalPages: 0 })
  const loading = ref(false)
  const error = ref<string | null>(null)
  const filters = ref<WarehouseCartTaskQuery>({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })

  async function loadWarehouseCartTasks() {
    loading.value = true
    error.value = null
    try {
      const result = await warehouseCartTaskService.fetchWarehouseCartTasks(filters.value)
      items.value = result.items
      meta.value = result.meta
    } catch (e) {
      error.value = e instanceof ApiError ? e.message : 'Failed to load warehouse cart tasks'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function releaseWarehouseCartTask(input: ReleaseWarehouseCartTaskInput) {
    return warehouseCartTaskService.releaseWarehouseCartTask(input)
  }

  function setFilters(patch: Partial<WarehouseCartTaskQuery>) {
    filters.value = { ...filters.value, ...patch }
  }

  return {
    items,
    meta,
    loading,
    error,
    filters,
    loadWarehouseCartTasks,
    releaseWarehouseCartTask,
    setFilters,
  }
})
