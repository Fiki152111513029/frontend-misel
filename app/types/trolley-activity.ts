import type { TrolleyStatus } from '~/types/trolley'

export type TrolleyActivityStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'

export interface LookupTrolleyResult {
  trolleyId: string
  trolleyCode: string
  trolleyName: string
  userName: string
  statusBeginning: TrolleyStatus
  droppingLocationCode: string | null
  startDate: string
}

export interface LookupLocationResult {
  pickupLocationCode: string
  pickupLocationName: string
  // WAREHOUSE: dropping is the trolley's own fixed droppingLocationCode.
  // PRODUCTION: dropping is auto-picked from an EMPTY Warehouse Location at
  // submit time, so it isn't known yet on this review step.
  pickupLocationSource: 'WAREHOUSE' | 'PRODUCTION'
}

export interface CreateTrolleyActivityInput {
  trolleyId: string
  pickupLocationCode: string
  startDate: string
  // Which page the operator is on — routes the Current Queue card back to
  // that same page on reload, independent of which direction (Warehouse
  // Location vs Production Location pickup) this submission turns out to be.
  queueRole: 'Warehouse' | 'Operator'
}

export interface TakeTrolleyInput {
  trolleyId: string
  pickupLocationCode: string
  queueRole: 'Warehouse' | 'Operator'
}

export interface TakeTrolleyResult {
  activityId: string
  trolleyId: string
  trolleyCode: string
  trolleyName: string
  statusBeginning: TrolleyStatus
  pickupLocationCode: string
  startDate: string
}

export interface TrolleyActivity {
  id: string
  userId: string
  trolleyId: string
  statusBeginning: TrolleyStatus
  // Null until Drop Trolley completes this row — a Take Trolley-only ("open")
  // row has no statusEnd/endDate yet.
  statusEnd: TrolleyStatus | null
  pickupLocationCode: string
  droppingLocationCode: string | null
  queueRole: string | null
  startDate: string
  endDate: string | null
  taskId: string
  status: TrolleyActivityStatus
  robotId: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  user: { id: string, fullName: string }
  trolley: { id: string, code: string, name: string }
  robot: { id: string, name: string } | null
}

export interface CreateTrolleyActivityResult {
  activity: TrolleyActivity
  rcsRequest: unknown
  rcsResponse: unknown
}

export interface TrolleyActivityQuery {
  page?: number
  limit?: number
}

export interface TrolleyActivityListMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface TrolleyActivityListResult {
  items: TrolleyActivity[]
  meta: TrolleyActivityListMeta
}

export interface TrolleyActivityDashboardStats {
  totals: {
    total: number
    completed: number
    pending: number
    inProgress: number
    failed: number
  }
  avgDurationSeconds: number | null
  dailyTrend: { date: string, completed: number, failed: number }[]
  // Empty for Warehouse/Operator roles — a cross-user leaderboard doesn't
  // make sense once stats are already narrowed to one user's own rows.
  topOperators: {
    userId: string
    fullName: string
    completedCount: number
    avgDurationSeconds: number | null
  }[]
  topLocations: { code: string, count: number }[]
}
