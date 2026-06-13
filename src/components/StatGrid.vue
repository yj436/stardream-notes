<script setup lang="ts">
defineProps<{
  items: Array<{ label: string; value: string | number }>
}>()
</script>

<template>
  <div class="stat-grid">
    <div v-for="item in items" :key="item.label" class="stat-item">
      <strong>{{ item.value }}</strong>
      <span>{{ item.label }}</span>
    </div>
  </div>
</template>
