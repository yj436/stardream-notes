<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Bot, EyeOff, LoaderCircle, Sparkles } from 'lucide-vue-next'
import { useRoute } from 'vue-router'
import { useLive2DCompanion } from '@/composables/useLive2DCompanion'
import type { Widget, WidgetOptions } from 'l2d-widget'

const transitionDuration = 700
const defaultModelPath = '/live2d/mao/Mao.model3.json'

const route = useRoute()
const { enabled, minViewportWidth, modelSourceUrl, setEnabled } = useLive2DCompanion()
const canRender = ref(false)
const loading = ref(false)
const failed = ref(false)
let widget: Widget | null = null
let mediaQuery: MediaQueryList | null = null
let creationToken = 0

const routeAllowsCompanion = computed(() => !route.path.startsWith('/admin'))
const isActive = computed(() => enabled.value && canRender.value && routeAllowsCompanion.value && !failed.value)
const controlTitle = computed(() => {
  if (failed.value) return 'Live2D 加载失败，点击重试'
  if (!canRender.value) return '当前窗口较窄，已暂停 Live2D'
  return enabled.value ? '关闭 Live2D 看板娘' : '召唤 Live2D 看板娘'
})

const createOptions = (): WidgetOptions => ({
  position: 'bottom-left',
  size: {
    width: 280,
    height: 320,
  },
  primaryColor: 'rgba(255, 111, 168, 0.92)',
  transitionDuration,
  transitionType: 'slide',
  model: {
    path: defaultModelPath,
    scale: 1.05,
    offset: [0, -0.08],
    volume: 0,
    logLevel: 'warn',
    tips: {
      welcomeMessage: ['欢迎来到星梦笔记。', '今天也一起收集灵感吧。', '画廊里有新的光。'],
      messages: ['写累了就看看窗外。', '记得给喜欢的作品点个赞。', '灵感会在翻页时出现。'],
      duration: 3600,
      interval: 9000,
      typing: {
        param: 'ParamA',
        speed: 90,
        minValue: 0.2,
        maxValue: 0.75,
      },
      offset: {
        x: 18,
        y: -8,
      },
      style: {
        borderRadius: '8px',
        boxShadow: '0 14px 34px rgba(38, 48, 71, 0.18)',
      },
    },
  },
  menus: {
    align: 'right',
    items: [
      {
        icon: 'mdi:bed',
        label: '休眠',
        onClick: (instance) => instance.sleep(),
      },
      {
        icon: 'mdi:copyright',
        label: '模型来源',
        onClick: () => window.open(modelSourceUrl, '_blank', 'noopener,noreferrer'),
      },
      {
        icon: 'mdi:eye-off-outline',
        label: '关闭',
        onClick: () => {
          void setEnabled(false)
        },
      },
    ],
  },
  statusBar: {
    style: {
      borderRadius: '8px',
      boxShadow: '0 12px 28px rgba(38, 48, 71, 0.18)',
    },
  },
})

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms))

const cleanupCompanionNodes = () => {
  const bodyChildren = Array.from(document.body.children)
  bodyChildren.forEach((node) => {
    if (!(node instanceof HTMLElement)) return
    const isWidgetShell = node.style.position === 'fixed' && node.style.zIndex === '9999' && !!node.querySelector('canvas')
    const isWidgetStatusBar = node.style.position === 'fixed' && node.style.zIndex === '9998'
    if (isWidgetShell || isWidgetStatusBar) {
      node.remove()
    }
  })
}

const destroyWidget = async () => {
  creationToken += 1
  const current = widget
  widget = null
  if (!current) {
    cleanupCompanionNodes()
    return
  }
  const teardown = current.destroy().catch(() => undefined)
  try {
    await Promise.race([teardown, wait(transitionDuration + 350)])
  } catch {
    // The widget owns a WebGL context; failures during teardown should not break the app shell.
  } finally {
    cleanupCompanionNodes()
  }
}

const createWidgetInstance = async () => {
  if (widget || loading.value || !isActive.value) return
  const token = ++creationToken
  loading.value = true
  try {
    cleanupCompanionNodes()
    const { createWidget } = await import('l2d-widget')
    if (token !== creationToken || !isActive.value) return
    cleanupCompanionNodes()
    widget = createWidget(createOptions())
  } catch {
    failed.value = true
    setEnabled(false)
  } finally {
    loading.value = false
  }
}

const syncWidget = async () => {
  if (isActive.value) {
    await createWidgetInstance()
    return
  }
  await destroyWidget()
}

const updateViewportState = () => {
  canRender.value = window.innerWidth >= minViewportWidth
}

const setCompanionEnabled = async (value: boolean) => {
  failed.value = false
  setEnabled(value)
  await syncWidget()
}

const toggleCompanion = () => {
  void setCompanionEnabled(!enabled.value || failed.value)
}

onMounted(() => {
  updateViewportState()
  window.addEventListener('resize', updateViewportState)
  mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  mediaQuery.addEventListener('change', syncWidget)
  void syncWidget()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateViewportState)
  mediaQuery?.removeEventListener('change', syncWidget)
  void destroyWidget()
})

watch([isActive, () => route.path, enabled], () => {
  void syncWidget()
})
</script>

<template>
  <div v-if="routeAllowsCompanion" :class="['live2d-companion-control', { sleeping: !isActive }]">
    <button
      type="button"
      class="live2d-companion-toggle"
      :class="{ active: isActive, failed }"
      :aria-label="controlTitle"
      :aria-pressed="isActive"
      :title="controlTitle"
      @click="toggleCompanion"
    >
      <LoaderCircle v-if="loading" :size="18" class="spin-icon" />
      <Bot v-else-if="failed" :size="18" />
      <Sparkles v-else-if="isActive" :size="18" />
      <EyeOff v-else :size="18" />
    </button>
  </div>
</template>
