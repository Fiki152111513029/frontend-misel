export interface EmptyPalletLocation {
  id: string
  name: string
  iRaypleLocationCode: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface CreateEmptyPalletLocationInput {
  name: string
  iRaypleLocationCode: string
  isActive?: boolean
}

export type UpdateEmptyPalletLocationInput = Partial<CreateEmptyPalletLocationInput>

export type EmptyPalletLocationSortBy = 'name' | 'createdAt'
export type EmptyPalletLocationSortOrder = 'asc' | 'desc'

export interface EmptyPalletLocationQuery {
  page?: number
  limit?: number
  search?: string
  sortBy?: EmptyPalletLocationSortBy
  sortOrder?: EmptyPalletLocationSortOrder
}

export interface EmptyPalletLocationListMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface EmptyPalletLocationListResult {
  items: EmptyPalletLocation[]
  meta: EmptyPalletLocationListMeta
}
