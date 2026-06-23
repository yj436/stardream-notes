<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Building2,
  CalendarDays,
  Camera,
  Database,
  Flame,
  Hash,
  Heart,
  Library,
  MessageCircle,
  MonitorPlay,
  Palette,
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
      eyebrow: ['今日主推', '馆藏资料', '活动现场', '正版入口', '编辑精选'][index] ?? '精选资料',
      tag: post.tags[0] ?? '资料精选',
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
        eyebrow: slide.tag || ['今日主推', '馆藏资料', '活动现场', '正版入口', '编辑精选'][index] || '精选资料',
        tag: slide.tag || post?.tags[0] || '资料精选',
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
    title: '漫画馆藏',
    desc: '京都国际漫画博物馆、馆藏检索与漫画史资料',
    tag: '京都国际漫画博物馆',
    icon: Library,
    image: imageAssets.starryDesk,
  },
  {
    title: '展会与同人',
    desc: 'Comic Market、东京 Big Sight 与创作者社群',
    tag: 'Comiket',
    icon: Building2,
    image: imageAssets.moonlightCos,
  },
  {
    title: '动画产业',
    desc: 'AnimeJapan、公共日、商务日与展会结构',
    tag: 'AnimeJapan',
    icon: Tv,
    image: imageAssets.hero,
  },
  {
    title: '正版阅读',
    desc: 'MANGA Plus 等官方平台入口与内容规范',
    tag: 'MANGA Plus',
    icon: MonitorPlay,
    image: imageAssets.creators,
  },
])
const siteShowcase = [
  {
    title: '归档',
    desc: '按时间回看公开资料卡',
    to: '/archive',
    icon: BookOpen,
    image: imageAssets.starryDesk,
  },
  {
    title: '图库',
    desc: '开放授权图片与来源说明',
    to: '/gallery',
    icon: Camera,
    image: imageAssets.sakuraWatercolor,
  },
  {
    title: '写作',
    desc: '用富文本整理资料笔记',
    to: '/editor',
    icon: Palette,
    image: imageAssets.creators,
  },
  {
    title: '后台',
    desc: '管理内容、轮播和数据状态',
    to: '/admin',
    icon: Database,
    image: imageAssets.hero,
  },
]

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
        <div class="halo-sakura-layer" aria-hidden="true" />
        <div class="hero-carousel-orbit" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div class="halo-site-card hero-carousel-copy">
          <span
            class="halo-avatar"
            :style="{ backgroundImage: activeHeroSlide.author?.avatarUrl ? `url(${activeHeroSlide.author.avatarUrl})` : undefined, backgroundPosition: activeHeroSlide.author?.avatarPosition }"
          />
          <span class="section-kicker"><Sparkles :size="16" /> ACGN 公开资料博客</span>
          <h1>星梦笔记</h1>
          <p>收录公开来源、开放授权图片与原创整理文本，把活动、馆藏、平台和日常场景做成可维护的博客资料库。</p>
          <strong class="hero-slide-title">{{ activeHeroSlide.title }}</strong>
          <div class="hero-actions">
            <RouterLink class="primary-button" :to="activeHeroSlide.link">
              <BookOpen :size="18" />
              阅读主推资料
            </RouterLink>
            <RouterLink class="ghost-button" to="/discover">
              <Hash :size="18" />
              浏览标签
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
          <div class="hero-thumb-strip" aria-label="轮播文章">
            <button
              v-for="(slide, index) in heroSlides.slice(0, 4)"
              :key="slide.post?.id ?? `${slide.title}-${index}`"
              type="button"
              :class="{ active: index === activeHeroIndex }"
              @click="setHeroSlide(index)"
            >
              <img :src="slide.imageUrl" :alt="slide.title" :style="{ objectPosition: slide.imagePosition }" />
              <span>#{{ slide.tag }}</span>
            </button>
          </div>
        </div>
      </section>

      <section class="feature-strip halo-notice">
        <div>
          <span class="section-kicker"><Star :size="16" /> 真实资料专题</span>
          <h2>漫画馆藏、展会活动、正版平台和日常场景参考在这里汇流。</h2>
        </div>
        <RouterLink class="feature-link" to="/discover">探索话题 <ArrowRight :size="16" /></RouterLink>
      </section>

      <section class="site-motion-showcase" aria-label="站点页面入口">
        <RouterLink v-for="item in siteShowcase" :key="item.to" class="motion-page-card" :to="item.to">
          <img :src="item.image" :alt="item.title" />
          <div class="motion-page-shade" aria-hidden="true" />
          <div class="motion-browser" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <span class="motion-page-icon"><component :is="item.icon" :size="18" /></span>
          <div>
            <strong>{{ item.title }}</strong>
            <small>{{ item.desc }}</small>
          </div>
        </RouterLink>
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
                <span class="section-kicker"><Sparkles :size="16" /> 博客精选</span>
                <h2>每篇内容都保留来源、图片授权和原创整理说明。</h2>
              </div>
            </div>
            <div class="featured-grid">
              <RouterLink v-for="post in featuredPosts" :key="post.id" class="feature-tile" :to="`/post/${post.id}`">
                <img :src="post.coverUrl" :alt="post.title" :style="{ objectPosition: post.imagePosition ?? 'center' }" />
                <span>{{ post.series ? `系列 · ${post.series}` : `#${post.tags[0]}` }}</span>
                <strong>{{ post.title }}</strong>
              </RouterLink>
            </div>
          </section>

          <section class="section-block">
            <div class="section-title">
              <div>
                <span class="section-kicker"><BookOpen :size="16" /> 最新文章</span>
                <h2>公开资料流</h2>
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
            <h2>欢迎来到星梦笔记</h2>
            <p>这里把 ACGN 相关公开页面、开放授权图片和原创整理文本统一收进一个轻博客界面，适合持续扩展但不堆砌素材。</p>
            <div class="stat-grid">
              <div class="stat-item"><strong>{{ blog.posts.length }}</strong><span>文章</span></div>
              <div class="stat-item"><strong>{{ blog.users.length }}</strong><span>资料组</span></div>
              <div class="stat-item"><strong>{{ blog.tags.length }}</strong><span>标签</span></div>
            </div>
          </section>

          <section class="side-card halo-widget">
            <span class="section-kicker"><Sparkles :size="16" /> 图片来源</span>
            <div class="cover-wall">
              <img :src="imageAssets.starryDesk" alt="京都国际漫画博物馆主展区" />
              <img :src="imageAssets.sakuraWatercolor" alt="漫画工具展示" />
              <img :src="imageAssets.moonlightCos" alt="Comiket 现场 Cosplay 区域" />
              <img :src="imageAssets.galaxySchool" alt="京都国际漫画博物馆户外阅读场景" />
            </div>
          </section>

          <section class="side-card halo-widget">
            <span class="section-kicker"><Sparkles :size="16" /> 站点公告</span>
            <p class="notice-copy">本轮已将默认内容替换为公开来源资料，并在文档中记录图片作者、授权协议和原始链接。</p>
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
            <span class="section-kicker">资料组</span>
            <UserPanel v-for="user in creators" :key="user.id" :user="user" />
          </section>
        </aside>
      </div>
    </template>
  </section>
</template>
