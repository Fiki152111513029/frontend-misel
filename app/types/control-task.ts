export type TypeOfGoods = 'PALLET' | 'TROLLEY' | 'RACK'

export const TYPE_OF_GOODS_OPTIONS: { value: TypeOfGoods, label: string }[] = [
  { value: 'PALLET', label: 'Pallet' },
  { value: 'TROLLEY', label: 'Trolley' },
  { value: 'RACK', label: 'Rack' },
]

export interface ControlTaskModelCodeProcess {
  id: string
  name: string
  fromSystem: string
}

export interface ControlTask {
  id: string
  abjad: string
  name: string
  typeOfGoods: TypeOfGoods
  modelCodeProcessId: string
  modelCodeProcess: ControlTaskModelCodeProcess | null
  /** The legs in the order the operator chose — repeats are allowed. */
  route: string[]
  /** `route` joined with "," — the shape the RCS task order expects. */
  taskPath: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface CreateControlTaskInput {
  abjad: string
  name: string
  typeOfGoods: TypeOfGoods
  modelCodeProcessId: string
  route: string[]
  isActive?: boolean
}

export type UpdateControlTaskInput = Partial<CreateControlTaskInput>

export type ControlTaskSortBy = 'abjad' | 'name' | 'createdAt'
export type ControlTaskSortOrder = 'asc' | 'desc'

export interface ControlTaskQuery {
  page?: number
  limit?: number
  search?: string
  typeOfGoods?: TypeOfGoods
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
