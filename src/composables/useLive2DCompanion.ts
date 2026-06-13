import { computed, ref } from 'vue'

const storageKey = 'stardream:l2d-companion'
const modelSourceUrl = 'https://www.live2d.com/en/learn/sample/'
const minViewportWidth = 760
const enabled = ref(true)

const readPreference = () => {
  if (typeof window === 'undefined') return true
  const stored = window.localStorage.getItem(storageKey)
  if (stored) return stored === 'on'
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

if (typeof window !== 'undefined') {
  enabled.value = readPreference()
  window.addEventListener('storage', (event) => {
    if (event.key === storageKey) {
      enabled.value = event.newValue ? event.newValue === 'on' : readPreference()
    }
  })
}

export function useLive2DCompanion() {
  const isEnabled = computed(() => enabled.value)

  const setEnabled = (value: boolean) => {
    enabled.value = value
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(storageKey, value ? 'on' : 'off')
    }
  }

  const toggle = () => {
    setEnabled(!enabled.value)
  }

  return {
    enabled: isEnabled,
    minViewportWidth,
    modelSourceUrl,
    setEnabled,
    toggle,
  }
}
