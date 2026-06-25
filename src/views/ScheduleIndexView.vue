<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { CalendarDays, Clock3, ExternalLink, RefreshCw, Search, Sparkles, Tv } from 'lucide-vue-next'
import TimestampPill from '@/components/TimestampPill.vue'
import { appApi } from '@/api/appApi'
import { imageAssets } from '@/api/mock'
import type { AnimeTimelineDay, AnimeTimelineEpisode, AnimeTimelineKind, AnimeTimelinePayload } from '@/types/content'

type CategoryFilter = 'all' | AnimeTimelineKind
type StatusFilter = 'all' | 'published' | 'upcoming' | 'scheduled' | 'delayed'
type DateTab = {
  label: string
  dateLabel: string
  value: string
  count: number
  today?: boolean
}

const category = ref<CategoryFilter>('all')
const status = ref<StatusFilter>('all')
const selectedDate = ref('all')
const keyword = ref('')
const loading = ref(false)
const error = ref('')
const timeline = ref<AnimeTimelinePayload | null>(null)

const weekdayLabels: Record<number, string> = {
  1: '周一',
  2: '周二',
  3: '周三',
  4: '周四',
  5: '周五',
  6: '周六',
  7: '周日',
}

const categoryOptions: Array<{ label: string; value: CategoryFilter }> = [
  { label: '全部番剧', value: 'all' },
  { label: '日本动画', value: 'anime' },
  { label: '国产动画', value: 'guochuang' },
]

const statusOptions: Array<{ label: string; value: StatusFilter; hint: string }> = [
  { label: '全部', value: 'all', hint: '完整时间线' },
  { label: '已播出', value: 'published', hint: '已有更新时间' },
  { label: '待播出', value: 'upcoming', hint: '即将更新' },
  { label: '排期参考', value: 'scheduled', hint: '按周历推定' },
  { label: '延期', value: 'delayed', hint: '平台标注延期' },
]

const sourceLinks = [
  { label: 'MAL', href: 'https://myanimelist.net/anime/season/schedule' },
  { label: 'Bangumi', href: 'https://bangumi.tv/calendar' },
  { label: 'Bilibili', href: 'https://www.bilibili.com/anime/timeline' },
  { label: 'Anikore', href: 'https://www.anikore.jp/' },
]

const quickDateOptions: Array<{ label: string; value: string }> = [
  { label: '全部', value: 'all' },
  { label: '今天', value: 'today' },
  { label: '未来', value: 'future' },
]

const flatEpisodes = computed(() => timeline.value?.days.flatMap((day) => day.episodes.map((episode) => ({ day, episode }))) ?? [])
const totalEpisodes = computed(() => flatEpisodes.value.length)
const todayEpisodes = computed(() => flatEpisodes.value.filter(({ day }) => day.isToday).length)
const upcomingEpisodes = computed(() => flatEpisodes.value.filter(({ episode }) => !episode.published && !episode.isDelayed).length)
const updatedEpisodes = computed(() => flatEpisodes.value.filter(({ episode }) => episode.published && !episode.isDelayed).length)
const scheduledEpisodes = computed(() => flatEpisodes.value.filter(({ episode }) => episode.confidence === 'weekday' && !episode.isDelayed).length)
const animeEpisodes = computed(() => flatEpisodes.value.filter(({ episode }) => episode.kind === 'anime').length)
const guochuangEpisodes = computed(() => flatEpisodes.value.filter(({ episode }) => episode.kind === 'guochuang').length)

const dateTabs = computed<DateTab[]>(() => [
  { label: '全部', dateLabel: '全部', value: 'all', count: totalEpisodes.value },
  ...(timeline.value?.days.map((day) => ({
    label: weekdayLabels[day.dayOfWeek] ?? '未知',
    dateLabel: day.date.slice(5),
    value: String(day.dateTimestamp || day.date),
    count: day.episodes.length,
    today: day.isToday,
  })) ?? []),
])

