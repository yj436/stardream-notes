<script setup lang="ts">
import { computed, ref, type Component } from 'vue'
import { Archive, Camera, ExternalLink, Film, Gamepad2, Images, MonitorPlay } from 'lucide-vue-next'
import { imageAssets } from '@/api/mock'

type ResourceType = 'anime' | 'cos' | 'game' | 'gallery'
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
    id: 'res_animejapan',
    title: 'AnimeJapan 2026 番剧前哨',
    coverUrl: imageAssets.hero,
    type: 'anime',
    period: '2026-03-28 至 2026-03-31',
    sourceLabel: 'AnimeJapan 官方',
    sourceUrl: 'https://anime-japan.jp/en/about/',
    synopsis: '公共日、商务日、展位、AJ Stage 和官方商品可以支撑番剧板块的新番情报入口。',
    tags: ['番剧', 'AnimeJapan', '新番情报'],
  },
  {
    id: 'res_comiket_cos',
    title: 'Comiket COS 图廊',
    coverUrl: imageAssets.cosplayStage,
    type: 'cos',
    period: 'Comiket 69 / Comiket 84 开放授权照片',
    sourceLabel: 'Comic Market 官方',
    sourceUrl: 'https://www.comiket.co.jp/index_e.html',
    synopsis: '角色扮演群像、现场空间和拍摄礼仪可以组成更像二次元社区的 COS 影廊。',
    tags: ['COS', 'Comiket', '同人现场'],
  },
  {
    id: 'res_tgs_2026',
    title: 'Tokyo Game Show 2026',
    coverUrl: imageAssets.gameController,
    type: 'game',
    period: '2026-09-17 至 2026-09-21',
    sourceLabel: 'TGS 官方',
    sourceUrl: 'https://tgs.cesa.or.jp/en/',
    synopsis: '贸易活动列表确认 2026 会期与 Makuhari Messe 场馆，TGS 官方入口可继续追踪展区、购票和玩家活动更新。',
    tags: ['游戏', 'Tokyo Game Show', '玩家文化'],
  },
  {
    id: 'res_manga_plus',
    title: 'MANGA Plus 正版补番入口',
    coverUrl: imageAssets.creators,
    type: 'anime',
    period: '官方数字阅读服务',
    sourceLabel: 'MANGA Plus',
    sourceUrl: 'https://mangaplus.shueisha.co.jp/updates',
    synopsis: '番剧站可以延伸到漫画原作和补充阅读，但不在站内搬运漫画正文或商业封面。',
    tags: ['番剧补完', '正版阅读', 'SHUEISHA'],
  },
  {
    id: 'res_gallery_rules',
    title: '图廊版权标注规则',
    coverUrl: imageAssets.sakuraWatercolor,
    type: 'gallery',
    period: '站内素材治理',
    sourceLabel: '内容来源文档',
    sourceUrl: 'https://github.com/yj436/stardream-notes/blob/main/docs/content-sources.md',
    synopsis: '把 CC 授权、官方素材、用户投稿、商业海报和游戏截图分开标注，后台管理会更稳定。',
    tags: ['图廊', '版权标注', '后台管理'],
  },
]

const typeMeta: Record<ResourceType, { label: string; icon: Component }> = {
  anime: { label: '番剧', icon: MonitorPlay },
  cos: { label: 'COS', icon: Camera },
  game: { label: '游戏', icon: Gamepad2 },
  gallery: { label: '图廊', icon: Images },
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
          <span class="section-kicker"><Film :size="16" /> 番剧 · COS · 游戏资料馆</span>
          <h1>按二次元板块发现内容</h1>
          <p class="archive-summary">把新番情报、COS 现场、游戏展会和图廊版权规则拆成清晰入口，方便后续继续扩展。</p>
        </div>
        <div class="segmented compact">
          <button type="button" :class="{ active: tab === 'all' }" @click="tab = 'all'">全部</button>
          <button type="button" :class="{ active: tab === 'anime' }" @click="tab = 'anime'">番剧</button>
          <button type="button" :class="{ active: tab === 'cos' }" @click="tab = 'cos'">COS</button>
          <button type="button" :class="{ active: tab === 'game' }" @click="tab = 'game'">游戏</button>
          <button type="button" :class="{ active: tab === 'gallery' }" @click="tab = 'gallery'">图廊</button>
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
