import {
  fetchOperatorDurationMonthlySummary,
  fetchOperatorDurationSummary,
  fetchTrolleyFrequencyMonthlySummary,
  fetchTrolleyFrequencySummary,
} from '~/services/trolley-activity.service'
import { ApiError } from '~/types/api'
import type {
  OperatorDurationSummaryRow,
  TrolleyShiftMonthlyMode,
  TrolleySupplyFrequencyRow,
} from '~/types/trolley-activity'

export function useTrolleyShiftSummary() {
  const toast = useToast()

  async function fetchDurationSummary(date: string, shiftId: string): Promise<OperatorDurationSummaryRow[]> {
    try {
      return await fetchOperatorDurationSummary(date, shiftId)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to load operator duration data')
      return []
    }
  }

  async function fetchDurationMonthlySummary(
    month: string,
    shiftId: string,
    mode: TrolleyShiftMonthlyMode,
  ): Promise<OperatorDurationSummaryRow[]> {
    try {
      return await fetchOperatorDurationMonthlySummary(month, shiftId, mode)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to load operator duration data')
      return []
    }
  }

  async function fetchFrequencySummary(date: string, shiftId: string): Promise<TrolleySupplyFrequencyRow[]> {
    try {
      return await fetchTrolleyFrequencySummary(date, shiftId)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to load trolley frequency data')
      return []
    }
  }

  async function fetchFrequencyMonthlySummary(
    month: string,
    shiftId: string,
    mode: TrolleyShiftMonthlyMode,
  ): Promise<TrolleySupplyFrequencyRow[]> {
    try {
      return await fetchTrolleyFrequencyMonthlySummary(month, shiftId, mode)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to load trolley frequency data')
      return []
    }
  }

  return {
    fetchDurationSummary,
    fetchDurationMonthlySummary,
    fetchFrequencySummary,
    fetchFrequencyMonthlySummary,
  }
}
