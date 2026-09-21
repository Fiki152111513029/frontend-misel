import { fetchFactoryMapById } from '~/services/factory-map.service'
import { ApiError } from '~/types/api'
import type {
  CreateFactoryMapInput,
  FactoryMapQuery,
  LocationSyncSummary,
  TopologySyncResult,
  UpdateFactoryMapInput,
} from '~/types/factory-map'

export function useFactoryMaps() {
  const store = useFactoryMapsStore()
  const toast = useToast()

  // Tells the user what the topology file's nodes turned into — created,
  // already-existing (skipped), and any that couldn't be created (with why).
  function reportLocationSync(sync: TopologySyncResult | null | undefined) {
    if (!sync) return
    const groups: [string, LocationSyncSummary][] = [
      ['Charger Areas', sync.chargerAreas],
      ['Parking Areas', sync.parkingAreas],
      ['Production Locations', sync.productionLocations],
      ['Warehouse Locations', sync.warehouseLocations],
    ]
    const lines = groups
      .filter(([, g]) => g.created + g.skipped + g.failed > 0)
      .map(([label, g]) => `${label}: ${g.created} created${g.skipped ? `, ${g.skipped} already existed` : ''}${g.failed ? `, ${g.failed} failed` : ''}`)
    if (lines.length) toast.success(`Imported from map — ${lines.join(' · ')}`)

    const failures = groups.flatMap(([label, g]) => g.errors.map(e => `${label} ${e.code}: ${e.error}`))
    if (failures.length) {
      const shown = failures.slice(0, 3).join('; ')
      toast.error(`${failures.length} location(s) not imported — ${shown}${failures.length > 3 ? '…' : ''}`)
    }
  }

  async function fetchFactoryMaps(query?: Partial<FactoryMapQuery>) {
    if (query) store.setFilters(query)
    try {
      await store.loadFactoryMaps()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to load factory maps')
    }
  }

  async function fetchFactoryMap(id: string) {
    try {
      return await fetchFactoryMapById(id)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to load factory map')
      return null
    }
  }

  async function createFactoryMap(input: CreateFactoryMapInput) {
    try {
      const created = await store.addFactoryMap(input)
      toast.success('Factory map created successfully')
      reportLocationSync(created.locationSync)
      await fetchFactoryMaps()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to create factory map')
      return false
    }
  }

  async function updateFactoryMap(id: string, input: UpdateFactoryMapInput) {
    try {
      await store.editFactoryMap(id, input)
      toast.success('Factory map updated successfully')
      await fetchFactoryMaps()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to update factory map')
      return false
    }
  }

  async function deleteFactoryMap(id: string) {
    try {
      await store.removeFactoryMap(id)
      toast.success('Factory map deleted successfully')
      await fetchFactoryMaps()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to delete factory map')
      return false
    }
  }

  return {
    items: computed(() => store.items),
    meta: computed(() => store.meta),
    loading: computed(() => store.loading),
    filters: computed(() => store.filters),
    fetchFactoryMaps,
    fetchFactoryMap,
    createFactoryMap,
    updateFactoryMap,
    deleteFactoryMap,
    setFilters: store.setFilters,
  }
}
