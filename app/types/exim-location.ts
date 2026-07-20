export interface EximLocation {
  id: string
  name: string
  iRaypleLocationCode: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface CreateEximLocationInput {
  name: string
  iRaypleLocationCode: string
  isActive?: boolean
}

export type UpdateEximLocationInput = Partial<CreateEximLocationInput>

export type EximLocationSortBy = 'name' | 'createdAt'
export type EximLocationSortOrder = 'asc' | 'desc'

export interface EximLocationQuery {
  page?: number
  limit?: number
  search?: string
  sortBy?: EximLocationSortBy
  sortOrder?: EximLocationSortOrder
}

export interface EximLocationListMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface EximLocationListResult {
  items: EximLocation[]
  meta: EximLocationListMeta
}
