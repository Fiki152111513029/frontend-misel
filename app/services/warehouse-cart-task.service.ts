import type {
  ReleaseWarehouseCartTaskInput,
  WarehouseCartTask,
  WarehouseCartTaskListResult,
  WarehouseCartTaskOperatorOption,
  WarehouseCartTaskQuery,
} from '~/types/warehouse-cart-task'

export async function fetchWarehouseCartTasks(
  query: WarehouseCartTaskQuery = {},
): Promise<WarehouseCartTaskListResult> {
  const { $http } = useNuxtApp()
  return (await $http.get('/warehouse-cart-tasks', { params: query })) as WarehouseCartTaskListResult
}

export async function releaseWarehouseCartTask(
  input: ReleaseWarehouseCartTaskInput,
): Promise<WarehouseCartTask> {
  const { $http } = useNuxtApp()
  return (await $http.post('/warehouse-cart-tasks/release', input)) as WarehouseCartTask
}

export async function fetchWarehouseCartTaskOperators(): Promise<WarehouseCartTaskOperatorOption[]> {
  const { $http } = useNuxtApp()
  return (await $http.get('/warehouse-cart-tasks/operators')) as WarehouseCartTaskOperatorOption[]
}
