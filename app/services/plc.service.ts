import type {
  CreatePlcDeviceInput,
  CreatePlcTagInput,
  PlcDevice,
  PlcDeviceListResult,
  PlcDeviceQuery,
  PlcDeviceSnapshot,
  PlcReadingListResult,
  PlcReadingQuery,
  PlcTag,
  PlcTagListResult,
  PlcTagQuery,
  PlcTestResult,
  UpdatePlcDeviceInput,
  UpdatePlcTagInput,
} from '~/types/plc'

export async function fetchPlcDevices(
  query: PlcDeviceQuery = {},
): Promise<PlcDeviceListResult> {
  const { $http } = useNuxtApp()
  return (await $http.get('/plc/devices', { params: query })) as PlcDeviceListResult
}

export async function createPlcDevice(
  input: CreatePlcDeviceInput,
): Promise<PlcDevice> {
  const { $http } = useNuxtApp()
  return (await $http.post('/plc/devices', input)) as PlcDevice
}

export async function updatePlcDevice(
  id: string,
  input: UpdatePlcDeviceInput,
): Promise<PlcDevice> {
  const { $http } = useNuxtApp()
  return (await $http.put(`/plc/devices/${id}`, input)) as PlcDevice
}

export async function deletePlcDevice(id: string): Promise<null> {
  const { $http } = useNuxtApp()
  return (await $http.delete(`/plc/devices/${id}`)) as null
}

/** Connects and reads one register — never throws for a device that is down. */
export async function testPlcDevice(id: string): Promise<PlcTestResult> {
  const { $http } = useNuxtApp()
  return (await $http.post(`/plc/devices/${id}/test`, {})) as PlcTestResult
}

export async function fetchPlcTags(
  query: PlcTagQuery = {},
): Promise<PlcTagListResult> {
  const { $http } = useNuxtApp()
  return (await $http.get('/plc/tags', { params: query })) as PlcTagListResult
}

export async function createPlcTag(input: CreatePlcTagInput): Promise<PlcTag> {
  const { $http } = useNuxtApp()
  return (await $http.post('/plc/tags', input)) as PlcTag
}

export async function updatePlcTag(
  id: string,
  input: UpdatePlcTagInput,
): Promise<PlcTag> {
  const { $http } = useNuxtApp()
  return (await $http.put(`/plc/tags/${id}`, input)) as PlcTag
}

export async function deletePlcTag(id: string): Promise<null> {
  const { $http } = useNuxtApp()
  return (await $http.delete(`/plc/tags/${id}`)) as null
}

/**
 * The current value of every tag.
 *
 * Called once when a page opens; after that the socket pushes changes, so
 * the monitor makes no further HTTP requests at all.
 */
export async function fetchPlcLive(): Promise<PlcDeviceSnapshot[]> {
  const { $http } = useNuxtApp()
  return (await $http.get('/plc/live')) as PlcDeviceSnapshot[]
}

export async function fetchPlcReadings(
  query: PlcReadingQuery = {},
): Promise<PlcReadingListResult> {
  const { $http } = useNuxtApp()
  return (await $http.get('/plc/readings', { params: query })) as PlcReadingListResult
}
