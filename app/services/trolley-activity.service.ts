import type {
  CreateTrolleyActivityInput,
  CreateTrolleyActivityResult,
  LookupLocationResult,
  LookupTrolleyResult,
  TrolleyActivityListResult,
  TrolleyActivityQuery,
} from '~/types/trolley-activity'

export async function lookupTrolley(code: string): Promise<LookupTrolleyResult> {
  const { $http } = useNuxtApp()
  return (await $http.post('/trolley-activities/lookup-trolley', { code })) as LookupTrolleyResult
}

export async function lookupLocation(code: string): Promise<LookupLocationResult> {
  const { $http } = useNuxtApp()
  return (await $http.post('/trolley-activities/lookup-location', { code })) as LookupLocationResult
}

export async function createTrolleyActivity(
  input: CreateTrolleyActivityInput,
): Promise<CreateTrolleyActivityResult> {
  const { $http } = useNuxtApp()
  return (await $http.post('/trolley-activities', input)) as CreateTrolleyActivityResult
}

export async function fetchTrolleyActivities(
  query: TrolleyActivityQuery = {},
): Promise<TrolleyActivityListResult> {
  const { $http } = useNuxtApp()
  return (await $http.get('/trolley-activities', {
    params: query,
  })) as TrolleyActivityListResult
}

export async function fetchTrolleyActivitySequence(id: string): Promise<{ sequenceNumber: number }> {
  const { $http } = useNuxtApp()
  return (await $http.get(`/trolley-activities/${id}/sequence`)) as { sequenceNumber: number }
}
