import { ref, onMounted, onUnmounted } from 'vue'

export function useLazyImage(src: string) {
  const loaded = ref(false)
  const error = ref(false)
  const visible = ref(false)

  let observer: IntersectionObserver | null = null
  let imgEl: HTMLElement | null = null

  const img = new Image()
  img.onload = () => {
    loaded.value = true
  }
  img.onerror = () => {
    error.value = true
    loaded.value = true // Don't block rendering on error
  }

  const loadImage = () => {
    if (loaded.value) return
    img.src = src
  }

  const observe = (el: HTMLElement) => {
    imgEl = el
    observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          visible.value = true
          loadImage()
          observer?.unobserve(el)
          observer?.disconnect()
        }
      },
      { rootMargin: '200px' },
    )
    observer.observe(el)
  }

  // Immediate load if IntersectionObserver not available
  onMounted(() => {
    if (!imgEl && !observer) {
      loadImage()
    }
  })

  onUnmounted(() => {
    observer?.disconnect()
  })

  return { loaded, error, visible, observe }
}
