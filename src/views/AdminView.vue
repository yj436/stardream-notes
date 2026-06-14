<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BarChart3,
  BellRing,
  CheckCircle2,
  CircleGauge,
  Cloud,
  Database,
  FileText,
  Flag,
  Image as ImageIcon,
  Images,
  LayoutDashboard,
  Link2,
  Megaphone,
  MessageSquareText,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Send,
  Server,
  ShieldCheck,
  Trash2,
  Users,
  WifiOff,
  X,
} from 'lucide-vue-next'
import TimestampPill from '@/components/TimestampPill.vue'
import { appApi } from '@/api/appApi'
import { imageAssets } from '@/api/mock'
import { useBlogStore } from '@/stores/blog'
import { useNotificationStore } from '@/composables/useNotificationStore'
import type { ApiHealth, HomeCarouselSlide, Post, Report, User } from '@/types/content'

type AdminTab = 'users' | 'posts' | 'comments' | 'reports' | 'carousel'
type ReportStatusFilter = 'all' | Report['status']
type CarouselImageChoice = {
  label: string
  desc: string
  url: string
  position: string
  post?: Post
}

const router = useRouter()
const blog = useBlogStore()
const notifStore = useNotificationStore()
const tab = ref<AdminTab>('users')
const adminQuery = ref('')
const broadcastText = ref('')
const broadcastSent = ref(false)
const refreshing = ref(false)
const reportStatusFilter = ref<ReportStatusFilter>('all')
const selectedReportIds = ref<string[]>([])
const carouselSaving = ref(false)
const selectedCarouselId = ref('')
const carouselDrafts = ref<HomeCarouselSlide[]>([])
const runtimeInfo = appApi.getRuntimeInfo()
const systemHealth = ref<ApiHealth | null>(null)
const systemLoading = ref(false)

const tabConfig = [
  { key: 'users' as const, label: '用户', title: '用户管理', desc: '角色、封禁与创作者权限', icon: Users },
  { key: 'posts' as const, label: '内容', title: '文章管理', desc: '置顶、隐藏与内容状态', icon: FileText },
  { key: 'comments' as const, label: '评论', title: '评论审核', desc: '社区互动与风险评论', icon: MessageSquareText },
  { key: 'reports' as const, label: '举报', title: '举报处理', desc: '复核流程与处理结论', icon: Flag },
  { key: 'carousel' as const, label: '轮播', title: '首页轮播', desc: '更换首屏主图与文案', icon: Images },
]

const builtinCarouselImages: CarouselImageChoice[] = [
  { label: '星梦主视觉', desc: '沉浸式首页背景', url: imageAssets.hero, position: 'center' },
  { label: '星空书桌', desc: '写作与插画氛围', url: imageAssets.starryDesk, position: 'center' },
  { label: '樱花水彩', desc: '柔和插画教程', url: imageAssets.sakuraWatercolor, position: '20% 40%' },
  { label: '月光影棚', desc: 'Cos 影棚展示', url: imageAssets.moonlightCos, position: '70% 28%' },
  { label: '治愈追番', desc: '追番记录入口', url: imageAssets.healingAnime, position: '35% 55%' },
  { label: '轻小说厨房', desc: '连载故事主图', url: imageAssets.novelKitchen, position: 'center' },
  { label: '银河校园', desc: '原创企划封面', url: imageAssets.galaxySchool, position: 'center' },
  { label: '创作者设定', desc: '写作工作台入口', url: imageAssets.creators, position: '70% 28%' },
]

const reportStatusOptions: Array<{ key: ReportStatusFilter; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'open', label: '待处理' },
  { key: 'reviewing', label: '复核中' },
  { key: 'resolved', label: '已解决' },
  { key: 'rejected', label: '已驳回' },
]

const loadSystemHealth = async () => {
  systemLoading.value = true
  try {
    systemHealth.value = await appApi.getSystemHealth()
  } finally {
    systemLoading.value = false
  }
}

const sendBroadcast = () => {
  if (!broadcastText.value.trim()) return
  notifStore.add({
    type: 'system',
    message: broadcastText.value.trim(),
  })
  broadcastText.value = ''
  broadcastSent.value = true
  window.setTimeout(() => {
    broadcastSent.value = false
  }, 2000)
  blog.notify('系统通知已发送', 'success')
}

