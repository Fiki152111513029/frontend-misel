import type {
  ReleaseTaskInput,
  Task,
  TaskListResult,
  TaskQuery,
} from '~/types/task'

export async function fetchTasks(query: TaskQuery = {}): Promise<TaskListResult> {
  const { $http } = useNuxtApp()
  return (await $http.get('/tasks', { params: query })) as TaskListResult
}

export async function releaseTask(input: ReleaseTaskInput): Promise<Task> {
  const { $http } = useNuxtApp()
  return (await $http.post('/tasks/release', input)) as Task
}
