<script setup lang="ts">
import { computed } from 'vue'
import { Bookmark, Eye, Heart, MessageCircle } from 'lucide-vue-next'
import TimestampPill from '@/components/TimestampPill.vue'
import type { Post, User } from '@/types/content'
import { useBlogStore } from '@/stores/blog'

const props = defineProps<{
  post: Post
  author?: User
  compact?: boolean
}>()

const blog = useBlogStore()
const authorName = computed(() => props.author?.nickname ?? '板块编辑')
const typeLabel = computed(() => {
  const labels = { article: '番剧', gallery: 'COS', record: '游戏' }
  return labels[props.post.type]
})
</script>

<template>
  <article :class="['post-card', { compact }]">
    <RouterLink class="post-cover" :to="`/post/${post.id}`">
      <img :src="post.coverUrl" :alt="post.title" :style="{ objectPosition: post.imagePosition ?? 'center' }" />
      <span class="post-kind">{{ typeLabel }}</span>
    </RouterLink>

    <div class="post-body">
      <div class="post-meta">
        <RouterLink v-if="author" class="mini-author" :to="`/user/${author.id}`">
          <span class="mini-avatar" :style="{ backgroundImage: `url(${author.avatarUrl})`, backgroundPosition: author.avatarPosition }" />
          {{ authorName }}
        </RouterLink>
        <TimestampPill :value="post.createdAt" compact />
      </div>

      <RouterLink class="post-title" :to="`/post/${post.id}`">{{ post.title }}</RouterLink>
      <p>{{ post.excerpt }}</p>
      <RouterLink v-if="post.series" class="series-pill compact" :to="`/search?q=${encodeURIComponent(post.series)}`">
        系列 · {{ post.series }}
      </RouterLink>

      <div class="tag-row">
        <RouterLink v-for="tag in post.tags.slice(0, 3)" :key="tag" :to="`/search?q=${encodeURIComponent(tag)}`">
          #{{ tag }}
        </RouterLink>
      </div>

      <div class="post-actions">
        <button type="button" :class="{ active: post.isLiked }" @click="blog.toggleLike(post.id)">
          <Heart :size="16" />
          {{ post.likeCount }}
        </button>
        <button type="button" :class="{ active: post.isFavorited }" @click="blog.toggleFavorite(post.id)">
          <Bookmark :size="16" />
          {{ post.favoriteCount }}
        </button>
        <span><MessageCircle :size="16" /> {{ post.commentCount }}</span>
        <span><Eye :size="16" /> {{ post.viewCount }}</span>
      </div>
    </div>
  </article>
</template>
