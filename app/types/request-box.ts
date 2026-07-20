export interface RequestBoxProductionLineRef {
  id: string
  name: string
}

export interface RequestBoxBoxTypeRef {
  id: string
  name: string
  colorCode: string
}

export interface RequestBox {
  id: string
  productionLineId: string
  productionLine: RequestBoxProductionLineRef
  boxTypeId: string
  boxType: RequestBoxBoxTypeRef
  qty: number
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface CreateRequestBoxInput {
  productionLineId: string
  boxTypeId: string
  qty: number
}

export type RequestBoxSortBy = 'createdAt' | 'qty'
export type RequestBoxSortOrder = 'asc' | 'desc'

export interface RequestBoxQuery {
  page?: number
  limit?: number
  sortBy?: RequestBoxSortBy
  sortOrder?: RequestBoxSortOrder
}

export interface RequestBoxListMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface RequestBoxListResult {
  items: RequestBox[]
  meta: RequestBoxListMeta
}
