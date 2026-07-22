export async function verifyIcsLogsPassword(password: string): Promise<boolean> {
  const { $http } = useNuxtApp()
  const result = (await $http.post('/ics-logs-access/verify', { password })) as { verified: boolean }
  return result.verified
}
