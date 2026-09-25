import type {
  CreateRackInput,
  Rack,
  RackListResult,
  RackQuery,
  UpdateRackInput,
} from '~/types/rack'

export async function fetchRacks(query: RackQuery = {}): Promise<RackListResult> {
  const { $http } = useNuxtApp()
  return (await $http.get('/racks', { params: query })) as RackListResult
}

export async function fetchRack(id: string): Promise<Rack> {
  const { $http } = useNuxtApp()
  return (await $http.get(`/racks/${id}`)) as Rack
}

export async function createRack(input: CreateRackInput): Promise<Rack> {
  const { $http } = useNuxtApp()
  return (await $http.post('/racks', input)) as Rack
}

export async function updateRack(id: string, input: UpdateRackInput): Promise<Rack> {
  const { $http } = useNuxtApp()
  return (await $http.put(`/racks/${id}`, input)) as Rack
}

export async function deleteRack(id: string): Promise<null> {
  const { $http } = useNuxtApp()
  return (await $http.delete(`/racks/${id}`)) as null
}
