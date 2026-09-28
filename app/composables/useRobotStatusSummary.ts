import {
  fetchRobotStatusMonthlySummary,
  fetchRobotStatusSummary,
} from '~/services/robot.service'
import { ApiError } from '~/types/api'
import type {
  RobotStatusMonthlyMode,
  RobotStatusSummaryRow,
} from '~/types/robot'

export function useRobotStatusSummary() {
  const toast = useToast()

  async function fetchStatusSummary(
    date: string,
    shiftId: string | null,
    areaId?: number | null,
  ): Promise<RobotStatusSummaryRow[]> {
    try {
      return await fetchRobotStatusSummary(date, shiftId, areaId)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to load AMR performance data')
      return []
    }
  }

  async function fetchMonthlyStatusSummary(
    month: string,
    shiftId: string | null,
    mode: RobotStatusMonthlyMode,
    areaId?: number | null,
  ): Promise<RobotStatusSummaryRow[]> {
    try {
      return await fetchRobotStatusMonthlySummary(month, shiftId, mode, areaId)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to load AMR performance data')
      return []
    }
  }

  return { fetchStatusSummary, fetchMonthlyStatusSummary }
}
