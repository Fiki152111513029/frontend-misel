export interface WarehouseLineLocationModelCodeProcessRef {
  id: string
  name: string
}

export interface WarehouseLineLocation {
  id: string
  name: string
  droppingLocationCode: string
  pickingLocationCode: string
  modelCodeProcessId: string | null
  modelCodeProcess: WarehouseLineLocationModelCodeProcessRef | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface CreateWarehouseLineLocationInput {
  name: string
  droppingLocationCode: string
  pickingLocationCode: string
  modelCodeProcessId?: string
}

export type UpdateWarehouseLineLocationInput = Partial<CreateWarehouseLineLocationInput>

export type WarehouseLineLocationSortBy = 'name' | 'createdAt'
export type WarehouseLineLocationSortOrder = 'asc' | 'desc'

export interface WarehouseLineLocationQuery {
  page?: number
  limit?: number
  search?: string
  sortBy?: WarehouseLineLocationSortBy
  sortOrder?: WarehouseLineLocationSortOrder
}

export interface WarehouseLineLocationListMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface WarehouseLineLocationListResult {
  items: WarehouseLineLocation[]
  meta: WarehouseLineLocationListMeta
}
