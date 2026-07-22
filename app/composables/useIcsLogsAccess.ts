import { verifyIcsLogsPassword } from '~/services/ics-logs-access.service'
import { ApiError } from '~/types/api'

export function useIcsLogsAccess() {
  const verifying = ref(false)

  async function verifyPassword(password: string): Promise<boolean> {
    verifying.value = true
    try {
      return await verifyIcsLogsPassword(password)
    } catch (e) {
      if (e instanceof ApiError && e.statusCode === 403) return false
      throw e
    } finally {
      verifying.value = false
    }
  }

  return {
    verifying: computed(() => verifying.value),
    verifyPassword,
  }
}
