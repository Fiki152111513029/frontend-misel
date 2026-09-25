// What a scanned abjad resolves to: exactly the RCS task order that would be
// sent, so the confirmation screen and the submit cannot disagree.
export interface CustomTaskPreview {
  controlTaskId: string
  abjad: string
  name: string
  route: string[]
  taskPath: string
  modelProcessCode: string
  fromSystem: string
  priority: number
}

export interface ReleasedCustomTask extends CustomTaskPreview {
  /** The abjad followed by %Y%m%d%H%M%S — what RCS and the webhooks call it. */
  orderId: string
  releasedAt: string
}
