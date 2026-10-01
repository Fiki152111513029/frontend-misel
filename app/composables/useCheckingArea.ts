import {
  fetchCheckingArea as fetchCheckingAreaSvc,
  setBinStatus as setBinStatusSvc,
} from '~/services/checking-area.service'
import { ApiError } from '~/types/api'
import type { BinStatus, CheckingAreaRow } from '~/types/checking-area'

export function useCheckingArea() {
  const toast = useToast()
  const items = ref<CheckingAreaRow[]>([])
  const loading = ref(false)

  // `silent` is for the background poll: it leaves the current rows on
  // screen and stays quiet on failure, so the table never blinks and a
  // brief outage does not produce a toast every few seconds.
  let inFlight = false

  async function fetchRows(areaId: number | null, options: { silent?: boolean } = {}) {
    if (areaId == null) {
      items.value = []
      return
    }
    if (options.silent && inFlight) return
    inFlight = true
    if (!options.silent) loading.value = true
    try {
      items.value = await fetchCheckingAreaSvc(areaId)
    } catch (e) {
      if (!options.silent) {
        toast.error(e instanceof ApiError ? e.message : 'Failed to load bin status from RCS')
      }
    } finally {
      inFlight = false
      loading.value = false
    }
  }

  async function correctBin(code: string, status: BinStatus) {
    try {
      await setBinStatusSvc(code, status)
      toast.success(`${code} marked ${status === 'FULL' ? 'full' : 'empty'}`)
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'RCS refused the change')
      return false
    }
  }

  return { items, loading, fetchRows, correctBin }
}
