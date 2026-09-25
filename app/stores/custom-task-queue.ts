import { fetchLatestWebhookStatus } from '~/services/webhook-log.service'
import { isTaskCompleted, isTaskTerminal } from '~/utils/taskStatus'
import type { LatestWebhookStatus } from '~/types/webhook-log'

export interface CustomTaskQueueItem {
  orderId: string
  abjad: string
  name: string
  taskPath: string
  webhookStatus: LatestWebhookStatus | null
}

// Same Current Queue behaviour as the Trolley Task pages, keyed by orderId
// rather than an activity row — a Custom Task writes nothing of its own to
// the database, so the RCS order id is all there is to poll on. Browser
// memory only: a full page reload clears the cards, while the task itself
// carries on in RCS.
export const useCustomTaskQueueStore = defineStore('custom-task-queue', () => {
  const items = ref<CustomTaskQueueItem[]>([])
  const toast = useToast()

  const POLL_INTERVAL_MS = 3000
  const TERMINAL_GRACE_MS = 5000
  let pollTimer: ReturnType<typeof setInterval> | null = null
  const terminalSince = new Map<string, number>()

  async function refreshItem(item: CustomTaskQueueItem) {
    try {
      item.webhookStatus = await fetchLatestWebhookStatus(item.orderId)
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
          if (!terminalSince.has(item.orderId)) {
            terminalSince.set(item.orderId, Date.now())
            if (isTaskCompleted(status)) {
              toast.success(`Custom task ${item.abjad} completed`)
            }
          }
          if (Date.now() - terminalSince.get(item.orderId)! >= TERMINAL_GRACE_MS) {
            terminalSince.delete(item.orderId)
            toRemove.add(item.orderId)
          }
        } else {
          terminalSince.delete(item.orderId)
        }
      }))
      if (toRemove.size > 0) {
        items.value = items.value.filter(item => !toRemove.has(item.orderId))
      }
      if (items.value.length === 0 && pollTimer) {
        clearInterval(pollTimer)
        pollTimer = null
      }
    }, POLL_INTERVAL_MS)
  }

  async function addTask(input: {
    orderId: string
    abjad: string
    name: string
    taskPath: string
  }) {
    if (items.value.some(item => item.orderId === input.orderId)) return

    const item: CustomTaskQueueItem = { ...input, webhookStatus: null }
    items.value.push(item)
    ensurePolling()
    await refreshItem(item)
  }

  // Called on logout so a shared device does not leak the previous
  // operator's Current Queue into the next login.
  function clear() {
    items.value = []
    terminalSince.clear()
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  }

  return { items, addTask, clear }
})
