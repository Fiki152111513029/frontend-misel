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

export interface LocationCodesResult {
  codes: string[]
  chargerCodes: string[]
  warehouseLocationStatuses: { code: string, status: 'EMPTY' | 'FULL' }[]
}

// Real location codes (Quarantine Areas, EXIM Locations, Empty Pallet
// Locations, Production Line Areas, Charger Areas) — used to filter which
// topology nodes get a marker on the Factory Map, instead of every
// alphanumeric-looking node. `chargerCodes` is the Charger Area subset, used
// to pick which icon a matched node gets. `warehouseLocationStatuses` is our
// own DB's occupancy tracking — kept for reference, but the Factory Map's
// node icons are now driven by fetchStockStatus() (live off RCS) instead.
export async function fetchLocationCodes(): Promise<LocationCodesResult> {
  const { $http } = useNuxtApp()
  return (await $http.get('/factory-maps/location-codes')) as LocationCodesResult
}

export interface StockStatusEntry {
  code: string
  status: 'EMPTY' | 'FULL'
}

// Live full/empty status per Warehouse/Production Location node, straight
// off RCS's own getStockStatus for the given area — the Factory Map's node
// icons (full/empty-trolley) are driven by this, not our own DB.
export async function fetchStockStatus(areaId: number): Promise<StockStatusEntry[]> {
  const { $http } = useNuxtApp()
  return (await $http.get('/factory-maps/stock-status', {
    params: { areaId },
  })) as StockStatusEntry[]
}
