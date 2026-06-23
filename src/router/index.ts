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
      meta: { title: '星梦笔记', description: 'ACGN 公开资料博客，收录展会、漫画馆藏、正版平台与开放授权图片。' },
    },
    {
      path: '/post/:id',
      name: 'post-detail',
      component: () => import('@/views/PostDetailView.vue'),
      meta: { title: '文章详情', description: '阅读公开资料来源、原创整理说明和图片授权信息。' },
    },
    {
      path: '/user/:id',
      name: 'user-profile',
      component: () => import('@/views/UserProfileView.vue'),
      meta: { title: '资料组主页', description: '查看资料整理账号、来源说明和发布内容。' },
    },
    {
      path: '/editor',
      name: 'editor',
      component: () => import('@/views/EditorView.vue'),
      meta: { title: '写文章', description: '使用富文本编辑器整理公开资料、来源链接和图片说明。' },
    },
    {
      path: '/discover',
      name: 'discover',
      component: () => import('@/views/DiscoverView.vue'),
      meta: { title: '发现话题', description: '按标签探索 ACGN 展会、馆藏、平台和场景资料。' },
    },
    {
      path: '/gallery',
      name: 'gallery',
      component: () => import('@/views/GalleryView.vue'),
      meta: { title: '开放授权图库', description: '浏览站内使用的开放授权图片、来源文章和图片说明。' },
    },
    {
      path: '/search',
      name: 'search',
      component: () => import('@/views/SearchView.vue'),
      meta: { title: '搜索', description: '搜索公开资料文章、资料组、标签和内容。' },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/AuthView.vue'),
      meta: { title: '登录', description: '登录星梦笔记，继续整理、收藏和管理资料。' },
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
      meta: { title: '关注动态', description: '查看关注资料组的最新文章和站内动态。' },
    },
    {
      path: '/favorites',
      name: 'favorites',
      component: () => import('@/views/FavoritesView.vue'),
      meta: { title: '我的收藏', description: '整理已经收藏的公开资料文章和图片。' },
    },
    {
      path: '/archive',
      name: 'archive',
      component: () => import('@/views/ArchiveView.vue'),
      meta: { title: '文章归档', description: '按时间和标签回看站内公开资料归档。' },
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
      meta: { title: 'ACGN 公开资料库', description: '整理活动、馆藏和正版平台的公开来源。' },
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
