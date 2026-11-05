import {
  createPlcDevice as createPlcDeviceSvc,
  createPlcTag as createPlcTagSvc,
  deletePlcDevice as deletePlcDeviceSvc,
  deletePlcTag as deletePlcTagSvc,
  fetchPlcDevices as fetchPlcDevicesSvc,
  fetchPlcTags as fetchPlcTagsSvc,
  testPlcDevice as testPlcDeviceSvc,
  updatePlcDevice as updatePlcDeviceSvc,
  updatePlcTag as updatePlcTagSvc,
} from '~/services/plc.service'
import { ApiError } from '~/types/api'
import type {
  CreatePlcDeviceInput,
  CreatePlcTagInput,
  PlcDevice,
  PlcDeviceQuery,
  PlcListMeta,
  PlcTag,
  PlcTagQuery,
  PlcTestResult,
  UpdatePlcDeviceInput,
  UpdatePlcTagInput,
} from '~/types/plc'

const EMPTY_META: PlcListMeta = { page: 1, limit: 10, total: 0, totalPages: 0 }

function message(e: unknown, fallback: string) {
  return e instanceof ApiError ? e.message : fallback
}

export function usePlcDevices() {
  const toast = useToast()
  const items = ref<PlcDevice[]>([])
  const meta = ref<PlcListMeta>({ ...EMPTY_META })
  const loading = ref(false)
  const filters = ref<PlcDeviceQuery>({
    page: 1,
    limit: 10,
    sortBy: 'name',
    sortOrder: 'asc',
  })

  async function fetchDevices(query?: Partial<PlcDeviceQuery>) {
    if (query) filters.value = { ...filters.value, ...query }
    loading.value = true
    try {
      const result = await fetchPlcDevicesSvc(filters.value)
      items.value = result.items
      meta.value = result.meta
    } catch (e) {
      toast.error(message(e, 'Failed to load PLC devices'))
    } finally {
      loading.value = false
    }
  }

  async function createDevice(input: CreatePlcDeviceInput) {
    try {
      await createPlcDeviceSvc(input)
      toast.success('PLC device created')
      await fetchDevices()
      return true
    } catch (e) {
      toast.error(message(e, 'Failed to create PLC device'))
      return false
    }
  }

  async function updateDevice(id: string, input: UpdatePlcDeviceInput) {
    try {
      await updatePlcDeviceSvc(id, input)
      toast.success('PLC device updated')
      await fetchDevices()
      return true
    } catch (e) {
      toast.error(message(e, 'Failed to update PLC device'))
      return false
    }
  }

  async function deleteDevice(id: string) {
    try {
      await deletePlcDeviceSvc(id)
      toast.success('PLC device deleted')
      await fetchDevices()
      return true
    } catch (e) {
      toast.error(message(e, 'Failed to delete PLC device'))
      return false
    }
  }

  /**
   * A failed test is an answer, not an error: the whole point is to find
   * out that the address is wrong, so it comes back as a result and is
   * shown on the page rather than thrown as a toast and lost.
   */
  async function testDevice(id: string): Promise<PlcTestResult | null> {
    try {
      return await testPlcDeviceSvc(id)
    } catch (e) {
      toast.error(message(e, 'Could not run the connection test'))
      return null
    }
  }

  return {
    items,
    meta,
    loading,
    filters,
    fetchDevices,
    createDevice,
    updateDevice,
    deleteDevice,
    testDevice,
  }
}

export function usePlcTags() {
  const toast = useToast()
  const items = ref<PlcTag[]>([])
  const meta = ref<PlcListMeta>({ ...EMPTY_META })
  const loading = ref(false)
  const filters = ref<PlcTagQuery>({
    page: 1,
    limit: 25,
    sortBy: 'address',
    sortOrder: 'asc',
  })

  async function fetchTags(query?: Partial<PlcTagQuery>) {
    if (query) filters.value = { ...filters.value, ...query }
    loading.value = true
    try {
      const result = await fetchPlcTagsSvc(filters.value)
      items.value = result.items
      meta.value = result.meta
    } catch (e) {
      toast.error(message(e, 'Failed to load PLC tags'))
    } finally {
      loading.value = false
    }
  }

  async function createTag(input: CreatePlcTagInput) {
    try {
      await createPlcTagSvc(input)
      toast.success('PLC tag created')
      await fetchTags()
      return true
    } catch (e) {
      toast.error(message(e, 'Failed to create PLC tag'))
      return false
    }
  }

  async function updateTag(id: string, input: UpdatePlcTagInput) {
    try {
      await updatePlcTagSvc(id, input)
      toast.success('PLC tag updated')
      await fetchTags()
      return true
    } catch (e) {
      toast.error(message(e, 'Failed to update PLC tag'))
      return false
    }
  }

  async function deleteTag(id: string) {
    try {
      await deletePlcTagSvc(id)
      toast.success('PLC tag deleted')
      await fetchTags()
      return true
    } catch (e) {
      toast.error(message(e, 'Failed to delete PLC tag'))
      return false
    }
  }

  return {
    items,
    meta,
    loading,
    filters,
    fetchTags,
    createTag,
    updateTag,
    deleteTag,
  }
}
