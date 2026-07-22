export type FromSystem = 'MES' | 'WMS'

export interface ModelCodeProcess {
  id: string
  name: string
  fromSystem: FromSystem
  isActive: boolean
  statusComment1: string
  statusComment2: string
  statusComment3: string
  statusComment4: string
  statusComment5: string
  statusComment6: string
  statusComment7: string
  statusComment8: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface CreateModelCodeProcessInput {
  name: string
  fromSystem: FromSystem
  isActive?: boolean
  statusComment1?: string
  statusComment2?: string
  statusComment3?: string
  statusComment4?: string
  statusComment5?: string
  statusComment6?: string
  statusComment7?: string
  statusComment8?: string
}

export type UpdateModelCodeProcessInput = Partial<CreateModelCodeProcessInput>

export type ModelCodeProcessSortBy = 'name' | 'createdAt'
export type ModelCodeProcessSortOrder = 'asc' | 'desc'

export interface ModelCodeProcessQuery {
  page?: number
  limit?: number
  search?: string
  sortBy?: ModelCodeProcessSortBy
  sortOrder?: ModelCodeProcessSortOrder
}

export interface ModelCodeProcessListMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ModelCodeProcessListResult {
  items: ModelCodeProcess[]
  meta: ModelCodeProcessListMeta
}
