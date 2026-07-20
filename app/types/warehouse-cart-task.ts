export type WarehouseCartTaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'

export interface WarehouseCartTaskNamedRef {
  id: string
  name: string
}

export interface WarehouseCartTaskOperatorRef {
  id: string
  username: string
  fullName: string
}

export interface WarehouseCartTask {
  id: string
  taskId: string
  taskPath: string
  // Our own lifecycle status — the ICS/RCS fleet server is not polled for
  // live overrides here (unlike Mainline's Task list), so this only ever
  // reflects what we recorded at release time.
  status: WarehouseCartTaskStatus | string
  warehouseLineLocationId: string
  warehouseLineLocation: WarehouseCartTaskNamedRef
  modelCodeProcessId: string
  modelCodeProcess: WarehouseCartTaskNamedRef
  robotId: string | null
  robot: WarehouseCartTaskNamedRef | null
  operatorId: string
  operator: WarehouseCartTaskOperatorRef
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface ReleaseWarehouseCartTaskInput {
  warehouseLineLocationId: string
}

export type WarehouseCartTaskSortBy = 'createdAt'
export type WarehouseCartTaskSortOrder = 'asc' | 'desc'

export interface WarehouseCartTaskQuery {
  page?: number
  limit?: number
  sortBy?: WarehouseCartTaskSortBy
  sortOrder?: WarehouseCartTaskSortOrder
}

export interface WarehouseCartTaskListMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface WarehouseCartTaskListResult {
  items: WarehouseCartTask[]
  meta: WarehouseCartTaskListMeta
}
