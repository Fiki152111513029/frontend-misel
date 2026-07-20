import type { ApiLog, HttpMethod } from '~/types/api-log'

const ROUTES: { method: HttpMethod, endpoint: string }[] = [
  { method: 'GET', endpoint: 'api/ics/production-lines' },
  { method: 'GET', endpoint: 'api/ics/robots/status' },
  { method: 'POST', endpoint: 'api/ics/tasks/release' },
  { method: 'PATCH', endpoint: 'api/ics/tasks/status' },
  { method: 'GET', endpoint: 'api/ics/quarantine-areas' },
  { method: 'DELETE', endpoint: 'api/ics/tasks/cancel' },
]

function buildSampleApiLogs(): ApiLog[] {
  const now = Date.now()
  return Array.from({ length: 18 }, (_, index) => {
    const route = ROUTES[index % ROUTES.length]!
    const createdAt = new Date(now - index * 5 * 60 * 1000).toISOString()
    const failed = index % 7 === 0
    return {
      id: `APL-${String(index + 1).padStart(4, '0')}`,
      createdAt,
      method: route.method,
      endpoint: route.endpoint,
      statusCode: failed ? 500 : 200,
      durationMs: 40 + ((index * 17) % 260),
      requestPayload: {
        timestamp: createdAt,
        params: { page: 1, limit: 10 },
      },
      responsePayload: failed
        ? { success: false, message: 'Internal server error' }
        : { success: true, data: [] },
    }
  })
}

const SAMPLE_API_LOGS = buildSampleApiLogs()

export function useApiLogs() {
  const apiLogs = ref<ApiLog[]>(SAMPLE_API_LOGS)
  const loading = ref(false)

  return {
    apiLogs,
    loading,
  }
}
