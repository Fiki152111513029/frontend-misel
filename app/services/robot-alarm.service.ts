import type { AlarmDashboardStats, RobotAlarmListResult, RobotAlarmQuery } from '~/types/robot-alarm'

// Critical alarm count + per-zone alarm density within the last N hours —
// powers the main Dashboard's Critical Alarms stat and Abnormality chart.
export async function fetchAlarmDashboardStats(hours: number = 24): Promise<AlarmDashboardStats> {
  const { $http } = useNuxtApp()
  return (await $http.get('/robot-alarms/dashboard-stats', {
    params: { hours },
  })) as AlarmDashboardStats
}

// Every received robot alarm (pagination), newest first — the Alarm Logs
// page under ICS Logs.
export async function fetchRobotAlarms(query: RobotAlarmQuery = {}): Promise<RobotAlarmListResult> {
  const { $http } = useNuxtApp()
  return (await $http.get('/robot-alarms', { params: query })) as RobotAlarmListResult
}
