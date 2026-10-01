import type { BinStatus, CheckingAreaRow } from '~/types/checking-area'

// Every active Warehouse Location paired with the bin status RCS currently
// reports for it. Omitting `areaId` asks every area and merges the answers.
export async function fetchCheckingArea(areaId?: number | null): Promise<CheckingAreaRow[]> {
  const { $http } = useNuxtApp()
  return (await $http.get('/checking-areas', {
    params: areaId == null ? {} : { areaId },
  })) as CheckingAreaRow[]
}

// Corrects one bin in RCS to match the floor. Throws if RCS refuses, so the
// caller must not report success on its own.
export async function setBinStatus(
  code: string,
  status: BinStatus,
): Promise<{ iRaypleLocationCode: string, stockStatus: BinStatus }> {
  const { $http } = useNuxtApp()
  return (await $http.patch(`/checking-areas/${encodeURIComponent(code)}`, {
    status,
  })) as { iRaypleLocationCode: string, stockStatus: BinStatus }
}
