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
  MessageCircle,
  Palette,
  Pause,
  Play,
  Sparkles,
  Star,
  Tv,
  Utensils,
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
      eyebrow: ['今日主推', '灵感封面', '读者热看', '创作更新', '编辑精选'][index] ?? '精选文章',
      tag: post.tags[0] ?? '精选',
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
        eyebrow: slide.tag || ['今日主推', '灵感封面', '读者热看', '创作更新', '编辑精选'][index] || '精选文章',
        tag: slide.tag || post?.tags[0] || '精选',
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
    title: '绘画教程',
    desc: '柔光上色、水彩入门与封面构图',
    tag: '绘画教程',
    icon: Palette,
    image: imageAssets.starryDesk,
  },
  {
    title: 'Cos 影棚',
    desc: '低成本布光、服装手作与摄影幕后',
    tag: 'Cosplay',
    icon: Camera,
    image: imageAssets.moonlightCos,
  },
  {
    title: '追番记录',
    desc: '想看、在看、看过的轻量时间线',
    tag: '追番记录',
    icon: Tv,
    image: imageAssets.healingAnime,
  },
  {
    title: '轻小说连载',
    desc: '原创企划、异世界料理和日常短篇',
    tag: '轻小说',
    icon: Utensils,
    image: imageAssets.novelKitchen,
  },
])
const siteShowcase = [
  {
    title: '阅读',
    desc: '长文、目录和阅读进度',
    to: '/archive',
    icon: BookOpen,
    image: imageAssets.starryDesk,
  },
  {
    title: '画廊',
    desc: '瀑布流作品展示',
    to: '/gallery',
    icon: Camera,
    image: imageAssets.sakuraWatercolor,
  },
  {
    title: '写作',
    desc: '富文本与文章大纲',
    to: '/editor',
    icon: Palette,
    image: imageAssets.creators,
  },
  {
    title: '后台',
    desc: '数据、审核和举报处理',
    to: '/admin',
    icon: Hash,
    image: imageAssets.healingAnime,
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
          <span class="halo-avatar" :style="{ backgroundImage: `url(${activeHeroSlide.author?.avatarUrl})`, backgroundPosition: activeHeroSlide.author?.avatarPosition }" />
          <span class="section-kicker"><Sparkles :size="16" /> Halo 二次元博客</span>
          <h1>星梦笔记</h1>
          <p>梦之城、童话梦境、动漫创作与轻博客记录。</p>
          <strong class="hero-slide-title">{{ activeHeroSlide.title }}</strong>
          <div class="hero-actions">
            <RouterLink class="primary-button" :to="activeHeroSlide.link">
              <BookOpen :size="18" />
              阅读主推文章
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
          <span class="section-kicker"><Star :size="16" /> 星梦专题</span>
          <h2>同人创作、追番记录、Cos 影棚和轻小说连载都在这里汇流。</h2>
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
                <h2>封面、标签、摘要和作者信息都服务于阅读入口</h2>
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
                <h2>创作流</h2>
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
            <p>参考 Halo Sakura / Dream 的二次元博客气质：沉浸头图、文章卡片、侧栏组件和轻量互动。</p>
            <div class="stat-grid">
              <div class="stat-item"><strong>{{ blog.posts.length }}</strong><span>文章</span></div>
              <div class="stat-item"><strong>{{ blog.users.length }}</strong><span>作者</span></div>
              <div class="stat-item"><strong>{{ blog.tags.length }}</strong><span>标签</span></div>
            </div>
          </section>

          <section class="side-card halo-widget">
            <span class="section-kicker"><Sparkles :size="16" /> 封面墙</span>
            <div class="cover-wall">
              <img :src="imageAssets.starryDesk" alt="星空书桌封面" />
              <img :src="imageAssets.sakuraWatercolor" alt="樱花水彩封面" />
              <img :src="imageAssets.moonlightCos" alt="月光影棚封面" />
              <img :src="imageAssets.healingAnime" alt="治愈追番封面" />
            </div>
          </section>

          <section class="side-card halo-widget">
            <span class="section-kicker"><Sparkles :size="16" /> 站点公告</span>
            <p class="notice-copy">今晚的推荐流已换上新封面，适合从一张图开始写一篇轻博客。</p>
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
            <span class="section-kicker">推荐作者</span>
            <UserPanel v-for="user in creators" :key="user.id" :user="user" />
          </section>
        </aside>
      </div>
    </template>
  </section>
</template>
