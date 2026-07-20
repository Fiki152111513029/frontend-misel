export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface WebhookLog {
  id: string
  createdAt: string
  method: HttpMethod
  endpoint: string
  requestPayload: Record<string, unknown>
  responsePayload: Record<string, unknown>
}

export type WebhookLogSortBy = 'createdAt' | 'method' | 'endpoint'
export type WebhookLogSortOrder = 'asc' | 'desc'

export interface WebhookLogQuery {
  page?: number
  limit?: number
  dateFrom?: string
  dateTo?: string
  sortBy?: WebhookLogSortBy
  sortOrder?: WebhookLogSortOrder
}
