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

export interface WebhookLogListMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface WebhookLogListResult {
  items: WebhookLog[]
  meta: WebhookLogListMeta
}

export interface LatestWebhookStatus {
  status: string | null
  subTaskSeq: string | null
  // ModelCodeProcess.statusComment{subTaskSeq} for the Model Code Process
  // actually used by this task — wording differs per process, so this is
  // resolved server-side rather than shown as a bare 1-8 number.
  statusComment: string | null
  receivedAt: string
}
