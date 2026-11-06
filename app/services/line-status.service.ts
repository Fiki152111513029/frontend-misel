import type { LineStatus, RaiseLineStatusInput } from '~/types/line-status'

/** What every production line is currently saying — the Checking Area board. */
export async function fetchLineStatuses(): Promise<LineStatus[]> {
  const { $http } = useNuxtApp()
  return (await $http.get('/line-statuses')) as LineStatus[]
}

/**
 * Announce something for one line. Replaces whatever that line was saying.
 *
 * The server checks the caller really works that group, so a 403 here
 * means the task registration and the button no longer agree — not that
 * the press was malformed.
 */
export async function raiseLineStatus(
  input: RaiseLineStatusInput,
): Promise<LineStatus> {
  const { $http } = useNuxtApp()
  return (await $http.post('/line-statuses', input)) as LineStatus
}

/** The warehouse has dealt with it. */
export async function clearLineStatus(groupName: string): Promise<void> {
  const { $http } = useNuxtApp()
  await $http.delete(`/line-statuses/${encodeURIComponent(groupName)}`)
}
