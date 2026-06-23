<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Eye,
  Grid3X3,
  Heart,
  Images,
  Maximize2,
  Search,
  Sparkles,
  X,
} from 'lucide-vue-next'
import TimestampPill from '@/components/TimestampPill.vue'
import { imageAssets } from '@/api/mock'
import { useBlogStore } from '@/stores/blog'
import type { ImageAsset, Post, PostType } from '@/types/content'
import { imageAlt, imageUrl, normalizeImageAsset } from '@/utils/image'

type GallerySort = 'latest' | 'hot' | 'views'
type GalleryItem = {
  id: string
  image: ImageAsset
  post: Post
  index: number
  authorName: string
  authorAvatar?: string
  authorAvatarPosition?: string
  shape: 'square' | 'tall' | 'wide'
}

const blog = useBlogStore()
const selectedTag = ref('全部')
const selectedType = ref<'all' | PostType>('all')
const selectedSort = ref<GallerySort>('hot')
const galleryQuery = ref('')
const activeImageId = ref<string | null>(null)

const typeOptions: Array<{ label: string; value: 'all' | PostType }> = [
  { label: '全部图廊', value: 'all' },
  { label: '番剧图文', value: 'article' },
  { label: 'COS 图集', value: 'gallery' },
  { label: '游戏资料', value: 'record' },
]

const sortOptions: Array<{ label: string; value: GallerySort }> = [
  { label: '热度', value: 'hot' },
  { label: '最新', value: 'latest' },
  { label: '浏览', value: 'views' },
]

const galleryItems = computed<GalleryItem[]>(() =>
  blog.posts.flatMap((post) => {
    const author = blog.users.find((user) => user.id === post.authorId)
    const fallback = normalizeImageAsset(post.coverUrl, post.title)
    const images = post.gallery.length ? post.gallery : fallback ? [fallback] : []
    return images.map((image, index) => ({
      id: `${post.id}-${index}`,
      image,
      post,
      index,
      authorName: author?.nickname ?? '板块编辑',
      authorAvatar: author?.avatarUrl,
      authorAvatarPosition: author?.avatarPosition,
      shape: index % 5 === 1 ? 'tall' : index % 5 === 3 ? 'wide' : 'square',
    }))
  }),
)

const galleryTags = computed(() => {
  const tagCounts = new Map<string, number>()
  galleryItems.value.forEach((item) => {
    item.post.tags.forEach((tag) => tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1))
  })
  return [...tagCounts.entries()].sort((a, b) => b[1] - a[1])
})

const filteredItems = computed(() => {
  const keyword = galleryQuery.value.trim().toLowerCase()
  const items = galleryItems.value.filter((item) => {
    const tagMatched = selectedTag.value === '全部' || item.post.tags.includes(selectedTag.value)
    const typeMatched = selectedType.value === 'all' || item.post.type === selectedType.value
    const textMatched =
      !keyword ||
      [item.post.title, item.post.excerpt, item.authorName, ...item.post.tags].some((text) => text.toLowerCase().includes(keyword))
    return tagMatched && typeMatched && textMatched
  })
  return [...items].sort((a, b) => {
    if (selectedSort.value === 'latest') return new Date(b.post.createdAt).getTime() - new Date(a.post.createdAt).getTime()
    if (selectedSort.value === 'views') return b.post.viewCount - a.post.viewCount
    return b.post.likeCount + b.post.favoriteCount - (a.post.likeCount + a.post.favoriteCount)
  })
})

const featuredItem = computed(() => filteredItems.value[0] ?? galleryItems.value[0])
const activeItem = computed(() => filteredItems.value.find((item) => item.id === activeImageId.value) ?? null)
const activeIndex = computed(() => filteredItems.value.findIndex((item) => item.id === activeImageId.value))
const galleryStats = computed(() => ({
  images: filteredItems.value.length,
  posts: new Set(filteredItems.value.map((item) => item.post.id)).size,
  creators: new Set(filteredItems.value.map((item) => item.post.authorId)).size,
  likes: filteredItems.value.reduce((sum, item) => sum + item.post.likeCount, 0),
}))

const selectTag = (tag: string) => {
  selectedTag.value = tag
}

const openLightbox = (item: GalleryItem) => {
  activeImageId.value = item.id
}

const closeLightbox = () => {
  activeImageId.value = null
}

const moveLightbox = (direction: 1 | -1) => {
  if (!filteredItems.value.length) return
  const current = activeIndex.value >= 0 ? activeIndex.value : 0
  const next = (current + direction + filteredItems.value.length) % filteredItems.value.length
  activeImageId.value = filteredItems.value[next].id
}

const handleKeydown = (event: KeyboardEvent) => {
  if (!activeItem.value) return
  if (event.key === 'Escape') closeLightbox()
  if (event.key === 'ArrowRight') moveLightbox(1)
  if (event.key === 'ArrowLeft') moveLightbox(-1)
}

onMounted(async () => {
  await blog.bootstrap()
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
})

watch([selectedTag, selectedType, selectedSort, galleryQuery], () => {
  if (activeImageId.value && !filteredItems.value.some((item) => item.id === activeImageId.value)) {
    activeImageId.value = null
  }
})
</script>

