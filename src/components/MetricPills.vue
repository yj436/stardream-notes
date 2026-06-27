<script setup lang="ts">
import type { Component } from 'vue'

export interface MetricPill {
  label: string
  value: string | number
  icon?: Component
}

defineProps<{
  items: MetricPill[]
}>()
</script>

<template>
  <div class="metric-pills">
    <span v-for="item in items" :key="item.label">
      <component :is="item.icon" v-if="item.icon" :size="15" />
      {{ item.value }} {{ item.label }}
    </span>
  </div>
</template>
