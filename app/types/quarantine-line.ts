export interface QuarantineLineModelCodeProcessRef {
  id: string
  name: string
}

export interface QuarantineLine {
  id: string
  name: string
  isActive: boolean
  modelCodeProcessId: string | null
  modelCodeProcess: QuarantineLineModelCodeProcessRef | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface CreateQuarantineLineInput {
  name: string
  isActive?: boolean
  modelCodeProcessId?: string
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
