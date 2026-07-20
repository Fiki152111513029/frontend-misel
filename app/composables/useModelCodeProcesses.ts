import { fetchModelCodeProcess as fetchModelCodeProcessSvc } from '~/services/model-code-process.service'
import { ApiError } from '~/types/api'
import type {
  CreateModelCodeProcessInput,
  ModelCodeProcessQuery,
  UpdateModelCodeProcessInput,
} from '~/types/model-code-process'

export function useModelCodeProcesses() {
  const store = useModelCodeProcessesStore()
  const toast = useToast()

  async function fetchModelCodeProcesses(query?: Partial<ModelCodeProcessQuery>) {
    if (query) store.setFilters(query)
    try {
      await store.loadModelCodeProcesses()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to load model code processes')
    }
  }

  async function fetchModelCodeProcess(id: string) {
    try {
      return await fetchModelCodeProcessSvc(id)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to load model code process')
      return null
    }
  }

  async function createModelCodeProcess(input: CreateModelCodeProcessInput) {
    try {
      await store.addModelCodeProcess(input)
      toast.success('Model Code Process created successfully')
      await fetchModelCodeProcesses()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to create model code process')
      return false
    }
  }

  async function updateModelCodeProcess(id: string, input: UpdateModelCodeProcessInput) {
    try {
      await store.editModelCodeProcess(id, input)
      toast.success('Model Code Process updated successfully')
      await fetchModelCodeProcesses()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to update model code process')
      return false
    }
  }

  async function deleteModelCodeProcess(id: string) {
    try {
      await store.removeModelCodeProcess(id)
      toast.success('Model Code Process deleted successfully')
      await fetchModelCodeProcesses()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to delete model code process')
      return false
    }
  }

  return {
    items: computed(() => store.items),
    meta: computed(() => store.meta),
    loading: computed(() => store.loading),
    filters: computed(() => store.filters),
    fetchModelCodeProcesses,
    fetchModelCodeProcess,
    createModelCodeProcess,
    updateModelCodeProcess,
    deleteModelCodeProcess,
    setFilters: store.setFilters,
  }
}
