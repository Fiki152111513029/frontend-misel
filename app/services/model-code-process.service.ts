import type {
  CreateModelCodeProcessInput,
  ModelCodeProcess,
  ModelCodeProcessListResult,
  ModelCodeProcessQuery,
  UpdateModelCodeProcessInput,
} from '~/types/model-code-process'

export async function fetchModelCodeProcesses(
  query: ModelCodeProcessQuery = {},
): Promise<ModelCodeProcessListResult> {
  const { $http } = useNuxtApp()
  return (await $http.get('/model-code-processes', {
    params: query,
  })) as ModelCodeProcessListResult
}

export async function fetchModelCodeProcess(id: string): Promise<ModelCodeProcess> {
  const { $http } = useNuxtApp()
  return (await $http.get(`/model-code-processes/${id}`)) as ModelCodeProcess
}

export async function createModelCodeProcess(
  input: CreateModelCodeProcessInput,
): Promise<ModelCodeProcess> {
  const { $http } = useNuxtApp()
  return (await $http.post('/model-code-processes', input)) as ModelCodeProcess
}

export async function updateModelCodeProcess(
  id: string,
  input: UpdateModelCodeProcessInput,
): Promise<ModelCodeProcess> {
  const { $http } = useNuxtApp()
  return (await $http.put(`/model-code-processes/${id}`, input)) as ModelCodeProcess
}

export async function deleteModelCodeProcess(id: string): Promise<null> {
  const { $http } = useNuxtApp()
  return (await $http.delete(`/model-code-processes/${id}`)) as null
}
