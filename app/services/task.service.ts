import type {
  ReleaseTaskInput,
  ReleaseTaskResult,
  Task,
  TaskListResult,
  TaskOperatorOption,
  TaskQuery,
} from '~/types/task'

export async function fetchTasks(query: TaskQuery = {}): Promise<TaskListResult> {
  const { $http } = useNuxtApp()
  return (await $http.get('/tasks', { params: query })) as TaskListResult
}

export async function releaseTask(input: ReleaseTaskInput): Promise<ReleaseTaskResult> {
  const { $http } = useNuxtApp()
  const raw = (await $http.post('/tasks/release', input)) as unknown

  // Tolerate an older backend that returned the Task directly instead of
  // { task, rcsRequest, rcsResponse } — a deploy-order mismatch between
  // frontend/backend should degrade gracefully instead of throwing deep in
  // a .task.taskId access and surfacing as a confusing "failed" toast.
  if (raw && typeof raw === 'object' && 'task' in raw) {
    return raw as ReleaseTaskResult
  }
  return { task: raw as Task, rcsRequest: null, rcsResponse: null }
}

export async function fetchTaskOperators(): Promise<TaskOperatorOption[]> {
  const { $http } = useNuxtApp()
  return (await $http.get('/tasks/operators')) as TaskOperatorOption[]
}

export async function cancelTask(id: string): Promise<Task> {
  const { $http } = useNuxtApp()
  return (await $http.patch(`/tasks/${id}/cancel`)) as Task
}