<template>
  <section class="gallery-layout">
    <section
      class="page-hero gallery-hero"
      :style="{
        backgroundImage: `linear-gradient(135deg, rgba(23, 30, 55, 0.12), rgba(23, 30, 55, 0.76)), url(${featuredItem ? imageUrl(featuredItem.image) : imageAssets.cosplayStage})`,
      }"
    >
      <div class="halo-sakura-layer" aria-hidden="true" />
      <div>
        <span class="section-kicker"><Images :size="16" /> Anime · Cosplay · Game Gallery</span>
        <h1>ACGN 图廊</h1>
        <p>把番剧资料图、COS 现场、游戏硬件和日常番场景按文章与标签汇成一条可追溯视觉流。</p>
      </div>
      <RouterLink class="primary-button" to="/editor">
        <Camera :size="16" />
        投稿图集
      </RouterLink>
    </section>

    <section class="gallery-console section-block">
      <div class="gallery-toolbar">
        <label class="gallery-search">
          <Search :size="17" />
          <input v-model="galleryQuery" placeholder="搜索 番剧、COS、游戏、标签..." />
        </label>
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

      <div class="gallery-stats">
        <span><Grid3X3 :size="15" />{{ galleryStats.images }} 张图片</span>
        <span><Sparkles :size="15" />{{ galleryStats.posts }} 篇内容</span>
        <span><Camera :size="15" />{{ galleryStats.creators }} 个板块组</span>
        <span><Heart :size="15" />{{ galleryStats.likes.toLocaleString('zh-CN') }} 热度</span>
      </div>
    </section>

    <div class="gallery-grid-shell">
      <aside class="gallery-rail">
        <section class="side-card halo-widget">
          <span class="section-kicker"><Sparkles :size="16" /> 标签筛选</span>
          <div class="gallery-tag-list">
            <button type="button" :class="{ active: selectedTag === '全部' }" @click="selectTag('全部')">
              <strong>#全部</strong>
              <small>{{ galleryItems.length }}</small>
            </button>
            <button v-for="[tag, count] in galleryTags" :key="tag" type="button" :class="{ active: selectedTag === tag }" @click="selectTag(tag)">
              <strong>#{{ tag }}</strong>
              <small>{{ count }}</small>
            </button>
          </div>
        </section>

        <section v-if="featuredItem" class="side-card gallery-feature-card">
          <span class="section-kicker"><Eye :size="16" /> 当前图廊图</span>
          <img :src="imageUrl(featuredItem.image)" :alt="imageAlt(featuredItem.image, featuredItem.post.title)" />
          <RouterLink :to="`/post/${featuredItem.post.id}`">{{ featuredItem.post.title }}</RouterLink>
          <small>{{ featuredItem.authorName }} · {{ featuredItem.post.likeCount }} 赞</small>
        </section>
      </aside>

      <main class="gallery-board">
        <button
          v-for="item in filteredItems"
          :key="item.id"
          type="button"
          :class="['gallery-card', item.shape]"
          @click="openLightbox(item)"
        >
          <img :src="imageUrl(item.image)" :alt="imageAlt(item.image, item.post.title)" :style="{ objectPosition: item.post.imagePosition ?? 'center' }" />
          <span class="gallery-card-overlay">
            <span class="gallery-card-title">{{ item.post.title }}</span>
            <span class="gallery-card-meta">
              <span v-if="item.authorAvatar" class="mini-avatar" :style="{ backgroundImage: `url(${item.authorAvatar})`, backgroundPosition: item.authorAvatarPosition }" />
              {{ item.authorName }}
              <Heart :size="14" />
              {{ item.post.likeCount }}
            </span>
          </span>
          <span class="gallery-expand"><Maximize2 :size="16" /></span>
        </button>
        <p v-if="!filteredItems.length" class="empty-state">暂时没有符合条件的图廊图片。</p>
      </main>
    </div>

    <Teleport to="body">
      <div v-if="activeItem" class="gallery-lightbox" role="dialog" aria-modal="true" aria-label="图廊图片预览">
        <button type="button" class="gallery-lightbox-close" aria-label="关闭预览" @click="closeLightbox">
          <X :size="22" />
        </button>
        <button type="button" class="gallery-lightbox-arrow prev" aria-label="上一张" @click="moveLightbox(-1)">
          <ArrowLeft :size="22" />
        </button>
        <figure>
          <img :src="imageUrl(activeItem.image)" :alt="imageAlt(activeItem.image, activeItem.post.title)" />
          <figcaption>
            <div>
              <span class="section-kicker"><Images :size="16" /> {{ activeIndex + 1 }} / {{ filteredItems.length }}</span>
              <h2>{{ activeItem.post.title }}</h2>
              <p>{{ activeItem.post.excerpt }}</p>
              <div class="tag-row">
                <RouterLink v-for="tag in activeItem.post.tags" :key="tag" :to="`/search?q=${encodeURIComponent(tag)}`">#{{ tag }}</RouterLink>
              </div>
            </div>
            <div class="gallery-lightbox-actions">
              <TimestampPill :value="activeItem.post.createdAt" compact />
              <RouterLink class="primary-button" :to="`/post/${activeItem.post.id}`" @click="closeLightbox">阅读内容</RouterLink>
            </div>
          </figcaption>
        </figure>
        <button type="button" class="gallery-lightbox-arrow next" aria-label="下一张" @click="moveLightbox(1)">
          <ArrowRight :size="22" />
        </button>
      </div>
    </Teleport>
  </section>
</template>
