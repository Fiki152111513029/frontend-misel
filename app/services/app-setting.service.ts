import type { AppSettings } from '~/types/app-setting'

export async function fetchAppSettings(): Promise<AppSettings> {
  const { $http } = useNuxtApp()
  return (await $http.get('/app-settings')) as AppSettings
}

export async function updateAppSettings(
  settings: Partial<AppSettings>,
): Promise<AppSettings> {
  const { $http } = useNuxtApp()
  return (await $http.put('/app-settings', { settings })) as AppSettings
}
