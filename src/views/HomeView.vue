<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Camera,
  Flame,
  Hash,
  Heart,
  Library,
  MessageCircle,
  MonitorPlay,
  Pause,
  Play,
  Sparkles,
  Star,
  Tv,
} from 'lucide-vue-next'
import PostCard from '@/components/PostCard.vue'
import SkeletonHome from '@/components/SkeletonHome.vue'
import TimestampPill from '@/components/TimestampPill.vue'
import UserPanel from '@/components/UserPanel.vue'
import { imageAssets } from '@/api/mock'
import { useBlogStore } from '@/stores/blog'
import type { Post } from '@/types/content'

const blog = useBlogStore()
const activeHeroIndex = ref(0)
const heroPaused = ref(false)
let heroTimer: number | null = null

const authorFor = (authorId: string) => blog.users.find((user) => user.id === authorId)
const leadPost = computed(() => blog.posts.find((post) => post.isPinned) ?? blog.posts[0])
const featuredPosts = computed(() => blog.featuredPosts.slice(0, 4))
const latestPosts = computed(() => blog.posts.slice(0, 6))
const hotPosts = computed(() => blog.hotPosts.slice(0, 5))
const creators = computed(() => blog.users.slice(0, 3))
const sideTags = computed(() => blog.tags.slice(0, 12))
const fallbackHeroSlides = computed(() => {
  const candidates = [leadPost.value, ...blog.featuredPosts, ...blog.hotPosts, ...blog.posts].filter(Boolean) as Post[]
  const seen = new Set<string>()
  return candidates
    .filter((post) => {
      if (seen.has(post.id)) return false
      seen.add(post.id)
      return true
    })
    .slice(0, 5)
    .map((post, index) => ({
      post,
      author: authorFor(post.authorId),
      title: post.title,
      excerpt: post.excerpt,
      imageUrl: post.coverUrl || imageAssets.hero,
      imagePosition: post.imagePosition ?? 'center',
      eyebrow: ['番剧前哨', 'COS图廊', '游戏现场', '正版入口', '编辑精选'][index] ?? 'ACGN精选',
      tag: post.tags[0] ?? 'ACGN精选',
      link: `/post/${post.id}`,
    }))
})
const configuredHeroSlides = computed(() =>
  blog.homeCarouselSlides
    .filter((slide) => slide.enabled)
    .map((slide, index) => {
      const post = slide.sourcePostId ? blog.posts.find((item) => item.id === slide.sourcePostId) : undefined
      return {
        post,
        author: post ? authorFor(post.authorId) : undefined,
        title: slide.title,
        excerpt: slide.excerpt,
        imageUrl: slide.imageUrl || post?.coverUrl || imageAssets.hero,
        imagePosition: slide.imagePosition ?? post?.imagePosition ?? 'center',
        eyebrow: slide.tag || ['番剧前哨', 'COS图廊', '游戏现场', '正版入口', '编辑精选'][index] || 'ACGN精选',
        tag: slide.tag || post?.tags[0] || 'ACGN精选',
        link: slide.link || (post ? `/post/${post.id}` : '/discover'),
      }
    }),
)
const heroSlides = computed(() => (configuredHeroSlides.value.length ? configuredHeroSlides.value : fallbackHeroSlides.value))
const activeHeroSlide = computed(() => {
  if (!heroSlides.value.length) return null
  return heroSlides.value[activeHeroIndex.value % heroSlides.value.length]
})
const topicRoutes = computed(() => [
  {
    title: '番剧板块',
    desc: 'AnimeJapan、新番情报与正版补番入口',
    tag: '番剧',
    icon: Tv,
    image: imageAssets.healingAnime,
  },
  {
    title: 'COS 影廊',
    desc: 'Comiket、角色扮演现场与拍摄边界',
    tag: 'COS',
    icon: Camera,
    image: imageAssets.animeSummerGarden,
  },
  {
    title: '游戏档案',
    desc: 'Tokyo Game Show、手柄硬件与玩家文化',
    tag: '游戏',
    icon: MonitorPlay,
    image: imageAssets.animeNightCity,
  },
  {
    title: '图廊规则',
    desc: '海报、截图、COS 照片的版权标注方式',
    tag: '图廊',
    icon: Library,
    image: imageAssets.sakuraWatercolor,
  },
])
const formatCount = (value: number) => (value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(value))
const setHeroSlide = (index: number) => {
  const count = heroSlides.value.length
  if (!count) return
  activeHeroIndex.value = (index + count) % count
}
const nextHeroSlide = () => setHeroSlide(activeHeroIndex.value + 1)
const previousHeroSlide = () => setHeroSlide(activeHeroIndex.value - 1)
const stopHeroCarousel = () => {
  if (!heroTimer) return
  window.clearInterval(heroTimer)
  heroTimer = null
}
const startHeroCarousel = () => {
  stopHeroCarousel()
  heroTimer = window.setInterval(() => {
    if (!heroPaused.value && heroSlides.value.length > 1) nextHeroSlide()
  }, 6200)
}

