import type { AlarmDashboardStats, RobotAlarmListResult, RobotAlarmQuery } from '~/types/robot-alarm'

// Live/current alarm snapshot — Critical alarm count + per-zone alarm
// density within the last N minutes only (reads 0 once nothing fresh has
// come in, rather than carrying an old count forward) — powers the main
// Dashboard's Critical Alarms stat and Abnormality chart.
export async function fetchAlarmDashboardStats(minutes: number = 2): Promise<AlarmDashboardStats> {
  const { $http } = useNuxtApp()
  return (await $http.get('/robot-alarms/dashboard-stats', {
    params: { minutes },
  })) as AlarmDashboardStats
}

// Every received robot alarm (pagination), newest first — the Alarm Logs
// page under ICS Logs.
export async function fetchRobotAlarms(query: RobotAlarmQuery = {}): Promise<RobotAlarmListResult> {
  const { $http } = useNuxtApp()
  return (await $http.get('/robot-alarms', { params: query })) as RobotAlarmListResult
}

// deviceName (same value as Robot.amrDeviceSerialNo, e.g. "AMR0004") of
// every device currently sitting in an active, unresolved alarm — powers
// the Factory Map's live alarm badge, which stays up until RCS reports
// that alarm resolved.
export async function fetchActiveAlarmDeviceNames(): Promise<string[]> {
  const { $http } = useNuxtApp()
  return (await $http.get('/robot-alarms/active-devices')) as string[]
}
