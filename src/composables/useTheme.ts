import { computed, ref, watch } from 'vue'
import type { ProfileTheme } from '@/types/content'

const currentTheme = ref<ProfileTheme>('sakura')
const darkMode = ref(false)

const themeClassMap: Record<ProfileTheme, string> = {
  sakura: 'theme-sakura',
  starlight: 'theme-starlight',
  mint: 'theme-mint',
}

const applyDarkMode = (value: boolean) => {
  document.documentElement.classList.toggle('dark', value)
  window.localStorage.setItem('stardream:dark', value ? '1' : '0')
}

if (typeof window !== 'undefined') {
  darkMode.value = window.localStorage.getItem('stardream:dark') === '1'
  applyDarkMode(darkMode.value)
}

export function useTheme() {
  const current = computed(() => currentTheme.value)
  const themeClass = computed(() => themeClassMap[currentTheme.value] ?? 'theme-sakura')
  const isDark = computed(() => darkMode.value)

  const setTheme = (theme: ProfileTheme) => {
    currentTheme.value = theme
    document.documentElement.setAttribute('data-profile-theme', theme)
  }

  const cycleTheme = () => {
    const themes: ProfileTheme[] = ['sakura', 'starlight', 'mint']
    const idx = themes.indexOf(currentTheme.value)
    setTheme(themes[(idx + 1) % themes.length])
  }

  const toggleTheme = () => {
    darkMode.value = !darkMode.value
  }

  watch(currentTheme, setTheme)
  watch(darkMode, applyDarkMode)

  return { current, themeClass, isDark, setTheme, cycleTheme, toggleTheme }
}
