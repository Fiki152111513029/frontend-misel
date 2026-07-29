const COLLAPSED_STORAGE_KEY = 'sidebar-collapsed'

export const useSidebarStore = defineStore('sidebar', () => {
  // The store is the single source of truth for collapsed state, persisted
  // to localStorage here — not in AppSidebar — so that a collapse() call
  // (e.g. redirecting an Operator straight into Mainline on login) can't get
  // silently reverted by a stale value being restored on mount later.
  const isCollapsed = ref(
    import.meta.client ? localStorage.getItem(COLLAPSED_STORAGE_KEY) === 'true' : false,
  )
  const isMobileOpen = ref(false)

  if (import.meta.client) {
    watch(isCollapsed, (value) => {
      localStorage.setItem(COLLAPSED_STORAGE_KEY, String(value))
    })
  }

  function toggleCollapse() {
    isCollapsed.value = !isCollapsed.value
  }

  function collapse() {
    isCollapsed.value = true
  }

  function openMobile() {
    isMobileOpen.value = true
  }

  function closeMobile() {
    isMobileOpen.value = false
  }

  function toggleMobile() {
    isMobileOpen.value = !isMobileOpen.value
  }

  return { isCollapsed, isMobileOpen, toggleCollapse, collapse, openMobile, closeMobile, toggleMobile }
})
