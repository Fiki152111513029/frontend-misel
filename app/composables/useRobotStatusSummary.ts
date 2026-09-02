import {
  fetchRobotStatusMonthlySummary,
  fetchRobotStatusSummary,
} from '~/services/robot.service'
import { ApiError } from '~/types/api'
import type {
  RobotShift,
  RobotStatusMonthlyMode,
  RobotStatusSummaryRow,
} from '~/types/robot'

export function useRobotStatusSummary() {
  const toast = useToast()

  async function fetchStatusSummary(date: string, shift: RobotShift): Promise<RobotStatusSummaryRow[]> {
    try {
      return await fetchRobotStatusSummary(date, shift)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to load AMR performance data')
      return []
    }
  }

  async function fetchMonthlyStatusSummary(
    month: string,
    shift: RobotShift,
    mode: RobotStatusMonthlyMode,
  ): Promise<RobotStatusSummaryRow[]> {
    try {
      return await fetchRobotStatusMonthlySummary(month, shift, mode)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to load AMR performance data')
      return []
    }
  }

  return { fetchStatusSummary, fetchMonthlyStatusSummary }
}
