export type BinStatus = 'EMPTY' | 'FULL'

export interface CheckingAreaRow {
  id: string
  name: string
  iRaypleLocationCode: string
  /** What RCS currently believes; null when RCS reported nothing for this code. */
  stockStatus: BinStatus | null
  /** An AMR delivered finished goods here; RCS still reports it empty. */
  hasFinishGood: boolean
}
