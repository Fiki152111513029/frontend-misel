import * as shiftService from '~/services/shift.service'
import { ApiError } from '~/types/api'
import type {
  Shift,
  ShiftListMeta,
  ShiftQuery,
  CreateShiftInput,
  UpdateShiftInput,
} from '~/types/shift'

export const useShiftsStore = defineStore('shifts', () => {
  const items = ref<Shift[]>([])
  const meta = ref<ShiftListMeta>({ total: 0, page: 1, limit: 10, totalPages: 0 })
  const loading = ref(false)
  const error = ref<string | null>(null)
  const filters = ref<ShiftQuery>({
    page: 1,
    limit: 10,
    search: '',
    sortBy: 'name',
    sortOrder: 'asc',
  })

  async function loadShifts() {
    loading.value = true
    error.value = null
    try {
      const result = await shiftService.fetchShifts(filters.value)
      items.value = result.items
      meta.value = result.meta
    } catch (e) {
      error.value = e instanceof ApiError ? e.message : 'Failed to load shifts'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function addShift(input: CreateShiftInput) {
    return shiftService.createShift(input)
  }

  async function editShift(id: string, input: UpdateShiftInput) {
    return shiftService.updateShift(id, input)
  }

  async function removeShift(id: string) {
    return shiftService.deleteShift(id)
  }

  function setFilters(patch: Partial<ShiftQuery>) {
    filters.value = { ...filters.value, ...patch }
  }

  return {
    items,
    meta,
    loading,
    error,
    filters,
    loadShifts,
    addShift,
    editShift,
    removeShift,
    setFilters,
  }
})
