import axios from 'axios'
import { imageAssets, mockApi } from '@/api/mock'
import type {
  AdminStats,
  AnimeRecord,
  AnimeRecordPayload,
  AnimeStatus,
  ApiHealth,
  ApiRuntimeInfo,
  AuthResult,
  Comment,
  Draft,
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

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()
const isGitHubPagesHost = typeof window !== 'undefined' && window.location.hostname.endsWith('github.io')
const shouldUseMockApi = import.meta.env.VITE_USE_MOCK_API === 'true' || (!configuredApiBaseUrl && isGitHubPagesHost)
const apiBaseUrl = configuredApiBaseUrl || '/api'

const client = axios.create({
  baseURL: apiBaseUrl,
  timeout: 1800,
})

const runtimeInfo: ApiRuntimeInfo = {
  mode: shouldUseMockApi ? 'mock' : 'api',
  apiBaseUrl,
  configuredApiBaseUrl: configuredApiBaseUrl || null,
  isGitHubPagesHost,
  fallbackEnabled: shouldUseMockApi,
}

const tokenKey = 'stardream:auth-token'
let authToken = window.localStorage.getItem(tokenKey)

client.interceptors.request.use((config) => {
  if (authToken) config.headers.Authorization = `Bearer ${authToken}`
  return config
})

const resolveAsset = (url: string) => {
  if (url === 'asset:hero') return imageAssets.hero
  if (url === 'asset:creators') return imageAssets.creators
  if (url === 'asset:starryDesk') return imageAssets.starryDesk
  if (url === 'asset:sakuraWatercolor') return imageAssets.sakuraWatercolor
  if (url === 'asset:moonlightCos') return imageAssets.moonlightCos
  if (url === 'asset:healingAnime') return imageAssets.healingAnime
  if (url === 'asset:novelKitchen') return imageAssets.novelKitchen
  if (url === 'asset:galaxySchool') return imageAssets.galaxySchool
  return url
}

const normalizeUser = (user: User): User => ({
  ...user,
  avatarUrl: resolveAsset(user.avatarUrl),
  coverUrl: resolveAsset(user.coverUrl),
})

const normalizePost = (post: Post): Post => ({
  ...post,
  coverUrl: resolveAsset(post.coverUrl),
  gallery: post.gallery.map(resolveAsset),
})

const normalizeComment = (comment: Comment): Comment => comment

const normalizeAnimeRecord = (record: AnimeRecord): AnimeRecord => ({
  ...record,
  coverUrl: resolveAsset(record.coverUrl),
})

const normalizeDraft = (draft: Draft): Draft => ({
  ...draft,
  images: draft.images.map(resolveAsset),
})

const withFallback = async <T>(request: () => Promise<T>, fallback: () => Promise<T>): Promise<T> => {
  if (shouldUseMockApi) return fallback()
  try {
    return await request()
  } catch (error) {
    if (axios.isAxiosError(error) && error.response && !isGitHubPagesHost) throw error
    if (!isGitHubPagesHost) console.warn('API fallback to local mock:', error)
    return fallback()
  }
}

const createMockAuthUser = async (identifier?: string) => {
  const users = await mockApi.getUsers()
  const normalizedIdentifier = identifier?.trim().toLowerCase()
  const user =
    users.find((item) =>
      [item.username, item.email, item.nickname].some((value) => value?.toLowerCase() === normalizedIdentifier),
    ) ?? users[0]
  return normalizeUser({
    ...user,
    email: user.email ?? 'admin@stardream.local',
    role: 'admin',
    status: 'active',
  })
}

const getMockAdminStats = async (): Promise<AdminStats> => {
  const [users, posts] = await Promise.all([mockApi.getUsers(), mockApi.getPosts()])
  const animeRecords = await Promise.all(users.map((user) => mockApi.getAnimeRecords(user.id)))
  return {
    users: users.length,
    posts: posts.length,
    comments: posts.reduce((total, post) => total + post.commentCount, 0),
    animeRecords: animeRecords.flat().length,
    reports: 0,
  }
}

const getMockAdminComments = async () => {
  const posts = await mockApi.getPosts()
  const commentGroups = await Promise.all(posts.map((post) => mockApi.getComments(post.id)))
  return commentGroups.flat().map(normalizeComment)
}

const getMockReports = async (): Promise<Report[]> => []

export const appApi = {
  getRuntimeInfo() {
    return runtimeInfo
  },

  setToken(token: string | null) {
    authToken = token
    if (token) window.localStorage.setItem(tokenKey, token)
    else window.localStorage.removeItem(tokenKey)
  },

  getStoredToken() {
    return authToken
  },

  async getSystemHealth(): Promise<ApiHealth> {
    if (shouldUseMockApi) {
      const [users, posts] = await Promise.all([mockApi.getUsers(), mockApi.getPosts()])
      return {
        ok: true,
        name: 'stardream-mock-api',
        database: {
          ok: true,
          provider: 'mock',
          latencyMs: 0,
          counts: {
            users: users.length,
            posts: posts.length,
            comments: posts.reduce((total, post) => total + post.commentCount, 0),
            reports: 0,
          },
        },
      }
    }

    try {
      return (await client.get<ApiHealth>('/health')).data
    } catch (error) {
      return {
        ok: false,
        name: 'stardream-api',
        database: {
          ok: false,
          provider: 'unknown',
          message: axios.isAxiosError(error) ? error.message : 'Health check failed',
        },
      }
    }
  },

  async login(payload: LoginPayload) {
    if (shouldUseMockApi) {
      const user = await createMockAuthUser(payload.identifier)
      const result = { token: 'mock-token', user }
      this.setToken(result.token)
      return result
    }
    const result = (await client.post<AuthResult>('/auth/login', payload)).data
    this.setToken(result.token)
    return { ...result, user: normalizeUser(result.user) }
  },

  async register(payload: RegisterPayload) {
    if (shouldUseMockApi) {
      const baseUser = await createMockAuthUser(payload.username)
      const user = normalizeUser({
        ...baseUser,
        id: `u_${Date.now()}`,
        username: payload.username,
        nickname: payload.nickname,
        email: payload.email,
        role: 'creator',
      })
      const result = { token: 'mock-token', user }
      this.setToken(result.token)
      return result
    }
    const result = (await client.post<AuthResult>('/auth/register', payload)).data
    this.setToken(result.token)
    return { ...result, user: normalizeUser(result.user) }
  },

  async getMe() {
    if (!authToken) return null
    if (shouldUseMockApi) return createMockAuthUser()
    try {
      return normalizeUser((await client.get<User>('/auth/me')).data)
    } catch {
      this.setToken(null)
      return null
    }
  },

  async getPosts() {
    return withFallback(
      async () => (await client.get<Post[]>('/posts')).data.map(normalizePost),
      () => mockApi.getPosts(),
    )
  },

  async getPostById(id: string) {
    return withFallback(
      async () => normalizePost((await client.get<Post>(`/posts/${id}`)).data),
      () => mockApi.getPostById(id),
    )
  },

  async getUsers() {
    return withFallback(
      async () => (await client.get<User[]>('/users')).data.map(normalizeUser),
      () => mockApi.getUsers(),
    )
  },

  async getUserById(id: string) {
    return withFallback(
      async () => normalizeUser((await client.get<User>(`/users/${id}`)).data),
      () => mockApi.getUserById(id),
    )
  },

  async getComments(postId: string) {
    return withFallback(
      async () => (await client.get<Comment[]>(`/posts/${postId}/comments`)).data.map(normalizeComment),
      () => mockApi.getComments(postId),
    )
  },

  async getAnimeRecords(userId: string) {
    return withFallback(
      async () => (await client.get<AnimeRecord[]>(`/users/${userId}/anime-records`)).data.map(normalizeAnimeRecord),
      () => mockApi.getAnimeRecords(userId),
    )
  },

  async updateUserProfile(userId: string, payload: ProfileUpdatePayload) {
    return withFallback(
      async () => normalizeUser((await client.put<User>(`/users/${userId}/profile`, payload)).data),
      () => mockApi.updateUserProfile(userId, payload),
    )
  },

  async toggleLike(postId: string) {
    return withFallback(
      async () => normalizePost((await client.post<Post>(`/posts/${postId}/like`)).data),
      () => mockApi.toggleLike(postId),
    )
  },

  async toggleFavorite(postId: string) {
    return withFallback(
      async () => normalizePost((await client.post<Post>(`/posts/${postId}/favorite`)).data),
      () => mockApi.toggleFavorite(postId),
    )
  },

  async toggleReaction(postId: string, reaction: PostReactionKey, selected: boolean) {
    return withFallback(
      async () => normalizePost((await client.post<Post>(`/posts/${postId}/reactions/${reaction}`, { selected })).data),
      () => mockApi.toggleReaction(postId, reaction, selected),
    )
  },

  async toggleFollow(userId: string) {
    return withFallback(
      async () => normalizeUser((await client.post<User>(`/users/${userId}/follow`)).data),
      () => mockApi.toggleFollow(userId),
    )
  },

  async addComment(postId: string, userId: string, content: string, parentId?: string) {
    return withFallback(
      async () =>
        normalizeComment((await client.post<Comment>(`/posts/${postId}/comments`, { userId, content, parentId })).data),
      () => mockApi.addComment(postId, userId, content, parentId),
    )
  },

  async deleteComment(commentId: string) {
    return withFallback(
      async () => (await client.delete<{ postId: string }>(`/comments/${commentId}`)).data.postId,
      () => mockApi.deleteComment(commentId),
    )
  },

  async toggleCommentLike(commentId: string) {
    return withFallback(
      async () => (await client.post<Comment>(`/comments/${commentId}/like`)).data,
      () => mockApi.toggleCommentLike(commentId),
    )
  },

  async addAnimeRecord(userId: string, payload: AnimeRecordPayload) {
    return withFallback(
      async () => normalizeAnimeRecord((await client.post<AnimeRecord>(`/users/${userId}/anime-records`, payload)).data),
      () => mockApi.addAnimeRecord(userId, payload),
    )
  },

  async updateAnimeStatus(recordId: string, status: AnimeStatus) {
    return withFallback(
      async () => normalizeAnimeRecord((await client.patch<AnimeRecord>(`/anime-records/${recordId}/status`, { status })).data),
      () => mockApi.updateAnimeStatus(recordId, status),
    )
  },

  async publishPost(authorId: string, payload: NewPostPayload) {
    return withFallback(
      async () => normalizePost((await client.post<Post>('/posts', { ...payload, authorId })).data),
      () => mockApi.publishPost(authorId, payload),
    )
  },

  async updatePost(id: string, payload: NewPostPayload) {
    return withFallback(
      async () => normalizePost((await client.put<Post>(`/posts/${id}`, payload)).data),
      async () => {
        const existing = await mockApi.getPostById(id)
        if (!existing) throw new Error('Post not found')
        return normalizePost({
          ...existing,
          ...payload,
          coverUrl: payload.images[0] ?? existing.coverUrl,
          gallery: payload.images.length ? payload.images : existing.gallery,
        })
      },
    )
  },

  async deletePost(id: string) {
    if (shouldUseMockApi) return
    await client.delete(`/posts/${id}`)
  },

  async reportPost(id: string, payload: { reason: string; detail?: string }) {
    return withFallback(
      async () => (await client.post<Report>(`/posts/${id}/reports`, payload)).data,
      async () => ({
        id: `r_${Date.now()}`,
        postId: id,
        reporterId: 'mock-user',
        reason: payload.reason,
        detail: payload.detail,
        status: 'open' as const,
        createdAt: new Date().toISOString(),
      }),
    )
  },

  async searchContent(query: string, type: 'all' | 'post' | 'user' | 'tag' = 'all'): Promise<SearchResult> {
    return withFallback(
      async () => {
        const result = (
          await client.get<SearchResult>('/search', {
            params: { q: query, type },
          })
        ).data
        return {
          posts: result.posts.map(normalizePost),
          users: result.users.map(normalizeUser),
          tags: result.tags,
        }
      },
      () => mockApi.searchContent(query, type),
    )
  },

  async getDraft() {
    return withFallback(
      async () => normalizeDraft((await client.get<Draft>('/draft')).data),
      () => mockApi.getDraft(),
    )
  },

  async uploadImage(file: File) {
    const form = new FormData()
    form.append('image', file)
    try {
      const res = await client.post<{ url: string }>('/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return res.data.url
    } catch {
      return null
    }
  },

  async saveDraft(payload: Draft) {
    return withFallback(
      async () => normalizeDraft((await client.put<Draft>('/draft', payload)).data),
      () => mockApi.saveDraft(payload),
    )
  },

  async getAdminStats() {
    return withFallback(async () => (await client.get<AdminStats>('/admin/stats')).data, getMockAdminStats)
  },

  async getAdminUsers() {
    return withFallback(
      async () => (await client.get<User[]>('/admin/users')).data.map(normalizeUser),
      async () => (await mockApi.getUsers()).map(normalizeUser),
    )
  },

  async updateAdminUser(id: string, payload: { status?: User['status']; role?: User['role'] }) {
    return withFallback(
      async () => normalizeUser((await client.patch<User>(`/admin/users/${id}`, payload)).data),
      async () => {
        const user = await mockApi.getUserById(id)
        if (!user) throw new Error('User not found')
        return normalizeUser({ ...user, ...payload })
      },
    )
  },

  async getAdminPosts() {
    return withFallback(
      async () => (await client.get<Post[]>('/admin/posts')).data.map(normalizePost),
      async () => (await mockApi.getPosts()).map(normalizePost),
    )
  },

  async updateAdminPost(id: string, payload: { isPinned?: boolean; status?: Post['status'] }) {
    return withFallback(
      async () => normalizePost((await client.patch<Post>(`/admin/posts/${id}`, payload)).data),
      async () => {
        const post = await mockApi.getPostById(id)
        if (!post) throw new Error('Post not found')
        return normalizePost({ ...post, ...payload })
      },
    )
  },

  async deleteAdminPost(id: string) {
    if (shouldUseMockApi) return
    await client.delete(`/admin/posts/${id}`)
  },

  async getAdminComments() {
    return withFallback(
      async () => (await client.get<Comment[]>('/admin/comments')).data.map(normalizeComment),
      getMockAdminComments,
    )
  },

  async getAdminReports() {
    return withFallback(async () => (await client.get<Report[]>('/admin/reports')).data, getMockReports)
  },

  async updateAdminReport(id: string, payload: { status: Report['status']; hidePost?: boolean }) {
    return withFallback(
      async () => (await client.patch<Report>(`/admin/reports/${id}`, payload)).data,
      async () => ({
        id,
        postId: 'mock-post',
        reporterId: 'mock-user',
        reason: payload.hidePost ? 'hidden' : 'review',
        status: payload.status,
        createdAt: new Date().toISOString(),
      }),
    )
  },
}
