export type ProductionLineAreaType = 'PRODUCTION' | 'STOCK'

export interface NamedRef {
  id: string
  name: string
}

export interface ProductionLineArea {
  id: string
  name: string
  type: ProductionLineAreaType
  iRaypleLocationCode: string
  productionLineId: string
  productionLine: NamedRef
  eximLocationId: string
  eximLocation: NamedRef
  emptyPalletLocationId: string
  emptyPalletLocation: NamedRef
  modelCodeProcessId: string | null
  modelCodeProcess: NamedRef | null
  order: number
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface CreateProductionLineAreaInput {
  name: string
  type: ProductionLineAreaType
  iRaypleLocationCode: string
  productionLineId: string
  eximLocationId: string
  emptyPalletLocationId: string
  modelCodeProcessId?: string
  order: number
}

export type UpdateProductionLineAreaInput = Partial<CreateProductionLineAreaInput>

export type ProductionLineAreaSortBy = 'name' | 'order' | 'createdAt'
export type ProductionLineAreaSortOrder = 'asc' | 'desc'

export interface ProductionLineAreaQuery {
  page?: number
  limit?: number
  search?: string
  sortBy?: ProductionLineAreaSortBy
  sortOrder?: ProductionLineAreaSortOrder
}

export interface ProductionLineAreaListMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ProductionLineAreaListResult {
  items: ProductionLineArea[]
  meta: ProductionLineAreaListMeta
}