const refreshAdmin = async () => {
  refreshing.value = true
  try {
    await Promise.all([blog.loadAdmin(), loadSystemHealth()])
    syncCarouselDrafts()
  } finally {
    refreshing.value = false
  }
}

const queryText = computed(() => adminQuery.value.trim().toLowerCase())
const includesQuery = (parts: Array<string | number | undefined | null>) =>
  !queryText.value || parts.join(' ').toLowerCase().includes(queryText.value)

const filteredAdminUsers = computed(() =>
  blog.adminUsers.filter((user) => includesQuery([user.nickname, user.username, user.email, user.role, user.status])),
)

const filteredAdminPosts = computed(() =>
  blog.adminPosts.filter((post) => includesQuery([post.title, post.type, post.status, post.tags.join(' ')])),
)

const filteredAdminComments = computed(() =>
  blog.adminComments.filter((comment) => includesQuery([comment.content, comment.postId])),
)

const filteredAdminReports = computed(() =>
  blog.adminReports.filter((report) => {
    const statusMatched = reportStatusFilter.value === 'all' || report.status === reportStatusFilter.value
    return statusMatched && includesQuery([report.reason, report.detail, report.status, report.postId])
  }),
)

const currentTab = computed(() => tabConfig.find((item) => item.key === tab.value) ?? tabConfig[0])
const openReports = computed(() => blog.adminReports.filter((report) => report.status === 'open' || report.status === 'reviewing'))
const hiddenPosts = computed(() => blog.adminPosts.filter((post) => post.status === 'hidden').length)
const bannedUsers = computed(() => blog.adminUsers.filter((user) => user.status === 'banned').length)
const totalViews = computed(() => blog.adminPosts.reduce((sum, post) => sum + post.viewCount, 0))
const currentRows = computed(() => {
  if (tab.value === 'users') return filteredAdminUsers.value.length
  if (tab.value === 'posts') return filteredAdminPosts.value.length
  if (tab.value === 'comments') return filteredAdminComments.value.length
  if (tab.value === 'carousel') return carouselDrafts.value.length
  return filteredAdminReports.value.length
})
const dataModeLabel = computed(() => (runtimeInfo.mode === 'mock' ? '演示数据模式' : '真实 API 模式'))
const apiHealthTone = computed(() => {
  if (runtimeInfo.mode === 'mock') return 'warning'
  if (!systemHealth.value) return 'info'
  return systemHealth.value.ok ? 'success' : 'danger'
})
const databaseHealthTone = computed(() => {
  if (runtimeInfo.mode === 'mock') return 'warning'
  if (!systemHealth.value?.database) return 'info'
  return systemHealth.value.database.ok ? 'success' : 'danger'
})
const apiHealthLabel = computed(() => {
  if (systemLoading.value) return '检测中'
  if (runtimeInfo.mode === 'mock') return 'Mock 在线'
  if (!systemHealth.value) return '未检测'
  return systemHealth.value.ok ? 'API 在线' : 'API 异常'
})
const databaseHealthLabel = computed(() => {
  if (systemLoading.value) return '检测中'
  if (runtimeInfo.mode === 'mock') return 'Mock 数据'
  const database = systemHealth.value?.database
  if (!database) return '未返回'
  if (database.ok) return `${database.provider.toUpperCase()} 正常`
  return database.code || '数据库异常'
})
const apiHealthIcon = computed(() => {
  if (systemLoading.value) return RefreshCw
  if (runtimeInfo.mode === 'mock') return AlertTriangle
  return systemHealth.value?.ok ? CheckCircle2 : WifiOff
})
const healthCounts = computed(() => systemHealth.value?.database?.counts)
const apiEndpointLabel = computed(() => runtimeInfo.apiBaseUrl)

const navItems = computed(() =>
  tabConfig.map((item) => ({
    ...item,
    count:
      item.key === 'users'
        ? blog.adminUsers.length
        : item.key === 'posts'
          ? blog.adminPosts.length
          : item.key === 'comments'
            ? blog.adminComments.length
            : item.key === 'reports'
              ? blog.adminReports.length
              : blog.adminCarouselSlides.length,
    alert: item.key === 'reports' ? openReports.value.length : 0,
  })),
)

