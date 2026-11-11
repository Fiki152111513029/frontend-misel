export interface ProductionLocation {
  id: string
  name: string
  iRaypleLocationCode: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface CreateProductionLocationInput {
  name: string
  iRaypleLocationCode: string
  isActive?: boolean
}

export type UpdateProductionLocationInput = Partial<CreateProductionLocationInput>

export type ProductionLocationSortBy = 'name' | 'createdAt'
export type ProductionLocationSortOrder = 'asc' | 'desc'

export interface ProductionLocationQuery {
  page?: number
  limit?: number
  search?: string
  sortBy?: ProductionLocationSortBy
  sortOrder?: ProductionLocationSortOrder
}

export interface ProductionLocationListMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

/** What a bulk delete actually did. See the backend use-case for why it reports rather than refuses. */
export interface BulkDeleteProductionLocationsResult {
  deleted: number
  /** Ids that matched nothing — already deleted, or never there. */
  missing: number
}

export interface ProductionLocationListResult {
  items: ProductionLocation[]
  meta: ProductionLocationListMeta
}
