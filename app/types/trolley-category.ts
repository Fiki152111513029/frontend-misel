export interface TrolleyCategory {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface CreateTrolleyCategoryInput {
  name: string
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
