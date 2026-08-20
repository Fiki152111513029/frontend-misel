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

function defineTrolleyTaskQueueStore(role: string) {
  return defineStore(`trolley-task-queue-${role}`, () => {
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
      // Idempotent — restoring from the backend on mount (see
      // fetchMyActiveTrolleyActivities) must not duplicate a card that a
      // live submit in this same session already added.
      if (items.value.some(item => item.activityId === input.activityId)) return

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

    // Wipes this role's queue and stops its polling — called on logout so a
    // shared device (one browser, operators taking turns) doesn't leak the
    // previous user's Current Queue into the next login. Client-side
    // navigation to /login doesn't reload the page, so this store would
    // otherwise just sit in memory untouched across the user switch.
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
}

// One store instance per role ("Warehouse" vs "Operator") — Warehouse
// Trolley Task and Operator Trolley Task are separate work queues for
// separate people, so a task submitted on one must not show up on the
// other. Each instance is still a Pinia singleton for its own role, so its
// Current Queue cards and their polling survive navigating away from that
// role's page and back — only a full page reload (not a client-side route
// change) resets it, same tradeoff Mainline accepts by re-deriving its own
// active task from the backend on mount.
const storesByRole = new Map<string, ReturnType<typeof defineTrolleyTaskQueueStore>>()

export function useTrolleyTaskQueueStore(role: string) {
  let useStore = storesByRole.get(role)
  if (!useStore) {
    useStore = defineTrolleyTaskQueueStore(role)
    storesByRole.set(role, useStore)
  }
  return useStore()
}

// Called on logout (see useAuth.ts) — clears every role's queue that has
// been instantiated so far, without the caller needing to know role names.
export function clearAllTrolleyTaskQueues() {
  for (const useStore of storesByRole.values()) {
    useStore().clear()
  }
}
