export interface AvailableOperator {
  id: string
  username: string
}

export interface WarehouseOperatorLocation {
  id: string
  name: string
  locationCode: string
  operatorId: string
  operator: AvailableOperator
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface CreateWarehouseOperatorLocationInput {
  name: string
  locationCode: string
  operatorId: string
}

export type UpdateWarehouseOperatorLocationInput = Partial<CreateWarehouseOperatorLocationInput>

export type WarehouseOperatorLocationSortBy = 'name' | 'createdAt'
export type WarehouseOperatorLocationSortOrder = 'asc' | 'desc'

export interface WarehouseOperatorLocationQuery {
  page?: number
  limit?: number
  search?: string
  sortBy?: WarehouseOperatorLocationSortBy
  sortOrder?: WarehouseOperatorLocationSortOrder
}

export interface WarehouseOperatorLocationListMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface WarehouseOperatorLocationListResult {
  items: WarehouseOperatorLocation[]
  meta: WarehouseOperatorLocationListMeta
}
