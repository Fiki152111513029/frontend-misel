export interface ChargerArea {
  id: string
  name: string
  iRaypleLocationCode: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface CreateChargerAreaInput {
  name: string
  iRaypleLocationCode: string
  isActive?: boolean
}

export type UpdateChargerAreaInput = Partial<CreateChargerAreaInput>

export type ChargerAreaSortBy = 'name' | 'createdAt'
export type ChargerAreaSortOrder = 'asc' | 'desc'

export interface ChargerAreaQuery {
  page?: number
  limit?: number
  search?: string
  sortBy?: ChargerAreaSortBy
  sortOrder?: ChargerAreaSortOrder
}

export interface ChargerAreaListMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface ChargerAreaListResult {
  items: ChargerArea[]
  meta: ChargerAreaListMeta
}
