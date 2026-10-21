import type { AgvLogListResult, AgvLogQuery } from '~/types/agv-log'

export async function fetchAgvLogs(query: AgvLogQuery = {}): Promise<AgvLogListResult> {
  const { $http } = useNuxtApp()
  return (await $http.get('/agv-logs', {
    params: { page: 1, limit: 25, ...query },
  })) as AgvLogListResult
}

/** Device codes seen in the stored reports — fills the filter dropdown. */
export async function fetchAgvDeviceCodes(): Promise<string[]> {
  const { $http } = useNuxtApp()
  return (await $http.get('/agv-logs/device-codes')) as string[]
}
