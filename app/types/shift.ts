export interface Shift {
  id: string
  name: string
  startTime: string
  endTime: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateShiftInput {
  name: string
  startTime: string
  endTime: string
  isActive?: boolean
}

export type UpdateShiftInput = Partial<CreateShiftInput>

export type ShiftSortBy = 'name' | 'createdAt'
export type ShiftSortOrder = 'asc' | 'desc'

export interface ShiftQuery {
  page?: number
  limit?: number
  search?: string
  sortBy?: ShiftSortBy
  sortOrder?: ShiftSortOrder
}

export interface ShiftListMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface ShiftListResult {
  items: Shift[]
  meta: ShiftListMeta
}
