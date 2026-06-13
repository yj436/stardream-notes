<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

const enabled = ref(true)
let particles: { element: HTMLDivElement; x: number; y: number; life: number; maxLife: number }[] = []
let rafId = 0
let lastX = 0
let lastY = 0

const colors = ['#ff76a9', '#5979ff', '#41cdb7', '#f5b84b', '#c084fc']

const spawn = (x: number, y: number) => {
  const el = document.createElement('div')
  const color = colors[Math.floor(Math.random() * colors.length)]
  const size = 4 + Math.random() * 6
  const life = 300 + Math.random() * 400
  el.style.cssText = `
    position: fixed;
    z-index: 9999;
    pointer-events: none;
    width: ${size}px;
    height: ${size}px;
    border-radius: 50%;
    background: ${color};
    left: ${x - size / 2}px;
    top: ${y - size / 2}px;
    opacity: 0.9;
    transition: opacity ${life}ms ease, transform ${life}ms ease;
  `
  document.body.appendChild(el)
  particles.push({ element: el, x, y, life: 0, maxLife: life })

  // random drift
  const dx = (Math.random() - 0.5) * 12
  const dy = (Math.random() - 0.5) * 12 - 8
  requestAnimationFrame(() => {
    el.style.transform = `translate(${dx}px, ${dy}px) scale(0.3)`
    el.style.opacity = '0'
  })
}

const tick = () => {
  const now = Date.now()
  particles = particles.filter((p) => {
    if (now - p.life > p.maxLife) {
      p.element.remove()
      return false
    }
    return true
  })
  rafId = requestAnimationFrame(tick)
}

const onMouseMove = (e: MouseEvent) => {
  if (!enabled.value) return
  const dist = Math.hypot(e.clientX - lastX, e.clientY - lastY)
  if (dist > 18) {
    spawn(e.clientX, e.clientY)
    lastX = e.clientX
    lastY = e.clientY
  }
}

onMounted(() => {
  window.addEventListener('mousemove', onMouseMove, { passive: true })
  rafId = requestAnimationFrame(tick)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', onMouseMove)
  cancelAnimationFrame(rafId)
  particles.forEach((p) => p.element.remove())
  particles = []
})

// Expose toggle
const toggle = () => {
  enabled.value = !enabled.value
}

defineExpose({ toggle })
</script>

<template>
  <slot />
</template>
