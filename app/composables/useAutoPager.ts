import type { MaybeRefOrGetter } from 'vue'

/**
 * Pages through a list on a timer, for panels on a wall display.
 *
 * A board nobody touches cannot scroll, so a panel that holds more rows
 * than it has room for has to show them in turns. Every panel on Live Map
 * that does this shares the same cadence from here rather than each
 * running its own timer with its own idea of how long a page should sit —
 * three panels drifting a second apart from each other is distracting in a
 * way one steady rhythm is not.
 *
 * The page advances only while there is more than one page, wraps at the
 * end, and never leaves the reader on a page that no longer exists after
 * the list shrinks.
 */
export function useAutoPager<T>(
  items: MaybeRefOrGetter<T[]>,
  options: {
    /** Rows on screen at once. */
    pageSize: number
    /** How long a page sits. 0 or less turns the timer off entirely. */
    intervalMs?: number
  },
) {
  const { pageSize, intervalMs = 5000 } = options

  const page = ref(1)
  const all = computed(() => toValue(items))
  const pageCount = computed(() => Math.max(1, Math.ceil(all.value.length / pageSize)))
  const pagedItems = computed(() =>
    all.value.slice((page.value - 1) * pageSize, page.value * pageSize),
  )

  let timer: ReturnType<typeof setInterval> | null = null

  function stop() {
    if (!timer) return
    clearInterval(timer)
    timer = null
  }

  function start() {
    // Restarted rather than left running whenever the page is set by hand,
    // so a reader who just moved it gets a full dwell on what they chose
    // instead of whatever was left of the current tick.
    stop()
    if (intervalMs <= 0) return
    timer = setInterval(() => {
      if (pageCount.value <= 1) return
      page.value = page.value >= pageCount.value ? 1 : page.value + 1
    }, intervalMs)
  }

  /** Move by hand. Wraps the same way the timer does. */
  function step(delta: number) {
    if (pageCount.value <= 1) return
    const next = page.value + delta
    page.value
      = next < 1 ? pageCount.value : next > pageCount.value ? 1 : next
    start()
  }

  // Robots going offline, alarms clearing, chargers leaving the map: any of
  // them can shorten the list under a reader sitting on the last page.
  watch(pageCount, (count) => {
    if (page.value > count) page.value = count
  })

  onMounted(start)
  onBeforeUnmount(stop)

  return { page, pageCount, pagedItems, step }
}
