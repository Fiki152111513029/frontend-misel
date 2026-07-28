import type { WebhookLogListResult, WebhookLogQuery } from '~/types/webhook-log'

export async function fetchWebhookLogs(query: WebhookLogQuery = {}): Promise<WebhookLogListResult> {
  const { $http } = useNuxtApp()
  // The page filters/sorts client-side over whatever is loaded (same pattern
  // as other client-filtered pages) — the backend endpoint only supports
  // page/limit for now, so request a generous page.
  return (await $http.get('/webhooks-logs', { params: { page: 1, limit: 200, ...query } })) as WebhookLogListResult
}
