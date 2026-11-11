export interface WarehouseLocation {
  id: string
  name: string
  iRaypleLocationCode: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface CreateWarehouseLocationInput {
  name: string
  iRaypleLocationCode: string
  isActive?: boolean
}

export type UpdateWarehouseLocationInput = Partial<CreateWarehouseLocationInput>

export type WarehouseLocationSortBy = 'name' | 'createdAt'
export type WarehouseLocationSortOrder = 'asc' | 'desc'

export interface WarehouseLocationQuery {
  page?: number
  limit?: number
  search?: string
  sortBy?: WarehouseLocationSortBy
  sortOrder?: WarehouseLocationSortOrder
}

export interface WarehouseLocationListMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

/** What a bulk delete actually did. See the backend use-case for why it reports rather than refuses. */
export interface BulkDeleteWarehouseLocationsResult {
  deleted: number
  /** Ids that matched nothing — already deleted, or never there. */
  missing: number
}

export interface WarehouseLocationListResult {
  items: WarehouseLocation[]
  meta: WarehouseLocationListMeta
}
