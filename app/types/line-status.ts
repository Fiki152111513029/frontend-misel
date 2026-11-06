/**
 * The four things a production line can announce from Custom Task.
 *
 * RUNNING_* states a fact ("we are on LH right now"); CHANGE_* asks for
 * something ("send us the other side"). A line is only ever saying one of
 * them at a time — the newest press replaces the last.
 */
export type LineStatusKind =
  | 'RUNNING_LH'
  | 'RUNNING_RH'
  | 'CHANGE_LH'
  | 'CHANGE_RH'

/** What one line is currently saying. One row per line, server-side. */
export interface LineStatus {
  /** The Control Task group the line is known by, e.g. "WRL31". */
  groupName: string
  kind: LineStatusKind
  /** Who pressed it. Null if that operator has since been removed. */
  raisedBy: string | null
  at: string
}

export interface RaiseLineStatusInput {
  groupName: string
  kind: LineStatusKind
}
