import { fetchRobotStatusSummary } from '~/services/robot.service'
import { ApiError } from '~/types/api'
import type { RobotStatusSummaryRow } from '~/types/robot'

export function useRobotStatusSummary() {
  const toast = useToast()

  async function fetchStatusSummary(date: string): Promise<RobotStatusSummaryRow[]> {
    try {
      return await fetchRobotStatusSummary(date)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to load AMR performance data')
      return []
    }
  }

  return { fetchStatusSummary }
}
