export type Theme = 'dark' | 'light'

const STORAGE_KEY = 'theme'

/** Dark by default; the choice is remembered per browser. The head script in nuxt.config applies it before first paint. */
export function useTheme() {
  const theme = useState<Theme>('theme', () =>
    import.meta.client && document.documentElement.dataset.theme === 'light' ? 'light' : 'dark')

  function setTheme(next: Theme) {
    theme.value = next
    document.documentElement.dataset.theme = next
    try { localStorage.setItem(STORAGE_KEY, next) }
    catch { /* storage blocked: theme still applies for this visit */ }
  }

  return {
    theme: readonly(theme),
    setTheme,
    toggleTheme: () => setTheme(theme.value === 'dark' ? 'light' : 'dark'),
  }
}
