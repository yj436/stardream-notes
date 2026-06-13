<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Clock, Search, Trash2 } from 'lucide-vue-next'
import PostCard from '@/components/PostCard.vue'
import UserPanel from '@/components/UserPanel.vue'
import { useBlogStore } from '@/stores/blog'
import { useDebounce } from '@/composables/useDebounce'

const route = useRoute()
const router = useRouter()
const blog = useBlogStore()
const query = ref(String(route.query.q ?? ''))
const type = ref<'all' | 'post' | 'user' | 'tag'>('all')
const searching = ref(false)
const searchHistory = ref<string[]>([])
const HISTORY_KEY = 'stardream:search-history'

const loadHistory = () => {
  try {
    searchHistory.value = JSON.parse(window.localStorage.getItem(HISTORY_KEY) || '[]')
  } catch {
    searchHistory.value = []
  }
}

const saveHistory = (q: string) => {
  if (!q.trim()) return
  searchHistory.value = [q.trim(), ...searchHistory.value.filter((h) => h !== q.trim())].slice(0, 10)
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(searchHistory.value))
  } catch {
    /* ignore */
  }
}

const clearHistory = () => {
  searchHistory.value = []
  try {
    window.localStorage.removeItem(HISTORY_KEY)
  } catch {
    /* ignore */
  }
}

const run = async () => {
  searching.value = true
  await blog.runSearch(query.value, type.value)
  if (query.value.trim()) saveHistory(query.value)
  void router.replace({ path: '/search', query: query.value ? { q: query.value } : {} })
  searching.value = false
}

const { debounced: debouncedSearch, cancel } = useDebounce(run, 400)

watch(query, () => {
  cancel()
  debouncedSearch()
})
watch(type, run)

const resultCount = computed(() => blog.search.posts.length + blog.search.users.length + blog.search.tags.length)

const highlightMatch = (text: string, keyword: string): string => {
  if (!keyword.trim()) return text
  const escaped = keyword.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return text.replace(new RegExp(`(${escaped})`, 'gi'), '<span class="search-highlight">$1</span>')
}

onMounted(async () => {
  loadHistory()
  await blog.bootstrap()
  await run()
})
</script>

<template>
  <section class="search-layout">
    <div class="search-panel">
      <div>
        <span class="section-kicker">全局搜索</span>
        <h1>找文章、用户和标签</h1>
      </div>
      <form class="search-form" @submit.prevent="run">
        <Search :size="20" />
        <input v-model="query" placeholder="输入 番剧、绘画教程、Coser..." />
        <button class="primary-button" type="submit" :disabled="searching">{{ searching ? '搜索中...' : '搜索' }}</button>
      </form>
      <div class="segmented">
        <button type="button" :class="{ active: type === 'all' }" @click="type = 'all'">全部</button>
        <button type="button" :class="{ active: type === 'post' }" @click="type = 'post'">文章</button>
        <button type="button" :class="{ active: type === 'user' }" @click="type = 'user'">用户</button>
        <button type="button" :class="{ active: type === 'tag' }" @click="type = 'tag'">标签</button>
      </div>
    </div>

    <section v-if="searchHistory.length && !query.trim()" class="section-block">
      <div class="section-title">
        <div>
          <span class="section-kicker"><Clock :size="16" /> 最近搜索</span>
        </div>
        <button type="button" class="text-button danger" @click="clearHistory"><Trash2 :size="14" />清空</button>
      </div>
      <div class="tag-row">
        <button v-for="term in searchHistory" :key="term" type="button" class="text-button" @click="query = term; run()">{{ term }}</button>
      </div>
    </section>

    <section v-if="query.trim() && resultCount === 0 && !searching" class="section-block">
      <p class="empty-state">没有找到与“{{ query }}”相关的结果，换个关键词试试。</p>
    </section>

    <section v-if="blog.search.tags.length" class="section-block">
      <div class="section-title">
        <div>
          <span class="section-kicker">标签结果</span>
          <h2>{{ blog.search.tags.length }} 个相关标签</h2>
        </div>
      </div>
      <div class="tag-row large-tags">
        <RouterLink v-for="tag in blog.search.tags" :key="tag" :to="`/search?q=${encodeURIComponent(tag)}`">
          <span v-html="highlightMatch(`#${tag}`, query)" />
        </RouterLink>
      </div>
    </section>

    <section v-if="blog.search.posts.length" class="section-block">
      <div class="section-title">
        <div>
          <span class="section-kicker">文章结果</span>
          <h2>{{ blog.search.posts.length }} 篇相关笔记</h2>
        </div>
      </div>
      <div class="post-list">
        <PostCard v-for="post in blog.search.posts" :key="post.id" :post="post" :author="blog.users.find((user) => user.id === post.authorId)" />
      </div>
    </section>

    <section v-if="blog.search.users.length" class="section-block">
      <div class="section-title">
        <div>
          <span class="section-kicker">用户结果</span>
          <h2>{{ blog.search.users.length }} 位创作者</h2>
        </div>
      </div>
      <div class="creator-grid">
        <UserPanel v-for="user in blog.search.users" :key="user.id" :user="user" />
      </div>
    </section>

    <p v-if="!blog.search.posts.length && !blog.search.users.length && !blog.search.tags.length && !query.trim()" class="empty-state">
      搜索你感兴趣的创作者、文章或标签。
    </p>
  </section>
</template>
