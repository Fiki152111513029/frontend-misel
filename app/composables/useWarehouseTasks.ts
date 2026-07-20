export type WarehouseTaskStatus = 'Pending' | 'In Progress' | 'Completed' | 'Failed'

export interface WarehouseTask {
  id: string
  lineLocation: string
  status: WarehouseTaskStatus
  createdAt: string
}

const SAMPLE_WAREHOUSE_TASKS: WarehouseTask[] = [
  {
    id: 'WHT-0001',
    lineLocation: 'Line Location A1',
    status: 'Completed',
    createdAt: '2026-07-07T08:10:00.000Z',
  },
  {
    id: 'WHT-0002',
    lineLocation: 'Line Location A2',
    status: 'In Progress',
    createdAt: '2026-07-07T08:32:00.000Z',
  },
  {
    id: 'WHT-0003',
    lineLocation: 'Line Location B1',
    status: 'Pending',
    createdAt: '2026-07-07T08:45:00.000Z',
  },
  {
    id: 'WHT-0004',
    lineLocation: 'Line Location B2',
    status: 'Failed',
    createdAt: '2026-07-07T07:58:00.000Z',
  },
  {
    id: 'WHT-0005',
    lineLocation: 'Line Location A1',
    status: 'Completed',
    createdAt: '2026-07-07T07:20:00.000Z',
  },
  {
    id: 'WHT-0006',
    lineLocation: 'Line Location C1',
    status: 'In Progress',
    createdAt: '2026-07-07T06:50:00.000Z',
  },
]

export function useWarehouseTasks() {
  const warehouseTasks = ref<WarehouseTask[]>(SAMPLE_WAREHOUSE_TASKS)
  const loading = ref(false)

  const toast = useToast()

  function viewWarehouseTask(warehouseTask: WarehouseTask) {
    toast.success(`Detail view for ${warehouseTask.id} is coming soon`)
  }

  return {
    warehouseTasks,
    loading,
    viewWarehouseTask,
  }
}
