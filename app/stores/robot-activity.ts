import * as robotService from '~/services/robot.service'
import { ApiError } from '~/types/api'
import type { RobotActivityListMeta, RobotActivityLog, RobotActivityQuery } from '~/types/robot'

export const useRobotActivityStore = defineStore('robot-activity', () => {
  const robotName = ref<string | null>(null)
  const items = ref<RobotActivityLog[]>([])
  const meta = ref<RobotActivityListMeta>({ total: 0, page: 1, limit: 20, totalPages: 0 })
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function loadRobotActivity(robotId: string, query?: RobotActivityQuery) {
    // Only show the loading state on a genuine first load — this page
    // auto-refreshes, and re-blanking the table on every tick would flash
    // distractingly instead of just swapping in fresh rows.
    if (items.value.length === 0) loading.value = true
    error.value = null
    try {
      const result = await robotService.fetchRobotActivity(robotId, query)
      robotName.value = result.robot.name
      items.value = result.items
      meta.value = result.meta
    } catch (e) {
      error.value = e instanceof ApiError ? e.message : 'Failed to load robot activity'
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    robotName,
    items,
    meta,
    loading,
    error,
    loadRobotActivity,
  }
})
