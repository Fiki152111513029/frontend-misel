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

export interface ProductionLocationListResult {
  items: ProductionLocation[]
  meta: ProductionLocationListMeta
}
