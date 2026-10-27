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
