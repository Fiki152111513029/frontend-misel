import { fetchLatestWebhookStatus } from '~/services/webhook-log.service'
import { fetchTrolleyActivitySequence } from '~/services/trolley-activity.service'
import { isTaskCompleted, isTaskTerminal } from '~/utils/taskStatus'
import type { LatestWebhookStatus } from '~/types/webhook-log'

export interface TrolleyQueueItem {
  activityId: string
  taskId: string
  trolleyCode: string
  trolleyName: string
  queueNumber: number | null
  webhookStatus: LatestWebhookStatus | null
}

// A Pinia store (app-wide singleton) rather than page-local state, so
// Current Queue cards and their polling survive navigating away from the
// Warehouse/Operator Trolley Task page and back — only a full page reload
// (not a client-side route change) resets it, same tradeoff Mainline
// accepts by re-deriving its own active task from the backend on mount.
export const useTrolleyTaskQueueStore = defineStore('trolley-task-queue', () => {
  const items = ref<TrolleyQueueItem[]>([])
  const toast = useToast()

  const POLL_INTERVAL_MS = 3000
  const TERMINAL_GRACE_MS = 5000
  let pollTimer: ReturnType<typeof setInterval> | null = null
  // How long each item's task has been terminal, keyed by activityId — a
  // brief grace period covers a webhook update that arrives a beat late.
  const terminalSince = new Map<string, number>()

  async function refreshItem(item: TrolleyQueueItem) {
    try {
      item.webhookStatus = await fetchLatestWebhookStatus(item.taskId)
    } catch {
      // Non-fatal — stays stale this tick.
    }
  }

  function ensurePolling() {
    if (pollTimer) return
    pollTimer = setInterval(async () => {
      const toRemove = new Set<string>()
      await Promise.all(items.value.map(async (item) => {
        await refreshItem(item)
        const status = item.webhookStatus?.status
        if (status && isTaskTerminal(status)) {
          if (!terminalSince.has(item.activityId)) {
            terminalSince.set(item.activityId, Date.now())
            if (isTaskCompleted(status)) {
              toast.success(`Trolley task ${item.trolleyCode} completed`)
            }
          }
          if (Date.now() - terminalSince.get(item.activityId)! >= TERMINAL_GRACE_MS) {
            terminalSince.delete(item.activityId)
            toRemove.add(item.activityId)
          }
        } else {
          terminalSince.delete(item.activityId)
        }
      }))
      if (toRemove.size > 0) {
        items.value = items.value.filter(item => !toRemove.has(item.activityId))
      }
      if (items.value.length === 0 && pollTimer) {
        clearInterval(pollTimer)
        pollTimer = null
      }
    }, POLL_INTERVAL_MS)
  }

  async function addTask(input: {
    activityId: string
    taskId: string
    trolleyCode: string
    trolleyName: string
  }) {
    const item: TrolleyQueueItem = { ...input, queueNumber: null, webhookStatus: null }
    items.value.push(item)
    ensurePolling()

    try {
      const sequence = await fetchTrolleyActivitySequence(item.activityId)
      item.queueNumber = sequence.sequenceNumber
    } catch {
      // Non-fatal — "No urut" just stays blank.
    }
    await refreshItem(item)
  }

  return { items, addTask }
})
