import type { AlarmDashboardStats, RobotAlarmListResult, RobotAlarmQuery } from '~/types/robot-alarm'

// Currently-active alarm snapshot — based on alarmStatus (0=active,
// 1=resolved), not a time window. Critical (Emergency-grade) count,
// per-zone density, and the active alarm list all derive from the same
// active set — powers the main Dashboard's Critical Alarms stat and
// Abnormality panel.
export async function fetchAlarmDashboardStats(): Promise<AlarmDashboardStats> {
  const { $http } = useNuxtApp()
  return (await $http.get('/robot-alarms/dashboard-stats')) as AlarmDashboardStats
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
