export type DockingStatus = 'Pending' | 'In Progress' | 'Completed' | 'Failed'

export interface Docking {
  id: string
  noUrut: number
  taskId: string
  timeCreated: string
  boxType: { name: string; colorCode: string }
  from: string
  to: string
  amrCode: string
  amrName: string
  status: DockingStatus
}

const SAMPLE_DOCKINGS: Docking[] = [
  {
    id: 'DK-0001',
    noUrut: 1,
    taskId: '20260706-100802-001',
    timeCreated: '2026-07-06T08:12:00.000Z',
    boxType: { name: 'Small', colorCode: '#22C55E' },
    from: 'Line 1',
    to: 'Quarantine Area A1',
    amrCode: 'RBT0000',
    amrName: 'V3-Titan',
    status: 'Completed',
  },
  {
    id: 'DK-0002',
    noUrut: 2,
    taskId: '20260706-101204-002',
    timeCreated: '2026-07-06T08:32:00.000Z',
    boxType: { name: 'Medium', colorCode: '#3B82F6' },
    from: 'Line 2',
    to: 'EXIM Location 1',
    amrCode: 'RBT0001',
    amrName: 'V2-Falcon',
    status: 'In Progress',
  },
  {
    id: 'DK-0003',
    noUrut: 3,
    taskId: '20260706-101530-003',
    timeCreated: '2026-07-06T08:45:00.000Z',
    boxType: { name: 'Large', colorCode: '#F97316' },
    from: 'Quarantine Area B1',
    to: 'Line 3',
    amrCode: 'RBT0002',
    amrName: 'V3-Atlas',
    status: 'Pending',
  },
  {
    id: 'DK-0004',
    noUrut: 4,
    taskId: '20260706-095800-004',
    timeCreated: '2026-07-06T07:58:00.000Z',
    boxType: { name: 'Fragile', colorCode: '#EF4444' },
    from: 'Line 1',
    to: 'Empty Pallet Location',
    amrCode: 'RBT0000',
    amrName: 'V3-Titan',
    status: 'Failed',
  },
  {
    id: 'DK-0005',
    noUrut: 5,
    taskId: '20260706-092000-005',
    timeCreated: '2026-07-06T07:20:00.000Z',
    boxType: { name: 'Small', colorCode: '#22C55E' },
    from: 'EXIM Location 2',
    to: 'Line 2',
    amrCode: 'RBT0001',
    amrName: 'V2-Falcon',
    status: 'Completed',
  },
]

export function useDockings() {
  const dockings = ref<Docking[]>(SAMPLE_DOCKINGS)
  const loading = ref(false)

  const toast = useToast()

  function viewDocking(docking: Docking) {
    toast.success(`Detail view for ${docking.taskId} is coming soon`)
  }

  return {
    dockings,
    loading,
    viewDocking,
  }
}