const kpis = computed(() => [
  {
    label: '注册用户',
    value: blog.adminStats?.users ?? 0,
    helper: `${bannedUsers.value} 个封禁账号`,
    icon: Users,
    tone: 'blue',
  },
  {
    label: '内容资产',
    value: blog.adminStats?.posts ?? 0,
    helper: `${hiddenPosts.value} 篇已隐藏`,
    icon: FileText,
    tone: 'pink',
  },
  {
    label: '互动评论',
    value: blog.adminStats?.comments ?? 0,
    helper: `${totalViews.value.toLocaleString()} 次浏览`,
    icon: MessageSquareText,
    tone: 'mint',
  },
  {
    label: '待处理',
    value: blog.adminStats?.reports ?? 0,
    helper: `${openReports.value.length} 个审核队列`,
    icon: Flag,
    tone: 'gold',
  },
])

const postTitle = (id: string) => blog.posts.find((post) => post.id === id)?.title ?? id
const postAuthor = (post: Post) => blog.users.find((user) => user.id === post.authorId)?.nickname ?? post.authorId
const reportPostTitle = (report: Report) => postTitle(report.postId)
const syncCarouselDrafts = () => {
  carouselDrafts.value = blog.adminCarouselSlides.map((slide) => ({ ...slide }))
  if (!carouselDrafts.value.length) {
    selectedCarouselId.value = ''
    return
  }
  if (!selectedCarouselId.value || !carouselDrafts.value.some((slide) => slide.id === selectedCarouselId.value)) {
    selectedCarouselId.value = carouselDrafts.value[0].id
  }
}
const selectedVisibleReportIds = computed(() =>
  filteredAdminReports.value.filter((report) => selectedReportIds.value.includes(report.id)).map((report) => report.id),
)
const allVisibleReportsSelected = computed(
  () => filteredAdminReports.value.length > 0 && filteredAdminReports.value.every((report) => selectedReportIds.value.includes(report.id)),
)
const reportStatusCounts = computed(() =>
  reportStatusOptions.map((option) => ({
    ...option,
    count:
      option.key === 'all'
        ? blog.adminReports.length
        : blog.adminReports.filter((report) => report.status === option.key).length,
  })),
)
const selectedCarouselSlide = computed(() => carouselDrafts.value.find((slide) => slide.id === selectedCarouselId.value) ?? null)
const enabledCarouselCount = computed(() => carouselDrafts.value.filter((slide) => slide.enabled).length)
const carouselImageChoices = computed(() => {
  const choices = [...builtinCarouselImages]
  const seen = new Set(choices.map((choice) => choice.url))
  blog.adminPosts.forEach((post) => {
    if (seen.has(post.coverUrl)) return
    seen.add(post.coverUrl)
    choices.push({
      label: post.title,
      desc: `文章封面 · ${post.tags[0] ?? post.type}`,
      url: post.coverUrl,
      position: post.imagePosition ?? 'center',
      post,
    })
  })
  return choices
})

const updateUserRole = (user: User, role: string) => {
  if (role !== 'user' && role !== 'creator' && role !== 'admin') return
  void blog.updateAdminUser(user.id, { role })
}

const updatePostStatus = (post: Post) => {
  void blog.updateAdminPost(post.id, { status: post.status === 'hidden' ? 'published' : 'hidden' })
}

const reportTone = (status: Report['status']) => (status === 'open' || status === 'reviewing' ? 'warning' : 'success')
const reportStatusLabel = (status: Report['status']) =>
  ({ open: '待处理', reviewing: '复核中', resolved: '已解决', rejected: '已驳回' })[status]

const toggleVisibleReports = () => {
  const visibleIds = filteredAdminReports.value.map((report) => report.id)
  if (allVisibleReportsSelected.value) {
    selectedReportIds.value = selectedReportIds.value.filter((id) => !visibleIds.includes(id))
    return
  }
  selectedReportIds.value = Array.from(new Set([...selectedReportIds.value, ...visibleIds]))
}

const runReportBatch = async (payload: { status: Report['status']; hidePost?: boolean }) => {
  const ids = selectedVisibleReportIds.value
  if (!ids.length) return
  await blog.updateAdminReports(ids, payload)
  selectedReportIds.value = selectedReportIds.value.filter((id) => !ids.includes(id))
}

const updateCarouselDraft = (id: string, payload: Partial<HomeCarouselSlide>) => {
  carouselDrafts.value = carouselDrafts.value.map((slide) => (slide.id === id ? { ...slide, ...payload } : slide))
}

