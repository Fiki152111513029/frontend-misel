export interface ProductionLineQuarantineLineRef {
  id: string
  name: string
}

export interface ProductionLineOperatorRef {
  id: string
  username: string
}

export interface ProductionLine {
  id: string
  name: string
  quarantineLineId: string
  quarantineLine: ProductionLineQuarantineLineRef
  operatorId: string
  operator: ProductionLineOperatorRef
  isActive: boolean
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface CreateProductionLineInput {
  name: string
  quarantineLineId: string
  operatorId: string
  isActive?: boolean
}

export type UpdateProductionLineInput = Partial<CreateProductionLineInput>

export type ProductionLineSortBy = 'name' | 'createdAt'
export type ProductionLineSortOrder = 'asc' | 'desc'

export interface ProductionLineQuery {
  page?: number
  limit?: number
  search?: string
  sortBy?: ProductionLineSortBy
  sortOrder?: ProductionLineSortOrder
}

export interface ProductionLineListMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ProductionLineListResult {
  items: ProductionLine[]
  meta: ProductionLineListMeta
}
