export interface TrolleyType {
  id: string
  name: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface CreateTrolleyTypeInput {
  name: string
  isActive?: boolean
}

export type UpdateTrolleyTypeInput = Partial<CreateTrolleyTypeInput>

export type TrolleyTypeSortBy = 'name' | 'createdAt'
export type TrolleyTypeSortOrder = 'asc' | 'desc'

export interface TrolleyTypeQuery {
  page?: number
  limit?: number
  search?: string
  sortBy?: TrolleyTypeSortBy
  sortOrder?: TrolleyTypeSortOrder
}

export interface TrolleyTypeListMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface TrolleyTypeListResult {
  items: TrolleyType[]
  meta: TrolleyTypeListMeta
}
