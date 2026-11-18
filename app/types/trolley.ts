export type TrolleyStatus = 'FULL' | 'EMPTY'

export interface Trolley {
  id: string
  name: string
  code: string
  status: TrolleyStatus
  trolleyTypeId: string
  type: { id: string, name: string }
  trolleyCategoryId: string | null
  category: { id: string, name: string } | null
  droppingLocationCode: string | null
  /**
   * An optional stop between the scanned pickup and the dropping point.
   *
   * Set, a Warehouse Trolley Task goes out as three legs instead of two
   * and the AMR waits here until the Model Code Process timer releases it.
   * Null and nothing changes.
   */
  transitLocationCode: string | null
  modelCodeProcessId: string | null
  modelCodeProcess: { id: string, name: string } | null
  customerId: string | null
  customer: { id: string, name: string } | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface CreateTrolleyInput {
  name: string
  code: string
  status?: TrolleyStatus
  trolleyTypeId: string
  trolleyCategoryId?: string
  droppingLocationCode?: string
  /** null clears the stop; omitted leaves it unchanged. */
  transitLocationCode?: string | null
  modelCodeProcessId?: string
  customerId?: string
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

/** What a bulk delete actually did. See the backend use-case for why it reports rather than refuses. */
export interface BulkDeleteTrolleysResult {
  deleted: number
  /** Ids that matched nothing - already deleted, or never there. */
  missing: number
}

export interface TrolleyListResult {
  items: Trolley[]
  meta: TrolleyListMeta
}
