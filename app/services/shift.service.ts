import type {
  Shift,
  ShiftListResult,
  ShiftQuery,
  CreateShiftInput,
  UpdateShiftInput,
} from '~/types/shift'

export async function fetchShifts(query: ShiftQuery = {}): Promise<ShiftListResult> {
  const { $http } = useNuxtApp()
  return (await $http.get('/shifts', {
    params: query,
  })) as ShiftListResult
}

export async function fetchShift(id: string): Promise<Shift> {
  const { $http } = useNuxtApp()
  return (await $http.get(`/shifts/${id}`)) as Shift
}

export async function createShift(input: CreateShiftInput): Promise<Shift> {
  const { $http } = useNuxtApp()
  return (await $http.post('/shifts', input)) as Shift
}

export async function updateShift(id: string, input: UpdateShiftInput): Promise<Shift> {
  const { $http } = useNuxtApp()
  return (await $http.put(`/shifts/${id}`, input)) as Shift
}

export async function deleteShift(id: string): Promise<null> {
  const { $http } = useNuxtApp()
  return (await $http.delete(`/shifts/${id}`)) as null
}

// Fetches "all" shifts in one page — used to populate the Shift dropdown on
// the User form, same convention as useRoles()'s flat, unpaginated list.
export async function fetchAllShifts(): Promise<Shift[]> {
  const result = await fetchShifts({ page: 1, limit: 1000, sortBy: 'name', sortOrder: 'asc' })
  return result.items
}

// Which Shift is actually running right now (accounts for the weekly A/B
// rotation server-side) — used to default/auto-follow the shift filter on
// AMR Performance and Trolley Activities charts. Null if no active shift's
// window currently contains "now".
export async function fetchCurrentShiftId(): Promise<string | null> {
  const { $http } = useNuxtApp()
  const result = (await $http.get('/shifts/current')) as { shiftId: string | null }
  return result.shiftId
}
