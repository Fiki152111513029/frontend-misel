export interface Customer {
  id: string
  name: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface CreateCustomerInput {
  name: string
  isActive?: boolean
}

export type UpdateCustomerInput = Partial<CreateCustomerInput>

export type CustomerSortBy = 'name' | 'createdAt'
export type CustomerSortOrder = 'asc' | 'desc'

export interface CustomerQuery {
  page?: number
  limit?: number
  search?: string
  sortBy?: CustomerSortBy
  sortOrder?: CustomerSortOrder
}

export interface CustomerListMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface CustomerListResult {
  items: Customer[]
  meta: CustomerListMeta
}
