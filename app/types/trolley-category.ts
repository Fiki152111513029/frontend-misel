export interface TrolleyCategory {
  id: string
  name: string
  modelCodeProcessId: string | null
  modelCodeProcess: { id: string, name: string } | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface CreateTrolleyCategoryInput {
  name: string
  modelCodeProcessId?: string
}

export type UpdateTrolleyCategoryInput = Partial<CreateTrolleyCategoryInput>

export type TrolleyCategorySortBy = 'name' | 'createdAt'
export type TrolleyCategorySortOrder = 'asc' | 'desc'

export interface TrolleyCategoryQuery {
  page?: number
  limit?: number
  search?: string
  sortBy?: TrolleyCategorySortBy
  sortOrder?: TrolleyCategorySortOrder
}

export interface TrolleyCategoryListMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface TrolleyCategoryListResult {
  items: TrolleyCategory[]
  meta: TrolleyCategoryListMeta
}
