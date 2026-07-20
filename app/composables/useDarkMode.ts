const STORAGE_KEY = 'misel-dark-mode'

export function useDarkMode() {
  const isDark = useState<boolean>('dark-mode', () => false)

  function applyClass() {
    if (!import.meta.client) return
    document.documentElement.classList.toggle('dark', isDark.value)
  }

  function toggle() {
    isDark.value = !isDark.value
    applyClass()
    localStorage.setItem(STORAGE_KEY, String(isDark.value))
  }

  function init() {
    if (!import.meta.client) return
    const stored = localStorage.getItem(STORAGE_KEY)
    isDark.value = stored !== null
      ? stored === 'true'
      : window.matchMedia('(prefers-color-scheme: dark)').matches
    applyClass()
  }

  return { isDark, toggle, init }
}
