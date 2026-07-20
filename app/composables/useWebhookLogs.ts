import type { WebhookLog } from '~/types/webhook-log'

const ENDPOINTS = [
  'api/ics/webhook/devices-update',
  'api/ics/webhook/robot-socket-update',
  'api/ics/webhook/task-status-update',
  'api/ics/webhook/quarantine-alert',
]

function buildSampleWebhookLogs(): WebhookLog[] {
  const now = Date.now()
  return Array.from({ length: 42 }, (_, index) => {
    const endpoint = ENDPOINTS[index % ENDPOINTS.length]!
    const createdAt = new Date(now - index * 2 * 60 * 1000).toISOString()
    return {
      id: `WHL-${String(index + 1).padStart(4, '0')}`,
      createdAt,
      method: 'POST',
      endpoint,
      requestPayload: {
        deviceId: `RBT${String(1000 + index).slice(-4)}`,
        timestamp: createdAt,
        status: index % 5 === 0 ? 'ERROR' : 'OK',
      },
      responsePayload: {
        success: index % 5 !== 0,
        message: index % 5 === 0 ? 'Failed to process update' : 'Update received',
      },
    }
  })
}

const SAMPLE_WEBHOOK_LOGS = buildSampleWebhookLogs()

export function useWebhookLogs() {
  const webhookLogs = ref<WebhookLog[]>(SAMPLE_WEBHOOK_LOGS)
  const loading = ref(false)

  return {
    webhookLogs,
    loading,
  }
}
