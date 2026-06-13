import { ref, type Ref } from 'vue'

export function useDebounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay = 300,
): { debounced: (...args: Parameters<T>) => void; cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | null = null

  const debounced = (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn(...args)
      timer = null
    }, delay)
  }

  const cancel = () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  return { debounced, cancel }
}

export function useDebounceRef<T>(initialValue: T, delay = 300): {
  value: Ref<T>
  debounced: Ref<T>
} {
  const value = ref(initialValue) as Ref<T>
  const debounced = ref(initialValue) as Ref<T>
  let timer: ReturnType<typeof setTimeout> | null = null

  const handler = (val: T) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      debounced.value = val
      timer = null
    }, delay)
  }

  // Watch is not easily composable in plain functions, return the pair
  return { value, debounced }
}
