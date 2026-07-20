export type BoxTypeFromSystem = 'MES' | 'WMS'

export interface BoxType {
  id: string
  name: string
  ordering: number
  colorCode: string
  modelProcessCode: string
  fromSystem: BoxTypeFromSystem
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface CreateBoxTypeInput {
  name: string
  ordering: number
  colorCode: string
  modelProcessCode: string
  fromSystem: BoxTypeFromSystem
}

export type UpdateBoxTypeInput = Partial<CreateBoxTypeInput>

export type BoxTypeSortBy = 'name' | 'ordering' | 'createdAt'
export type BoxTypeSortOrder = 'asc' | 'desc'

export interface BoxTypeQuery {
  page?: number
  limit?: number
  search?: string
  sortBy?: BoxTypeSortBy
  sortOrder?: BoxTypeSortOrder
}

export interface BoxTypeListMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface BoxTypeListResult {
  items: BoxType[]
  meta: BoxTypeListMeta
}
