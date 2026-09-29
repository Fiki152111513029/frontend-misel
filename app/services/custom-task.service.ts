import type {
  CustomTaskPreview,
  CustomTaskRun,
  CustomTaskRunListResult,
  CustomTaskRunQuery,
  ReleasedCustomTask,
} from '~/types/custom-task'

// Read-only: resolves the scanned QR value without sending anything to RCS.
export async function lookupCustomTask(code: string): Promise<CustomTaskPreview> {
  const { $http } = useNuxtApp()
  return (await $http.get(
    `/custom-tasks/lookup/${encodeURIComponent(code)}`,
  )) as CustomTaskPreview
}

// The only call that actually reaches RCS (/ics/taskOrder/addTask).
export async function releaseCustomTask(code: string): Promise<ReleasedCustomTask> {
  const { $http } = useNuxtApp()
  return (await $http.post('/custom-tasks/release', { code })) as ReleasedCustomTask
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

// Marks a run cancelled in our own database. RCS has no cancel endpoint in
// this integration, so the robot itself is not stopped.
export async function cancelCustomTaskRun(id: string): Promise<CustomTaskRun> {
  const { $http } = useNuxtApp()
  return (await $http.patch(`/custom-tasks/runs/${id}/cancel`)) as CustomTaskRun
}
