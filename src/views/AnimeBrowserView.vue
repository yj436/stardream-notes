<script setup lang="ts">
import { computed, ref } from 'vue'
import { Film, Star, Tv } from 'lucide-vue-next'
import { imageAssets } from '@/api/mock'
import { useBlogStore } from '@/stores/blog'

const blog = useBlogStore()
const tab = ref<'all' | 'watching' | 'watched'>('all')

interface AnimeEntry {
  id: string
  title: string
  coverUrl: string
  type: string
  episodes: number
  rating: number
  synopsis: string
  tags: string[]
  fans: number
}

const sampleAnimes: AnimeEntry[] = [
  {
    id: 'a_gogo',
    title: '银河放课后',
    coverUrl: imageAssets.hero,
    type: 'TV',
    episodes: 12,
    rating: 9,
    synopsis: '放课后的天文社，一群少女用望远镜连接星空与日常的青春群像剧。',
    tags: ['青春', '日常', '治愈'],
    fans: 12400,
  },
  {
    id: 'a_pixel',
    title: '像素雨季',
    coverUrl: imageAssets.creators,
    type: 'TV',
    episodes: 24,
    rating: 8,
    synopsis: '一座永远下着雨的小镇，每一帧都可以截屏当壁纸的奇幻日常。',
    tags: ['奇幻', '美术神作', '慢节奏'],
    fans: 8400,
  },
  {
    id: 'a_studio',
    title: '夏夜摄影棚',
    coverUrl: imageAssets.hero,
    type: 'Movie',
    episodes: 1,
    rating: 8,
    synopsis: '一个夏天的末尾，少年用父母的旧相机拍下了最后一张拍立得。',
    tags: ['剧场版', '夏日', '回忆'],
    fans: 6600,
  },
  {
    id: 'a_mahou',
    title: '星屑魔法书',
    coverUrl: imageAssets.creators,
    type: 'TV',
    episodes: 26,
    rating: 9,
    synopsis: '见习魔法使在图书馆发现了沉睡千年的星屑魔法，从此每翻一页书就打开一个新世界。',
    tags: ['魔法', '冒险', '奇幻'],
    fans: 15800,
  },
]

const filtered = computed(() => {
  if (tab.value === 'all') return sampleAnimes
  return sampleAnimes.filter((a) => a.type === (tab.value === 'watching' ? 'TV' : 'Movie'))
})

const ratingColor = (rating: number) => {
  if (rating >= 9) return 'var(--gold)'
  if (rating >= 8) return 'var(--mint)'
  return 'var(--muted)'
}
</script>

<template>
  <section class="anime-browser-layout">
    <div class="section-block">
      <div class="section-title">
        <div>
          <span class="section-kicker"><Film :size="16" /> 番剧资料库</span>
          <h1>发现 ACGN 作品</h1>
          <p class="archive-summary">浏览番剧、角色与同好动态，找到下一个让你心动入坑的故事。</p>
        </div>
        <div class="segmented compact">
          <button type="button" :class="{ active: tab === 'all' }" @click="tab = 'all'">全部</button>
          <button type="button" :class="{ active: tab === 'watching' }" @click="tab = 'watching'">连载</button>
          <button type="button" :class="{ active: tab === 'watched' }" @click="tab = 'watched'">剧场版</button>
        </div>
      </div>
    </div>

    <div class="anime-grid">
      <RouterLink v-for="anime in filtered" :key="anime.id" :to="`/search?q=${encodeURIComponent(anime.title)}`" class="anime-card">
        <div class="anime-card-cover">
          <img :src="anime.coverUrl" :alt="anime.title" />
          <span class="anime-type-badge">{{ anime.type }}</span>
        </div>
        <div class="anime-card-body">
          <strong>{{ anime.title }}</strong>
          <div class="anime-meta-row">
            <Tv :size="14" />
            <span>{{ anime.episodes }} 话</span>
            <Star :size="14" :style="{ color: ratingColor(anime.rating) }" />
            <span>{{ anime.rating }}/10</span>
          </div>
          <p>{{ anime.synopsis }}</p>
          <div class="tag-row">
            <span v-for="tag in anime.tags" :key="tag">#{{ tag }}</span>
          </div>
          <small>{{ anime.fans.toLocaleString() }} 位星梦同好</small>
        </div>
      </RouterLink>
    </div>
  </section>
</template>
