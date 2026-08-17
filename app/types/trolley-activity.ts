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
}

export interface CreateTrolleyActivityInput {
  trolleyId: string
  pickupLocationCode: string
  startDate: string
}

export interface TrolleyActivity {
  id: string
  userId: string
  trolleyId: string
  statusBeginning: TrolleyStatus
  statusEnd: TrolleyStatus
  pickupLocationCode: string
  droppingLocationCode: string | null
  startDate: string
  endDate: string
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
