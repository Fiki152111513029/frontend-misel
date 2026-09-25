export type RackStatus = 'FULL' | 'EMPTY'

export interface Rack {
  id: string
  name: string
  status: RackStatus
  isActive: boolean
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface CreateRackInput {
  name: string
  status?: RackStatus
  isActive?: boolean
}

export type UpdateRackInput = Partial<CreateRackInput>

export type RackSortBy = 'name' | 'createdAt'
export type RackSortOrder = 'asc' | 'desc'

export interface RackQuery {
  page?: number
  limit?: number
  search?: string
  status?: RackStatus
  sortBy?: RackSortBy
  sortOrder?: RackSortOrder
}

export interface RackListMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface RackListResult {
  items: Rack[]
  meta: RackListMeta
}
