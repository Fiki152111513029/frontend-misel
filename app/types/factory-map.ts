export interface FactoryMap {
  id: string
  name: string
  /** The areaId Robots in this area use to talk to the AMR fleet API. Null on maps that predate this field. */
  areaNumber: number | null
  /** Null if this map has no floor-plan raster — some maps are topology-only. */
  imageUrl: string | null
  topologyUrl: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  /** Only present on the create response — what got imported from the topology file's nodes. Null if that import itself errored (the map was still saved). */
  locationSync?: TopologySyncResult | null
}

export type RackTarget = 'PRODUCTION' | 'WAREHOUSE'

export interface RackAssignment {
  code: string
  target: RackTarget
}

export interface LocationSyncSummary {
  created: number
  skipped: number
  failed: number
  errors: { code: string, error: string }[]
}

export interface TopologySyncResult {
  chargerAreas: LocationSyncSummary
  parkingAreas: LocationSyncSummary
  productionLocations: LocationSyncSummary
  warehouseLocations: LocationSyncSummary
}

export interface CreateFactoryMapInput {
  name: string
  areaNumber: number
  imageFile?: File
  topologyFile: File
  /** Which Production/Warehouse Location each type-1 rack in the topology becomes. Racks not listed aren't imported. */
  rackAssignments?: RackAssignment[]
}

export interface UpdateFactoryMapInput {
  name?: string
  areaNumber?: number
  imageFile?: File
  topologyFile?: File
}

/** What the Add/Edit dialog emits — rackAssignments only ever applies when creating. */
export interface FactoryMapFormInput extends UpdateFactoryMapInput {
  rackAssignments?: RackAssignment[]
}

export type FactoryMapSortBy = 'name' | 'createdAt'
export type FactoryMapSortOrder = 'asc' | 'desc'

export interface FactoryMapQuery {
  page?: number
  limit?: number
  search?: string
  sortBy?: FactoryMapSortBy
  sortOrder?: FactoryMapSortOrder
}

export interface FactoryMapListMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface FactoryMapListResult {
  items: FactoryMap[]
  meta: FactoryMapListMeta
}
