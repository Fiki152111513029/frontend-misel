export interface QuarantineArea {
  id: string
  name: string
  iRaypleLocationCode: string
  quarantineLineId: string
  quarantineLine: {
    id: string
    name: string
  }
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface CreateQuarantineAreaInput {
  name: string
  iRaypleLocationCode: string
  quarantineLineId: string
}

export type UpdateQuarantineAreaInput = Partial<CreateQuarantineAreaInput>

export type QuarantineAreaSortBy = 'name' | 'createdAt'
export type QuarantineAreaSortOrder = 'asc' | 'desc'

export interface QuarantineAreaQuery {
  page?: number
  limit?: number
  search?: string
  sortBy?: QuarantineAreaSortBy
  sortOrder?: QuarantineAreaSortOrder
}

export interface QuarantineAreaListMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface QuarantineAreaListResult {
  items: QuarantineArea[]
  meta: QuarantineAreaListMeta
}
