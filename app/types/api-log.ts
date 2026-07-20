export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface ApiLog {
  id: string
  createdAt: string
  method: HttpMethod
  endpoint: string
  statusCode: number
  durationMs: number
  requestPayload: Record<string, unknown>
  responsePayload: Record<string, unknown>
}

export type ApiLogSortBy = 'createdAt' | 'method' | 'endpoint' | 'statusCode' | 'durationMs'
export type ApiLogSortOrder = 'asc' | 'desc'

export interface ApiLogQuery {
  page?: number
  limit?: number
  dateFrom?: string
  dateTo?: string
  sortBy?: ApiLogSortBy
  sortOrder?: ApiLogSortOrder
}
