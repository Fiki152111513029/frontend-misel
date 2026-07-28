import * as webhookLogService from '~/services/webhook-log.service'
import { ApiError } from '~/types/api'
import type { WebhookLog, WebhookLogListMeta, WebhookLogQuery } from '~/types/webhook-log'

export const useWebhookLogsStore = defineStore('webhook-logs', () => {
  const items = ref<WebhookLog[]>([])
  const meta = ref<WebhookLogListMeta>({ total: 0, page: 1, limit: 200, totalPages: 0 })
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function loadWebhookLogs(query?: WebhookLogQuery) {
    loading.value = true
    error.value = null
    try {
      const result = await webhookLogService.fetchWebhookLogs(query)
      items.value = result.items
      meta.value = result.meta
    } catch (e) {
      error.value = e instanceof ApiError ? e.message : 'Failed to load webhook logs'
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    items,
    meta,
    loading,
    error,
    loadWebhookLogs,
  }
})
