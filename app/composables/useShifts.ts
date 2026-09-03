import * as shiftService from '~/services/shift.service'
import { ApiError } from '~/types/api'
import type { CreateShiftInput, Shift, ShiftQuery, UpdateShiftInput } from '~/types/shift'

export function useShifts() {
  const store = useShiftsStore()
  const toast = useToast()

  async function fetchShifts(query?: Partial<ShiftQuery>) {
    if (query) store.setFilters(query)
    try {
      await store.loadShifts()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to load shifts')
    }
  }

  async function createShift(input: CreateShiftInput) {
    try {
      await store.addShift(input)
      toast.success('Shift created successfully')
      await fetchShifts()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to create shift')
      return false
    }
  }

  async function updateShift(id: string, input: UpdateShiftInput) {
    try {
      await store.editShift(id, input)
      toast.success('Shift updated successfully')
      await fetchShifts()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to update shift')
      return false
    }
  }

  async function deleteShift(id: string) {
    try {
      await store.removeShift(id)
      toast.success('Shift deleted successfully')
      await fetchShifts()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to delete shift')
      return false
    }
  }

  return {
    items: computed(() => store.items),
    meta: computed(() => store.meta),
    loading: computed(() => store.loading),
    filters: computed(() => store.filters),
    fetchShifts,
    createShift,
    updateShift,
    deleteShift,
    setFilters: store.setFilters,
  }
}

// Flat, unpaginated list — used to populate the Shift dropdown on the User
// form, same convention as useRoles()'s flat list.
export function useShiftOptions() {
  const toast = useToast()
  const items = ref<Shift[]>([])

  async function fetchShiftOptions() {
    try {
      items.value = await shiftService.fetchAllShifts()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to load shifts')
    }
  }

  return { items, fetchShiftOptions }
}
