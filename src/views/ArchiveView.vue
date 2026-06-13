<script setup lang="ts">
import { computed, ref } from 'vue'
import { Archive, CalendarDays, Sparkles } from 'lucide-vue-next'
import TimestampPill from '@/components/TimestampPill.vue'
import { imageAssets } from '@/api/mock'
import { useBlogStore } from '@/stores/blog'
import type { Post } from '@/types/content'

const blog = useBlogStore()
const scope = ref<'all' | 'mine'>('all')
const sourcePosts = computed(() => (scope.value === 'mine' ? blog.posts.filter((post) => post.authorId === blog.currentUserId) : blog.posts))

type ArchiveGroup = { key: string; label: string; year: number; month: number; posts: Post[] }

const groups = computed(() => {
  const map = new Map<string, ArchiveGroup>()
  for (const post of [...sourcePosts.value].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())) {
    const date = new Date(post.createdAt)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const key = `${year}-${String(month).padStart(2, '0')}`
    const group = map.get(key) ?? { key, label: `${year} 年 ${month} 月`, year, month, posts: [] }
    group.posts.push(post)
    map.set(key, group)
  }
  return Array.from(map.values())
})

const totalPosts = computed(() => sourcePosts.value.length)
const latestPost = computed(() => groups.value[0]?.posts[0])
const typeLabel = (type: Post['type']) => ({ article: '文章', gallery: '作品画廊', record: '追番' })[type]
</script>

<template>
  <section class="archive-layout">
    <section class="page-hero archive-hero" :style="{ backgroundImage: `linear-gradient(135deg, rgba(23, 30, 55, 0.2), rgba(23, 30, 55, 0.76)), url(${imageAssets.hero})` }">
      <div class="halo-sakura-layer" aria-hidden="true" />
      <div>
        <span class="section-kicker"><Archive :size="16" /> Halo Archive</span>
        <h1>按时间回看星梦笔记</h1>
        <p class="archive-summary">
          {{ scope === 'all' ? '全站' : '我的' }}共 {{ totalPosts }} 篇内容
          <template v-if="latestPost">，最新更新是《{{ latestPost.title }}》。</template>
        </p>
      </div>
      <div class="segmented compact">
        <button type="button" :class="{ active: scope === 'all' }" @click="scope = 'all'">全站</button>
        <button type="button" :class="{ active: scope === 'mine' }" @click="scope = 'mine'">我的</button>
      </div>
    </section>

    <div v-if="groups.length" class="archive-timeline">
      <section v-for="group in groups" :key="group.key" class="archive-node section-block">
        <div class="archive-date-mark">
          <span><Sparkles :size="16" /></span>
          <strong>{{ group.month }} 月</strong>
          <small>{{ group.year }}</small>
        </div>
        <div class="archive-month-content">
          <div class="archive-month-head">
            <div>
              <span class="section-kicker"><CalendarDays :size="16" /> {{ group.label }}</span>
              <h2>{{ group.posts.length }} 篇星梦记录</h2>
            </div>
          </div>
          <RouterLink v-for="post in group.posts" :key="post.id" :to="`/post/${post.id}`" class="archive-row timeline-row">
            <img :src="post.coverUrl" :alt="post.title" :style="{ objectPosition: post.imagePosition ?? 'center' }" />
            <TimestampPill :value="post.createdAt" compact />
            <span class="post-kind-inline">{{ typeLabel(post.type) }}</span>
            <strong>{{ post.title }}</strong>
            <small>{{ post.tags.map((tag) => `#${tag}`).join(' ') }}</small>
          </RouterLink>
        </div>
      </section>
    </div>

    <p v-if="!groups.length" class="empty-state">这个范围暂时没有可归档内容。</p>
  </section>
</template>
