<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  Bell,
  ChevronDown,
  Heart,
  LogIn,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
  User,
  X,
} from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useBlogStore } from '@/stores/blog'
import { useNotificationStore } from '@/composables/useNotificationStore'
import { useTheme } from '@/composables/useTheme'

const blog = useBlogStore()
const notifStore = useNotificationStore()
const { isDark, toggleTheme } = useTheme()
const router = useRouter()
const open = ref(false)
const profileOpen = ref(false)
const navSearch = ref('')
const currentUser = computed(() => blog.currentUser)

const links = [
  { label: '首页', to: '/' },
  { label: '时间表', to: '/schedule' },
  { label: '动态', to: '/feed' },
  { label: '发现', to: '/discover' },
  { label: '画廊', to: '/gallery' },
  { label: '归档', to: '/archive' },
  { label: '设置', to: '/settings' },
]

const submitNavSearch = async () => {
  const query = navSearch.value.trim()
  await router.push(query ? `/search?q=${encodeURIComponent(query)}` : '/search')
  open.value = false
}

const logout = () => {
  profileOpen.value = false
  blog.logout()
}
</script>

<template>
  <header class="topbar">
    <RouterLink class="brand" to="/" @click="open = false">
      <span class="brand-mark"><Sparkles :size="18" /></span>
      <span>星梦笔记</span>
    </RouterLink>

    <nav :class="['nav-links', { open }]">
      <RouterLink v-for="link in links" :key="link.to" :to="link.to" @click="open = false">
        {{ link.label }}
      </RouterLink>
    </nav>

    <form class="nav-search" role="search" @submit.prevent="submitNavSearch">
      <Search :size="17" />
      <input v-model="navSearch" placeholder="搜索文章、作者、标签" />
    </form>

    <div class="nav-actions">
      <button class="icon-button" type="button" :aria-label="isDark ? '切换浅色模式' : '切换暗色模式'" @click="toggleTheme">
        <Sun v-if="isDark" :size="18" />
        <Moon v-else :size="18" />
      </button>
      <button v-if="currentUser" class="icon-button notif-bell" type="button" aria-label="通知" @click="notifStore.togglePanel()">
        <Bell :size="18" />
        <span v-if="notifStore.unread" class="notif-dot">{{ notifStore.unread > 9 ? '9+' : notifStore.unread }}</span>
      </button>
      <RouterLink v-if="blog.isAdmin" class="icon-button" to="/admin" aria-label="管理后台">
        <ShieldCheck :size="18" />
      </RouterLink>
      <div v-if="currentUser" class="profile-menu-wrap">
        <button type="button" class="profile-trigger" aria-label="打开个人菜单" @click="profileOpen = !profileOpen">
          <span class="nav-avatar" :style="{ backgroundImage: `url(${currentUser.avatarUrl})`, backgroundPosition: currentUser.avatarPosition }" />
          <span class="profile-name">{{ currentUser.nickname }}</span>
          <ChevronDown :size="15" />
        </button>
        <div v-if="profileOpen" class="profile-dropdown">
          <RouterLink :to="`/user/${currentUser.id}`" @click="profileOpen = false"><User :size="15" />我的主页</RouterLink>
          <RouterLink to="/favorites" @click="profileOpen = false"><Star :size="15" />收藏夹</RouterLink>
          <RouterLink to="/settings" @click="profileOpen = false"><Settings :size="15" />设置</RouterLink>
          <button type="button" @click="logout"><LogOut :size="15" />退出</button>
        </div>
      </div>
      <RouterLink v-else class="write-button" to="/login">
        <LogIn :size="18" />
        <span>登录</span>
      </RouterLink>
      <RouterLink class="write-button desktop-write" to="/editor">
        <Sparkles :size="18" />
        <span>写笔记</span>
      </RouterLink>
      <button class="menu-button" type="button" aria-label="展开导航" @click="open = !open">
        <X v-if="open" :size="20" />
        <Menu v-else :size="20" />
      </button>
    </div>
  </header>

  <Teleport v-if="notifStore.panelOpen" to="body">
    <div class="notif-overlay" @click="notifStore.closePanel()" />
    <aside class="notif-panel" role="dialog" aria-label="通知面板">
      <div class="notif-header">
        <span class="section-kicker"><Bell :size="16" /> 通知中心</span>
        <div>
          <button type="button" class="ghost-button" @click="notifStore.markAllRead()">全部已读</button>
          <button type="button" class="text-button danger" @click="notifStore.clear()">清空</button>
        </div>
      </div>
      <div v-if="!notifStore.sorted.length" class="empty-state">暂无通知消息</div>
      <div v-for="n in notifStore.sorted" :key="n.id" :class="['notif-item', { unread: !n.read }]" @click="notifStore.markRead(n.id)">
        <div class="notif-icon">
          <Bell v-if="n.type === 'system'" :size="14" />
          <Heart v-else :size="14" />
        </div>
        <div class="notif-body">
          <p>{{ n.message }}</p>
          <small>{{ new Date(n.createdAt).toLocaleDateString('zh-CN') }}</small>
        </div>
      </div>
    </aside>
  </Teleport>
</template>
