<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  Activity,
  BarChart3,
  BellRing,
  CheckCircle2,
  CircleGauge,
  Clock3,
  FileText,
  Flag,
  LayoutDashboard,
  Megaphone,
  MessageSquareText,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Trash2,
  Users,
} from 'lucide-vue-next'
import TimestampPill from '@/components/TimestampPill.vue'
import { useBlogStore } from '@/stores/blog'
import { useNotificationStore } from '@/composables/useNotificationStore'
import type { Post, Report, User } from '@/types/content'

type AdminTab = 'users' | 'posts' | 'comments' | 'reports'

const router = useRouter()
const blog = useBlogStore()
const notifStore = useNotificationStore()
const tab = ref<AdminTab>('users')
const adminQuery = ref('')
const broadcastText = ref('')
const broadcastSent = ref(false)
const refreshing = ref(false)

const tabConfig = [
  { key: 'users' as const, label: '用户', title: '用户管理', desc: '角色、封禁与创作者权限', icon: Users },
  { key: 'posts' as const, label: '内容', title: '文章管理', desc: '置顶、隐藏与内容状态', icon: FileText },
  { key: 'comments' as const, label: '评论', title: '评论审核', desc: '社区互动与风险评论', icon: MessageSquareText },
  { key: 'reports' as const, label: '举报', title: '举报处理', desc: '复核流程与处理结论', icon: Flag },
]

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
  await blog.loadAdmin()
  refreshing.value = false
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
  blog.adminReports.filter((report) => includesQuery([report.reason, report.detail, report.status, report.postId])),
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
  return filteredAdminReports.value.length
})

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
            : blog.adminReports.length,
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

const updateUserRole = (user: User, role: string) => {
  if (role !== 'user' && role !== 'creator' && role !== 'admin') return
  void blog.updateAdminUser(user.id, { role })
}

const updatePostStatus = (post: Post) => {
  void blog.updateAdminPost(post.id, { status: post.status === 'hidden' ? 'published' : 'hidden' })
}

const reportTone = (status: Report['status']) => (status === 'open' || status === 'reviewing' ? 'warning' : 'success')

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
        <strong>本地 MVP 环境</strong>
        <small>SQLite · Express API · Vue 控制台</small>
        <div class="admin-health-row">
          <span><CheckCircle2 :size="14" /> API 在线</span>
          <span><Clock3 :size="14" /> 实时刷新</span>
        </div>
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
            <div class="admin-table-row admin-table-head">
              <span>举报原因</span>
              <span>关联文章</span>
              <span>状态</span>
              <span>提交时间</span>
              <span>操作</span>
            </div>
            <div v-for="report in filteredAdminReports" :key="report.id" class="admin-table-row">
              <span class="admin-report-copy">
                <strong>{{ report.reason }}</strong>
                <small>{{ report.detail || '无补充说明' }}</small>
              </span>
              <RouterLink class="admin-link" :to="`/post/${report.postId}`">{{ reportPostTitle(report) }}</RouterLink>
              <span :class="['admin-status-chip', reportTone(report.status)]">{{ report.status }}</span>
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
