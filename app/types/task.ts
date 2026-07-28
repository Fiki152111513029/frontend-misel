export type TaskAction = 'AMBIL_FG' | 'NOT_STANDARD'
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'

export interface TaskNamedRef {
  id: string
  name: string
}

export interface TaskProductionLineRef extends TaskNamedRef {
  quarantineLine: TaskNamedRef
}

export interface TaskOperatorRef {
  id: string
  username: string
  fullName: string
}

export interface Task {
  id: string
  taskId: string
  taskAction: TaskAction
  taskPath: string
  // Our own lifecycle status, unless overridden by the live RCS OrderStatus
  // value when a matching order is found — that value's shape isn't ours to
  // constrain, so this accepts any string beyond the known TaskStatus set.
  status: TaskStatus | string
  productionLineId: string
  productionLine: TaskProductionLineRef
  productionLineAreaId: string | null
  productionLineArea: TaskNamedRef | null
  quarantineAreaId: string | null
  quarantineArea: TaskNamedRef | null
  boxTypeId: string
  boxType: TaskNamedRef
  robotId: string | null
  robot: TaskNamedRef | null
  operatorId: string
  operator: TaskOperatorRef
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface ReleaseTaskInput {
  productionLineAreaId: string
  boxTypeId: string
  taskAction: TaskAction
}

export interface RcsOrderRequest {
  modelProcessCode: string
  priority: number
  fromSystem: string
  orderId: string
  taskOrderDetail: { taskPath: string }[]
}

export interface ReleaseTaskResult {
  task: Task
  // Null when an older backend returned the Task directly without the RCS
  // exchange — see services/task.service.ts.
  rcsRequest: RcsOrderRequest | null
  // Shape is whatever the RCS system returns — not ours to constrain.
  rcsResponse: unknown
}

export interface ReleaseQuarantineTaskResult {
  rcsRequest: RcsOrderRequest
  rcsResponse: unknown
}

export type TaskSortBy = 'createdAt'
export type TaskSortOrder = 'asc' | 'desc'

export interface TaskQuery {
  page?: number
  limit?: number
  sortBy?: TaskSortBy
  sortOrder?: TaskSortOrder
  dateFrom?: string
  dateTo?: string
  operatorId?: string
  status?: TaskStatus
  taskAction?: TaskAction
  activeOnly?: boolean
}

export interface TaskOperatorOption {
  id: string
  username: string
  fullName: string
}

export interface TaskListMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface TaskListResult {
  items: Task[]
  meta: TaskListMeta
}
