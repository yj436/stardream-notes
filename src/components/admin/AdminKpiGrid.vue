<script setup lang="ts">
import type { AdminKpiItem } from './adminTypes'

defineProps<{
  items: AdminKpiItem[]
}>()
</script>

<template>
  <section class="admin-kpi-grid" aria-label="运营指标">
    <article v-for="item in items" :key="item.label" :class="['admin-kpi-card', item.tone]">
      <span><component :is="item.icon" :size="20" /></span>
      <div>
        <strong>{{ item.value }}</strong>
        <small>{{ item.label }}</small>
      </div>
      <p>{{ item.helper }}</p>
    </article>
  </section>
</template>
