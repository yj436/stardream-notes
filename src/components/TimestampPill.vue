<script setup lang="ts">
import { computed, ref } from 'vue'
import { CalendarClock, Copy } from 'lucide-vue-next'
import { formatDateTime, formatRelativeTime, formatUnixTimestamp, getTimestampTitle, toDate } from '@/utils/time'

const props = withDefaults(
  defineProps<{
    value: string | number | Date
    label?: string
    compact?: boolean
    showCopy?: boolean
  }>(),
  {
    label: '',
    compact: false,
    showCopy: false,
  },
)

const copied = ref(false)
const date = computed(() => toDate(props.value))
const relative = computed(() => formatRelativeTime(date.value))
const exact = computed(() => formatDateTime(date.value))
const unix = computed(() => String(formatUnixTimestamp(date.value)))
const title = computed(() => getTimestampTitle(date.value))

const copyTimestamp = async () => {
  const text = `${exact.value} | Unix ${unix.value} | ${date.value.toISOString()}`
  try {
    await navigator.clipboard.writeText(text)
    copied.value = true
    window.setTimeout(() => {
      copied.value = false
    }, 1200)
  } catch {
    copied.value = false
  }
}
</script>

<template>
  <span :class="['timestamp-pill', { compact }]" :title="title">
    <CalendarClock :size="compact ? 14 : 15" />
    <time :datetime="date.toISOString()">
      <template v-if="label">{{ label }} </template>
      {{ compact ? relative : `${relative} · ${exact}` }}
    </time>
    <button v-if="showCopy" type="button" :aria-label="copied ? '时间戳已复制' : '复制时间戳'" @click.stop.prevent="copyTimestamp">
      <Copy :size="13" />
      {{ copied ? '已复制' : '时间戳' }}
    </button>
  </span>
</template>
