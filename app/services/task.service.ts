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
  return (await $http.post('/tasks/release', input)) as ReleaseTaskResult
}

export async function fetchTaskOperators(): Promise<TaskOperatorOption[]> {
  const { $http } = useNuxtApp()
  return (await $http.get('/tasks/operators')) as TaskOperatorOption[]
}

export async function cancelTask(id: string): Promise<Task> {
  const { $http } = useNuxtApp()
  return (await $http.patch(`/tasks/${id}/cancel`)) as Task
}
