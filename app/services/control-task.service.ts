import type {
  ControlTask,
  ControlTaskListResult,
  ControlTaskQuery,
  CreateControlTaskInput,
  RouteOptions,
  UpdateControlTaskInput,
} from '~/types/control-task'

export async function fetchControlTasks(
  query: ControlTaskQuery = {},
): Promise<ControlTaskListResult> {
  const { $http } = useNuxtApp()
  return (await $http.get('/control-tasks', {
    params: query,
  })) as ControlTaskListResult
}

export async function fetchControlTask(id: string): Promise<ControlTask> {
  const { $http } = useNuxtApp()
  return (await $http.get(`/control-tasks/${id}`)) as ControlTask
}

// Resolves the value encoded in a Control Task QR label back to its task.
export async function fetchControlTaskByAbjad(abjad: string): Promise<ControlTask> {
  const { $http } = useNuxtApp()
  return (await $http.get(`/control-tasks/by-abjad/${encodeURIComponent(abjad)}`)) as ControlTask
}

// Every iRayple Location Code a route leg can be, from both the Production
// and Warehouse Location tables — served by the Control Tasks endpoint so the
// form needs only control-task.read.
export async function fetchRouteOptions(): Promise<RouteOptions> {
  const { $http } = useNuxtApp()
  return (await $http.get('/control-tasks/route-options')) as RouteOptions
}

export async function createControlTask(
  input: CreateControlTaskInput,
): Promise<ControlTask> {
  const { $http } = useNuxtApp()
  return (await $http.post('/control-tasks', input)) as ControlTask
}

export async function updateControlTask(
  id: string,
  input: UpdateControlTaskInput,
): Promise<ControlTask> {
  const { $http } = useNuxtApp()
  return (await $http.put(`/control-tasks/${id}`, input)) as ControlTask
}

export async function deleteControlTask(id: string): Promise<null> {
  const { $http } = useNuxtApp()
  return (await $http.delete(`/control-tasks/${id}`)) as null
}
