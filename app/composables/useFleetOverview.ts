import { fetchRobots, fetchFleetStatus, fetchRobotTaskSummary } from '~/services/robot.service'
import type { Robot, RobotTaskSummaryRow } from '~/types/robot'

export interface FleetOverviewRobot {
  id: string
  name: string
  unitId: string
  battery: number | null
  speed: number | null
  state: string | null
  mission: string | null
  tasks: RobotTaskSummaryRow | null
}

/**
 * The Fleet Overview page's single source: one row per robot in the selected
 * area, carrying both its live telemetry and its task counts.
 *
 * Three calls because no single endpoint has all of it — /robots has the
 * telemetry, fleet-status resolves the human-readable mission, task-summary
 * does the counting. Joined on the device serial, which is what fleet-status
 * keys on.
 */
export function useFleetOverview() {
  const robots = ref<Robot[]>([])
  const summaries = ref<RobotTaskSummaryRow[]>([])
  const missions = ref<Map<string, string | null>>(new Map())
  const loading = ref(false)

  // Silent polls leave the cards on screen rather than blinking, the same
  // way the Dashboard panels refresh.
  let inFlight = false

  async function load(
    areaId: number | null,
    date: string | undefined,
    options: { silent?: boolean } = {},
  ) {
    if (options.silent && inFlight) return
    inFlight = true
    if (!options.silent) loading.value = true
    try {
      const [robotList, fleet, taskRows] = await Promise.all([
        fetchRobots({ page: 1, limit: 1000 }),
        fetchFleetStatus(areaId),
        fetchRobotTaskSummary(areaId, date),
      ])
      robots.value = areaId == null
        ? robotList.items
        : robotList.items.filter(robot => robot.areaId === areaId)
      missions.value = new Map(fleet.map(row => [row.unitId, row.mission]))
      summaries.value = taskRows
    } catch {
      // Non-fatal — keep whatever is already on screen; the next tick retries.
    } finally {
      inFlight = false
      loading.value = false
    }
  }

  const items = computed<FleetOverviewRobot[]>(() => {
    const byRobotId = new Map(summaries.value.map(row => [row.robotId, row]))
    return robots.value.map(robot => ({
      id: robot.id,
      name: robot.name,
      unitId: robot.amrDeviceSerialNo,
      battery: robot.battery,
      speed: robot.speed,
      state: robot.state,
      mission: missions.value.get(robot.amrDeviceSerialNo) ?? null,
      tasks: byRobotId.get(robot.id) ?? null,
    }))
  })

  return { items, loading, load }
}