const matchesFilters = (day: AnimeTimelineDay, episode: AnimeTimelineEpisode) => {
  const text = keyword.value.trim().toLowerCase()
  const dateMatched = selectedDate.value === 'all' || selectedDate.value === String(day.dateTimestamp || day.date)
  const categoryMatched = category.value === 'all' || episode.kind === category.value
  const statusMatched =
    status.value === 'all' ||
    (status.value === 'published' && episode.published && !episode.isDelayed) ||
    (status.value === 'upcoming' && !episode.published && !episode.isDelayed && episode.confidence !== 'weekday') ||
    (status.value === 'scheduled' && episode.confidence === 'weekday' && !episode.isDelayed) ||
    (status.value === 'delayed' && episode.isDelayed)
  const textMatched =
    !text ||
    [episode.title, episode.pubIndex, episode.sourceName ?? '', ...(episode.aliases ?? []), weekdayLabels[day.dayOfWeek] ?? '', day.date].some((item) =>
      item.toLowerCase().includes(text),
    )
  return dateMatched && categoryMatched && statusMatched && textMatched
}

const filteredDays = computed(() =>
  (timeline.value?.days ?? []).map((day) => ({
    ...day,
    episodes: day.episodes.filter((episode) => matchesFilters(day, episode)),
  })),
)

const visibleDays = computed(() => {
  const days =
    selectedDate.value === 'all' ? filteredDays.value : filteredDays.value.filter((day) => String(day.dateTimestamp || day.date) === selectedDate.value)
  return selectedDate.value === 'all' ? days.filter((day) => day.episodes.length) : days
})
const filteredCount = computed(() => filteredDays.value.reduce((sum, day) => sum + day.episodes.length, 0))
const activeDateCount = computed(() => visibleDays.value.reduce((sum, day) => sum + day.episodes.length, 0))
const hasVisibleEpisodes = computed(() => visibleDays.value.some((day) => day.episodes.length))
const sourceStats = computed(() => timeline.value?.sources ?? [])
const sourceLabel = computed(() => {
  if (!timeline.value) return loading.value ? '多源时间表同步中' : '等待同步时间表'
  if (timeline.value?.source === 'multi') return 'MyAnimeList / Bangumi / Bilibili 多源聚合'
  if (timeline.value?.source === 'myanimelist') return 'MyAnimeList 时间表'
  if (timeline.value?.source === 'bangumi') return 'Bangumi 每日放送'
  if (timeline.value?.source === 'bilibili') return 'Bilibili PGC 时间线'
  return '本地兜底样例'
})

const formatDateTime = (value?: string) =>
  value ? new Date(value).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '未同步'

const episodeKindLabel = (kind: AnimeTimelineKind) => (kind === 'anime' ? '日番' : '国创')
const quickDate = computed(() => {
  if (selectedDate.value === 'all') return 'all'
  const day = timeline.value?.days.find((item) => String(item.dateTimestamp || item.date) === selectedDate.value)
  if (day?.isToday) return 'today'
  if (day && day.dateTimestamp > Date.now()) return 'future'
  return 'custom'
})
const episodeStateLabel = (episode: AnimeTimelineEpisode) => {
  if (episode.isDelayed) return episode.delayReason || '延期'
  if (episode.confidence === 'weekday') return '排期'
  return episode.published ? '已更新' : '待更新'
}
const dayStatusLabel = (day: AnimeTimelineDay) => {
  if (day.isToday) return '今日更新'
  const now = Date.now()
  if (day.dateTimestamp > now) return '即将播出'
  return '近期回看'
}
const selectQuickDate = (value: string) => {
  if (value === 'all') {
    selectedDate.value = 'all'
    return
  }
  if (value === 'today') {
    const today = timeline.value?.days.find((day) => day.isToday)
    selectedDate.value = today ? String(today.dateTimestamp || today.date) : 'all'
    return
  }
  const future = timeline.value?.days.find((day) => !day.isToday && day.dateTimestamp > Date.now())
  selectedDate.value = future ? String(future.dateTimestamp || future.date) : 'all'
}
const sourceStatusLabel = (status: string, count: number) => {
  if (status === 'failed') return '抓取失败'
  if (status === 'fallback') return `${count} 条样例`
  if (status === 'reference') return '参考入口'
  return `${count} 条`
}
const episodeSourceNames = (episode: AnimeTimelineEpisode) => episode.sourceNames?.length ? episode.sourceNames : [episode.sourceName ?? '来源']
const scoreLabel = (episode: AnimeTimelineEpisode) => {
  if (episode.score) return `评分 ${episode.score}`
  if (episode.popularity) return `热度 ${episode.popularity.toLocaleString('zh-CN')}`
  return ''
}
const handleEpisodeCoverError = (event: Event) => {
  const image = event.currentTarget as HTMLImageElement | null
  if (image && image.src !== imageAssets.hero) image.src = imageAssets.hero
}

