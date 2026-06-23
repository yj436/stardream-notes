<script setup lang="ts">
import { computed, ref, type Component } from 'vue'
import { Archive, Building2, ExternalLink, Film, Library, MonitorPlay } from 'lucide-vue-next'
import { imageAssets } from '@/api/mock'

type ResourceType = 'event' | 'archive' | 'platform'
const tab = ref<'all' | ResourceType>('all')

interface ResourceEntry {
  id: string
  title: string
  coverUrl: string
  type: ResourceType
  period: string
  sourceLabel: string
  sourceUrl: string
  synopsis: string
  tags: string[]
}

const resourceEntries: ResourceEntry[] = [
  {
    id: 'res_comiket',
    title: 'Comic Market / Comiket',
    coverUrl: imageAssets.moonlightCos,
    type: 'event',
    period: '官方信息以每届会期页面为准',
    sourceLabel: 'Comic Market 官方',
    sourceUrl: 'https://www.comiket.co.jp/index_e.html',
    synopsis: '以同人志、自出版作品和创作者社群为核心的大型活动，适合放入同人文化、展会攻略和创作社群板块。',
    tags: ['Comiket', '同人文化', '东京展会'],
  },
  {
    id: 'res_animejapan',
    title: 'AnimeJapan 2026',
    coverUrl: imageAssets.hero,
    type: 'event',
    period: '2026-03-28 至 2026-03-31',
    sourceLabel: 'AnimeJapan 官方',
    sourceUrl: 'https://anime-japan.jp/en/about/',
    synopsis: '官方 About 页面列出公共日、商务日、展位、AJ Stage、官方商品和商务交流内容，适合作为动画产业资料入口。',
    tags: ['AnimeJapan', '动画产业', 'Tokyo Big Sight'],
  },
  {
    id: 'res_kyoto_museum',
    title: '京都国际漫画博物馆',
    coverUrl: imageAssets.starryDesk,
    type: 'archive',
    period: '约 300,000 项资料可检索',
    sourceLabel: '京都国际漫画博物馆',
    sourceUrl: 'https://kyotomm.jp/en/',
    synopsis: '官网提供馆藏、数据库、Manga Wall、Research Reference Room 等信息，适合做漫画史与馆藏资料板块。',
    tags: ['漫画馆藏', '京都', '资料库'],
  },
  {
    id: 'res_manga_plus',
    title: 'MANGA Plus by SHUEISHA',
    coverUrl: imageAssets.creators,
    type: 'platform',
    period: '官方数字阅读服务',
    sourceLabel: 'MANGA Plus',
    sourceUrl: 'https://mangaplus.shueisha.co.jp/updates',
    synopsis: '集英社官方漫画阅读入口，公开说明强调最新章节与日本同步更新，适合放入正版阅读与平台资料板块。',
    tags: ['正版阅读', '漫画平台', 'SHUEISHA'],
  },
]

const typeMeta: Record<ResourceType, { label: string; icon: Component }> = {
  event: { label: '活动', icon: Building2 },
  archive: { label: '馆藏', icon: Library },
  platform: { label: '平台', icon: MonitorPlay },
}

const filtered = computed(() => {
  if (tab.value === 'all') return resourceEntries
  return resourceEntries.filter((entry) => entry.type === tab.value)
})
</script>

<template>
  <section class="anime-browser-layout">
    <div class="section-block">
      <div class="section-title">
        <div>
          <span class="section-kicker"><Film :size="16" /> ACGN 公开资料库</span>
          <h1>发现真实资料入口</h1>
          <p class="archive-summary">整理活动、馆藏和正版平台的公开来源，替代虚构番剧评分与不可验证热度。</p>
        </div>
        <div class="segmented compact">
          <button type="button" :class="{ active: tab === 'all' }" @click="tab = 'all'">全部</button>
          <button type="button" :class="{ active: tab === 'event' }" @click="tab = 'event'">活动</button>
          <button type="button" :class="{ active: tab === 'archive' }" @click="tab = 'archive'">馆藏</button>
          <button type="button" :class="{ active: tab === 'platform' }" @click="tab = 'platform'">平台</button>
        </div>
      </div>
    </div>

    <div class="anime-grid">
      <article v-for="entry in filtered" :key="entry.id" class="anime-card">
        <div class="anime-card-cover">
          <img :src="entry.coverUrl" :alt="entry.title" />
          <span class="anime-type-badge">{{ typeMeta[entry.type].label }}</span>
        </div>
        <div class="anime-card-body">
          <strong>{{ entry.title }}</strong>
          <div class="anime-meta-row">
            <component :is="typeMeta[entry.type].icon" :size="14" />
            <span>{{ entry.period }}</span>
          </div>
          <p>{{ entry.synopsis }}</p>
          <div class="tag-row">
            <RouterLink v-for="tag in entry.tags" :key="tag" :to="`/search?q=${encodeURIComponent(tag)}`">#{{ tag }}</RouterLink>
          </div>
          <a class="text-button compact" :href="entry.sourceUrl" target="_blank" rel="noreferrer">
            <Archive :size="14" />
            {{ entry.sourceLabel }}
            <ExternalLink :size="13" />
          </a>
        </div>
      </article>
    </div>
  </section>
</template>
