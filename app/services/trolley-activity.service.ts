import type {
  CreateTrolleyActivityInput,
  CreateTrolleyActivityResult,
  LookupLocationResult,
  LookupTrolleyResult,
  OperatorDurationSummaryRow,
  PickupDirection,
  TakeTrolleyInput,
  TakeTrolleyResult,
  TrolleyActivityDashboardStats,
  TrolleyActivityListResult,
  TrolleyActivityQuery,
  TrolleyShiftMonthlyMode,
  TrolleySupplyFrequencyRow,
} from '~/types/trolley-activity'

export async function lookupTrolley(code: string, trolleyTypeId?: string): Promise<LookupTrolleyResult> {
  const { $http } = useNuxtApp()
  return (await $http.post('/trolley-activities/lookup-trolley', { code, trolleyTypeId })) as LookupTrolleyResult
}

export async function lookupLocation(code: string): Promise<LookupLocationResult> {
  const { $http } = useNuxtApp()
  return (await $http.post('/trolley-activities/lookup-location', { code })) as LookupLocationResult
}

export async function createTrolleyActivity(
  input: CreateTrolleyActivityInput,
): Promise<CreateTrolleyActivityResult> {
  const { $http } = useNuxtApp()
  return (await $http.post('/trolley-activities', input)) as CreateTrolleyActivityResult
}

export async function takeTrolley(input: TakeTrolleyInput): Promise<TakeTrolleyResult> {
  const { $http } = useNuxtApp()
  return (await $http.post('/trolley-activities/take-trolley', input)) as TakeTrolleyResult
}

export async function fetchTrolleyActivities(
  query: TrolleyActivityQuery = {},
): Promise<TrolleyActivityListResult> {
  const { $http } = useNuxtApp()
  return (await $http.get('/trolley-activities', {
    params: query,
  })) as TrolleyActivityListResult
}

export async function fetchTrolleyActivitySequence(id: string): Promise<{ sequenceNumber: number }> {
  const { $http } = useNuxtApp()
  return (await $http.get(`/trolley-activities/${id}/sequence`)) as { sequenceNumber: number }
}

export async function deleteTrolleyActivity(id: string): Promise<void> {
  const { $http } = useNuxtApp()
  await $http.delete(`/trolley-activities/${id}`)
}

export async function fetchTrolleyActivityDashboard(
  days: number | undefined = 7,
  date?: string,
): Promise<TrolleyActivityDashboardStats> {
  const { $http } = useNuxtApp()
  return (await $http.get('/trolley-activities/dashboard', {
    // `date` scopes to that one calendar day and takes precedence over
    // `days` server-side — the Dashboard passes it so Total Production
    // follows the day picker.
    params: { ...(days == null ? {} : { days }), ...(date ? { date } : {}) },
  })) as TrolleyActivityDashboardStats
}

export interface ActiveTrolleyActivityByRobot {
  robotId: string
  carrying: 'EMPTY' | 'FULL'
}

export async function fetchActiveTrolleyActivitiesByRobot(): Promise<ActiveTrolleyActivityByRobot[]> {
  const { $http } = useNuxtApp()
  return (await $http.get('/trolley-activities/active-by-robot')) as ActiveTrolleyActivityByRobot[]
}

export interface MyActiveTrolleyActivity {
  activityId: string
  taskId: string
  trolleyCode: string
  trolleyName: string
  trolleyTypeName: string
  // Which direction the pickup was — used to restore into the right page's
  // Current Queue (Warehouse Trolley Task vs Operator Trolley Task) without
  // mixing the two.
  pickupSource: 'WAREHOUSE' | 'PRODUCTION'
}

export async function fetchMyActiveTrolleyActivities(): Promise<MyActiveTrolleyActivity[]> {
  const { $http } = useNuxtApp()
  return (await $http.get('/trolley-activities/active-mine')) as MyActiveTrolleyActivity[]
}

// Total/average minutes Warehouse/Operator users spent per Trolley Task,
// per user, for one Shift on one UTC calendar day, split by pickup
// direction (WAREHOUSE = "Dealer Operator", PRODUCTION = "Supply Operator").
export async function fetchOperatorDurationSummary(
  date: string,
  shiftId: string | null,
  direction: PickupDirection,
): Promise<OperatorDurationSummaryRow[]> {
  const { $http } = useNuxtApp()
  return (await $http.get('/trolley-activities/operator-duration-summary', {
    params: { date, direction, ...(shiftId ? { shiftId } : {}) },
  })) as OperatorDurationSummaryRow[]
}

export async function fetchOperatorDurationMonthlySummary(
  month: string,
  shiftId: string | null,
  mode: TrolleyShiftMonthlyMode,
  direction: PickupDirection,
): Promise<OperatorDurationSummaryRow[]> {
  const { $http } = useNuxtApp()
  return (await $http.get('/trolley-activities/operator-duration-summary/monthly', {
    params: { month, mode, direction, ...(shiftId ? { shiftId } : {}) },
  })) as OperatorDurationSummaryRow[]
}

// How many times each Trolley was supplied, for one Shift on one UTC
// calendar day — sorted highest to lowest.
export async function fetchTrolleyFrequencySummary(
  date: string,
  shiftId: string | null,
): Promise<TrolleySupplyFrequencyRow[]> {
  const { $http } = useNuxtApp()
  return (await $http.get('/trolley-activities/trolley-frequency-summary', {
    params: { date, ...(shiftId ? { shiftId } : {}) },
  })) as TrolleySupplyFrequencyRow[]
}

export async function fetchTrolleyFrequencyMonthlySummary(
  month: string,
  shiftId: string | null,
  mode: TrolleyShiftMonthlyMode,
): Promise<TrolleySupplyFrequencyRow[]> {
  const { $http } = useNuxtApp()
  return (await $http.get('/trolley-activities/trolley-frequency-summary/monthly', {
    params: { month, mode, ...(shiftId ? { shiftId } : {}) },
  })) as TrolleySupplyFrequencyRow[]
}
