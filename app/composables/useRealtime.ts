import { io, type Socket } from 'socket.io-client'

/**
 * Replaces the per-page setInterval polling with a push from the server.
 *
 * The socket carries no data — only "topic X changed" — so a page keeps
 * using the same REST endpoint it already had, just calling it when
 * something actually happened instead of every few seconds. Payload
 * shapes, permissions and query params all stay in the REST layer.
 */
export type RealtimeTopic =
  | 'robots'
  | 'tasks'
  | 'alarms'
  | 'custom-tasks'
  | 'trolley-activities'
  | 'stock'

const REALTIME_EVENT = 'changed'

/**
 * The one channel that carries data rather than a signal.
 *
 * Robot positions have to arrive every second for the map to track the
 * floor. As a signal that meant every open browser issuing a full
 * GET /robots on every tick, so the cost of a responsive map grew with the
 * number of screens. Pushed this way it is one small message per tick,
 * shared by everyone watching, and the browsers make no request at all.
 */
const ROBOT_POSITIONS_EVENT = 'robots:positions'

export interface RobotPositionUpdate {
  id: string
  areaId: number | null
  x: number
  y: number
  orientation: number
  state: string | null
  battery: number | null
  payload: string | null
}

/**
 * How often a subscriber refreshes anyway. This is NOT the old polling
 * cadence — it is a safety net for when the socket cannot connect at all
 * (a proxy without WebSocket upgrade headers, a corporate firewall), so
 * the app degrades to slow-but-working rather than silently frozen. While
 * the socket is up, nothing fires on this timer.
 */
const FALLBACK_POLL_MS = 60_000

interface RealtimeState {
  socket: Socket | null
  connected: boolean
  /** Subscribers per topic, so one socket serves every page and component. */
  handlers: Map<RealtimeTopic, Set<() => void>>
  /** Subscribers to the robot-position stream. */
  positionHandlers: Set<(robots: RobotPositionUpdate[]) => void>
}

function state() {
  return useState<RealtimeState>('realtime', () => ({
    socket: null,
    connected: false,
    handlers: new Map(),
    positionHandlers: new Set(),
  }))
}

function apiOrigin(apiBase: string): { url: string, path: string } {
  // apiBase can be a bare origin ("http://host:3001") or sit behind a
  // proxy prefix ("https://host/api"). socket.io needs the origin and the
  // handshake path separately, and the path has to carry the same prefix
  // or the proxy will not route it.
  try {
    const parsed = new URL(apiBase, window.location.origin)
    const prefix = parsed.pathname.replace(/\/$/, '')
    return { url: parsed.origin, path: `${prefix}/socket.io` }
  } catch {
    return { url: window.location.origin, path: '/socket.io' }
  }
}

function ensureSocket() {
  const realtime = state()
  if (realtime.value.socket) return realtime.value.socket

  const token
    = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
  if (!token) return null

  const { url, path } = apiOrigin(useRuntimeConfig().public.apiBase as string)
  const socket = io(`${url}/realtime`, {
    path,
    auth: { token },
    // Polling first, then let Socket.IO upgrade to WebSocket on its own.
    // Trying WebSocket first means that behind a proxy without the upgrade
    // headers the very first attempt fails loudly in the console before the
    // fallback kicks in — and if the fallback is slow or blocked, the app
    // sits disconnected. Starting on polling always connects, then quietly
    // moves to WebSocket wherever the proxy allows it.
    transports: ['polling', 'websocket'],
    reconnectionDelayMax: 10_000,
  })

  socket.on('connect', () => {
    realtime.value.connected = true
  })
  socket.on('disconnect', () => {
    realtime.value.connected = false
  })
  socket.on('connect_error', () => {
    realtime.value.connected = false
  })

  socket.on(REALTIME_EVENT, (message: { topic: RealtimeTopic }) => {
    for (const handler of realtime.value.handlers.get(message.topic) ?? []) {
      handler()
    }
  })

  socket.on(ROBOT_POSITIONS_EVENT, (message: { robots: RobotPositionUpdate[] }) => {
    for (const handler of realtime.value.positionHandlers) {
      handler(message.robots ?? [])
    }
  })

  realtime.value.socket = socket
  return socket
}

/** Closes the shared socket — called on logout so the next user reconnects. */
export function closeRealtime() {
  const realtime = state()
  realtime.value.socket?.disconnect()
  realtime.value.socket = null
  realtime.value.connected = false
  realtime.value.handlers.clear()
}

/**
 * Runs `onChange` whenever the server says one of `topics` changed, and
 * unsubscribes when the component goes away.
 *
 * It does NOT fire on mount — the caller does its own first load, which
 * keeps the initial fetch explicit and lets it show a spinner while a
 * background refresh does not.
 */
export function useRealtime(
  topics: RealtimeTopic | RealtimeTopic[],
  onChange: () => void,
) {
  const realtime = state()
  const list = Array.isArray(topics) ? topics : [topics]

  onMounted(() => {
    ensureSocket()
    for (const topic of list) {
      const existing = realtime.value.handlers.get(topic) ?? new Set()
      existing.add(onChange)
      realtime.value.handlers.set(topic, existing)
    }
  })

  onBeforeUnmount(() => {
    for (const topic of list) {
      realtime.value.handlers.get(topic)?.delete(onChange)
    }
  })

  // The net the socket hangs over. Skipped entirely while connected, so a
  // healthy deployment makes no periodic requests at all.
  let fallbackTimer: ReturnType<typeof setInterval> | null = null
  onMounted(() => {
    fallbackTimer = setInterval(() => {
      if (!realtime.value.connected) onChange()
    }, FALLBACK_POLL_MS)
  })
  onBeforeUnmount(() => {
    if (fallbackTimer) clearInterval(fallbackTimer)
    fallbackTimer = null
  })

  return { connected: computed(() => realtime.value.connected) }
}

/**
 * Subscribes to the robot-position stream.
 *
 * Unlike useRealtime, the handler receives the positions directly — there
 * is no follow-up request. Pair it with one REST read on mount for the
 * fields positions do not carry (name, device serial, area links).
 */
export function useRobotPositions(
  onPositions: (robots: RobotPositionUpdate[]) => void,
) {
  const realtime = state()

  onMounted(() => {
    ensureSocket()
    realtime.value.positionHandlers.add(onPositions)
  })

  onBeforeUnmount(() => {
    realtime.value.positionHandlers.delete(onPositions)
  })

  return { connected: computed(() => realtime.value.connected) }
}
