import { defineStore } from 'pinia'
import { appApi } from '@/api/appApi'
import { EXP_EVENTS, addExp, levelTitle, nextLevelExp } from '@/composables/useExpSystem'
import { useNotificationStore } from '@/composables/useNotificationStore'
import type {
  AdminStats,
  AnimeRecord,
  AnimeRecordPayload,
  AnimeStatus,
  Comment,
  Draft,
  DraftSnapshot,
  HomeCarouselSlide,
  LoginPayload,
  NewPostPayload,
  Post,
  PostReactionKey,
  ProfileUpdatePayload,
  RegisterPayload,
  Report,
  SearchResult,
  User,
} from '@/types/content'

const getNotifStore = () => useNotificationStore()

interface ToastMessage {
  id: number
  text: string
  tone: 'success' | 'info' | 'warning'
}

interface BlogState {
  currentUserId: string
  authToken: string | null
  users: User[]
  posts: Post[]
  commentsByPost: Record<string, Comment[]>
  animeRecords: AnimeRecord[]
  homeCarouselSlides: HomeCarouselSlide[]
  draft: Draft
  draftSnapshots: DraftSnapshot[]
  search: SearchResult
  adminStats: AdminStats | null
  adminUsers: User[]
  adminPosts: Post[]
  adminComments: Comment[]
  adminReports: Report[]
  adminCarouselSlides: HomeCarouselSlide[]
  notifications: ToastMessage[]
  loading: boolean
}

let bootstrapRequest: Promise<void> | null = null