onMounted(startHeroCarousel)
onBeforeUnmount(stopHeroCarousel)
</script>

<template>
  <section class="home-layout">
    <SkeletonHome v-if="blog.loading" :count="4" />
    <template v-else>
      <section
        v-if="activeHeroSlide"
        class="halo-masthead hero-carousel"
        @mouseenter="heroPaused = true"
        @mouseleave="heroPaused = false"
        @focusin="heroPaused = true"
        @focusout="heroPaused = false"
      >
        <transition name="hero-fade" mode="out-in">
          <img
            :key="activeHeroSlide.post?.id ?? activeHeroSlide.imageUrl"
            class="hero-carousel-bg"
            :src="activeHeroSlide.imageUrl"
            :alt="activeHeroSlide.title"
            :style="{ objectPosition: activeHeroSlide.imagePosition }"
          />
        </transition>
        <div class="halo-site-card hero-carousel-copy">
          <span class="section-kicker"><Sparkles :size="16" /> 番剧 · COS · 游戏 · 图廊</span>
          <h1>星梦番剧馆</h1>
          <p>把新番情报、COS 现场、游戏展会和日常番场景整理成一条有图、有来源、有版权说明的 ACGN 内容流。</p>
          <strong class="hero-slide-title">{{ activeHeroSlide.title }}</strong>
          <div class="hero-actions">
            <RouterLink class="primary-button" :to="activeHeroSlide.link">
              <BookOpen :size="18" />
              阅读主推内容
            </RouterLink>
            <RouterLink class="ghost-button" to="/discover">
              <Hash :size="18" />
              浏览板块
            </RouterLink>
          </div>
        </div>
        <div class="hero-carousel-panel">
          <div class="hero-carousel-controls" aria-label="首页轮播控制">
            <button type="button" aria-label="上一张" @click="previousHeroSlide"><ArrowLeft :size="18" /></button>
            <button type="button" :aria-label="heroPaused ? '继续轮播' : '暂停轮播'" @click="heroPaused = !heroPaused">
              <Play v-if="heroPaused" :size="18" />
              <Pause v-else :size="18" />
            </button>
            <button type="button" aria-label="下一张" @click="nextHeroSlide"><ArrowRight :size="18" /></button>
          </div>
          <RouterLink class="halo-featured-post" :to="activeHeroSlide.link">
            <span class="section-kicker"><CalendarDays :size="16" /> {{ activeHeroSlide.eyebrow }}</span>
            <strong>{{ activeHeroSlide.title }}</strong>
            <small>{{ activeHeroSlide.excerpt }}</small>
            <span class="hero-author-line">
              <span
                v-if="activeHeroSlide.author"
                class="mini-avatar"
                :style="{ backgroundImage: `url(${activeHeroSlide.author.avatarUrl})`, backgroundPosition: activeHeroSlide.author.avatarPosition }"
              />
              <span>{{ activeHeroSlide.author?.nickname ?? activeHeroSlide.tag }}</span>
              <TimestampPill v-if="activeHeroSlide.post" :value="activeHeroSlide.post.createdAt" compact />
            </span>
          </RouterLink>
          <div class="hero-carousel-dots" role="tablist" aria-label="首页轮播">
            <button
              v-for="(slide, index) in heroSlides"
              :key="slide.post?.id ?? `${slide.title}-${index}`"
              type="button"
              :class="{ active: index === activeHeroIndex }"
              :aria-label="`切换到 ${slide.title}`"
              @click="setHeroSlide(index)"
            >
              <span />
            </button>
          </div>
        </div>
      </section>

      <section class="feature-strip halo-notice">
        <div class="feature-strip-copy">
          <span class="section-kicker"><Star :size="16" /> ACGN 主板块</span>
          <h2>番剧前哨、COS 影廊、游戏现场和图廊规则在这里汇流。</h2>
        </div>
        <div class="feature-strip-preview" aria-label="精选内容预览">
          <RouterLink v-for="post in featuredPosts.slice(0, 3)" :key="post.id" :to="`/post/${post.id}`">
            <img :src="post.coverUrl" :alt="post.title" :style="{ objectPosition: post.imagePosition ?? 'center' }" />
            <span>#{{ post.tags[0] }}</span>
          </RouterLink>
        </div>
        <RouterLink class="feature-link" to="/discover">探索板块 <ArrowRight :size="16" /></RouterLink>
      </section>

      <section class="topic-route-band">
        <RouterLink v-for="topic in topicRoutes" :key="topic.tag" class="topic-route-card" :to="`/search?q=${encodeURIComponent(topic.tag)}`">
          <img :src="topic.image" :alt="topic.title" />
          <span class="topic-route-icon"><component :is="topic.icon" :size="18" /></span>
          <div>
            <strong>{{ topic.title }}</strong>
            <small>{{ topic.desc }}</small>
          </div>
        </RouterLink>
      </section>

      <div class="home-grid">
        <main class="main-column">
          <section class="section-block">
            <div class="section-title">
              <div>
                <span class="section-kicker"><Sparkles :size="16" /> ACGN 精选</span>
                <h2>番剧、COS、游戏和图廊内容都保留来源与版权说明。</h2>
              </div>
            </div>
            <div class="featured-grid">
              <RouterLink v-for="(post, index) in featuredPosts" :key="post.id" :class="['feature-tile', { lead: index === 0 }]" :to="`/post/${post.id}`">
                <img :src="post.coverUrl" :alt="post.title" :style="{ objectPosition: post.imagePosition ?? 'center' }" />
                <span>{{ post.series ? `系列 · ${post.series}` : `#${post.tags[0]}` }}</span>
                <strong>{{ post.title }}</strong>
                <small><Heart :size="13" /> {{ formatCount(post.likeCount) }} · {{ post.tags.slice(0, 2).join(' / ') }}</small>
              </RouterLink>
            </div>
          </section>

          <section class="section-block">
            <div class="section-title">
              <div>
                <span class="section-kicker"><BookOpen :size="16" /> 最新文章</span>
                <h2>最新 ACGN 内容</h2>
              </div>
              <RouterLink to="/archive">查看归档</RouterLink>
            </div>
            <div class="post-list">
              <PostCard v-for="post in latestPosts" :key="post.id" :post="post" :author="authorFor(post.authorId)" />
            </div>
          </section>
        </main>

        <aside class="side-column">
          <section class="side-card site-card">
            <span class="section-kicker"><Hash :size="16" /> 博客信息</span>
            <h2>欢迎来到星梦番剧馆</h2>
            <p>这里把番剧入口、COS 现场、游戏展会和图廊素材统一收进轻博客界面，既有二次元氛围，也能继续追踪来源。</p>
            <div class="stat-grid">
              <div class="stat-item"><strong>{{ blog.posts.length }}</strong><span>文章</span></div>
              <div class="stat-item"><strong>{{ blog.users.length }}</strong><span>板块组</span></div>
              <div class="stat-item"><strong>{{ blog.tags.length }}</strong><span>标签</span></div>
            </div>
          </section>

          <section class="side-card halo-widget">
            <span class="section-kicker"><Sparkles :size="16" /> ACGN 图廊</span>
            <div class="cover-wall">
              <img :src="imageAssets.healingAnime" alt="AnimeJapan 番剧前哨场馆图" />
              <img :src="imageAssets.animeForestPath" alt="二次元森林图廊" />
              <img :src="imageAssets.animeSummerGarden" alt="游戏与图廊二次元壁纸" />
              <img :src="imageAssets.novelKitchen" alt="日常番场景参考" />
            </div>
          </section>

          <section class="side-card halo-widget">
            <span class="section-kicker"><Sparkles :size="16" /> 站点公告</span>
            <p class="notice-copy">本轮已把默认内容切到番剧、COS、游戏、图廊方向；素材会在文档中记录作者、授权协议和原始链接。</p>
            <div class="topic-cloud">
              <RouterLink v-for="tag in sideTags" :key="tag" :to="`/search?q=${encodeURIComponent(tag)}`">#{{ tag }}</RouterLink>
            </div>
          </section>

          <section class="side-card">
            <span class="section-kicker"><Flame :size="16" /> 热门榜</span>
            <RouterLink v-for="(post, index) in hotPosts" :key="post.id" class="rank-row" :to="`/post/${post.id}`">
              <strong>{{ index + 1 }}</strong>
              <span>{{ post.title }}</span>
              <small><Heart :size="13" /> {{ formatCount(post.likeCount) }}</small>
              <small><MessageCircle :size="13" /> {{ post.commentCount }}</small>
            </RouterLink>
          </section>

          <section class="side-card">
            <span class="section-kicker">板块组</span>
            <UserPanel v-for="user in creators" :key="user.id" :user="user" />
          </section>
        </aside>
      </div>
    </template>
  </section>
</template>
