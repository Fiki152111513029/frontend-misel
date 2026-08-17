import * as trolleyActivityService from '~/services/trolley-activity.service'
import { ApiError } from '~/types/api'
import type {
  CreateTrolleyActivityInput,
  TrolleyActivityQuery,
} from '~/types/trolley-activity'

export function useTrolleyActivities() {
  const store = useTrolleyActivitiesStore()
  const toast = useToast()

  async function fetchTrolleyActivities(query?: Partial<TrolleyActivityQuery>) {
    if (query) store.setFilters(query)
    try {
      await store.loadTrolleyActivities()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to load trolley activities')
    }
  }

  async function lookupTrolley(code: string) {
    try {
      return await trolleyActivityService.lookupTrolley(code)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to look up trolley')
      return null
    }
  }

  async function lookupLocation(code: string) {
    try {
      return await trolleyActivityService.lookupLocation(code)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to look up location')
      return null
    }
  }

  async function createTrolleyActivity(input: CreateTrolleyActivityInput) {
    try {
      return await trolleyActivityService.createTrolleyActivity(input)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to submit trolley activity')
      return null
    }
  }

  async function fetchTrolleyActivitySequence(id: string) {
    try {
      return await trolleyActivityService.fetchTrolleyActivitySequence(id)
    } catch {
      return null
    }
  }

  return {
    items: computed(() => store.items),
    meta: computed(() => store.meta),
    loading: computed(() => store.loading),
    filters: computed(() => store.filters),
    fetchTrolleyActivities,
    lookupTrolley,
    lookupLocation,
    createTrolleyActivity,
    fetchTrolleyActivitySequence,
    setFilters: store.setFilters,
  }
}
