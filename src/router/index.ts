import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import PostDetailView from '@/views/PostDetailView.vue'
import UserProfileView from '@/views/UserProfileView.vue'
import EditorView from '@/views/EditorView.vue'
import DiscoverView from '@/views/DiscoverView.vue'
import GalleryView from '@/views/GalleryView.vue'
import SearchView from '@/views/SearchView.vue'
import AuthView from '@/views/AuthView.vue'
import AdminView from '@/views/AdminView.vue'
import MeView from '@/views/MeView.vue'
import FeedView from '@/views/FeedView.vue'
import FavoritesView from '@/views/FavoritesView.vue'
import ArchiveView from '@/views/ArchiveView.vue'
import SettingsView from '@/views/SettingsView.vue'
import AnimeBrowserView from '@/views/AnimeBrowserView.vue'

const history =
  import.meta.env.VITE_ROUTER_MODE === 'hash'
    ? createWebHashHistory(import.meta.env.BASE_URL)
    : createWebHistory(import.meta.env.BASE_URL)

const router = createRouter({
  history,
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/post/:id', name: 'post-detail', component: PostDetailView },
    { path: '/user/:id', name: 'user-profile', component: UserProfileView },
    { path: '/editor', name: 'editor', component: EditorView },
    { path: '/discover', name: 'discover', component: DiscoverView },
    { path: '/gallery', name: 'gallery', component: GalleryView },
    { path: '/search', name: 'search', component: SearchView },
    { path: '/login', name: 'login', component: AuthView },
    { path: '/me', name: 'me', component: MeView },
    { path: '/feed', name: 'feed', component: FeedView },
    { path: '/favorites', name: 'favorites', component: FavoritesView },
    { path: '/archive', name: 'archive', component: ArchiveView },
    { path: '/admin', name: 'admin', component: AdminView },
    { path: '/settings', name: 'settings', component: SettingsView },
    { path: '/anime', name: 'anime', component: AnimeBrowserView },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
