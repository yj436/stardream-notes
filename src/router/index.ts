import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'
import { metaFromRoute, updatePageMeta } from '@/composables/useSeoMeta'

const history =
  import.meta.env.VITE_ROUTER_MODE === 'hash'
    ? createWebHashHistory(import.meta.env.BASE_URL)
    : createWebHistory(import.meta.env.BASE_URL)

const router = createRouter({
  history,
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
      meta: { title: '星梦番剧馆', description: 'ACGN 内容博客，收录番剧、COS、游戏和图廊资料。' },
    },
    {
      path: '/post/:id',
      name: 'post-detail',
      component: () => import('@/views/PostDetailView.vue'),
      meta: { title: '文章详情', description: '阅读 ACGN 内容、来源说明和图片版权标注。' },
    },
    {
      path: '/user/:id',
      name: 'user-profile',
      component: () => import('@/views/UserProfileView.vue'),
      meta: { title: '板块组主页', description: '查看番剧、COS、游戏和图廊编辑账号。' },
    },
    {
      path: '/editor',
      name: 'editor',
      component: () => import('@/views/EditorView.vue'),
      meta: { title: '写文章', description: '使用富文本编辑器整理番剧、COS、游戏和图廊内容。' },
    },
    {
      path: '/discover',
      name: 'discover',
      component: () => import('@/views/DiscoverView.vue'),
      meta: { title: '发现话题', description: '按标签探索番剧、COS、游戏、图廊和日常番场景。' },
    },
    {
      path: '/gallery',
      name: 'gallery',
      component: () => import('@/views/GalleryView.vue'),
      meta: { title: 'ACGN 图廊', description: '浏览番剧资料图、COS 现场、游戏硬件和日常番场景。' },
    },
    {
      path: '/schedule',
      name: 'schedule',
      component: () => import('@/views/ScheduleIndexView.vue'),
      meta: { title: '番剧时间表', description: '抓取最近日番和国创更新时间线，按周几整理成追番索引。' },
    },
    {
      path: '/search',
      name: 'search',
      component: () => import('@/views/SearchView.vue'),
      meta: { title: '搜索', description: '搜索番剧、COS、游戏、图廊文章和标签。' },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/AuthView.vue'),
      meta: { title: '登录', description: '登录星梦笔记，继续整理、收藏和管理 ACGN 内容。' },
    },
    {
      path: '/me',
      name: 'me',
      component: () => import('@/views/MeView.vue'),
      meta: { title: '我的主页', description: '管理你的账号资料、文章和互动记录。' },
    },
    {
      path: '/feed',
      name: 'feed',
      component: () => import('@/views/FeedView.vue'),
      meta: { title: '关注动态', description: '查看关注板块组的最新文章和站内动态。' },
    },
    {
      path: '/favorites',
      name: 'favorites',
      component: () => import('@/views/FavoritesView.vue'),
      meta: { title: '我的收藏', description: '整理已经收藏的 ACGN 文章和图廊图片。' },
    },
    {
      path: '/archive',
      name: 'archive',
      component: () => import('@/views/ArchiveView.vue'),
      meta: { title: '文章归档', description: '按时间和标签回看番剧、COS、游戏和图廊内容。' },
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('@/views/AdminView.vue'),
      meta: { title: '后台管理', description: '管理内容审核、轮播图、举报处理和系统状态。' },
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/SettingsView.vue'),
      meta: { title: '设置', description: '调整界面、Live2D 小人和阅读偏好。' },
    },
    {
      path: '/anime',
      name: 'anime',
      component: () => import('@/views/AnimeBrowserView.vue'),
      meta: { title: '番剧 / COS / 游戏资料馆', description: '整理番剧前哨、COS 现场、游戏展会和图廊规则。' },
    },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

router.afterEach((to) => {
  updatePageMeta(metaFromRoute(to))
})

export default router
