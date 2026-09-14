export type ExportFormat = 'csv' | 'xlsx'

export interface ImportSummary {
  totalRows: number
  created: number
  updated: number
  failed: number
  errors: { rowNumber: number, error: string }[]
}
