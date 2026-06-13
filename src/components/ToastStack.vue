<script setup lang="ts">
import { CheckCircle2, Info, TriangleAlert } from 'lucide-vue-next'
import { useBlogStore } from '@/stores/blog'

const blog = useBlogStore()
</script>

<template>
  <Teleport to="body">
    <div class="toast-stack" aria-live="polite">
      <div v-for="message in blog.notifications" :key="message.id" :class="['toast', message.tone]">
        <CheckCircle2 v-if="message.tone === 'success'" :size="18" />
        <TriangleAlert v-else-if="message.tone === 'warning'" :size="18" />
        <Info v-else :size="18" />
        <span>{{ message.text }}</span>
      </div>
    </div>
  </Teleport>
</template>
