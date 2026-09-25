import * as rackService from '~/services/rack.service'
import { ApiError } from '~/types/api'
import type {
  CreateRackInput,
  Rack,
  RackListMeta,
  RackQuery,
  UpdateRackInput,
} from '~/types/rack'

export const useRacksStore = defineStore('racks', () => {
  const items = ref<Rack[]>([])
  const meta = ref<RackListMeta>({ total: 0, page: 1, limit: 10, totalPages: 0 })
  const loading = ref(false)
  const error = ref<string | null>(null)
  const filters = ref<RackQuery>({
    page: 1,
    limit: 10,
    search: '',
    sortBy: 'name',
    sortOrder: 'asc',
  })

  async function loadRacks() {
    loading.value = true
    error.value = null
    try {
      const result = await rackService.fetchRacks(filters.value)
      items.value = result.items
      meta.value = result.meta
    } catch (e) {
      error.value = e instanceof ApiError ? e.message : 'Failed to load racks'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function addRack(input: CreateRackInput) {
    return rackService.createRack(input)
  }

  async function editRack(id: string, input: UpdateRackInput) {
    return rackService.updateRack(id, input)
  }

  async function removeRack(id: string) {
    return rackService.deleteRack(id)
  }

  function setFilters(patch: Partial<RackQuery>) {
    filters.value = { ...filters.value, ...patch }
  }

  return {
    items,
    meta,
    loading,
    error,
    filters,
    loadRacks,
    addRack,
    editRack,
    removeRack,
    setFilters,
  }
})
