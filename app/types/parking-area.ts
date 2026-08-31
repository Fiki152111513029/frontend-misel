export interface ParkingArea {
  id: string
  name: string
  iRaypleLocationCode: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface CreateParkingAreaInput {
  name: string
  iRaypleLocationCode: string
  isActive?: boolean
}

export type UpdateParkingAreaInput = Partial<CreateParkingAreaInput>

export type ParkingAreaSortBy = 'name' | 'createdAt'
export type ParkingAreaSortOrder = 'asc' | 'desc'

export interface ParkingAreaQuery {
  page?: number
  limit?: number
  search?: string
  sortBy?: ParkingAreaSortBy
  sortOrder?: ParkingAreaSortOrder
}

export interface ParkingAreaListMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface ParkingAreaListResult {
  items: ParkingArea[]
  meta: ParkingAreaListMeta
}
