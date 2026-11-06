import type { LineStatusKind } from '~/types/line-status'

/**
 * The four presses, in the order they appear at the foot of a group.
 *
 * Running before Ganti, LH before RH — the same reading order as the
 * buttons on the line's own panel, so an operator reaching for one does
 * not have to hunt.
 */
export const LINE_STATUS_KINDS: LineStatusKind[] = [
  'RUNNING_LH',
  'RUNNING_RH',
  'CHANGE_LH',
  'CHANGE_RH',
]

/**
 * Which side of the harness the press is about.
 *
 * Colour is driven off this rather than off the kind, because the side is
 * the thing the floor reads from a distance: every LH button is blue and
 * every RH button red, whether it is a status or a request.
 */
export function lineStatusSide(kind: LineStatusKind): 'LH' | 'RH' {
  return kind.endsWith('_LH') ? 'LH' : 'RH'
}

const SIDE_COLOR: Record<'LH' | 'RH', string> = {
  LH: '#01ADEF',
  RH: '#ED1C24',
}

export function lineStatusColor(kind: LineStatusKind): string {
  return SIDE_COLOR[lineStatusSide(kind)]
}

/**
 * What the button says in Custom Task.
 *
 * No line name in it: the group heading directly above already says which
 * line this is, and repeating it costs a third line of wrapped text on a
 * phone where the buttons sit two to a row.
 */
const BUTTON_LABEL: Record<LineStatusKind, string> = {
  RUNNING_LH: 'SAAT INI RUNNING LH',
  RUNNING_RH: 'SAAT INI RUNNING RH',
  CHANGE_LH: 'REQUEST GANTI LH',
  CHANGE_RH: 'REQUEST GANTI RH',
}

export function lineStatusButtonLabel(kind: LineStatusKind): string {
  return BUTTON_LABEL[kind]
}

/**
 * What it reads as on the Checking Area board.
 *
 * The line name IS in this one, and has to be: Checking Area watches every
 * line at once, so "SEDANG RUNNING LH" on its own would not say whose.
 */
const BOARD_PHRASE: Record<LineStatusKind, string> = {
  RUNNING_LH: 'SEDANG RUNNING LH',
  RUNNING_RH: 'SEDANG RUNNING RH',
  CHANGE_LH: 'REQUEST GANTI LH',
  CHANGE_RH: 'REQUEST GANTI RH',
}

export function lineStatusBoardText(
  groupName: string,
  kind: LineStatusKind,
): string {
  return `${groupName} ${BOARD_PHRASE[kind]}`
}

/**
 * Whether the warehouse has to go and do something about it.
 *
 * Only the Ganti requests: "we are running LH" is the line telling the
 * board where it stands, and ringing for that would train the floor to
 * ignore the sound by the end of the first shift.
 */
export function isLineStatusActionable(kind: LineStatusKind): boolean {
  return kind === 'CHANGE_LH' || kind === 'CHANGE_RH'
}
