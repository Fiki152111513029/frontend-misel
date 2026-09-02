import type {
  CreateRobotInput,
  FleetStatusRow,
  Robot,
  RobotActivityQuery,
  RobotActivityResult,
  RobotListResult,
  RobotQuery,
  RobotShift,
  RobotStatusMonthlyMode,
  RobotStatusSummaryRow,
  RobotSystemStatus,
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

export async function fetchFleetStatus(): Promise<FleetStatusRow[]> {
  const { $http } = useNuxtApp()
  return (await $http.get('/robots/fleet-status')) as FleetStatusRow[]
}

export async function fetchRobotActivity(
  id: string,
  query: RobotActivityQuery = {},
): Promise<RobotActivityResult> {
  const { $http } = useNuxtApp()
  return (await $http.get(`/robots/${id}/activity`, { params: query })) as RobotActivityResult
}

// Running/Idle/Charging minutes per robot for one shift on one UTC
// calendar day (YYYY-MM-DD) — the AMR Performance chart's daily view.
export async function fetchRobotStatusSummary(
  date: string,
  shift: RobotShift,
): Promise<RobotStatusSummaryRow[]> {
  const { $http } = useNuxtApp()
  return (await $http.get('/robots/status-summary', {
    params: { date, shift },
  })) as RobotStatusSummaryRow[]
}

// Running/Idle/Charging minutes per robot averaged or totaled across one
// UTC calendar month (YYYY-MM), for one shift — the AMR Performance
// chart's Average/Total per Month views.
export async function fetchRobotStatusMonthlySummary(
  month: string,
  shift: RobotShift,
  mode: RobotStatusMonthlyMode,
): Promise<RobotStatusSummaryRow[]> {
  const { $http } = useNuxtApp()
  return (await $http.get('/robots/status-summary/monthly', {
    params: { month, shift, mode },
  })) as RobotStatusSummaryRow[]
}
