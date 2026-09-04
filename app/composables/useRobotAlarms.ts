import { fetchAlarmDashboardStats, fetchRobotAlarms } from '~/services/robot-alarm.service'
import { ApiError } from '~/types/api'
import type { AlarmDashboardStats, RobotAlarmListResult, RobotAlarmQuery } from '~/types/robot-alarm'

const EMPTY_LIST: RobotAlarmListResult = { items: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } }

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

  async function fetchAlarms(query?: RobotAlarmQuery): Promise<RobotAlarmListResult> {
    try {
      return await fetchRobotAlarms(query)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to load alarm logs')
      return EMPTY_LIST
    }
  }

  return { fetchDashboardStats, fetchAlarms }
}
