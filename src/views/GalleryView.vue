<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
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
import MetricPills from '@/components/MetricPills.vue'
import TimestampPill from '@/components/TimestampPill.vue'
import { imageAssets } from '@/api/mock'
import { useGalleryBoard } from '@/composables/useGalleryBoard'
import { imageAlt, imageUrl } from '@/utils/image'

const {
  blog,
  activeIndex,
  activeItem,
  closeLightbox,
  featuredItem,
  filteredItems,
  galleryItems,
  galleryQuery,
  galleryStats,
  galleryTags,
  moveLightbox,
  openLightbox,
  selectTag,
  selectedSort,
  selectedTag,
  selectedType,
  sortOptions,
  typeOptions,
} = useGalleryBoard()

const galleryStatItems = computed(() => [
  { label: '张图片', value: galleryStats.value.images, icon: Grid3X3 },
  { label: '篇内容', value: galleryStats.value.posts, icon: Sparkles },
  { label: '个板块组', value: galleryStats.value.creators, icon: Camera },
  { label: '热度', value: galleryStats.value.likes.toLocaleString('zh-CN'), icon: Heart },
])

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

      <MetricPills :items="galleryStatItems" />
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
          <span class="gallery-card-chip">#{{ item.post.tags[0] }}</span>
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
