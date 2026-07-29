export const useSidebarStore = defineStore('sidebar', () => {
  const isCollapsed = ref(false)
  const isMobileOpen = ref(false)

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
