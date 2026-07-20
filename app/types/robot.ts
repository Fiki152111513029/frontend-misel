export interface Robot {
  id: string
  name: string
  amrDeviceSerialNo: string
  amrDeviceNo: string
  areaId: number
  /** Live value from the AMR telemetry API, null if the device isn't reporting */
  speed: number | null
  /** Live value from the AMR telemetry API, null if the device isn't reporting */
  battery: number | null
  /** Live value from the AMR telemetry API, null if the device isn't reporting */
  state: string | null
  /** Live value from the AMR telemetry API, null if the device isn't reporting */
  lastUpdate: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface CreateRobotInput {
  name: string
  amrDeviceSerialNo: string
  amrDeviceNo: string
  areaId: number
  isActive?: boolean
}

export type UpdateRobotInput = Partial<CreateRobotInput>

export type RobotSortBy = 'name' | 'createdAt'
export type RobotSortOrder = 'asc' | 'desc'

export interface RobotQuery {
  page?: number
  limit?: number
  search?: string
  sortBy?: RobotSortBy
  sortOrder?: RobotSortOrder
}

export interface RobotListMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface RobotListResult {
  items: Robot[]
  meta: RobotListMeta
}