const selectCarouselImage = (choice: CarouselImageChoice) => {
  const current = selectedCarouselSlide.value
  if (!current) return
  updateCarouselDraft(current.id, {
    imageUrl: choice.url,
    imagePosition: choice.position,
    ...(choice.post
      ? {
          title: choice.post.title,
          excerpt: choice.post.excerpt,
          tag: choice.post.tags[0] ?? '精选',
          link: `/post/${choice.post.id}`,
          sourcePostId: choice.post.id,
        }
      : { sourcePostId: undefined }),
  })
}

const addCarouselDraft = () => {
  const choice = carouselImageChoices.value[0]
  const slide: HomeCarouselSlide = {
    id: `hero_custom_${Date.now()}`,
    title: '新的首页轮播',
    excerpt: '用一句话介绍这张主图希望带读者前往哪里。',
    imageUrl: choice?.url ?? imageAssets.hero,
    imagePosition: choice?.position ?? 'center',
    tag: '精选',
    link: '/discover',
    enabled: true,
    updatedAt: new Date().toISOString(),
  }
  carouselDrafts.value = [...carouselDrafts.value, slide]
  selectedCarouselId.value = slide.id
}

const removeCarouselDraft = (id: string) => {
  if (carouselDrafts.value.length <= 1) return
  const index = carouselDrafts.value.findIndex((slide) => slide.id === id)
  carouselDrafts.value = carouselDrafts.value.filter((slide) => slide.id !== id)
  if (selectedCarouselId.value === id) selectedCarouselId.value = carouselDrafts.value[Math.max(0, index - 1)]?.id ?? ''
}

const moveCarouselDraft = (id: string, direction: -1 | 1) => {
  const index = carouselDrafts.value.findIndex((slide) => slide.id === id)
  const nextIndex = index + direction
  if (index < 0 || nextIndex < 0 || nextIndex >= carouselDrafts.value.length) return
  const next = [...carouselDrafts.value]
  const [slide] = next.splice(index, 1)
  next.splice(nextIndex, 0, slide)
  carouselDrafts.value = next
}

const saveCarouselDrafts = async () => {
  if (!carouselDrafts.value.length) return
  carouselSaving.value = true
  try {
    await blog.updateAdminHomeCarousel(carouselDrafts.value)
    syncCarouselDrafts()
  } finally {
    carouselSaving.value = false
  }
}

const resetCarouselDrafts = async () => {
  carouselSaving.value = true
  try {
    await blog.resetAdminHomeCarousel()
    syncCarouselDrafts()
  } finally {
    carouselSaving.value = false
  }
}

watch(
  () => blog.adminCarouselSlides.map((slide) => slide.id).join('|'),
  () => syncCarouselDrafts(),
)

onMounted(async () => {
  await blog.bootstrap()
  if (!blog.isAuthenticated) {
    await router.replace('/login')
    return
  }
  if (!blog.isAdmin) {
    blog.notify('当前账号没有后台权限', 'warning')
    await router.replace('/')
    return
  }
  await refreshAdmin()
})
</script>

