export interface AlarmZoneCount {
  areaId: number
  count: number
}

export interface AlarmDashboardStats {
  // Count of alarmGrade = 3 (Emergency, RCS's own severity scale) alarms
  // received within the window.
  criticalCount: number
  // Alarm counts grouped by areaId within the window, sorted highest first.
  byZone: AlarmZoneCount[]
}
