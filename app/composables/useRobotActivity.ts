import { ApiError } from '~/types/api'
import type { RobotActivityQuery } from '~/types/robot'

export function useRobotActivity() {
  const store = useRobotActivityStore()
  const toast = useToast()

  async function fetchRobotActivity(robotId: string, query?: RobotActivityQuery) {
    try {
      await store.loadRobotActivity(robotId, query)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to load robot activity')
    }
  }

  return {
    robotName: computed(() => store.robotName),
    items: computed(() => store.items),
    meta: computed(() => store.meta),
    loading: computed(() => store.loading),
    fetchRobotActivity,
  }
}
