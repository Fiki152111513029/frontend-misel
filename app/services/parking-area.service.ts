import type {
  ParkingArea,
  ParkingAreaListResult,
  ParkingAreaQuery,
  CreateParkingAreaInput,
  UpdateParkingAreaInput,
} from '~/types/parking-area'

export async function fetchParkingAreas(
  query: ParkingAreaQuery = {},
): Promise<ParkingAreaListResult> {
  const { $http } = useNuxtApp()
  return (await $http.get('/parking-areas', {
    params: query,
  })) as ParkingAreaListResult
}

export async function fetchParkingArea(id: string): Promise<ParkingArea> {
  const { $http } = useNuxtApp()
  return (await $http.get(`/parking-areas/${id}`)) as ParkingArea
}

export async function createParkingArea(
  input: CreateParkingAreaInput,
): Promise<ParkingArea> {
  const { $http } = useNuxtApp()
  return (await $http.post('/parking-areas', input)) as ParkingArea
}

export async function updateParkingArea(
  id: string,
  input: UpdateParkingAreaInput,
): Promise<ParkingArea> {
  const { $http } = useNuxtApp()
  return (await $http.put(`/parking-areas/${id}`, input)) as ParkingArea
}

export async function deleteParkingArea(id: string): Promise<null> {
  const { $http } = useNuxtApp()
  return (await $http.delete(`/parking-areas/${id}`)) as null
}
