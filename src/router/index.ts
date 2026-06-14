import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'

const history =
  import.meta.env.VITE_ROUTER_MODE === 'hash'
    ? createWebHashHistory(import.meta.env.BASE_URL)
    : createWebHistory(import.meta.env.BASE_URL)

const router = createRouter({
  history,
  routes: [
    { path: '/', name: 'home', component: () => import('@/views/HomeView.vue') },
    { path: '/post/:id', name: 'post-detail', component: () => import('@/views/PostDetailView.vue') },
    { path: '/user/:id', name: 'user-profile', component: () => import('@/views/UserProfileView.vue') },
    { path: '/editor', name: 'editor', component: () => import('@/views/EditorView.vue') },
    { path: '/discover', name: 'discover', component: () => import('@/views/DiscoverView.vue') },
    { path: '/gallery', name: 'gallery', component: () => import('@/views/GalleryView.vue') },
    { path: '/search', name: 'search', component: () => import('@/views/SearchView.vue') },
    { path: '/login', name: 'login', component: () => import('@/views/AuthView.vue') },
    { path: '/me', name: 'me', component: () => import('@/views/MeView.vue') },
    { path: '/feed', name: 'feed', component: () => import('@/views/FeedView.vue') },
    { path: '/favorites', name: 'favorites', component: () => import('@/views/FavoritesView.vue') },
    { path: '/archive', name: 'archive', component: () => import('@/views/ArchiveView.vue') },
    { path: '/admin', name: 'admin', component: () => import('@/views/AdminView.vue') },
    { path: '/settings', name: 'settings', component: () => import('@/views/SettingsView.vue') },
    { path: '/anime', name: 'anime', component: () => import('@/views/AnimeBrowserView.vue') },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
