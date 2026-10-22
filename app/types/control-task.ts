export interface ControlTaskModelCodeProcess {
  id: string
  name: string
  fromSystem: string
}

/** An operator this task was registered to. */
export interface ControlTaskAssignee {
  user: { id: string, username: string, fullName: string }
}

export interface ControlTask {
  id: string
  code: string
  name: string
  /** Heading it sits under in the Custom Task picker. Null = "Other". */
  groupName: string | null
  /** Button colour in Custom Task as #RRGGBB. Null = the default blue. */
  colorCode: string | null
  modelCodeProcessId: string
  modelCodeProcess: ControlTaskModelCodeProcess | null
  /** The legs in the order the operator chose — repeats are allowed. */
  route: string[]
  /** `route` joined with "," — the shape the RCS task order expects. */
  taskPath: string
  isActive: boolean
  /** Who may dispatch it from Custom Task. Empty = picker shows it to nobody. */
  assignees: ControlTaskAssignee[]
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface CreateControlTaskInput {
  code: string
  name: string
  groupName?: string | null
  colorCode?: string | null
  modelCodeProcessId: string
  route: string[]
  isActive?: boolean
  /** Operators allowed to dispatch it. Replaces the whole list on update. */
  userIds?: string[]
}

export type UpdateControlTaskInput = Partial<CreateControlTaskInput>

export type ControlTaskSortBy = 'code' | 'name' | 'createdAt'
export type ControlTaskSortOrder = 'asc' | 'desc'

export interface ControlTaskQuery {
  page?: number
  limit?: number
  search?: string
  sortBy?: ControlTaskSortBy
  sortOrder?: ControlTaskSortOrder
}

export interface ControlTaskListMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface ControlTaskListResult {
  items: ControlTask[]
  meta: ControlTaskListMeta
}

export interface RouteOption {
  name: string
  iRaypleLocationCode: string
  source: 'PRODUCTION' | 'WAREHOUSE'
}

export interface RouteOptions {
  production: RouteOption[]
  warehouse: RouteOption[]
}
