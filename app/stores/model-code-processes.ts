import * as modelCodeProcessService from '~/services/model-code-process.service'
import { ApiError } from '~/types/api'
import type {
  CreateModelCodeProcessInput,
  ModelCodeProcess,
  ModelCodeProcessListMeta,
  ModelCodeProcessQuery,
  UpdateModelCodeProcessInput,
} from '~/types/model-code-process'

export const useModelCodeProcessesStore = defineStore('model-code-processes', () => {
  const items = ref<ModelCodeProcess[]>([])
  const meta = ref<ModelCodeProcessListMeta>({ total: 0, page: 1, limit: 10, totalPages: 0 })
  const loading = ref(false)
  const error = ref<string | null>(null)
  const filters = ref<ModelCodeProcessQuery>({
    page: 1,
    limit: 10,
    search: '',
    sortBy: 'name',
    sortOrder: 'asc',
  })

  async function loadModelCodeProcesses() {
    loading.value = true
    error.value = null
    try {
      const result = await modelCodeProcessService.fetchModelCodeProcesses(filters.value)
      items.value = result.items
      meta.value = result.meta
    } catch (e) {
      error.value = e instanceof ApiError ? e.message : 'Failed to load model code processes'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function addModelCodeProcess(input: CreateModelCodeProcessInput) {
    return modelCodeProcessService.createModelCodeProcess(input)
  }

  async function editModelCodeProcess(id: string, input: UpdateModelCodeProcessInput) {
    return modelCodeProcessService.updateModelCodeProcess(id, input)
  }

  async function removeModelCodeProcess(id: string) {
    return modelCodeProcessService.deleteModelCodeProcess(id)
  }

  function setFilters(patch: Partial<ModelCodeProcessQuery>) {
    filters.value = { ...filters.value, ...patch }
  }

  return {
    items,
    meta,
    loading,
    error,
    filters,
    loadModelCodeProcesses,
    addModelCodeProcess,
    editModelCodeProcess,
    removeModelCodeProcess,
    setFilters,
  }
})
