// What the Dashboard is currently scoped to — the Factory Map on screen and
// the day being looked at — shared between the controls that own them (the
// map card's dropdown, the stats bar's day picker) and every panel that has
// to agree with them: AMR Fleet Real-time Status, Performance, AMR
// Performance and Total Production.
//
// Before this, each panel fetched on its own and every day-scoped one was
// hardcoded to "today", so the Dashboard could not be used to look back at
// a past day and the numbers beside the map described robots that were not
// on it.
function todayIso() {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  // Local date parts, not toISOString() — that converts to UTC first and
  // rolls back a day for anyone east of UTC during the evening.
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export const useDashboardFiltersStore = defineStore('dashboard-filters', () => {
  // --- Area (Factory Map) ---
  // `areaNumber` is the Factory Map's own areaNumber, which is the areaId
  // robots report. A map with no areaNumber is linked to no robot, which is
  // why the map draws no markers for it — the panels follow that and show
  // nothing rather than silently falling back to every area.
  const areaNumber = ref<number | null>(null)
  const mapName = ref<string | null>(null)
  // False until the map card has resolved its first selection. The panels
  // wait for it so they never flash site-wide numbers on load and then
  // quietly narrow a moment later.
  const isAreaResolved = ref(false)

  function setArea(input: { areaNumber: number | null, mapName: string | null }) {
    areaNumber.value = input.areaNumber
    mapName.value = input.mapName
    isAreaResolved.value = true
  }

  // No maps exist at all — resolved, but with nothing to scope to.
  function markAreaResolvedWithoutMap() {
    areaNumber.value = null
    mapName.value = null
    isAreaResolved.value = true
  }

  // --- Day ---
  const selectedDate = ref(todayIso())
  const isToday = computed(() => selectedDate.value === todayIso())

  function setDate(date: string) {
    selectedDate.value = date || todayIso()
  }

  function resetToToday() {
    selectedDate.value = todayIso()
  }

  return {
    areaNumber,
    mapName,
    isAreaResolved,
    setArea,
    markAreaResolvedWithoutMap,
    selectedDate,
    isToday,
    setDate,
    resetToToday,
  }
})
