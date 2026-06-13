<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Bookmark, BookOpen, Copy, Edit3, Flag, Heart, ListTree, MessageCircle, Reply, Send, Share2, Trash2 } from 'lucide-vue-next'
import MarkdownRenderer from '@/components/MarkdownRenderer.vue'
import TimestampPill from '@/components/TimestampPill.vue'
import UserPanel from '@/components/UserPanel.vue'
import { useBlogStore } from '@/stores/blog'
import type { Comment, PostReactionKey } from '@/types/content'

const route = useRoute()
const router = useRouter()
const blog = useBlogStore()
const commentText = ref('')
const replyTexts = ref<Record<string, string>>({})
const reportOpen = ref(false)
const shareOpen = ref(false)
const reportReason = ref('不适宜内容')
const reportDetail = ref('')
const selectedReactions = ref<Record<string, boolean>>({})

const reactionEmojis = [
  { key: 'heart', icon: '♥', label: '暖心' },
  { key: 'laugh', icon: '哈', label: '好笑' },
  { key: 'cry', icon: '泪', label: '感动' },
  { key: 'fire', icon: '燃', label: '热血' },
] satisfies Array<{ key: PostReactionKey; icon: string; label: string }>

const postId = computed(() => String(route.params.id))
const reactionStorageKey = computed(() => `stardream:post-reactions:${postId.value}`)
const post = computed(() => blog.posts.find((item) => item.id === postId.value))
const author = computed(() => blog.users.find((user) => user.id === post.value?.authorId))
const comments = computed(() => blog.commentsByPost[postId.value] ?? [])
const topLevelComments = computed(() => comments.value.filter((comment) => !comment.parentId))
const relatedPosts = computed(() => {
  if (!post.value) return []
  return blog.posts
    .filter((item) => item.id !== post.value?.id && item.tags.some((tag) => post.value?.tags.includes(tag)))
    .slice(0, 3)
})
const articleHeadings = computed(() => {
  if (!post.value) return []
  return post.value.content
    .split('\n')
    .map((line) => line.match(/^#{2,3}\s+(.+)$/)?.[1]?.trim())
    .filter((heading): heading is string => Boolean(heading))
    .slice(0, 6)
})
const wordCount = computed(() => post.value?.content.replace(/\s+/g, '').length ?? 0)
const readingMinutes = computed(() => Math.max(1, Math.ceil(wordCount.value / 420)))

const repliesFor = (commentId: string) => comments.value.filter((comment) => comment.parentId === commentId)
const userFor = (comment: Comment) => blog.users.find((user) => user.id === comment.userId)
const canDelete = (comment: Comment) => comment.userId === blog.currentUserId || author.value?.id === blog.currentUserId
const canManagePost = computed(() => post.value?.authorId === blog.currentUserId || blog.isAdmin)

const load = async () => {
  await blog.bootstrap()
  if (!post.value) {
    void router.replace('/')
    return
  }
  selectedReactions.value = readSelectedReactions()
  await blog.loadPostComments(postId.value)
}

const readSelectedReactions = () => {
  try {
    return JSON.parse(window.localStorage.getItem(reactionStorageKey.value) ?? '{}') as Record<string, boolean>
  } catch {
    return {}
  }
}

const writeSelectedReactions = () => {
  window.localStorage.setItem(reactionStorageKey.value, JSON.stringify(selectedReactions.value))
}

const submitComment = async () => {
  await blog.addComment(postId.value, commentText.value)
  commentText.value = ''
}

const submitReply = async (commentId: string) => {
  await blog.addComment(postId.value, replyTexts.value[commentId] ?? '', commentId)
  replyTexts.value = { ...replyTexts.value, [commentId]: '' }
}

const deleteCurrentPost = async () => {
  if (!post.value) return
  await blog.deletePost(post.value.id)
  await router.push('/')
}

const submitReport = async () => {
  if (!post.value) return
  await blog.reportPost(post.value.id, reportReason.value, reportDetail.value)
  reportOpen.value = false
  reportDetail.value = ''
}

const copyShareLink = async () => {
  if (!post.value) return
  const url = `${window.location.origin}/post/${post.value.id}`
  try {
    await navigator.clipboard.writeText(url)
    blog.notify('分享链接已复制', 'success')
  } catch {
    blog.notify(url, 'info')
  }
}

const toggleReaction = async (key: PostReactionKey) => {
  if (!blog.requireLogin()) return
  const selected = !selectedReactions.value[key]
  selectedReactions.value = { ...selectedReactions.value, [key]: selected }
  writeSelectedReactions()
  await blog.toggleReaction(postId.value, key, selected)
}

onMounted(load)
watch(postId, load)
</script>

<template>
  <article v-if="post && author" class="detail-layout">
    <section class="article-panel">
      <div class="article-hero">
        <img :src="post.coverUrl" :alt="post.title" :style="{ objectPosition: post.imagePosition ?? 'center' }" />
        <div class="halo-sakura-layer" aria-hidden="true" />
        <div class="article-hero-copy">
          <div class="tag-row">
            <RouterLink v-for="tag in post.tags" :key="tag" :to="`/search?q=${encodeURIComponent(tag)}`">#{{ tag }}</RouterLink>
          </div>
          <h1>{{ post.title }}</h1>
          <div class="article-meta meta-line">
            <span>{{ author.nickname }}</span>
            <TimestampPill :value="post.createdAt" label="发布于" show-copy />
            <span>{{ post.viewCount }} 浏览</span>
          </div>
        </div>
      </div>

      <div id="article-body" class="article-content">
        <div class="article-text">
          <MarkdownRenderer :content="post.content" />
        </div>

        <div class="gallery-row" v-if="post.gallery.length">
          <img v-for="(image, index) in post.gallery" :key="`${image}-${index}`" :src="image" alt="作品图" />
        </div>

        <div class="reaction-bar">
          <button v-for="reaction in reactionEmojis" :key="reaction.key" type="button" :class="{ active: selectedReactions[reaction.key] }" @click="toggleReaction(reaction.key)">
            <span>{{ reaction.icon }}</span>
            {{ reaction.label }}
            <small>{{ post.reactions?.[reaction.key] ?? 0 }}</small>
          </button>
        </div>

        <div class="article-actions">
          <RouterLink v-if="canManagePost" class="text-button" :to="`/editor?edit=${post.id}`"><Edit3 :size="16" />编辑</RouterLink>
          <button v-if="canManagePost" type="button" class="text-button danger" @click="deleteCurrentPost"><Trash2 :size="16" />删除文章</button>
          <button type="button" :class="{ active: post.isLiked }" @click="blog.toggleLike(post.id)"><Heart :size="18" />{{ post.isLiked ? '已点赞' : '点赞' }} {{ post.likeCount }}</button>
          <button type="button" :class="{ active: post.isFavorited }" @click="blog.toggleFavorite(post.id)"><Bookmark :size="18" />{{ post.isFavorited ? '已收藏' : '收藏' }} {{ post.favoriteCount }}</button>
          <button v-if="!canManagePost" type="button" @click="reportOpen = !reportOpen"><Flag :size="18" />举报</button>
          <button type="button" @click="shareOpen = !shareOpen"><Share2 :size="18" />分享</button>
        </div>

        <form v-if="reportOpen" class="report-form" @submit.prevent="submitReport">
          <select v-model="reportReason">
            <option>不适宜内容</option>
            <option>侵权或搬运</option>
            <option>骚扰攻击</option>
            <option>垃圾广告</option>
          </select>
          <textarea v-model="reportDetail" rows="3" placeholder="补充说明，方便管理员判断" />
          <button type="submit" class="primary-button">提交举报</button>
        </form>

        <div v-if="shareOpen" class="share-panel">
          <div class="share-card">
            <img :src="post.coverUrl" :alt="post.title" />
            <div>
              <span>星梦分享卡</span>
              <h3>{{ post.title }}</h3>
              <p>{{ post.excerpt }}</p>
              <small>来自 {{ author.nickname }} · {{ post.tags.map((tag) => `#${tag}`).join(' ') }}</small>
            </div>
          </div>
          <button type="button" class="ghost-button" @click="copyShareLink"><Copy :size="16" />复制链接</button>
        </div>
      </div>
    </section>

    <aside class="detail-side">
      <UserPanel :user="author" />
      <section class="side-card halo-widget">
        <span class="section-kicker">文章信息</span>
        <div class="stat-grid">
          <div class="stat-item"><strong>{{ post.likeCount }}</strong><span>点赞</span></div>
          <div class="stat-item"><strong>{{ post.favoriteCount }}</strong><span>收藏</span></div>
          <div class="stat-item"><strong>{{ comments.length }}</strong><span>评论</span></div>
        </div>
      </section>
      <section class="side-card halo-widget">
        <span class="section-kicker"><BookOpen :size="16" /> 阅读信息</span>
        <div class="read-meta-grid">
          <span>{{ wordCount }} 字</span>
          <span>约 {{ readingMinutes }} 分钟</span>
          <span>{{ post.tags.length }} 个标签</span>
        </div>
      </section>
      <section v-if="articleHeadings.length" class="side-card halo-widget article-toc">
        <span class="section-kicker"><ListTree :size="16" /> 文章目录</span>
        <a v-for="heading in articleHeadings" :key="heading" href="#article-body">{{ heading }}</a>
      </section>
      <section v-if="relatedPosts.length" class="side-card">
        <span class="section-kicker">相关文章</span>
        <RouterLink v-for="item in relatedPosts" :key="item.id" class="side-link" :to="`/post/${item.id}`">{{ item.title }}</RouterLink>
      </section>
    </aside>

    <section class="comment-panel">
      <div class="section-title">
        <div>
          <span class="section-kicker"><MessageCircle :size="16" /> 评论</span>
          <h2>{{ comments.length }} 条同好留言</h2>
        </div>
      </div>
      <form class="comment-form" @submit.prevent="submitComment">
        <textarea v-model="commentText" rows="4" placeholder="写下你的星屿留言..." />
        <button type="submit" class="primary-button" :disabled="!commentText.trim()"><Send :size="16" />发送</button>
      </form>
      <div class="comment-list">
        <div v-for="comment in topLevelComments" :key="comment.id" class="comment-item">
          <span class="mini-avatar" :style="{ backgroundImage: `url(${userFor(comment)?.avatarUrl})`, backgroundPosition: userFor(comment)?.avatarPosition }" />
          <div class="comment-body">
            <div class="comment-head">
              <strong>{{ userFor(comment)?.nickname }}</strong>
              <button v-if="canDelete(comment)" type="button" class="text-button danger" @click="blog.deleteComment(comment.id)"><Trash2 :size="15" />删除</button>
            </div>
            <p>{{ comment.content }}</p>
            <div class="comment-foot">
              <TimestampPill :value="comment.createdAt" compact show-copy />
              <button type="button" class="text-button" @click="blog.toggleCommentLike(comment.id, postId)"><Heart :size="15" />赞 {{ comment.likeCount }}</button>
            </div>
            <form class="reply-form" @submit.prevent="submitReply(comment.id)">
              <input v-model="replyTexts[comment.id]" placeholder="回复这条留言..." />
              <button type="submit" class="text-button" :disabled="!replyTexts[comment.id]?.trim()"><Reply :size="15" />回复</button>
            </form>

            <div v-if="repliesFor(comment.id).length" class="reply-list">
              <div v-for="reply in repliesFor(comment.id)" :key="reply.id" class="reply-item">
                <span class="mini-avatar" :style="{ backgroundImage: `url(${userFor(reply)?.avatarUrl})`, backgroundPosition: userFor(reply)?.avatarPosition }" />
                <div>
                  <div class="comment-head">
                    <strong>{{ userFor(reply)?.nickname }}</strong>
                    <button v-if="canDelete(reply)" type="button" class="text-button danger" @click="blog.deleteComment(reply.id)"><Trash2 :size="15" />删除</button>
                  </div>
                  <p>{{ reply.content }}</p>
                  <div class="comment-foot">
                    <TimestampPill :value="reply.createdAt" compact show-copy />
                    <button type="button" class="text-button" @click="blog.toggleCommentLike(reply.id, postId)"><Heart :size="15" />赞 {{ reply.likeCount }}</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </article>
</template>
