import { fetchBoxType as fetchBoxTypeSvc } from '~/services/box-type.service'
import { ApiError } from '~/types/api'
import type { BoxTypeQuery, CreateBoxTypeInput, UpdateBoxTypeInput } from '~/types/box-type'

export function useBoxTypes() {
  const store = useBoxTypesStore()
  const toast = useToast()

  async function fetchBoxTypes(query?: Partial<BoxTypeQuery>) {
    if (query) store.setFilters(query)
    try {
      await store.loadBoxTypes()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to load box types')
    }
  }

  async function fetchBoxType(id: string) {
    try {
      return await fetchBoxTypeSvc(id)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to load box type')
      return null
    }
  }

  async function createBoxType(input: CreateBoxTypeInput) {
    try {
      await store.addBoxType(input)
      toast.success('Box type created successfully')
      await fetchBoxTypes()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to create box type')
      return false
    }
  }

  async function updateBoxType(id: string, input: UpdateBoxTypeInput) {
    try {
      await store.editBoxType(id, input)
      toast.success('Box type updated successfully')
      await fetchBoxTypes()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to update box type')
      return false
    }
  }

  async function deleteBoxType(id: string) {
    try {
      await store.removeBoxType(id)
      toast.success('Box type deleted successfully')
      await fetchBoxTypes()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to delete box type')
      return false
    }
  }

  return {
    items: computed(() => store.items),
    meta: computed(() => store.meta),
    loading: computed(() => store.loading),
    filters: computed(() => store.filters),
    fetchBoxTypes,
    fetchBoxType,
    createBoxType,
    updateBoxType,
    deleteBoxType,
    setFilters: store.setFilters,
  }
}
