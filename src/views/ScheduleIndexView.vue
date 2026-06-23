<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { CalendarDays, Clock3, ExternalLink, RefreshCw, Search, Sparkles, Tv } from 'lucide-vue-next'
import TimestampPill from '@/components/TimestampPill.vue'
import { appApi } from '@/api/appApi'
import { imageAssets } from '@/api/mock'
import type { AnimeTimelineDay, AnimeTimelineEpisode, AnimeTimelineKind, AnimeTimelinePayload } from '@/types/content'

type CategoryFilter = 'all' | AnimeTimelineKind
type StatusFilter = 'all' | 'today' | 'published' | 'upcoming' | 'delayed'
type DateTab = {
  label: string
  value: string
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
  { label: '全部', value: 'all' },
  { label: '日番', value: 'anime' },
  { label: '国创', value: 'guochuang' },
]

const statusOptions: Array<{ label: string; value: StatusFilter }> = [
  { label: '全部', value: 'all' },
  { label: '今天', value: 'today' },
  { label: '已更新', value: 'published' },
  { label: '待更新', value: 'upcoming' },
  { label: '延期', value: 'delayed' },
]

const flatEpisodes = computed(() => timeline.value?.days.flatMap((day) => day.episodes.map((episode) => ({ day, episode }))) ?? [])
const totalEpisodes = computed(() => flatEpisodes.value.length)
const todayEpisodes = computed(() => flatEpisodes.value.filter(({ day }) => day.isToday).length)
const upcomingEpisodes = computed(() => flatEpisodes.value.filter(({ episode }) => !episode.published).length)
const updatedEpisodes = computed(() => flatEpisodes.value.filter(({ episode }) => episode.published).length)

const dateTabs = computed<DateTab[]>(() => [
  { label: '全部', value: 'all' },
  ...(timeline.value?.days.map((day) => ({
    label: `${weekdayLabels[day.dayOfWeek] ?? '未知'} ${day.date}`,
    value: String(day.dateTimestamp || day.date),
    today: day.isToday,
  })) ?? []),
])

const matchesFilters = (day: AnimeTimelineDay, episode: AnimeTimelineEpisode) => {
  const text = keyword.value.trim().toLowerCase()
  const dateMatched = selectedDate.value === 'all' || selectedDate.value === String(day.dateTimestamp || day.date)
  const categoryMatched = category.value === 'all' || episode.kind === category.value
  const statusMatched =
    status.value === 'all' ||
    (status.value === 'today' && day.isToday) ||
    (status.value === 'published' && episode.published) ||
    (status.value === 'upcoming' && !episode.published) ||
    (status.value === 'delayed' && episode.isDelayed)
  const textMatched = !text || [episode.title, episode.pubIndex, weekdayLabels[day.dayOfWeek] ?? '', day.date].some((item) => item.toLowerCase().includes(text))
  return dateMatched && categoryMatched && statusMatched && textMatched
}

const filteredDays = computed(() =>
  (timeline.value?.days ?? []).map((day) => ({
    ...day,
    episodes: day.episodes.filter((episode) => matchesFilters(day, episode)),
  })),
)

const visibleDays = computed(() =>
  selectedDate.value === 'all' ? filteredDays.value : filteredDays.value.filter((day) => String(day.dateTimestamp || day.date) === selectedDate.value),
)
const filteredCount = computed(() => filteredDays.value.reduce((sum, day) => sum + day.episodes.length, 0))
const sourceLabel = computed(() => (timeline.value?.source === 'bilibili' ? 'Bilibili PGC 时间线' : '本地兜底样例'))

const formatDateTime = (value?: string) =>
  value ? new Date(value).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '未同步'

