<script setup lang="ts">
import { computed } from 'vue'
import { ArrowRight, BookOpen, CalendarDays, Camera, Flame, Hash, Heart, MessageCircle, Palette, Sparkles, Star, Tv, Utensils } from 'lucide-vue-next'
import PostCard from '@/components/PostCard.vue'
import SkeletonHome from '@/components/SkeletonHome.vue'
import TimestampPill from '@/components/TimestampPill.vue'
import UserPanel from '@/components/UserPanel.vue'
import { imageAssets } from '@/api/mock'
import { useBlogStore } from '@/stores/blog'

const blog = useBlogStore()

const leadPost = computed(() => blog.posts.find((post) => post.isPinned) ?? blog.posts[0])
const leadAuthor = computed(() => blog.users.find((user) => user.id === leadPost.value?.authorId))
const featuredPosts = computed(() => blog.featuredPosts.slice(0, 4))
const latestPosts = computed(() => blog.posts.slice(0, 6))
const hotPosts = computed(() => blog.hotPosts.slice(0, 5))
const creators = computed(() => blog.users.slice(0, 3))
const sideTags = computed(() => blog.tags.slice(0, 12))
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

const authorFor = (authorId: string) => blog.users.find((user) => user.id === authorId)
const formatCount = (value: number) => (value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(value))
</script>

<template>
  <section class="home-layout">
    <SkeletonHome v-if="blog.loading" :count="4" />
    <template v-else>
      <section
        v-if="leadPost && leadAuthor"
        class="halo-masthead"
        :style="{ backgroundImage: `linear-gradient(180deg, rgba(23, 30, 55, 0.18), rgba(23, 30, 55, 0.78)), url(${leadPost.coverUrl || imageAssets.hero})` }"
      >
        <div class="halo-sakura-layer" aria-hidden="true" />
        <div class="halo-site-card">
          <span class="halo-avatar" :style="{ backgroundImage: `url(${leadAuthor.avatarUrl})`, backgroundPosition: leadAuthor.avatarPosition }" />
          <span class="section-kicker"><Sparkles :size="16" /> Halo 二次元博客</span>
          <h1>星梦笔记</h1>
          <p>梦之城、童话梦境、动漫创作与轻博客记录。</p>
          <div class="hero-actions">
            <RouterLink class="primary-button" :to="`/post/${leadPost.id}`">
              <BookOpen :size="18" />
              阅读主推文章
            </RouterLink>
            <RouterLink class="ghost-button" to="/discover">
              <Hash :size="18" />
              浏览标签
            </RouterLink>
          </div>
        </div>
        <RouterLink class="halo-featured-post" :to="`/post/${leadPost.id}`">
          <span class="section-kicker"><CalendarDays :size="16" /> 今日主推</span>
          <strong>{{ leadPost.title }}</strong>
          <small>{{ leadPost.excerpt }}</small>
          <span class="hero-author-line">
            <span class="mini-avatar" :style="{ backgroundImage: `url(${leadAuthor.avatarUrl})`, backgroundPosition: leadAuthor.avatarPosition }" />
            <span>{{ leadAuthor.nickname }}</span>
            <TimestampPill :value="leadPost.createdAt" compact />
          </span>
        </RouterLink>
      </section>

      <section class="feature-strip halo-notice">
        <div>
          <span class="section-kicker"><Star :size="16" /> 星梦专题</span>
          <h2>同人创作、追番记录、Cos 影棚和轻小说连载都在这里汇流。</h2>
        </div>
        <RouterLink class="feature-link" to="/discover">探索话题 <ArrowRight :size="16" /></RouterLink>
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
                <span>#{{ post.tags[0] }}</span>
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
