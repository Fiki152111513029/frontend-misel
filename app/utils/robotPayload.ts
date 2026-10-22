/**
 * Whether RCS telemetry says this robot is carrying something.
 *
 * Shared by both maps on purpose. They used to decide this separately —
 * 2D tested the number, 3D kept a blacklist of strings — so a payLoad like
 * "0.0" read as empty on one map and loaded on the other, and the 3D AMR
 * appeared to carry a rack permanently.
 *
 * The numeric test is the right one: payLoad is a count, and anything that
 * is not a number above zero means nothing is on board.
 */
export function isCarryingPayload(payload: string | number | null | undefined): boolean {
  if (payload == null) return false
  const value = Number(String(payload).trim())
  return Number.isFinite(value) && value > 0
}
