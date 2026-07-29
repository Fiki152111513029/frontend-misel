export function useSidebar() {
  const store = useSidebarStore()
  return {
    isCollapsed: computed(() => store.isCollapsed),
    isMobileOpen: computed(() => store.isMobileOpen),
    toggleCollapse: store.toggleCollapse,
    collapse: store.collapse,
    toggleMobile: store.toggleMobile,
    closeMobile: store.closeMobile,
  }
}
