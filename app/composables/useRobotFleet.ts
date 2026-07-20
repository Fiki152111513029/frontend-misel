export interface FleetStatusCounts {
  active: number
  charging: number
  idle: number
  error: number
}

export interface SensorStatus {
  key: string
  label: string
  status: 'nominal' | 'stable' | 'drift' | 'offline'
}

export interface RobotUnit {
  id: string
  name: string
  serialId: string
  status: 'en-route' | 'charging' | 'idle' | 'error'
  isCritical: boolean
  payload: number
  payloadCapacity: number
  battery: number
  mission: {
    name: string
    route: string
    stepLabel: string
    currentStep: number
    totalSteps: number
  } | null
  specs: {
    locomotion: string
    sensorArray: string
    lastCalibration: string
    uptime: string
  }
}

const FLEET_STATUS: FleetStatusCounts = {
  active: 12,
  charging: 4,
  idle: 2,
  error: 1,
}

const SENSORS: SensorStatus[] = [
  { key: 'lidar', label: 'LiDAR', status: 'nominal' },
  { key: 'imu', label: 'IMU', status: 'stable' },
  { key: 'ultrasonic', label: 'Ultrasonic', status: 'drift' },
]

const SPEED_SERIES = [3.4, 4.1, 3.8, 4.6, 5.2, 4.9, 4.3, 3.9]

const ROBOTS: RobotUnit[] = [
  {
    id: 'amr-v3-x8922',
    name: 'V3-Titan',
    serialId: 'AMR-V3-X8922',
    status: 'en-route',
    isCritical: true,
    payload: 342,
    payloadCapacity: 500,
    battery: 88,
    mission: {
      name: 'Material Transport',
      route: 'Sector 7 → Loading Bay B',
      stepLabel: 'Step 4 of 6',
      currentStep: 4,
      totalSteps: 6,
    },
    specs: {
      locomotion: 'Mecanum 4WD',
      sensorArray: 'LiDAR + Stereo Cam',
      lastCalibration: '02.24.2026 14:38',
      uptime: '12d 04h 22m',
    },
  },
  {
    id: 'amr-v2-x7710',
    name: 'V2-Falcon',
    serialId: 'AMR-V2-X7710',
    status: 'charging',
    isCritical: false,
    payload: 0,
    payloadCapacity: 350,
    battery: 41,
    mission: null,
    specs: {
      locomotion: 'Differential Drive',
      sensorArray: 'LiDAR Only',
      lastCalibration: '02.20.2026 09:12',
      uptime: '3d 11h 05m',
    },
  },
  {
    id: 'amr-v3-x8931',
    name: 'V3-Atlas',
    serialId: 'AMR-V3-X8931',
    status: 'error',
    isCritical: true,
    payload: 120,
    payloadCapacity: 500,
    battery: 63,
    mission: {
      name: 'Quarantine Pickup',
      route: 'Sector 2 → Quarantine Area A1',
      stepLabel: 'Step 1 of 4',
      currentStep: 1,
      totalSteps: 4,
    },
    specs: {
      locomotion: 'Mecanum 4WD',
      sensorArray: 'LiDAR + Stereo Cam',
      lastCalibration: '02.18.2026 08:02',
      uptime: '18d 02h 51m',
    },
  },
]

export function useRobotFleet() {
  const robots = ref<RobotUnit[]>(ROBOTS)
  const selectedRobotId = ref<string>(ROBOTS[0]!.id)

  const selectedRobot = computed(
    () => robots.value.find((r) => r.id === selectedRobotId.value) ?? robots.value[0]!,
  )

  function selectRobot(id: string) {
    selectedRobotId.value = id
  }

  const toast = useToast()

  function pauseUnit() {
    toast.success(`${selectedRobot.value.name} paused`)
  }

  function requestCharge() {
    toast.success(`Charge requested for ${selectedRobot.value.name}`)
  }

  function forceManualOverride() {
    toast.error(`Manual override engaged for ${selectedRobot.value.name}`)
  }

  return {
    fleetStatus: FLEET_STATUS,
    sensors: SENSORS,
    speedSeries: SPEED_SERIES,
    robots,
    selectedRobot,
    selectRobot,
    pauseUnit,
    requestCharge,
    forceManualOverride,
  }
}
