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
      meta: { title: '星梦笔记', description: '二次元轻博客社区，收藏创作笔记、追番短评和作品画廊。' },
    },
    {
      path: '/post/:id',
      name: 'post-detail',
      component: () => import('@/views/PostDetailView.vue'),
      meta: { title: '文章详情', description: '阅读星梦笔记里的创作故事、作品记录和追番短评。' },
    },
    {
      path: '/user/:id',
      name: 'user-profile',
      component: () => import('@/views/UserProfileView.vue'),
      meta: { title: '创作者主页', description: '查看创作者资料、作品和星梦笔记动态。' },
    },
    {
      path: '/editor',
      name: 'editor',
      component: () => import('@/views/EditorView.vue'),
      meta: { title: '写文章', description: '使用 Markdown 富文本编辑器记录创作灵感和追番笔记。' },
    },
    {
      path: '/discover',
      name: 'discover',
      component: () => import('@/views/DiscoverView.vue'),
      meta: { title: '发现话题', description: '探索星梦笔记里的热门标签、专题路线和创作灵感。' },
    },
    {
      path: '/gallery',
      name: 'gallery',
      component: () => import('@/views/GalleryView.vue'),
      meta: { title: '作品画廊', description: '浏览二次元作品、插画封面和创作者图片资产。' },
    },
    {
      path: '/search',
      name: 'search',
      component: () => import('@/views/SearchView.vue'),
      meta: { title: '搜索', description: '搜索星梦笔记的文章、用户、标签和作品内容。' },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/AuthView.vue'),
      meta: { title: '登录', description: '登录星梦笔记，继续写作、收藏和互动。' },
    },
    {
      path: '/me',
      name: 'me',
      component: () => import('@/views/MeView.vue'),
      meta: { title: '我的主页', description: '管理你的星梦笔记资料、创作和互动记录。' },
    },
    {
      path: '/feed',
      name: 'feed',
      component: () => import('@/views/FeedView.vue'),
      meta: { title: '关注动态', description: '查看关注创作者的最新文章、作品和互动动态。' },
    },
    {
      path: '/favorites',
      name: 'favorites',
      component: () => import('@/views/FavoritesView.vue'),
      meta: { title: '我的收藏', description: '整理已经收藏的文章、画廊和追番记录。' },
    },
    {
      path: '/archive',
      name: 'archive',
      component: () => import('@/views/ArchiveView.vue'),
      meta: { title: '文章归档', description: '按时间和标签回看星梦笔记里的内容归档。' },
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('@/views/AdminView.vue'),
      meta: { title: '后台管理', description: '管理星梦笔记的内容审核、举报处理和系统状态。' },
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/SettingsView.vue'),
      meta: { title: '设置', description: '调整星梦笔记的界面、Live2D 小人和阅读偏好。' },
    },
    {
      path: '/anime',
      name: 'anime',
      component: () => import('@/views/AnimeBrowserView.vue'),
      meta: { title: '追番记录', description: '记录想看、在看、看过的动画与轻量短评。' },
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
