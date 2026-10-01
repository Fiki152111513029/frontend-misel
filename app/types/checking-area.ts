export type BinStatus = 'EMPTY' | 'FULL'

export interface CheckingAreaRow {
  id: string
  name: string
  iRaypleLocationCode: string
  /** What RCS currently believes; null when RCS reported nothing for this code. */
  stockStatus: BinStatus | null
  /** RCS says a task is using this node right now. */
  inTask: boolean
}
