export type TroubleShotStatus = 'Open' | 'In Progress' | 'Resolved' | 'Failed'

export interface TroubleShot {
  id: string
  taskAction: string
  robot: string
  operator: string
  status: TroubleShotStatus
  createdAt: string
}

const SAMPLE_TROUBLE_SHOTS: TroubleShot[] = [
  {
    id: 'TSH-0001',
    taskAction: 'Pickup Box',
    robot: 'RBT0000',
    operator: 'operator1',
    status: 'Resolved',
    createdAt: '2026-07-07T08:10:00.000Z',
  },
  {
    id: 'TSH-0002',
    taskAction: 'Transport Pallet',
    robot: 'V3-Titan',
    operator: 'operator2',
    status: 'In Progress',
    createdAt: '2026-07-07T08:32:00.000Z',
  },
  {
    id: 'TSH-0003',
    taskAction: 'Return to Dock',
    robot: 'V2-Falcon',
    operator: 'supervisor1',
    status: 'Open',
    createdAt: '2026-07-07T08:45:00.000Z',
  },
  {
    id: 'TSH-0004',
    taskAction: 'Move to Quarantine Area',
    robot: 'V3-Atlas',
    operator: 'operator1',
    status: 'Failed',
    createdAt: '2026-07-07T07:58:00.000Z',
  },
  {
    id: 'TSH-0005',
    taskAction: 'Deliver to Loading Bay',
    robot: 'RBT0000',
    operator: 'operator3',
    status: 'Resolved',
    createdAt: '2026-07-07T07:20:00.000Z',
  },
  {
    id: 'TSH-0006',
    taskAction: 'Charge Battery',
    robot: 'V2-Falcon',
    operator: 'supervisor1',
    status: 'In Progress',
    createdAt: '2026-07-07T06:50:00.000Z',
  },
]

export function useTroubleShots() {
  const troubleShots = ref<TroubleShot[]>(SAMPLE_TROUBLE_SHOTS)
  const loading = ref(false)

  const toast = useToast()

  function viewTroubleShot(troubleShot: TroubleShot) {
    toast.success(`Detail view for ${troubleShot.id} is coming soon`)
  }

  return {
    troubleShots,
    loading,
    viewTroubleShot,
  }
}