export const useBlogStore = defineStore('blog', {
  state: (): BlogState => ({
    currentUserId: '',
    authToken: appApi.getStoredToken(),
    users: [],
    posts: [],
    commentsByPost: {},
    animeRecords: [],
    homeCarouselSlides: [],
    draft: { title: '', content: '', tags: ['番剧', 'COS', '游戏'], images: [] },
    draftSnapshots: [],
    search: { posts: [], users: [], tags: [] },
    adminStats: null,
    adminUsers: [],
    adminPosts: [],
    adminComments: [],
    adminReports: [],
    adminCarouselSlides: [],
    notifications: [],
    loading: false,
  }),

  getters: {
    currentUser(state) {
      return state.users.find((user) => user.id === state.currentUserId)
    },
    isAuthenticated(state) {
      return Boolean(state.authToken && state.currentUserId)
    },
    isAdmin(state) {
      return state.users.find((user) => user.id === state.currentUserId)?.role === 'admin'
    },
    hotPosts(state) {
      return [...state.posts].sort((a, b) => b.likeCount - a.likeCount)
    },
    featuredPosts(state) {
      return state.posts.filter((post) => post.isPinned || post.type === 'gallery')
    },
    tags(state) {
      return Array.from(new Set(state.posts.flatMap((post) => post.tags)))
    },
  },

  actions: {
    async bootstrap(force = false) {
      if (!force && bootstrapRequest) return bootstrapRequest
      if (!force && this.posts.length) return

      const request = (async () => {
        this.loading = true
        try {
          const me = await appApi.getMe()
          if (me) {
            this.currentUserId = me.id
            this.authToken = appApi.getStoredToken()
          } else {
            this.currentUserId = ''
            this.authToken = null
          }
          getNotifStore()
          const [users, posts, homeCarouselSlides, draft, draftSnapshots] = await Promise.all([
            appApi.getUsers(),
            appApi.getPosts(),
            appApi.getHomeCarousel(),
            me ? appApi.getDraft() : Promise.resolve(this.draft),
            me ? appApi.getDraftSnapshots() : Promise.resolve([]),
          ])
          this.users = me ? [me, ...users.filter((user) => user.id !== me.id)] : users
          this.posts = posts
          this.homeCarouselSlides = homeCarouselSlides
          this.draft = draft
          this.draftSnapshots = draftSnapshots
          this.search = await appApi.searchContent('')
        } finally {
          this.loading = false
        }
      })()

      bootstrapRequest = request
      try {
        await request
      } finally {
        if (bootstrapRequest === request) bootstrapRequest = null
      }
    },

    async login(payload: LoginPayload) {
      const result = await appApi.login(payload)
      this.authToken = result.token
      this.currentUserId = result.user.id
      this.users = [result.user, ...this.users.filter((user) => user.id !== result.user.id)]
      this.draft = await appApi.getDraft()
      this.draftSnapshots = await appApi.getDraftSnapshots()
      this.gainExp('DAILY_LOGIN')
      this.notify(`欢迎回来，${result.user.nickname}`, 'success')
      return result.user
    },

    async register(payload: RegisterPayload) {
      const result = await appApi.register(payload)
      this.authToken = result.token
      this.currentUserId = result.user.id
      this.users = [result.user, ...this.users]
      this.draft = await appApi.getDraft()
      this.draftSnapshots = await appApi.getDraftSnapshots()
      this.gainExp('DAILY_LOGIN')
      this.notify('注册成功，欢迎来到星梦笔记', 'success')
      return result.user
    },

    logout() {
      appApi.setToken(null)
      this.authToken = null
      this.currentUserId = ''
      this.draftSnapshots = []
      this.draft = { title: '', content: '', tags: ['番剧', 'COS', '游戏'], images: [] }
      this.notify('已退出登录', 'info')
    },

    requireLogin() {
      if (this.isAuthenticated) return true
      this.notify('请先登录后再操作', 'warning')
      return false
    },

    async loadPostComments(postId: string) {
      this.commentsByPost[postId] = await appApi.getComments(postId)
    },

    async loadAnimeRecords(userId: string) {
      this.animeRecords = await appApi.getAnimeRecords(userId)
    },

    async toggleLike(postId: string) {
      if (!this.requireLogin()) return
      const updated = await appApi.toggleLike(postId)
      if (updated) this.replacePost(updated)
      if (updated?.isLiked) this.gainExp('GIVE_LIKE')
      if (updated?.authorId && updated.authorId !== this.currentUserId) {
        getNotifStore()?.add({
          type: 'like',
          message: `${this.currentUser?.nickname ?? '有人'} 点赞了你的资料《${updated.title}》`,
          fromUserId: this.currentUserId,
          targetId: postId,
        })
      }
      this.notify(updated?.isLiked ? '已点亮这篇资料' : '已取消点赞', 'info')
    },

    async toggleFavorite(postId: string) {
      if (!this.requireLogin()) return
      const updated = await appApi.toggleFavorite(postId)
      if (updated) this.replacePost(updated)
      this.notify(updated?.isFavorited ? '已收藏到个人星盒' : '已移出收藏', 'info')
    },

    async toggleReaction(postId: string, reaction: PostReactionKey, selected: boolean) {
      if (!this.requireLogin()) return
      const updated = await appApi.toggleReaction(postId, reaction, selected)
      if (updated) this.replacePost(updated)
      this.notify(selected ? '已投递情绪贴纸' : '已收回情绪贴纸', 'info')
    },

    async toggleFollow(userId: string) {
      if (!this.requireLogin()) return
      const updated = await appApi.toggleFollow(userId)
      if (!updated) return
      this.users = this.users.map((user) => (user.id === userId ? updated : user))
      if (updated.isFollowing) {
        getNotifStore()?.add({
          type: 'follow',
          message: `${this.currentUser?.nickname ?? '有人'} 关注了你`,
          fromUserId: this.currentUserId,
          targetId: userId,
        })
      }
      this.notify(updated.isFollowing ? `已关注 ${updated.nickname}` : `已取消关注 ${updated.nickname}`, 'info')
    },

    async addComment(postId: string, content: string, parentId?: string) {
      if (!this.requireLogin()) return
      const trimmed = content.trim()
      if (!trimmed) return
      const comment = await appApi.addComment(postId, this.currentUserId, trimmed, parentId)
      this.commentsByPost[postId] = [comment, ...(this.commentsByPost[postId] ?? [])]
      const updated = await appApi.getPostById(postId)
      if (updated) this.replacePost(updated)
      if (updated?.authorId && updated.authorId !== this.currentUserId) {
        getNotifStore()?.add({
          type: 'comment',
          message: `${this.currentUser?.nickname ?? '有人'} 评论了你的资料《${updated.title}》`,
          fromUserId: this.currentUserId,
          targetId: postId,
        })
      }
      this.notify(parentId ? '回复已发送' : '评论已发送', 'success')
    },

    async deleteComment(commentId: string) {
      if (!this.requireLogin()) return
      const postId = await appApi.deleteComment(commentId)
      if (!postId) return
      this.commentsByPost[postId] = await appApi.getComments(postId)
      const updated = await appApi.getPostById(postId)
      if (updated) this.replacePost(updated)
      this.notify('评论已删除', 'info')
    },

    async toggleCommentLike(commentId: string, postId: string) {
      if (!this.requireLogin()) return
      const updated = await appApi.toggleCommentLike(commentId)
      if (!updated) return
      const comments = this.commentsByPost[postId] ?? []
      this.commentsByPost[postId] = comments.map((comment) => (comment.id === commentId ? updated : comment))
    },

    async updateProfile(payload: ProfileUpdatePayload) {
      if (!this.requireLogin()) return
      const updated = await appApi.updateUserProfile(this.currentUserId, payload)
      if (!updated) return
      this.users = this.users.map((user) => (user.id === updated.id ? updated : user))
      this.notify('个人空间已更新', 'success')
    },

    async addAnimeRecord(payload: AnimeRecordPayload) {
      if (!this.requireLogin()) return
      const record = await appApi.addAnimeRecord(this.currentUserId, payload)
      this.animeRecords = [record, ...this.animeRecords]
      this.notify('资料记录已添加', 'success')
    },

    async updateAnimeStatus(recordId: string, status: AnimeStatus) {
      if (!this.requireLogin()) return
      const updated = await appApi.updateAnimeStatus(recordId, status)
      if (!updated) return
      this.animeRecords = this.animeRecords.map((record) => (record.id === recordId ? updated : record))
      this.notify('资料记录状态已更新', 'info')
    },

    async runSearch(query: string, type: 'all' | 'post' | 'user' | 'tag' = 'all') {
      this.search = await appApi.searchContent(query, type)
    },

    async saveDraft(payload: Draft) {
      if (!this.requireLogin()) return
      this.draft = await appApi.saveDraft(payload)
      this.draftSnapshots = await appApi.getDraftSnapshots()
      this.gainExp('DRAFT_SAVE')
      this.notify('草稿已保存', 'success')
    },

    async restoreDraftSnapshot(id: string) {
      if (!this.requireLogin()) return null
      this.draft = await appApi.restoreDraftSnapshot(id)
      this.draftSnapshots = await appApi.getDraftSnapshots()
      this.notify('已恢复草稿版本', 'success')
      return this.draft
    },

    async publishPost(payload: NewPostPayload) {
      if (!this.requireLogin()) return null
      const post = await appApi.publishPost(this.currentUserId, payload)
      this.posts = [post, ...this.posts]
      this.users = await appApi.getUsers()
      this.draft = await appApi.getDraft()
      this.draftSnapshots = []
      this.search = await appApi.searchContent('')
      this.gainExp('PUBLISH_POST')
      this.notify('新资料已发布', 'success')
      return post
    },

    async updatePost(postId: string, payload: NewPostPayload) {
      if (!this.requireLogin()) return null
      const post = await appApi.updatePost(postId, payload)
      this.replacePost(post)
      this.adminPosts = this.adminPosts.map((item) => (item.id === postId ? post : item))
      this.notify('文章已更新', 'success')
      return post
    },

    async deletePost(postId: string) {
      if (!this.requireLogin()) return
      await appApi.deletePost(postId)
      this.posts = this.posts.filter((post) => post.id !== postId)
      this.adminPosts = this.adminPosts.filter((post) => post.id !== postId)
      this.notify('文章已删除', 'info')
    },

    async reportPost(postId: string, reason: string, detail?: string) {
      if (!this.requireLogin()) return
      await appApi.reportPost(postId, { reason, detail })
      this.notify('举报已提交，管理员会尽快处理', 'success')
    },

    async loadAdmin() {
      if (!this.isAdmin) {
        this.notify('需要管理员权限', 'warning')
        return
      }
      const [stats, users, posts, comments, reports, carouselSlides] = await Promise.all([
        appApi.getAdminStats(),
        appApi.getAdminUsers(),
        appApi.getAdminPosts(),
        appApi.getAdminComments(),
        appApi.getAdminReports(),
        appApi.getAdminHomeCarousel(),
      ])
      this.adminStats = stats
      this.adminUsers = users
      this.adminPosts = posts
      this.adminComments = comments
      this.adminReports = reports
      this.adminCarouselSlides = carouselSlides
    },

    async updateAdminUser(id: string, payload: { status?: User['status']; role?: User['role'] }) {
      const user = await appApi.updateAdminUser(id, payload)
      this.adminUsers = this.adminUsers.map((item) => (item.id === id ? user : item))
      this.users = this.users.map((item) => (item.id === id ? user : item))
      this.notify('用户状态已更新', 'success')
    },

    async updateAdminPost(id: string, payload: { isPinned?: boolean; status?: Post['status'] }) {
      const post = await appApi.updateAdminPost(id, payload)
      this.adminPosts = this.adminPosts.map((item) => (item.id === id ? post : item))
      if (post.status === 'hidden' || post.status === 'archived') {
        this.posts = this.posts.filter((item) => item.id !== id)
      } else if (this.posts.some((item) => item.id === id)) {
        this.replacePost(post)
      } else {
        this.posts = await appApi.getPosts()
      }
      this.search = await appApi.searchContent('')
      this.notify('文章状态已更新', 'success')
    },

    async deleteAdminPost(id: string) {
      await appApi.deleteAdminPost(id)
      this.adminPosts = this.adminPosts.filter((post) => post.id !== id)
      this.posts = this.posts.filter((post) => post.id !== id)
      this.adminStats = await appApi.getAdminStats()
      this.users = await appApi.getUsers()
      this.notify('文章已删除', 'info')
    },

    async updateAdminReport(id: string, payload: { status: Report['status']; hidePost?: boolean }) {
      const report = await appApi.updateAdminReport(id, payload)
      this.adminReports = this.adminReports.map((item) => (item.id === id ? report : item))
      if (payload.hidePost) {
        this.adminPosts = await appApi.getAdminPosts()
        this.posts = this.posts.filter((post) => post.id !== report.postId)
        this.search = await appApi.searchContent('')
      }
      this.adminStats = await appApi.getAdminStats()
      this.notify('举报处理状态已更新', 'success')
    },

    async updateAdminReports(ids: string[], payload: { status: Report['status']; hidePost?: boolean }) {
      const uniqueIds = Array.from(new Set(ids))
      if (!uniqueIds.length) return
      const updatedReports = await Promise.all(uniqueIds.map((id) => appApi.updateAdminReport(id, payload)))
      this.adminReports = this.adminReports.map((item) => updatedReports.find((report) => report.id === item.id) ?? item)
      if (payload.hidePost) {
        const hiddenPostIds = new Set(updatedReports.map((report) => report.postId))
        this.adminPosts = await appApi.getAdminPosts()
        this.posts = this.posts.filter((post) => !hiddenPostIds.has(post.id))
        this.search = await appApi.searchContent('')
      }
      this.adminStats = await appApi.getAdminStats()
      this.notify(`已批量处理 ${updatedReports.length} 条举报`, 'success')
    },

    async updateAdminHomeCarousel(slides: HomeCarouselSlide[]) {
      const updated = await appApi.updateAdminHomeCarousel(slides)
      this.adminCarouselSlides = updated
      this.homeCarouselSlides = await appApi.getHomeCarousel()
      this.notify('首页轮播图已更新', 'success')
    },

    async resetAdminHomeCarousel() {
      const updated = await appApi.resetAdminHomeCarousel()
      this.adminCarouselSlides = updated
      this.homeCarouselSlides = await appApi.getHomeCarousel()
      this.notify('首页轮播已恢复为文章主推', 'success')
      return updated
    },

    notify(text: string, tone: ToastMessage['tone'] = 'info') {
      const message = { id: Date.now() + Math.random(), text, tone }
      this.notifications = [...this.notifications, message]
      window.setTimeout(() => {
        this.notifications = this.notifications.filter((item) => item.id !== message.id)
      }, 2600)
    },

    replacePost(post: Post) {
      this.posts = this.posts.map((item) => (item.id === post.id ? post : item))
    },

    gainExp(event: string) {
      if (!this.currentUser) return
      const amount = (EXP_EVENTS as Record<string, number>)[event]
      if (!amount) return
      const result = addExp(this.currentUser.exp ?? 0, amount)
      this.currentUser.level = result.newLevel
      this.currentUser.exp = result.total
      if (!result.leveledUp) return
      const title = levelTitle(result.newLevel)
      const next = nextLevelExp(result.newLevel)
      this.notify(`升级 Lv.${result.newLevel}「${title}」！再获得 ${next} 经验可继续升级`, 'success')
      getNotifStore()?.add({
        type: 'system',
        message: `恭喜升至 Lv.${result.newLevel}「${title}」`,
      })
    },
  },
})
