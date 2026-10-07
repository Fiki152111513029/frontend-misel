import { fetchLatestWebhookStatus } from '~/services/webhook-log.service'
import { isTaskCompleted, isTaskTerminal } from '~/utils/taskStatus'
import type { LatestWebhookStatus } from '~/types/webhook-log'

export interface CustomTaskQueueItem {
  orderId: string
  /** The history row, so this card can be cancelled without leaving the page. */
  runId: string | null
  code: string
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

  // A card disappears a short while after its task reaches a terminal
  // status, so the operator sees the outcome before it goes.
  const TERMINAL_GRACE_MS = 5000
  const removalTimers = new Map<string, ReturnType<typeof setTimeout>>()

  async function refreshItem(item: CustomTaskQueueItem) {
    try {
      item.webhookStatus = await fetchLatestWebhookStatus(item.orderId)
    } catch {
      // Non-fatal — this card keeps its previous status.
    }
  }

  function scheduleRemoval(orderId: string) {
    if (removalTimers.has(orderId)) return
    removalTimers.set(
      orderId,
      setTimeout(() => {
        removalTimers.delete(orderId)
        items.value = items.value.filter(item => item.orderId !== orderId)
      }, TERMINAL_GRACE_MS),
    )
  }

  /**
   * Re-reads every card's status. Driven by the realtime signal rather
   * than a timer — the component rendering the queue subscribes and calls
   * this, so nothing runs while no task is in flight.
   */
  async function refreshAll() {
    await Promise.all(
      items.value.map(async (item) => {
        await refreshItem(item)
        const status = item.webhookStatus?.status
        if (status && isTaskTerminal(status)) {
          if (!removalTimers.has(item.orderId)) {
            if (isTaskCompleted(status)) {
              toast.success(`Custom task ${item.code} completed`)
            }
            scheduleRemoval(item.orderId)
          }
        }
      }),
    )
  }

  async function addTask(input: {
    orderId: string
    runId: string | null
    code: string
    name: string
    taskPath: string
  }) {
    if (items.value.some(item => item.orderId === input.orderId)) return

    const item: CustomTaskQueueItem = { ...input, webhookStatus: null }
    items.value.push(item)
    await refreshItem(item)
  }

  // Called on logout so a shared device does not leak the previous
  // operator's Current Queue into the next login.
  function clear() {
    items.value = []
    for (const timer of removalTimers.values()) clearTimeout(timer)
    removalTimers.clear()
  }

  // Drops a card the moment its task is cancelled, rather than waiting for
  // the poll to see a terminal status — the operator just acted on it, so
  // leaving it sitting there reads as the cancel not having worked.
  function removeTask(orderId: string) {
    items.value = items.value.filter(item => item.orderId !== orderId)
    const pending = removalTimers.get(orderId)
    if (pending) {
      clearTimeout(pending)
      removalTimers.delete(orderId)
    }
  }

  return { items, addTask, refreshAll, removeTask, clear }
})
