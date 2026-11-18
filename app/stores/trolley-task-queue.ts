import { fetchLatestWebhookStatus } from '~/services/webhook-log.service'
import {
  fetchMyActiveTrolleyActivities,
  fetchTrolleyActivitySequence,
} from '~/services/trolley-activity.service'
import { isTaskCompleted, isTaskTerminal } from '~/utils/taskStatus'
import type { LatestWebhookStatus } from '~/types/webhook-log'

/** The transit wait as the card needs to render it. */
export interface TrolleyQueueTransit {
  transitLocationCode: string | null
  continueTaskDelaySec: number | null
  /** ISO; null until the AMR is seen at the stop. */
  transitArrivedAt: string | null
  /** ISO; set once RCS has accepted the continue. */
  continuedAt: string | null
}

export interface TrolleyQueueItem extends TrolleyQueueTransit {
  activityId: string
  taskId: string
  trolleyCode: string
  trolleyName: string
  trolleyTypeName: string
  queueNumber: number | null
  webhookStatus: LatestWebhookStatus | null
}

const NO_TRANSIT: TrolleyQueueTransit = {
  transitLocationCode: null,
  continueTaskDelaySec: null,
  transitArrivedAt: null,
  continuedAt: null,
}

function defineTrolleyTaskQueueStore(role: string) {
  return defineStore(`trolley-task-queue-${role}`, () => {
    const items = ref<TrolleyQueueItem[]>([])
    const toast = useToast()

    // A card disappears a short while after its task reaches a terminal
    // status, so the operator sees the outcome before it goes.
    const TERMINAL_GRACE_MS = 5000
    const removalTimers = new Map<string, ReturnType<typeof setTimeout>>()

    async function refreshItem(item: TrolleyQueueItem) {
      try {
        item.webhookStatus = await fetchLatestWebhookStatus(item.taskId)
      } catch {
        // Non-fatal — this card keeps its previous status.
      }
    }

    function scheduleRemoval(activityId: string) {
      if (removalTimers.has(activityId)) return
      removalTimers.set(
        activityId,
        setTimeout(() => {
          removalTimers.delete(activityId)
          items.value = items.value.filter(item => item.activityId !== activityId)
        }, TERMINAL_GRACE_MS),
      )
    }

    /**
     * Re-reads the transit wait of every card from the server.
     *
     * One request for the whole queue rather than one per card: the
     * endpoint already returns all of this user's in-flight tasks, and
     * these fields only ever change at two moments (the AMR reaching the
     * stop, and the continue being accepted), both of which publish the
     * realtime signal this runs on.
     *
     * The countdown itself is not refreshed here — the card computes it
     * against transitArrivedAt with its own ticker.
     */
    /**
     * Re-reads the transit wait of every card, and returns the set of
     * activity ids the server still considers in flight.
     *
     * One request for the whole queue rather than one per card: the
     * endpoint already returns all of this user's in-flight tasks, so the
     * same response answers both "how long is left on the wait" and "is
     * this task still running".
     *
     * Returns null when the request failed, which the caller must treat as
     * "no information" rather than "nothing is active" — otherwise one
     * flaky request would wipe the whole queue.
     */
    async function refreshTransit(): Promise<Set<string> | null> {
      if (items.value.length === 0) return null
      try {
        const activities = await fetchMyActiveTrolleyActivities()
        const byId = new Map(activities.map(a => [a.activityId, a]))
        for (const item of items.value) {
          const fresh = byId.get(item.activityId)
          // Missing means the task is no longer in flight. Its own fields
          // are left alone — the card is on its way out, and blanking the
          // wait first would make it flicker back to "no transit".
          if (!fresh) continue
          item.transitLocationCode = fresh.transitLocationCode
          item.continueTaskDelaySec = fresh.continueTaskDelaySec
          item.transitArrivedAt = fresh.transitArrivedAt
          item.continuedAt = fresh.continuedAt
        }
        return new Set(byId.keys())
      } catch {
        // Non-fatal — the cards keep the wait they last knew about.
        return null
      }
    }

    /**
     * Re-reads every card's status. Driven by the realtime signal rather
     * than a timer — the page rendering the queue subscribes and calls
     * this, so nothing runs while no task is in flight.
     *
     * A card goes when EITHER signal says the task is over:
     *
     *   - its latest webhook carries a terminal status, which is also what
     *     tells us whether to congratulate the operator; or
     *   - the server no longer lists it among this user's in-flight tasks,
     *     meaning the activity row itself has been marked COMPLETED or
     *     FAILED.
     *
     * The second one exists because the first is not always reached. The
     * webhook status is read off the raw payload of the LAST call RCS made
     * for that order, and an order that ends on a step rather than on 8 --
     * which a route with a transit stop can do, since its last events are
     * about legs — leaves a card that nothing would ever remove. The
     * activity's own status is set by our webhook handler regardless, so it
     * is the reliable half; the webhook payload is kept only for the toast
     * and for being the faster of the two.
     */
    async function refreshAll() {
      const stillActive = await refreshTransit()
      await Promise.all(
        items.value.map(async (item) => {
          await refreshItem(item)
          const status = item.webhookStatus?.status
          const terminal = !!status && isTaskTerminal(status)
          const noLongerActive = stillActive !== null && !stillActive.has(item.activityId)
          if (!terminal && !noLongerActive) return
          if (removalTimers.has(item.activityId)) return
          // Only on a status we can actually read as success. Dropping off
          // the active list tells us the task ended, not how.
          if (status && isTaskCompleted(status)) {
            toast.success(`Trolley task ${item.trolleyCode} completed`)
          }
          scheduleRemoval(item.activityId)
        }),
      )
    }

    async function addTask(input: {
      activityId: string
      taskId: string
      trolleyCode: string
      trolleyName: string
      trolleyTypeName: string
    } & Partial<TrolleyQueueTransit>) {
      // Idempotent — restoring from the backend on mount (see
      // fetchMyActiveTrolleyActivities) must not duplicate a card that a
      // live submit in this same session already added.
      if (items.value.some(item => item.activityId === input.activityId)) return

      // NO_TRANSIT first, so a live submit that does not know the transit
      // fields yet still gets well-defined nulls rather than undefined —
      // the card tests these for null.
      const item: TrolleyQueueItem = {
        ...NO_TRANSIT,
        ...input,
        queueNumber: null,
        webhookStatus: null,
      }
      items.value.push(item)

      try {
        const sequence = await fetchTrolleyActivitySequence(item.activityId)
        item.queueNumber = sequence.sequenceNumber
      } catch {
        // Non-fatal — "No urut" just stays blank.
      }
      await refreshItem(item)
      // A task submitted with a transit stop has its wait recorded
      // server-side at submit, which the submit response does not carry.
      // Only the transit fields are wanted here, never the removal pass --
      // the row was created moments ago and a card must not be reaped on
      // the same tick that added it.
      await refreshTransit()
    }

    // Wipes this role's queue and stops its polling — called on logout so a
    // shared device (one browser, operators taking turns) doesn't leak the
    // previous user's Current Queue into the next login. Client-side
    // navigation to /login doesn't reload the page, so this store would
    // otherwise just sit in memory untouched across the user switch.
    function clear() {
      items.value = []
      for (const timer of removalTimers.values()) clearTimeout(timer)
      removalTimers.clear()
    }

    return { items, addTask, refreshAll, refreshTransit, clear }
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
