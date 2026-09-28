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

// One day's task counts, bucketed from RCS's own order `status` on the
// task-status webhook payload (8 = Completed, 5/7 = Failed, 3 = Cancelled,
// 6 and the pick/place codes = In Progress, the rest = Not Start — see
// RCS_STATUS_BUCKET in the backend and the labels in utils/taskStatus.ts).
// One order counts once, under whichever status its most recent webhook
// call that day reported.
export interface TaskStatusSummary {
  notStarted: number
  inProgress: number
  completed: number
  failed: number
  cancelled: number
  /** Orders counted above — excludes any whose latest call carried no recognized `status`. */
  total: number
  /** Orders seen that day whose latest call had no (or an unrecognized) `status`. */
  unknown: number
}
