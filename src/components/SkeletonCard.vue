<script setup lang="ts">
import { computed } from 'vue'
import type { Post } from '@/types/content'

const props = defineProps<{
  post: Post
  compact?: boolean
}>()

const typeLabel = computed(() => {
  const labels: Record<string, string> = { article: '文章', gallery: '作品集', record: '追番' }
  return labels[props.post.type] ?? '笔记'
})
</script>

<template>
  <article :class="['post-card skeleton-card', { compact }]">
    <div class="post-cover">
      <div class="skeleton" style="width: 100%; height: 100%; min-height: 210px" />
    </div>
    <div class="post-body">
      <div class="post-meta">
        <div class="skeleton" style="width: 120px; height: 28px" />
        <div class="skeleton" style="width: 80px; height: 24px" />
      </div>
      <div class="skeleton" style="width: 80%; height: 28px" />
      <div class="skeleton" style="width: 100%; height: 16px" />
      <div class="skeleton" style="width: 60%; height: 16px" />
      <div class="tag-row" style="margin-top: 4px">
        <div class="skeleton" style="width: 56px; height: 24px" />
        <div class="skeleton" style="width: 64px; height: 24px" />
        <div class="skeleton" style="width: 48px; height: 24px" />
      </div>
      <div class="post-actions">
        <div class="skeleton" style="width: 48px; height: 32px" />
        <div class="skeleton" style="width: 48px; height: 32px" />
        <div class="skeleton" style="width: 60px; height: 32px" />
      </div>
    </div>
  </article>
</template>
