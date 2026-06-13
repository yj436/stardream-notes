import { onMounted, onUnmounted, ref, type Ref } from 'vue'

export function useInfiniteScroll(
  callback: () => void | Promise<void>,
  options?: {
    threshold?: number
    batchSize?: number
  },
) {
  const loading = ref(false)
  const finished = ref(false)
  const page = ref(1)

  let ticking = false
  let cleanup: (() => void) | null = null

  const onScroll = async () => {
    if (ticking || loading.value || finished.value) return
    const threshold = options?.threshold ?? 400
    const scrolledToBottom =
      window.innerHeight + window.scrollY >= document.body.scrollHeight - threshold
    if (!scrolledToBottom) return

    ticking = true
    loading.value = true
    page.value++

    try {
      await callback()
    } finally {
      loading.value = false
      ticking = false
    }
  }

  const reset = () => {
    finished.value = false
    page.value = 1
  }

  const loadMore = async (manual = false) => {
    if (!manual && (loading.value || finished.value)) return
    loading.value = true
    try {
      await callback()
    } finally {
      loading.value = false
    }
  }

  const stop = () => {
    finished.value = true
  }

  // Observer-based approach as fallback for better perf
  let observer: IntersectionObserver | null = null

  const setupObserver = () => {
    const sentinel = document.createElement('div')
    sentinel.id = 'infinite-scroll-sentinel'
    sentinel.style.cssText = 'height:1px;width:100%;'
    document.body.appendChild(sentinel)

    observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !loading.value && !finished.value) {
          void onScroll()
        }
      },
      { rootMargin: `${options?.threshold ?? 400}px` },
    )

    observer.observe(sentinel)
    cleanup = () => {
      observer?.disconnect()
      sentinel.remove()
    }
  }

  onMounted(() => {
    window.addEventListener('scroll', onScroll, { passive: true })
    setupObserver()
  })

  onUnmounted(() => {
    window.removeEventListener('scroll', onScroll)
    cleanup?.()
  })

  return { loading, finished, page, reset, loadMore, stop }
}
