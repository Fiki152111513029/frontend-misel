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
  /** Live map x/y from the AMR telemetry API (same coordinate space as Factory Map topology), null if not reporting */
  positionX: number | null
  /** Live map x/y from the AMR telemetry API (same coordinate space as Factory Map topology), null if not reporting */
  positionY: number | null
  /** Raw "payLoad" from the AMR telemetry API — "0.0" (idle) or "1.0" (carrying something); never distinguishes what's being carried. Null if not reporting. */
  payload: string | null
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

export interface RobotActivityLog {
  id: string
  robotId: string | null
  deviceCode: string
  deviceName: string
  speed: number | null
  battery: number | null
  status: number | null
  state: string | null
  position: string | null
  payload: string | null
  orientation: number | null
  recordedAt: string
}

export interface RobotActivityQuery {
  page?: number
  limit?: number
  startDate?: string
  endDate?: string
}

export interface RobotActivityListMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface RobotActivityResult {
  robot: { id: string, name: string }
  items: RobotActivityLog[]
  meta: RobotActivityListMeta
}

export interface RobotSystemStatus {
  online: boolean
  checkedAt: string
}

export interface FleetStatusRow {
  unitId: string
  status: string | null
  /** Resolved from the robot's active task's subTaskSeq — null if it has no mission right now. */
  mission: string | null
  load: string | null
  battery: number | null
}
