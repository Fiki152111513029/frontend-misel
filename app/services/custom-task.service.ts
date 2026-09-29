import type {
  CustomTaskPreview,
  CustomTaskRunListResult,
  CustomTaskRunQuery,
  ReleasedCustomTask,
} from '~/types/custom-task'

// Read-only: resolves the scanned QR value without sending anything to RCS.
export async function lookupCustomTask(abjad: string): Promise<CustomTaskPreview> {
  const { $http } = useNuxtApp()
  return (await $http.get(
    `/custom-tasks/lookup/${encodeURIComponent(abjad)}`,
  )) as CustomTaskPreview
}

// The only call that actually reaches RCS (/ics/taskOrder/addTask).
export async function releaseCustomTask(abjad: string): Promise<ReleasedCustomTask> {
  const { $http } = useNuxtApp()
  return (await $http.post('/custom-tasks/release', { abjad })) as ReleasedCustomTask
}

// History of dispatched Custom Tasks, newest first — the All Tasks >
// Custom Tasks page.
export async function fetchCustomTaskRuns(
  query: CustomTaskRunQuery = {},
): Promise<CustomTaskRunListResult> {
  const { $http } = useNuxtApp()
  return (await $http.get('/custom-tasks/runs', {
    params: query,
  })) as CustomTaskRunListResult
}
