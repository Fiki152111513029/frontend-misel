import * as robotService from '~/services/robot.service'
import { ApiError } from '~/types/api'
import type {
  CreateRobotInput,
  Robot,
  RobotListMeta,
  RobotQuery,
  UpdateRobotInput,
} from '~/types/robot'

export const useRobotsStore = defineStore('robots', () => {
  const items = ref<Robot[]>([])
  const meta = ref<RobotListMeta>({ total: 0, page: 1, limit: 10, totalPages: 0 })
  const loading = ref(false)
  const error = ref<string | null>(null)
  const filters = ref<RobotQuery>({
    page: 1,
    limit: 10,
    search: '',
    sortBy: 'name',
    sortOrder: 'asc',
  })

  async function loadRobots() {
    loading.value = true
    error.value = null
    try {
      const result = await robotService.fetchRobots(filters.value)
      items.value = result.items
      meta.value = result.meta
    } catch (e) {
      error.value = e instanceof ApiError ? e.message : 'Failed to load robots'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function pollRobots() {
    try {
      const result = await robotService.fetchRobots(filters.value)
      items.value = result.items
      meta.value = result.meta
    } catch {
      // Silent poll — keep showing the last known data if a refresh tick fails.
    }
  }

  async function addRobot(input: CreateRobotInput) {
    return robotService.createRobot(input)
  }

  async function editRobot(id: string, input: UpdateRobotInput) {
    return robotService.updateRobot(id, input)
  }

  async function removeRobot(id: string) {
    return robotService.deleteRobot(id)
  }

  function setFilters(patch: Partial<RobotQuery>) {
    filters.value = { ...filters.value, ...patch }
  }

  return {
    items,
    meta,
    loading,
    error,
    filters,
    loadRobots,
    pollRobots,
    addRobot,
    editRobot,
    removeRobot,
    setFilters,
  }
})
