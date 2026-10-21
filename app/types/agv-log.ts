// One raw AGV report as RCS pushed it. Nothing is normalised out of the
// payload beyond deviceCode — the point of this table is to show exactly
// what arrived, including shapes we have not seen before.
export interface AgvLog {
  id: string
  method: string
  endpoint: string
  deviceCode: string | null
  requestPayload: Record<string, unknown>
  responsePayload: Record<string, unknown>
  createdAt: string
}

export interface AgvLogQuery {
  page?: number
  limit?: number
  deviceCode?: string
  /** Single calendar day, YYYY-MM-DD. */
  date?: string
}

export interface AgvLogListMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface AgvLogListResult {
  items: AgvLog[]
  meta: AgvLogListMeta
}
