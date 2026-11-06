import type { WarehouseNotice } from '~/composables/useRealtime'

/**
 * The sentence a warehouse notice reads as.
 *
 * Written here rather than on the server: the server sends the facts, so
 * rewording any of this never needs a backend deploy.
 */
export function warehouseNoticeText(notice: WarehouseNotice): string {
  const who = notice.requester ?? 'Line'
  const amr = notice.robotName ?? 'AMR'
  const node = notice.nodeCode

  switch (notice.kind) {
    case 'pickup-held':
      return `"${who}" meminta rak kosong tapi rak belum ready, segera siapkan rak kosong di titik "${node}"`
    case 'pickup-running':
      return `"${amr}" menuju titik "${node}" di warehouse untuk mengambil rak kosong`
    case 'drop-held':
      return `"${who}" akan mengirim rak finish good ke "${node}" di warehouse namun masih ada rak kosong di sana`
    case 'drop-running':
      return `"${amr}" menuju titik "${node}" di warehouse membawa rak finish good`
    case 'drop-done':
      return `Finish Good Ready — rak finish good sudah diletakkan di titik "${node}"`
  }
}

/**
 * Which sound to play, or null for none.
 *
 * Only the two that need someone to get up and do something make a sound.
 * The "on its way" notices are there to be read, and ringing for every one
 * would train the floor to ignore the sound altogether.
 */
export function warehouseNoticeSound(notice: WarehouseNotice): string | null {
  if (notice.kind === 'pickup-held') return '/ringtone/amr.wav'
  // Both the warning that a drop is blocked and the news that one has
  // landed are things the warehouse has to go and handle, so both ring.
  if (notice.kind === 'drop-held' || notice.kind === 'drop-done') {
    return '/ringtone/amr-finish.wav'
  }
  return null
}

/**
 * Earlier notices about the same order that this one makes obsolete.
 *
 * A task reports its progress as a sequence, and each step answers the one
 * before it: "no empty rack ready" stops being true the moment the AMR is
 * on its way. Keeping both would leave the warehouse reading a warning
 * that has already been dealt with, and the real ones would get lost in
 * the pile.
 */
const SUPERSEDES: Record<WarehouseNotice['kind'], WarehouseNotice['kind'][]> = {
  'pickup-held': [],
  'pickup-running': ['pickup-held'],
  'drop-held': [],
  'drop-running': ['drop-held'],
  'drop-done': ['drop-held', 'drop-running'],
}

export function supersededKinds(
  kind: WarehouseNotice['kind'],
): WarehouseNotice['kind'][] {
  return SUPERSEDES[kind]
}

/**
 * Notices asking for something to be done at a node, as opposed to
 * reporting an AMR on its way there.
 *
 * Correcting that bin by hand settles exactly these, so they are the ones
 * cleared when an operator acts on the node.
 */
export function isWarehouseNoticeActionable(notice: WarehouseNotice): boolean {
  return (
    notice.kind === 'pickup-held'
    || notice.kind === 'drop-held'
    || notice.kind === 'drop-done'
  )
}

/** Needs attention now, as opposed to being informational. */
export function isWarehouseNoticeUrgent(notice: WarehouseNotice): boolean {
  return (
    notice.kind === 'pickup-held'
    || notice.kind === 'drop-held'
    // Something is physically waiting to be collected — that is the most
    // actionable notice of the lot, not a status update.
    || notice.kind === 'drop-done'
  )
}
