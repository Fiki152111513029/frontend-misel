export interface QuarantineLine {
  id: string
  name: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface CreateQuarantineLineInput {
  name: string
  isActive?: boolean
}

export type UpdateQuarantineLineInput = Partial<CreateQuarantineLineInput>

export type QuarantineLineSortBy = 'name' | 'createdAt'
export type QuarantineLineSortOrder = 'asc' | 'desc'

export interface QuarantineLineQuery {
  page?: number
  limit?: number
  search?: string
  sortBy?: QuarantineLineSortBy
  sortOrder?: QuarantineLineSortOrder
}

export interface QuarantineLineListMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface QuarantineLineListResult {
  items: QuarantineLine[]
  meta: QuarantineLineListMeta
}
