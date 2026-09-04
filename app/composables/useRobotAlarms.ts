import { fetchAlarmDashboardStats } from '~/services/robot-alarm.service'
import { ApiError } from '~/types/api'
import type { AlarmDashboardStats } from '~/types/robot-alarm'

export function useRobotAlarms() {
  const toast = useToast()

  async function fetchDashboardStats(hours?: number): Promise<AlarmDashboardStats | null> {
    try {
      return await fetchAlarmDashboardStats(hours)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to load alarm stats')
      return null
    }
  }

  return { fetchDashboardStats }
}
