/** Which Modbus address space a tag lives in. */
export type PlcRegisterType =
  | 'COIL'
  | 'DISCRETE_INPUT'
  | 'HOLDING_REGISTER'
  | 'INPUT_REGISTER'

export type PlcDataType =
  | 'BOOL'
  | 'INT16'
  | 'UINT16'
  | 'INT32'
  | 'UINT32'
  | 'FLOAT32'

/** Which register of a 32-bit value holds the high word. */
export type PlcWordOrder = 'BIG' | 'LITTLE'

/**
 * What the server's socket is doing right now.
 *
 * Not stored anywhere — it describes the connection this backend process
 * is holding, so after a restart everything reads disconnected until the
 * poller has been round once.
 */
export interface PlcConnection {
  connected: boolean
  lastError: string | null
  lastSuccessAt: string | null
}

export interface PlcTag {
  id: string
  deviceId: string
  name: string
  /** Zero-based protocol address, not the 4xxxx form from a tag list. */
  address: number
  registerType: PlcRegisterType
  dataType: PlcDataType
  wordOrder: PlcWordOrder
  scale: number
  unit: string | null
  description: string | null
  isActive: boolean
  logEnabled: boolean
  device: { id: string, name: string } | null
  createdAt: string
  updatedAt: string
}

export interface PlcDevice {
  id: string
  name: string
  host: string
  port: number
  unitId: number
  pollIntervalMs: number
  timeoutMs: number
  description: string | null
  isActive: boolean
  tags: PlcTag[]
  connection: PlcConnection
  createdAt: string
  updatedAt: string
}

export interface CreatePlcDeviceInput {
  name: string
  host: string
  port?: number
  unitId?: number
  pollIntervalMs?: number
  timeoutMs?: number
  description?: string | null
  isActive?: boolean
}

export type UpdatePlcDeviceInput = Partial<CreatePlcDeviceInput>

export interface CreatePlcTagInput {
  deviceId: string
  name: string
  address: number
  registerType: PlcRegisterType
  dataType?: PlcDataType
  wordOrder?: PlcWordOrder
  scale?: number
  unit?: string | null
  description?: string | null
  isActive?: boolean
  logEnabled?: boolean
}

export type UpdatePlcTagInput = Partial<Omit<CreatePlcTagInput, 'deviceId'>>

/** One tag as the poller last read it. */
export interface PlcTagValue {
  tagId: string
  name: string
  value: number | null
  unit: string | null
  address: number
  registerType: string
  dataType: string
  /** Why this tag has no value — a bad address, or the device being down. */
  error: string | null
  at: string
}

/** One device's current readings, as pushed over the socket. */
export interface PlcDeviceSnapshot {
  deviceId: string
  deviceName: string
  host: string
  port: number
  connected: boolean
  lastError: string | null
  at: string
  values: PlcTagValue[]
}

export interface PlcReading {
  id: string
  tagId: string
  value: number
  tag: { id: string, name: string, unit: string | null } | null
  createdAt: string
}

export interface PlcTestResult {
  ok: boolean
  /** Already phrased for a human — see describe() on the server. */
  message: string
  raw: number | null
  durationMs: number
  error: string | null
}

export interface PlcListMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface PlcDeviceListResult {
  items: PlcDevice[]
  meta: PlcListMeta
}

export interface PlcTagListResult {
  items: PlcTag[]
  meta: PlcListMeta
}

export interface PlcReadingListResult {
  items: PlcReading[]
  meta: PlcListMeta
}

export interface PlcDeviceQuery {
  page?: number
  limit?: number
  search?: string
  sortBy?: 'name' | 'host' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

export interface PlcTagQuery {
  page?: number
  limit?: number
  search?: string
  deviceId?: string
  sortBy?: 'name' | 'address' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

export interface PlcReadingQuery {
  page?: number
  limit?: number
  tagId?: string
  /** Single calendar day, YYYY-MM-DD. */
  date?: string
}

export const PLC_REGISTER_TYPES: { value: PlcRegisterType, label: string }[] = [
  { value: 'HOLDING_REGISTER', label: 'Holding Register (FC3, 4xxxx)' },
  { value: 'INPUT_REGISTER', label: 'Input Register (FC4, 3xxxx)' },
  { value: 'COIL', label: 'Coil (FC1, 0xxxx)' },
  { value: 'DISCRETE_INPUT', label: 'Discrete Input (FC2, 1xxxx)' },
]

export const PLC_DATA_TYPES: PlcDataType[] = [
  'BOOL',
  'INT16',
  'UINT16',
  'INT32',
  'UINT32',
  'FLOAT32',
]

/** The 32-bit types are the only ones that span two registers. */
export function spansTwoRegisters(dataType: PlcDataType): boolean {
  return dataType === 'INT32' || dataType === 'UINT32' || dataType === 'FLOAT32'
}