const episodeKindLabel = (kind: AnimeTimelineKind) => (kind === 'anime' ? '日番' : '国创')
const episodeStateLabel = (episode: AnimeTimelineEpisode) => {
  if (episode.isDelayed) return episode.delayReason || '延期'
  return episode.published ? '已更新' : '待更新'
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
        <h1>日番 / 国创更新时间表</h1>
        <p>抓取最近一周 B 站番剧与国创时间线，按周几、更新时间和更新状态整理成 ACG 视频站风格的追番索引表。</p>
      </div>
      <button class="primary-button" type="button" :disabled="loading" @click="loadTimeline">
        <RefreshCw :size="16" :class="{ 'spin-icon': loading }" />
        {{ loading ? '同步中' : '刷新时间表' }}
      </button>
    </section>

    <section class="schedule-console section-block">
      <div class="schedule-source-row">
        <div>
          <span class="section-kicker"><Sparkles :size="16" /> {{ sourceLabel }}</span>
          <h2>最近 3 天到未来 7 天</h2>
          <small>同步时间：{{ formatDateTime(timeline?.fetchedAt) }}</small>
        </div>
        <a class="text-button compact" href="https://www.bilibili.com/anime/timeline/" target="_blank" rel="noreferrer">
          B站时间表
          <ExternalLink :size="13" />
        </a>
      </div>

      <div class="schedule-toolbar">
        <label class="gallery-search schedule-search">
          <Search :size="17" />
          <input v-model="keyword" placeholder="搜索番名、集数、周几..." />
        </label>
        <div class="segmented compact">
          <button v-for="option in categoryOptions" :key="option.value" type="button" :class="{ active: category === option.value }" @click="category = option.value">
            {{ option.label }}
          </button>
        </div>
        <div class="segmented compact">
          <button v-for="option in statusOptions" :key="option.value" type="button" :class="{ active: status === option.value }" @click="status = option.value">
            {{ option.label }}
          </button>
        </div>
      </div>

      <div class="schedule-stats">
        <span><Tv :size="15" />{{ totalEpisodes }} 条</span>
        <span><Clock3 :size="15" />今天 {{ todayEpisodes }}</span>
        <span>已更新 {{ updatedEpisodes }}</span>
        <span>待更新 {{ upcomingEpisodes }}</span>
        <span>筛选 {{ filteredCount }}</span>
      </div>

      <div class="schedule-date-tabs" aria-label="按日期筛选">
        <button
          v-for="tab in dateTabs"
          :key="tab.value"
          type="button"
          :class="{ active: selectedDate === tab.value, today: tab.today }"
          @click="selectedDate = tab.value"
        >
          {{ tab.label }}
        </button>
      </div>
    </section>

    <p v-if="error" class="empty-state">{{ error }}</p>

    <section class="schedule-board" aria-label="番剧更新时间索引表">
      <article v-for="day in visibleDays" :key="day.dateTimestamp || day.date" class="schedule-day-column" :class="{ today: day.isToday }">
        <header>
          <span>{{ weekdayLabels[day.dayOfWeek] ?? '未知' }}</span>
          <strong>{{ day.date }}</strong>
          <small>{{ day.isToday ? '今天' : `${day.episodes.length} 条` }}</small>
        </header>

        <div v-if="day.episodes.length" class="schedule-episode-list">
          <a v-for="episode in day.episodes" :key="episode.id" class="schedule-episode-card" :href="episode.sourceUrl" target="_blank" rel="noreferrer">
            <img
              :src="episode.squareCoverUrl || episode.coverUrl || imageAssets.hero"
              :alt="episode.title"
              referrerpolicy="no-referrer"
              @error="handleEpisodeCoverError"
            />
            <div>
              <div class="schedule-episode-head">
                <span :class="['schedule-kind', episode.kind]">{{ episodeKindLabel(episode.kind) }}</span>
                <span :class="['schedule-state', { upcoming: !episode.published, delayed: episode.isDelayed }]">{{ episodeStateLabel(episode) }}</span>
              </div>
              <strong>{{ episode.title }}</strong>
              <p>{{ episode.pubIndex }}</p>
              <small><Clock3 :size="13" />{{ episode.pubTime }}</small>
            </div>
          </a>
        </div>
        <p v-else class="schedule-empty-day">暂无匹配更新</p>
      </article>
    </section>

    <section class="section-block schedule-note">
      <span class="section-kicker"><Sparkles :size="16" /> 数据说明</span>
      <p>该工具仅整理公开时间线字段，不下载正片内容。番剧是否延期、实际开播时间和地区可看状态以对应平台页面为准。</p>
      <TimestampPill v-if="timeline?.fetchedAt" :value="timeline.fetchedAt" compact />
    </section>
  </section>
</template>
