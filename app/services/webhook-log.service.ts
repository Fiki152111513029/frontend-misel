import type { LatestWebhookStatus, WebhookLogListResult, WebhookLogQuery } from '~/types/webhook-log'

export async function fetchWebhookLogs(query: WebhookLogQuery = {}): Promise<WebhookLogListResult> {
  const { $http } = useNuxtApp()
  // The page filters/sorts client-side over whatever is loaded (same pattern
  // as other client-filtered pages) — the backend endpoint only supports
  // page/limit for now, so request a generous page.
  return (await $http.get('/webhooks-logs', { params: { page: 1, limit: 200, ...query } })) as WebhookLogListResult
}

// Read live off the raw webhook payload — status/subTaskSeq are never
// persisted onto Task/WarehouseCartTask, so this is the only source for them.
export async function fetchLatestWebhookStatus(orderId: string): Promise<LatestWebhookStatus | null> {
  const { $http } = useNuxtApp()
  return (await $http.get('/webhooks-logs/latest', { params: { orderId } })) as LatestWebhookStatus | null
}
