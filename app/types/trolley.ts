export type TrolleyStatus = 'FULL' | 'EMPTY'

export interface Trolley {
  id: string
  name: string
  code: string
  status: TrolleyStatus
  trolleyCategoryId: string | null
  category: { id: string, name: string } | null
  droppingLocationCode: string | null
  modelCodeProcessId: string | null
  modelCodeProcess: { id: string, name: string } | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface CreateTrolleyInput {
  name: string
  code: string
  status?: TrolleyStatus
  trolleyCategoryId?: string
  droppingLocationCode?: string
  modelCodeProcessId?: string
}

export type UpdateTrolleyInput = Partial<CreateTrolleyInput>

export type TrolleySortBy = 'name' | 'createdAt'
export type TrolleySortOrder = 'asc' | 'desc'

export interface TrolleyQuery {
  page?: number
  limit?: number
  search?: string
  sortBy?: TrolleySortBy
  sortOrder?: TrolleySortOrder
}

export interface TrolleyListMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface TrolleyListResult {
  items: Trolley[]
  meta: TrolleyListMeta
}
