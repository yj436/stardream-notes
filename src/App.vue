<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { Compass, Edit3, Home, Radio, Search, Sparkles, User, ArrowUp } from 'lucide-vue-next'
import AppNav from '@/components/AppNav.vue'
import CursorSparkle from '@/components/CursorSparkle.vue'
import Live2DCompanion from '@/components/Live2DCompanion.vue'
import ToastStack from '@/components/ToastStack.vue'
import { useBlogStore } from '@/stores/blog'

const blog = useBlogStore()
const pullRefreshing = ref(false)
const scrollProgress = ref(0)
let touchStartY = 0

const updateScrollProgress = () => {
  const max = document.documentElement.scrollHeight - window.innerHeight
  scrollProgress.value = max > 0 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 0
}

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const onTouchStart = (e: TouchEvent) => {
  if (window.scrollY > 10) return
  touchStartY = e.touches[0].clientY
}

const onTouchMove = (e: TouchEvent) => {
  if (!touchStartY) return
  pullRefreshing.value = e.touches[0].clientY - touchStartY > 80
}

const onTouchEnd = async () => {
  if (pullRefreshing.value) {
    await blog.bootstrap()
    blog.notify('已刷新推荐流', 'success')
  }
  pullRefreshing.value = false
  touchStartY = 0
}

onMounted(() => {
  void blog.bootstrap()
  updateScrollProgress()
  window.addEventListener('scroll', updateScrollProgress, { passive: true })
  window.addEventListener('resize', updateScrollProgress)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', updateScrollProgress)
  window.removeEventListener('resize', updateScrollProgress)
})
</script>

<template>
  <CursorSparkle>
    <AppNav />
    <div class="reading-progress" :style="{ transform: `scaleX(${scrollProgress / 100})` }" aria-hidden="true" />
    <div class="site-atmosphere" aria-hidden="true">
      <span class="petal p1" />
      <span class="petal p2" />
      <span class="petal p3" />
      <span class="petal p4" />
      <span class="star-dust s1" />
      <span class="star-dust s2" />
      <span class="star-dust s3" />
    </div>
    <div class="pull-indicator" :class="{ active: pullRefreshing }">释放刷新星梦笔记</div>
    <main class="app-shell" @touchstart.passive="onTouchStart" @touchmove.passive="onTouchMove" @touchend="onTouchEnd">
      <RouterView v-slot="{ Component }">
        <transition name="page-transition" mode="out-in">
          <component :is="Component" />
        </transition>
      </RouterView>
    </main>
    <footer class="site-footer">
      <div class="footer-brand">
        <span class="brand-mark"><Sparkles :size="18" /></span>
        <div>
          <strong>星梦笔记</strong>
          <small>ACGN 创作、追番记录与轻博客归档</small>
          <small>This content uses sample data owned and copyrighted by Live2D Inc.</small>
        </div>
      </div>
      <div class="footer-links">
        <RouterLink to="/discover">话题</RouterLink>
        <RouterLink to="/archive">归档</RouterLink>
        <RouterLink to="/editor">写笔记</RouterLink>
      </div>
    </footer>
    <div class="floating-tools" aria-label="快捷工具">
      <RouterLink to="/editor" aria-label="写笔记"><Edit3 :size="18" /></RouterLink>
      <RouterLink to="/search" aria-label="搜索"><Search :size="18" /></RouterLink>
      <button type="button" aria-label="回到顶部" @click="scrollToTop"><ArrowUp :size="18" /></button>
    </div>
    <ToastStack />
    <Live2DCompanion />
    <nav class="bottom-nav" aria-label="移动端导航">
      <RouterLink to="/"><Home :size="20" /><span>首页</span></RouterLink>
      <RouterLink to="/feed"><Radio :size="20" /><span>动态</span></RouterLink>
      <RouterLink to="/discover"><Compass :size="20" /><span>发现</span></RouterLink>
      <RouterLink to="/search"><Search :size="20" /><span>搜索</span></RouterLink>
      <RouterLink to="/me"><User :size="20" /><span>我的</span></RouterLink>
    </nav>
  </CursorSparkle>
</template>
