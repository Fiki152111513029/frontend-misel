// Shared shift-filter behavior for the AMR Performance / Trolley Activities
// shift charts: defaults to whichever Shift is actually running right now
// (see GET /shifts/current — accounts for the weekly A/B rotation) instead
// of an arbitrary first-in-list pick, and keeps following it automatically
// as shifts change over the day — but only while the chart is actually
// looking at "now" (isViewingCurrent, e.g. Daily + today's date), and never
// overriding a shift the user picked manually themselves (until they
// reload), so it can't yank the selection out from under someone comparing
// a specific shift or a past date.
export function useShiftFilter(isViewingCurrent: ComputedRef<boolean>) {
  const { items: shifts, fetchShiftOptions, currentShiftId, fetchCurrentShift } = useShiftOptions()
  const shiftId = ref<string | null>(null)
  const userPickedShift = ref(false)

  function handleManualShiftChange() {
    userPickedShift.value = true
  }

  function applyCurrentShiftIfEligible() {
    if (userPickedShift.value || !isViewingCurrent.value) return
    if (currentShiftId.value && shifts.value.some(shift => shift.id === currentShiftId.value)) {
      shiftId.value = currentShiftId.value
    } else if (!shiftId.value && shifts.value.length > 0) {
      shiftId.value = shifts.value[0]!.id
    }
  }

  async function initShiftFilter() {
    await fetchShiftOptions()
    await fetchCurrentShift()
    applyCurrentShiftIfEligible()
    // Still nothing selected (e.g. no shift is "current" right now) — fall
    // back to the first one so the chart isn't left with no data at all.
    if (!shiftId.value && shifts.value.length > 0) shiftId.value = shifts.value[0]!.id
  }

  async function refreshShiftFilter() {
    await fetchCurrentShift()
    applyCurrentShiftIfEligible()
  }

  return { shifts, shiftId, initShiftFilter, refreshShiftFilter, handleManualShiftChange }
}