<template>
  <section class="admin-shell">
    <aside class="admin-sidebar">
      <div class="admin-brand-block">
        <span class="admin-brand-icon"><ShieldCheck :size="20" /></span>
        <div>
          <strong>星梦运营台</strong>
          <small>Stardream Admin</small>
        </div>
      </div>

      <nav class="admin-menu" aria-label="后台模块">
        <button
          v-for="item in navItems"
          :key="item.key"
          type="button"
          :class="['admin-menu-item', { active: tab === item.key }]"
          @click="tab = item.key"
        >
          <component :is="item.icon" :size="18" />
          <span>
            <strong>{{ item.title }}</strong>
            <small>{{ item.desc }}</small>
          </span>
          <em>{{ item.alert || item.count }}</em>
        </button>
      </nav>

      <div class="admin-system-card">
        <span class="section-kicker"><CircleGauge :size="15" /> 系统状态</span>
        <strong>{{ dataModeLabel }}</strong>
        <small class="admin-endpoint"><Cloud :size="13" /> {{ apiEndpointLabel }}</small>
        <div class="admin-health-row">
          <span :class="['admin-health-pill', apiHealthTone]">
            <component :is="apiHealthIcon" :size="14" :class="{ 'spin-icon': systemLoading }" />
            {{ apiHealthLabel }}
          </span>
          <span :class="['admin-health-pill', databaseHealthTone]">
            <Database :size="14" />
            {{ databaseHealthLabel }}
          </span>
        </div>
        <div v-if="healthCounts" class="admin-health-counts">
          <span><Users :size="13" />{{ healthCounts.users }}</span>
          <span><FileText :size="13" />{{ healthCounts.posts }}</span>
          <span><MessageSquareText :size="13" />{{ healthCounts.comments }}</span>
          <span><Flag :size="13" />{{ healthCounts.reports }}</span>
        </div>
        <button type="button" class="ghost-button compact admin-health-refresh" :disabled="systemLoading" @click="loadSystemHealth">
          <Server :size="15" />
          {{ systemLoading ? '检测中' : '重新检测' }}
        </button>
      </div>
    </aside>

    <main class="admin-console">
      <header class="admin-topbar">
        <div>
          <span class="admin-breadcrumb"><LayoutDashboard :size="16" /> 管理后台 / {{ currentTab.title }}</span>
          <h1>{{ currentTab.title }}</h1>
          <p>{{ currentTab.desc }}，当前筛选 {{ currentRows }} 条记录。</p>
        </div>
        <div class="admin-top-actions">
          <label class="admin-global-search">
            <Search :size="17" />
            <input v-model="adminQuery" placeholder="搜索用户、标题、状态、原因..." />
          </label>
          <button type="button" class="ghost-button" :disabled="refreshing" @click="refreshAdmin">
            <RefreshCw :size="16" />
            {{ refreshing ? '刷新中' : '刷新' }}
          </button>
        </div>
      </header>

      <section class="admin-kpi-grid" aria-label="运营指标">
        <article v-for="item in kpis" :key="item.label" :class="['admin-kpi-card', item.tone]">
          <span><component :is="item.icon" :size="20" /></span>
          <div>
            <strong>{{ item.value }}</strong>
            <small>{{ item.label }}</small>
          </div>
          <p>{{ item.helper }}</p>
        </article>
      </section>

      <section class="admin-workbench">
        <section class="admin-primary-panel">
          <div class="admin-panel-head">
            <div>
              <span class="section-kicker">
                <component :is="currentTab.icon" :size="16" />
                {{ currentTab.label }}
              </span>
              <h2>{{ currentTab.title }}</h2>
            </div>
            <span class="admin-count-pill">{{ currentRows }} 条</span>
          </div>

          <section v-if="tab === 'carousel'" class="admin-carousel-manager">
            <div class="admin-carousel-toolbar">
              <div>
                <strong>首页首屏轮播</strong>
                <small>{{ enabledCarouselCount }} 张启用 · 最多建议保留 5 张主图</small>
              </div>
              <div class="admin-row-actions">
                <button type="button" class="ghost-button compact" @click="addCarouselDraft"><Plus :size="15" />新增</button>
                <button type="button" class="ghost-button compact" :disabled="carouselSaving" @click="resetCarouselDrafts">
                  <RotateCcw :size="15" />
                  重置主推
                </button>
                <button type="button" class="primary-button compact" :disabled="carouselSaving || !carouselDrafts.length" @click="saveCarouselDrafts">
                  <Save :size="15" />
                  {{ carouselSaving ? '保存中' : '保存轮播' }}
                </button>
              </div>
            </div>

            <div class="admin-carousel-grid">
              <div class="admin-carousel-list" aria-label="轮播列表">
                <article v-for="(slide, index) in carouselDrafts" :key="slide.id" :class="['admin-carousel-item', { active: slide.id === selectedCarouselId }]">
                  <button type="button" class="admin-carousel-select" @click="selectedCarouselId = slide.id">
                    <img :src="slide.imageUrl" :alt="slide.title" :style="{ objectPosition: slide.imagePosition ?? 'center' }" />
                    <span>
                      <strong>{{ index + 1 }}. {{ slide.title }}</strong>
                      <small>{{ slide.enabled ? '展示中' : '已停用' }} · #{{ slide.tag }}</small>
                    </span>
                  </button>
                  <div class="admin-carousel-item-actions">
                    <button type="button" title="上移" :disabled="index === 0" @click="moveCarouselDraft(slide.id, -1)"><ArrowUp :size="14" /></button>
                    <button type="button" title="下移" :disabled="index === carouselDrafts.length - 1" @click="moveCarouselDraft(slide.id, 1)"><ArrowDown :size="14" /></button>
                    <button type="button" title="移除" :disabled="carouselDrafts.length <= 1" @click="removeCarouselDraft(slide.id)"><X :size="14" /></button>
                  </div>
                </article>
              </div>

              <div v-if="selectedCarouselSlide" class="admin-carousel-editor">
                <div class="admin-carousel-preview">
                  <img :src="selectedCarouselSlide.imageUrl" :alt="selectedCarouselSlide.title" :style="{ objectPosition: selectedCarouselSlide.imagePosition ?? 'center' }" />
                  <div>
                    <span class="section-kicker"><ImageIcon :size="15" /> #{{ selectedCarouselSlide.tag }}</span>
                    <strong>{{ selectedCarouselSlide.title }}</strong>
                    <small>{{ selectedCarouselSlide.excerpt }}</small>
                  </div>
                </div>

                <div class="admin-carousel-form">
                  <label>
                    轮播标题
                    <input
                      :value="selectedCarouselSlide.title"
                      maxlength="80"
                      @input="updateCarouselDraft(selectedCarouselSlide.id, { title: ($event.target as HTMLInputElement).value })"
                    />
                  </label>
                  <label>
                    摘要文案
                    <textarea
                      :value="selectedCarouselSlide.excerpt"
                      rows="3"
                      maxlength="180"
                      @input="updateCarouselDraft(selectedCarouselSlide.id, { excerpt: ($event.target as HTMLTextAreaElement).value })"
                    />
                  </label>
                  <div class="admin-carousel-fields">
                    <label>
                      标签
                      <input
                        :value="selectedCarouselSlide.tag"
                        maxlength="16"
                        @input="updateCarouselDraft(selectedCarouselSlide.id, { tag: ($event.target as HTMLInputElement).value })"
                      />
                    </label>
                    <label>
                      图片焦点
                      <select
                        :value="selectedCarouselSlide.imagePosition ?? 'center'"
                        @change="updateCarouselDraft(selectedCarouselSlide.id, { imagePosition: ($event.target as HTMLSelectElement).value })"
                      >
                        <option value="center">居中</option>
                        <option value="20% 40%">偏左</option>
                        <option value="70% 28%">偏右人物</option>
                        <option value="35% 55%">偏下主体</option>
                        <option value="50% 20%">偏上主体</option>
                      </select>
                    </label>
                  </div>
                  <label>
                    跳转链接
                    <span class="admin-input-with-icon">
                      <Link2 :size="15" />
                      <input
                        :value="selectedCarouselSlide.link"
                        placeholder="/post/xxx 或 /discover"
                        @input="updateCarouselDraft(selectedCarouselSlide.id, { link: ($event.target as HTMLInputElement).value })"
                      />
                    </span>
                  </label>
                  <label class="toggle-row">
                    <input
                      type="checkbox"
                      :checked="selectedCarouselSlide.enabled"
                      @change="updateCarouselDraft(selectedCarouselSlide.id, { enabled: ($event.target as HTMLInputElement).checked })"
                    />
                    <span>在首页轮播中启用</span>
                  </label>
                </div>

                <div class="admin-image-picker">
                  <div class="admin-carousel-toolbar compact">
                    <div>
                      <strong>更换轮播图</strong>
                      <small>可使用内置封面或任意文章封面</small>
                    </div>
                  </div>
                  <button
                    v-for="choice in carouselImageChoices"
                    :key="choice.url"
                    type="button"
                    :class="{ active: selectedCarouselSlide.imageUrl === choice.url }"
                    @click="selectCarouselImage(choice)"
                  >
                    <img :src="choice.url" :alt="choice.label" :style="{ objectPosition: choice.position }" />
                    <span>
                      <strong>{{ choice.label }}</strong>
                      <small>{{ choice.desc }}</small>
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section v-if="tab === 'users'" class="admin-table users-table">
            <div class="admin-table-row admin-table-head">
              <span>用户</span>
              <span>角色</span>
              <span>社区数据</span>
              <span>状态</span>
              <span>操作</span>
            </div>
            <div v-for="user in filteredAdminUsers" :key="user.id" class="admin-table-row">
              <RouterLink class="admin-entity" :to="`/user/${user.id}`">
                <span class="mini-avatar" :style="{ backgroundImage: `url(${user.avatarUrl})`, backgroundPosition: user.avatarPosition }" />
                <span>
                  <strong>{{ user.nickname }}</strong>
                  <small>@{{ user.username }} · {{ user.email ?? '未绑定邮箱' }}</small>
                </span>
              </RouterLink>
              <select :value="user.role ?? 'user'" @change="updateUserRole(user, ($event.target as HTMLSelectElement).value)">
                <option value="user">用户</option>
                <option value="creator">创作者</option>
                <option value="admin">管理员</option>
              </select>
              <span class="admin-muted">{{ user.stats.posts }} 篇 · {{ user.stats.likes.toLocaleString() }} 赞</span>
              <span :class="['admin-status-chip', user.status === 'banned' ? 'danger' : 'success']">
                {{ user.status === 'banned' ? '封禁' : '正常' }}
              </span>
              <button
                type="button"
                class="ghost-button compact"
                @click="blog.updateAdminUser(user.id, { status: user.status === 'banned' ? 'active' : 'banned' })"
              >
                {{ user.status === 'banned' ? '解封' : '封禁' }}
              </button>
            </div>
            <p v-if="!filteredAdminUsers.length" class="empty-state">没有匹配的用户。</p>
          </section>

          <section v-if="tab === 'posts'" class="admin-table posts-table">
            <div class="admin-table-row admin-table-head">
              <span>文章</span>
              <span>作者</span>
              <span>数据</span>
              <span>状态</span>
              <span>操作</span>
            </div>
            <div v-for="post in filteredAdminPosts" :key="post.id" class="admin-table-row">
              <RouterLink class="admin-entity text-only" :to="`/post/${post.id}`">
                <strong>{{ post.title }}</strong>
                <small>{{ post.tags.map((tag) => `#${tag}`).join(' ') }}</small>
              </RouterLink>
              <span class="admin-muted">{{ postAuthor(post) }}</span>
              <span class="admin-muted">{{ post.likeCount }} 赞 · {{ post.commentCount }} 评 · {{ post.viewCount }} 浏览</span>
              <span :class="['admin-status-chip', post.status === 'hidden' ? 'danger' : post.isPinned ? 'info' : 'success']">
                {{ post.status === 'hidden' ? '隐藏' : post.isPinned ? '置顶' : '发布' }}
              </span>
              <div class="admin-row-actions">
                <button type="button" class="ghost-button compact" @click="blog.updateAdminPost(post.id, { isPinned: !post.isPinned })">
                  {{ post.isPinned ? '取消置顶' : '置顶' }}
                </button>
                <button type="button" class="ghost-button compact" @click="updatePostStatus(post)">
                  {{ post.status === 'hidden' ? '恢复' : '隐藏' }}
                </button>
                <button type="button" class="text-button danger compact" @click="blog.deleteAdminPost(post.id)">
                  <Trash2 :size="15" />
                </button>
              </div>
            </div>
            <p v-if="!filteredAdminPosts.length" class="empty-state">没有匹配的文章。</p>
          </section>

          <section v-if="tab === 'comments'" class="admin-table comments-table">
            <div class="admin-table-row admin-table-head">
              <span>评论内容</span>
              <span>关联文章</span>
              <span>热度</span>
              <span>时间</span>
              <span>操作</span>
            </div>
            <div v-for="comment in filteredAdminComments" :key="comment.id" class="admin-table-row">
              <span class="admin-comment-copy">{{ comment.content }}</span>
              <RouterLink class="admin-link" :to="`/post/${comment.postId}`">{{ postTitle(comment.postId) }}</RouterLink>
              <span class="admin-muted">{{ comment.likeCount }} 赞</span>
              <TimestampPill :value="comment.createdAt" compact show-copy />
              <button type="button" class="text-button danger compact" @click="blog.deleteComment(comment.id).then(() => blog.loadAdmin())">
                <Trash2 :size="15" />
                删除
              </button>
            </div>
            <p v-if="!filteredAdminComments.length" class="empty-state">没有匹配的评论。</p>
          </section>

          <section v-if="tab === 'reports'" class="admin-table reports-table">
            <div class="admin-report-toolbar">
              <div class="segmented admin-report-filters" aria-label="举报状态筛选">
                <button
                  v-for="option in reportStatusCounts"
                  :key="option.key"
                  type="button"
                  :class="{ active: reportStatusFilter === option.key }"
                  @click="reportStatusFilter = option.key"
                >
                  {{ option.label }}
                  <small>{{ option.count }}</small>
                </button>
              </div>
              <div class="admin-report-bulk">
                <span>{{ selectedVisibleReportIds.length }} 已选</span>
                <button type="button" class="ghost-button compact" :disabled="!filteredAdminReports.length" @click="toggleVisibleReports">
                  {{ allVisibleReportsSelected ? '取消全选' : '选择当前' }}
                </button>
                <button type="button" class="ghost-button compact" :disabled="!selectedVisibleReportIds.length" @click="runReportBatch({ status: 'reviewing' })">
                  批量复核
                </button>
                <button type="button" class="ghost-button compact" :disabled="!selectedVisibleReportIds.length" @click="runReportBatch({ status: 'resolved', hidePost: true })">
                  批量隐藏
                </button>
                <button type="button" class="text-button compact" :disabled="!selectedVisibleReportIds.length" @click="runReportBatch({ status: 'rejected' })">
                  批量驳回
                </button>
              </div>
            </div>
            <div class="admin-table-row admin-table-head">
              <span class="admin-check-cell">
                <input type="checkbox" :checked="allVisibleReportsSelected" :disabled="!filteredAdminReports.length" @change="toggleVisibleReports" />
              </span>
              <span>举报原因</span>
              <span>关联文章</span>
              <span>状态</span>
              <span>提交时间</span>
              <span>操作</span>
            </div>
            <div v-for="report in filteredAdminReports" :key="report.id" class="admin-table-row">
              <span class="admin-check-cell">
                <input v-model="selectedReportIds" type="checkbox" :value="report.id" />
              </span>
              <span class="admin-report-copy">
                <strong>{{ report.reason }}</strong>
                <small>{{ report.detail || '无补充说明' }}</small>
              </span>
              <RouterLink class="admin-link" :to="`/post/${report.postId}`">{{ reportPostTitle(report) }}</RouterLink>
              <span :class="['admin-status-chip', reportTone(report.status)]">{{ reportStatusLabel(report.status) }}</span>
              <TimestampPill :value="report.createdAt" compact show-copy />
              <div class="admin-row-actions">
                <button type="button" class="ghost-button compact" @click="blog.updateAdminReport(report.id, { status: 'reviewing' })">
                  复核
                </button>
                <button type="button" class="ghost-button compact" @click="blog.updateAdminReport(report.id, { status: 'resolved', hidePost: true })">
                  隐藏
                </button>
                <button type="button" class="text-button compact" @click="blog.updateAdminReport(report.id, { status: 'rejected' })">
                  驳回
                </button>
              </div>
            </div>
            <p v-if="!filteredAdminReports.length" class="empty-state">没有匹配的举报。</p>
          </section>
        </section>

        <aside class="admin-side-rail">
          <section class="admin-side-panel">
            <div class="admin-panel-head compact">
              <div>
                <span class="section-kicker"><Megaphone :size="16" /> 系统广播</span>
                <h2>全站通知</h2>
              </div>
            </div>
            <form class="admin-broadcast-form" @submit.prevent="sendBroadcast">
              <textarea v-model="broadcastText" rows="4" placeholder="输入广播消息，发送后写入当前通知中心。" />
              <button type="submit" class="primary-button" :disabled="!broadcastText.trim()">
                <Send :size="16" />
                {{ broadcastSent ? '已发送' : '发送通知' }}
              </button>
            </form>
          </section>

          <section class="admin-side-panel">
            <div class="admin-panel-head compact">
              <div>
                <span class="section-kicker"><BellRing :size="16" /> 待办队列</span>
                <h2>需要关注</h2>
              </div>
            </div>
            <div class="admin-task-list">
              <RouterLink v-for="report in openReports.slice(0, 4)" :key="report.id" class="admin-task-item" :to="`/post/${report.postId}`">
                <span><Flag :size="15" /></span>
                <strong>{{ report.reason }}</strong>
                <small>{{ reportPostTitle(report) }}</small>
              </RouterLink>
              <p v-if="!openReports.length" class="empty-state">当前没有待处理举报。</p>
            </div>
          </section>

          <section class="admin-side-panel">
            <div class="admin-mini-chart">
              <span><BarChart3 :size="20" /></span>
              <div>
                <strong>{{ totalViews.toLocaleString() }}</strong>
                <small>累计内容浏览</small>
              </div>
            </div>
            <div class="admin-mini-chart">
              <span><Activity :size="20" /></span>
              <div>
                <strong>{{ blog.adminComments.length }}</strong>
                <small>评论审核样本</small>
              </div>
            </div>
          </section>
        </aside>
      </section>
    </main>
  </section>
</template>
