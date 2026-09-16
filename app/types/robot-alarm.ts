export interface AlarmZoneCount {
  areaId: number
  count: number
}

// One currently-active alarm, based on alarmStatus (0 = active, 1 =
// resolved) rather than a time window — the raw device/desc fields the
// Abnormality panel lists per zone.
export interface ActiveAlarmInfo {
  deviceNum: string | null
  deviceName: string | null
  alarmType: number | null
  alarmDesc: string | null
  alarmGrade: number | null
  areaId: number | null
}

export interface AlarmDashboardStats {
  // Count of currently-ACTIVE alarms (see activeAlarms) that are
  // alarmGrade = 3 (Emergency, RCS's own severity scale) — not a time
  // window. An alarm counts here from the moment it's reported active
  // until RCS reports it resolved.
  criticalCount: number
  // Currently-active alarm counts grouped by areaId, sorted highest first.
  byZone: AlarmZoneCount[]
  // Every currently-active alarm — one per device+alarm key, whichever
  // status was reported most recently.
  activeAlarms: ActiveAlarmInfo[]
}

export interface RobotAlarm {
  id: string
  deviceNum: string | null
  deviceName: string | null
  alarmDesc: string | null
  alarmType: number | null
  areaId: number | null
  alarmReadFlag: number | null
  channelDeviceId: string | null
  alarmSource: string | null
  channelName: string | null
  alarmDateRaw: string | null
  // RCS's own severity scale: 1 = Tip, 2 = Alert, 3 = Emergency.
  alarmGrade: number | null
  // RCS's own field: 0 = active, 1 = resolved.
  alarmStatus: number | null
  receivedAt: string
}

export interface RobotAlarmQuery {
  page?: number
  limit?: number
}

export interface RobotAlarmListMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface RobotAlarmListResult {
  items: RobotAlarm[]
  meta: RobotAlarmListMeta
}
