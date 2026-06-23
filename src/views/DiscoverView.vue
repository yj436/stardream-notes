<script setup lang="ts">
import { computed, ref } from 'vue'
import { Crown, Eye, Film, Hash, Heart, MessageCircle, Sparkles } from 'lucide-vue-next'
import PostCard from '@/components/PostCard.vue'
import UserPanel from '@/components/UserPanel.vue'
import { imageAssets } from '@/api/mock'
import { useBlogStore } from '@/stores/blog'
import type { PostType } from '@/types/content'

const blog = useBlogStore()
const selectedTag = ref('全部')
const selectedType = ref<'all' | PostType>('all')
const selectedSort = ref<'hot' | 'latest' | 'comments'>('latest')
const ranked = computed(() => blog.posts.slice(0, 5))

const typeOptions: Array<{ label: string; value: 'all' | PostType }> = [
  { label: '全部', value: 'all' },
  { label: '资料图文', value: 'article' },
  { label: '活动图集', value: 'gallery' },
  { label: '平台资料', value: 'record' },
]

const sortOptions: Array<{ label: string; value: 'hot' | 'latest' | 'comments' }> = [
  { label: '最新', value: 'latest' },
  { label: '热度', value: 'hot' },
  { label: '评论', value: 'comments' },
]

const filteredPosts = computed(() => {
  const posts = blog.posts.filter((post) => {
    const tagMatched = selectedTag.value === '全部' || post.tags.includes(selectedTag.value)
    const typeMatched = selectedType.value === 'all' || post.type === selectedType.value
    return tagMatched && typeMatched
  })
  return [...posts].sort((a, b) => {
    if (selectedSort.value === 'latest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    if (selectedSort.value === 'comments') return b.commentCount - a.commentCount
    return b.likeCount + b.favoriteCount - (a.likeCount + a.favoriteCount)
  })
})

const resultStats = computed(() => ({
  views: filteredPosts.value.reduce((sum, post) => sum + post.viewCount, 0),
  likes: filteredPosts.value.reduce((sum, post) => sum + post.likeCount, 0),
  comments: filteredPosts.value.reduce((sum, post) => sum + post.commentCount, 0),
}))
</script>

<template>
  <section class="discover-layout">
    <section class="page-hero topic-hero" :style="{ backgroundImage: `linear-gradient(135deg, rgba(23, 30, 55, 0.18), rgba(23, 30, 55, 0.78)), url(${imageAssets.creators})` }">
      <div class="halo-sakura-layer" aria-hidden="true" />
      <div>
        <span class="section-kicker"><Hash :size="16" /> Source Topic</span>
        <h1>按公开资料找内容</h1>
        <p>用标签、来源文章和资料组卡片组织入口，快速找到展会、馆藏、正版平台和场景参考。</p>
      </div>
      <RouterLink class="ghost-button" to="/anime">
        <Film :size="16" /> ACGN 资料库
      </RouterLink>
    </section>

    <div class="section-block topic-board halo-widget">
      <div class="section-title">
        <div>
          <span class="section-kicker"><Hash :size="16" /> 话题广场</span>
          <h2>标签云</h2>
        </div>
      </div>

      <div class="topic-grid">
        <button type="button" :class="{ active: selectedTag === '全部' }" @click="selectedTag = '全部'">
          <span>#全部</span>
          <small>{{ blog.posts.length }} 篇资料</small>
        </button>
        <button v-for="tag in blog.tags" :key="tag" type="button" :class="{ active: selectedTag === tag }" @click="selectedTag = tag">
          <span>#{{ tag }}</span>
          <small>{{ blog.posts.filter((post) => post.tags.includes(tag)).length }} 篇资料</small>
        </button>
      </div>
    </div>

    <div class="discover-grid">
      <section class="section-block">
        <div class="section-title">
          <div>
            <span class="section-kicker"><Sparkles :size="16" /> 资料精选</span>
            <h2>{{ selectedTag }} · {{ filteredPosts.length }} 条内容</h2>
          </div>
        </div>
        <div class="discover-toolbar">
          <div class="segmented compact">
            <button v-for="option in typeOptions" :key="option.value" type="button" :class="{ active: selectedType === option.value }" @click="selectedType = option.value">
              {{ option.label }}
            </button>
          </div>
          <div class="segmented compact">
            <button v-for="option in sortOptions" :key="option.value" type="button" :class="{ active: selectedSort === option.value }" @click="selectedSort = option.value">
              {{ option.label }}
            </button>
          </div>
        </div>
        <div class="discover-stats">
          <span><Eye :size="15" />{{ resultStats.views.toLocaleString('zh-CN') }} 浏览</span>
          <span><Heart :size="15" />{{ resultStats.likes.toLocaleString('zh-CN') }} 点赞</span>
          <span><MessageCircle :size="15" />{{ resultStats.comments.toLocaleString('zh-CN') }} 评论</span>
        </div>
        <div class="post-list">
          <PostCard v-for="post in filteredPosts" :key="post.id" :post="post" :author="blog.users.find((user) => user.id === post.authorId)" />
          <p v-if="!filteredPosts.length" class="empty-state">这个组合暂时没有资料，换个标签试试。</p>
        </div>
      </section>

      <aside class="side-card rank-card">
        <span class="section-kicker"><Crown :size="16" /> 资料索引</span>
        <RouterLink v-for="(post, index) in ranked" :key="post.id" :to="`/post/${post.id}`" class="rank-row">
          <strong>{{ index + 1 }}</strong>
          <span>{{ post.title }}</span>
          <small>{{ post.tags[0] }}</small>
        </RouterLink>
      </aside>
    </div>

    <section class="section-block">
      <div class="section-title">
        <div>
          <span class="section-kicker">推荐资料组</span>
          <h2>来源整理账号</h2>
        </div>
      </div>
      <div class="creator-grid">
        <UserPanel v-for="user in blog.users" :key="user.id" :user="user" />
      </div>
    </section>
  </section>
</template>
