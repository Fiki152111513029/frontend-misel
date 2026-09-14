import { ApiError } from '~/types/api'
import type { ExportFormat, ImportSummary } from '~/types/import-export'

// Shared Export/Import plumbing for every "reference data" page that offers
// an Export/Import toolbar (Trolleys, Trolley Categories, Trolley Types,
// Charger Areas, Parking Areas, Production Locations, Warehouse Locations) —
// each backend module exposes the same `GET /<base>/export` and
// `POST /<base>/import` shape, so this composable only needs the base path
// and a filename stem.
export function useImportExport(basePath: string, filenameStem: string) {
  const toast = useToast()
  const exporting = ref(false)
  const importing = ref(false)

  async function exportData(format: ExportFormat) {
    exporting.value = true
    try {
      const { $http } = useNuxtApp()
      const blob = (await $http.get(`${basePath}/export`, {
        params: { format },
        responseType: 'blob',
      })) as Blob

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${filenameStem}.${format}`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to export data')
    } finally {
      exporting.value = false
    }
  }

  async function importFile(file: File): Promise<ImportSummary | null> {
    importing.value = true
    try {
      const { $http } = useNuxtApp()
      const formData = new FormData()
      formData.append('file', file)
      return (await $http.post(`${basePath}/import`, formData)) as ImportSummary
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to import file')
      return null
    } finally {
      importing.value = false
    }
  }

  return { exporting, importing, exportData, importFile }
}