const loadTimeline = async () => {
  loading.value = true
  error.value = ''
  try {
    timeline.value = await appApi.getAnimeTimeline({ category: 'all', before: 3, after: 7 })
    if (!timeline.value.days.some((day) => String(day.dateTimestamp || day.date) === selectedDate.value)) {
      selectedDate.value = 'all'
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : '番剧时间线加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(loadTimeline)
</script>

<template>
  <section class="schedule-layout">
    <section class="page-hero schedule-hero" :style="{ backgroundImage: `linear-gradient(135deg, rgba(23, 30, 55, 0.18), rgba(23, 30, 55, 0.78)), url(${imageAssets.healingAnime})` }">
      <div>
        <span class="section-kicker"><CalendarDays :size="16" /> 新番时间索引</span>
        <h1>番剧更新时间表</h1>
        <p>聚合 MyAnimeList、Bangumi、Bilibili 的番剧与国创时间线，并把 Anikore 作为日本口碑站参考入口，按周几整理成 ACG 视频站风格的追番索引表。</p>
      </div>
      <button class="primary-button" type="button" :disabled="loading" @click="loadTimeline">
        <RefreshCw :size="16" :class="{ 'spin-icon': loading }" />
        {{ loading ? '同步中' : '刷新时间表' }}
      </button>
    </section>

    <section class="schedule-console section-block">
      <div class="schedule-console-head">
        <div>
          <span class="section-kicker"><Sparkles :size="16" /> {{ sourceLabel }}</span>
          <h2>最近 3 天到未来 7 天</h2>
          <small>同步时间：{{ formatDateTime(timeline?.fetchedAt) }}</small>
        </div>
        <div class="schedule-source-links">
          <a v-for="source in sourceLinks" :key="source.label" class="text-button compact" :href="source.href" target="_blank" rel="noreferrer">
            {{ source.label }}
            <ExternalLink :size="13" />
          </a>
        </div>
      </div>

      <div class="schedule-metrics" aria-label="时间表概览">
        <span><Tv :size="15" /><strong>{{ totalEpisodes }}</strong><em>全部条目</em></span>
        <span><Sparkles :size="15" /><strong>{{ animeEpisodes }}</strong><em>日本动画</em></span>
        <span><Sparkles :size="15" /><strong>{{ guochuangEpisodes }}</strong><em>国产动画</em></span>
        <span><Clock3 :size="15" /><strong>{{ todayEpisodes }}</strong><em>今日更新</em></span>
        <span><Clock3 :size="15" /><strong>{{ upcomingEpisodes }}</strong><em>待播出</em></span>
        <span><CalendarDays :size="15" /><strong>{{ scheduledEpisodes }}</strong><em>排期参考</em></span>
      </div>

      <div v-if="sourceStats.length" class="schedule-source-grid" aria-label="数据来源状态">
        <a
          v-for="source in sourceStats"
          :key="source.id"
          :href="source.url || undefined"
          target="_blank"
          rel="noreferrer"
          :class="['schedule-source-chip', source.status]"
        >
          <strong>{{ source.label }}</strong>
          <em>{{ sourceStatusLabel(source.status, source.count) }}</em>
          <small v-if="source.message">{{ source.message }}</small>
        </a>
      </div>

      <div class="schedule-filter-grid">
        <label class="gallery-search schedule-search">
          <Search :size="17" />
          <input v-model="keyword" placeholder="搜索番名、集数、周几..." />
        </label>
        <div class="schedule-filter-group">
          <strong>作品类型</strong>
          <div class="segmented compact">
            <button v-for="option in categoryOptions" :key="option.value" type="button" :class="{ active: category === option.value }" @click="category = option.value">
              {{ option.label }}
            </button>
          </div>
        </div>
        <div class="schedule-filter-group status">
          <strong>更新状态</strong>
          <div class="schedule-status-tabs">
            <button v-for="option in statusOptions" :key="option.value" type="button" :class="{ active: status === option.value }" @click="status = option.value">
              <span>{{ option.label }}</span>
              <em>{{ option.hint }}</em>
            </button>
          </div>
        </div>
        <div class="schedule-filter-group">
          <strong>日期范围</strong>
          <div class="segmented compact">
            <button v-for="option in quickDateOptions" :key="option.value" type="button" :class="{ active: quickDate === option.value }" @click="selectQuickDate(option.value)">
              {{ option.label }}
            </button>
          </div>
        </div>
      </div>

      <div class="schedule-result-strip">
        <span>当前筛选 {{ filteredCount }} 条</span>
        <span>看板显示 {{ activeDateCount }} 条</span>
        <span>已播出 {{ updatedEpisodes }} 条</span>
      </div>
    </section>

    <p v-if="error" class="empty-state">{{ error }}</p>

    <section class="schedule-workspace" aria-label="番剧更新时间索引表">
      <aside class="schedule-date-rail" aria-label="按日期筛选">
        <div class="schedule-rail-head">
          <strong>日期索引</strong>
          <small>{{ dateTabs.length - 1 }} 天</small>
        </div>
        <button
          v-for="tab in dateTabs"
          :key="tab.value"
          type="button"
          :class="{ active: selectedDate === tab.value, today: tab.today }"
          @click="selectedDate = tab.value"
        >
          <span>{{ tab.label }}</span>
          <strong>{{ tab.dateLabel }}</strong>
          <em>{{ tab.count }} 条</em>
        </button>
      </aside>

      <section class="schedule-board">
        <article v-for="day in visibleDays" :key="day.dateTimestamp || day.date" class="schedule-day-column" :class="{ today: day.isToday }">
          <header class="schedule-day-header">
            <div>
              <span>{{ weekdayLabels[day.dayOfWeek] ?? '未知' }}</span>
              <strong>{{ day.date }}</strong>
              <em>{{ dayStatusLabel(day) }}</em>
            </div>
            <small>{{ day.episodes.length }} 条</small>
          </header>

          <div v-if="day.episodes.length" class="schedule-episode-list">
            <a v-for="episode in day.episodes" :key="episode.id" class="schedule-episode-card" :href="episode.sourceUrl" target="_blank" rel="noreferrer">
              <span class="schedule-cover">
                <img
                  :src="episode.squareCoverUrl || episode.coverUrl || imageAssets.hero"
                  :alt="episode.title"
                  referrerpolicy="no-referrer"
                  @error="handleEpisodeCoverError"
                />
                <em>{{ episode.pubTime }}</em>
              </span>
              <div class="schedule-episode-body">
                <span class="schedule-episode-head">
                  <span :class="['schedule-kind', episode.kind]">{{ episodeKindLabel(episode.kind) }}</span>
                  <span :class="['schedule-state', episode.isDelayed ? 'delayed' : episode.confidence === 'weekday' ? 'catalog' : !episode.published ? 'upcoming' : 'published']">{{ episodeStateLabel(episode) }}</span>
                </span>
                <strong>{{ episode.title }}</strong>
                <span class="schedule-source-badges">
                  <span v-for="sourceName in episodeSourceNames(episode)" :key="sourceName">{{ sourceName }}</span>
                </span>
                <p>{{ episode.pubIndex }}</p>
                <small><Clock3 :size="13" />{{ episode.pubTime }}<em v-if="scoreLabel(episode)">{{ scoreLabel(episode) }}</em></small>
              </div>
            </a>
          </div>
          <p v-else class="schedule-empty-day">暂无匹配更新</p>
        </article>
        <p v-if="!hasVisibleEpisodes && !loading" class="schedule-empty-board">没有匹配的番剧更新，试试切换作品类型、状态或日期范围。</p>
      </section>
    </section>

    <section class="section-block schedule-note">
      <span class="section-kicker"><Sparkles :size="16" /> 数据说明</span>
      <p>该工具仅整理公开时间线字段，不下载正片内容。番剧是否延期、实际开播时间和地区可看状态以对应平台页面为准。</p>
      <TimestampPill v-if="timeline?.fetchedAt" :value="timeline.fetchedAt" compact />
    </section>
  </section>
</template>
