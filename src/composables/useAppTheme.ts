import { ref, watch } from 'vue'

type AppTheme = 'light' | 'dark'

const THEME_KEY = 'stardream:app-theme'

const loadTheme = (): AppTheme => {
  try {
    const stored = window.localStorage.getItem(THEME_KEY)
    if (stored === 'dark' || stored === 'light') return stored
  } catch { /* ignore */ }
  if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'dark'
  return 'light'
}

const currentTheme = ref<AppTheme>(loadTheme())

const applyTheme = (theme: AppTheme) => {
  currentTheme.value = theme
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
    root.setAttribute('data-theme', 'dark')
  } else {
    root.classList.remove('dark')
    root.setAttribute('data-theme', 'light')
  }
  try {
    window.localStorage.setItem(THEME_KEY, theme)
  } catch { /* ignore */ }
}

export function useAppTheme() {
  const isDark = ref(currentTheme.value === 'dark')

  const toggle = () => {
    const next: AppTheme = currentTheme.value === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    isDark.value = next === 'dark'
  }

  const setDark = () => {
    applyTheme('dark')
    isDark.value = true
  }

  const setLight = () => {
    applyTheme('light')
    isDark.value = false
  }

  watch(currentTheme, (val) => {
    isDark.value = val === 'dark'
  })

  return { currentTheme, isDark, toggle, setDark, setLight, applyTheme }
}

// Auto-apply on import
applyTheme(loadTheme())
