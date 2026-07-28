import { ApiError } from '~/types/api'
import type { WebhookLogQuery } from '~/types/webhook-log'

export function useWebhookLogs() {
  const store = useWebhookLogsStore()
  const toast = useToast()

  async function fetchWebhookLogs(query?: WebhookLogQuery) {
    try {
      await store.loadWebhookLogs(query)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to load webhook logs')
    }
  }

  return {
    webhookLogs: computed(() => store.items),
    meta: computed(() => store.meta),
    loading: computed(() => store.loading),
    fetchWebhookLogs,
  }
}
