import type {
  CreateRobotInput,
  FleetStatusRow,
  Robot,
  RobotActivityQuery,
  RobotActivityResult,
  RobotListResult,
  RobotQuery,
  RobotStatusMonthlyMode,
  RobotStatusSummaryRow,
  RobotSystemStatus,
  RobotTaskSummaryRow,
  UpdateRobotInput,
} from '~/types/robot'

export async function fetchRobots(query: RobotQuery = {}): Promise<RobotListResult> {
  const { $http } = useNuxtApp()
  return (await $http.get('/robots', { params: query })) as RobotListResult
}

export async function fetchRobot(id: string): Promise<Robot> {
  const { $http } = useNuxtApp()
  return (await $http.get(`/robots/${id}`)) as Robot
}

export async function createRobot(input: CreateRobotInput): Promise<Robot> {
  const { $http } = useNuxtApp()
  return (await $http.post('/robots', input)) as Robot
}

export async function updateRobot(id: string, input: UpdateRobotInput): Promise<Robot> {
  const { $http } = useNuxtApp()
  return (await $http.put(`/robots/${id}`, input)) as Robot
}

export async function deleteRobot(id: string): Promise<null> {
  const { $http } = useNuxtApp()
  return (await $http.delete(`/robots/${id}`)) as null
}

export async function controlRobot(id: string, controlWay: 0 | 1): Promise<unknown> {
  const { $http } = useNuxtApp()
  return await $http.post(`/robots/${id}/control`, { controlWay })
}

export async function fetchRobotSystemStatus(): Promise<RobotSystemStatus> {
  const { $http } = useNuxtApp()
  return (await $http.get('/robots/system-status')) as RobotSystemStatus
}

// `areaId` is a Factory Map's areaNumber — omit it for every area.
export async function fetchFleetStatus(areaId?: number | null): Promise<FleetStatusRow[]> {
  const { $http } = useNuxtApp()
  return (await $http.get('/robots/fleet-status', {
    params: areaId == null ? {} : { areaId },
  })) as FleetStatusRow[]
}

export async function fetchRobotActivity(
  id: string,
  query: RobotActivityQuery = {},
): Promise<RobotActivityResult> {
  const { $http } = useNuxtApp()
  return (await $http.get(`/robots/${id}/activity`, { params: query })) as RobotActivityResult
}

// Running/Idle/Charging minutes per robot for one Shift (see
// shift.service.ts) on one UTC calendar day (YYYY-MM-DD) — the AMR
// Performance chart's daily view.
// A null `shiftId` means every shift — the whole UTC day, not one shift's
// slice of it. That is what the AMR Performance chart sends for "All
// Shifts", and the only thing it can send when no Shift exists yet.
export async function fetchRobotStatusSummary(
  date: string,
  shiftId: string | null,
  areaId?: number | null,
): Promise<RobotStatusSummaryRow[]> {
  const { $http } = useNuxtApp()
  return (await $http.get('/robots/status-summary', {
    params: {
      date,
      ...(shiftId ? { shiftId } : {}),
      ...(areaId == null ? {} : { areaId }),
    },
  })) as RobotStatusSummaryRow[]
}

// Running/Idle/Charging minutes per robot averaged or totaled across one
// UTC calendar month (YYYY-MM), for one Shift — the AMR Performance
// chart's Average/Total per Month views.
export async function fetchRobotStatusMonthlySummary(
  month: string,
  shiftId: string | null,
  mode: RobotStatusMonthlyMode,
  areaId?: number | null,
): Promise<RobotStatusSummaryRow[]> {
  const { $http } = useNuxtApp()
  return (await $http.get('/robots/status-summary/monthly', {
    params: {
      month,
      mode,
      ...(shiftId ? { shiftId } : {}),
      ...(areaId == null ? {} : { areaId }),
    },
  })) as RobotStatusSummaryRow[]
}

// Per-robot task counts for the Fleet Overview tiles. `date` limits it to
// one calendar day; omitted, it counts everything.
export async function fetchRobotTaskSummary(
  areaId?: number | null,
  date?: string,
): Promise<RobotTaskSummaryRow[]> {
  const { $http } = useNuxtApp()
  return (await $http.get('/robots/task-summary', {
    params: {
      ...(areaId == null ? {} : { areaId }),
      ...(date ? { date } : {}),
    },
  })) as RobotTaskSummaryRow[]
}
