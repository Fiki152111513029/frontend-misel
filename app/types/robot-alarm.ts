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
