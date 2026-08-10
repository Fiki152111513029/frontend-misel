import type {
  CreateFactoryMapInput,
  FactoryMap,
  FactoryMapListResult,
  FactoryMapQuery,
  UpdateFactoryMapInput,
} from '~/types/factory-map'

export async function fetchFactoryMaps(query: FactoryMapQuery = {}): Promise<FactoryMapListResult> {
  const { $http } = useNuxtApp()
  return (await $http.get('/factory-maps', { params: query })) as FactoryMapListResult
}

export async function fetchFactoryMapById(id: string): Promise<FactoryMap> {
  const { $http } = useNuxtApp()
  return (await $http.get(`/factory-maps/${id}`)) as FactoryMap
}

export async function createFactoryMap(input: CreateFactoryMapInput): Promise<FactoryMap> {
  const { $http } = useNuxtApp()
  const formData = new FormData()
  formData.append('name', input.name)
  formData.append('areaNumber', String(input.areaNumber))
  if (input.imageFile) formData.append('image', input.imageFile)
  formData.append('topology', input.topologyFile)
  return (await $http.post('/factory-maps', formData)) as FactoryMap
}

export async function updateFactoryMap(id: string, input: UpdateFactoryMapInput): Promise<FactoryMap> {
  const { $http } = useNuxtApp()
  const formData = new FormData()
  if (input.name !== undefined) formData.append('name', input.name)
  if (input.areaNumber !== undefined) formData.append('areaNumber', String(input.areaNumber))
  if (input.imageFile) formData.append('image', input.imageFile)
  if (input.topologyFile) formData.append('topology', input.topologyFile)
  return (await $http.put(`/factory-maps/${id}`, formData)) as FactoryMap
}

export async function deleteFactoryMap(id: string): Promise<null> {
  const { $http } = useNuxtApp()
  return (await $http.delete(`/factory-maps/${id}`)) as null
}

// Real location codes (Quarantine Areas, EXIM Locations, Empty Pallet
// Locations, Production Line Areas) — used to filter which topology nodes
// get a marker on the Factory Map, instead of every alphanumeric-looking node.
export async function fetchLocationCodes(): Promise<string[]> {
  const { $http } = useNuxtApp()
  return (await $http.get('/factory-maps/location-codes')) as string[]
}
