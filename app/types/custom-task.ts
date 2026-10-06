// What a scanned code resolves to: exactly the RCS task order that would be
// sent, so the confirmation screen and the submit cannot disagree.
export interface CustomTaskPreview {
  controlTaskId: string
  code: string
  name: string
  route: string[]
  taskPath: string
  modelProcessCode: string
  fromSystem: string
  priority: number
}

export interface ReleasedCustomTask extends CustomTaskPreview {
  /** The code followed by %Y%m%d%H%M%S — what RCS and the webhooks call it. */
  orderId: string
  /**
   * The history row this release created, so the scan page can cancel it
   * on the spot. Null if the row could not be saved — the task is running
   * either way, there is just nothing to cancel through.
   */
  runId: string | null
  releasedAt: string
}

// One Custom Task actually dispatched to RCS — the All Tasks > Custom Tasks
// history. The Control Task fields are a snapshot taken at release time, so
// they keep describing what was sent even if that Control Task is later
// edited or deleted.
export interface CustomTaskRun {
  id: string
  orderId: string
  controlTaskId: string | null
  code: string
  name: string
  taskPath: string
  modelProcessCode: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
  /** Set when an operator cancelled it; `status` is FAILED alongside this. */
  cancelledAt: string | null
  robot: { id: string, name: string } | null
  operator: { id: string, fullName: string }
  createdAt: string
  updatedAt: string
}

export type CustomTaskRunSortBy = 'createdAt' | 'code' | 'name'
export type CustomTaskRunSortOrder = 'asc' | 'desc'

export interface CustomTaskRunQuery {
  page?: number
  limit?: number
  search?: string
  status?: CustomTaskRun['status']
  /** Single calendar day, YYYY-MM-DD. */
  date?: string
  sortBy?: CustomTaskRunSortBy
  sortOrder?: CustomTaskRunSortOrder
}

export interface CustomTaskRunListMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface CustomTaskRunListResult {
  items: CustomTaskRun[]
  meta: CustomTaskRunListMeta
}
