export type PostType = 'article' | 'gallery' | 'record'
export type AnimeStatus = 'want_to_watch' | 'watching' | 'watched'
export type ProfileTheme = 'sakura' | 'starlight' | 'mint'
export type PostReactionKey = 'heart' | 'laugh' | 'cry' | 'fire'

export interface FavoriteCharacter {
  name: string
  anime: string
  quote: string
}

export interface UserStats {
  posts: number
  followers: number
  following: number
  likes: number
}

export interface User {
  id: string
  username: string
  email?: string
  nickname: string
  avatarUrl: string
  avatarPosition?: string
  coverUrl: string
  bio: string
  level: number
  exp?: number
  creatorBadge?: string
  favoriteCharacter: FavoriteCharacter
  stats: UserStats
  role?: 'user' | 'creator' | 'admin'
  status?: 'active' | 'banned'
  isFollowing?: boolean
  theme?: ProfileTheme
}

export interface Post {
  id: string
  authorId: string
  title: string
  excerpt: string
  content: string
  coverUrl: string
  imagePosition?: string
  type: PostType
  tags: string[]
  gallery: string[]
  viewCount: number
  likeCount: number
  favoriteCount: number
  commentCount: number
  createdAt: string
  status?: 'published' | 'hidden' | 'archived'
  isPinned?: boolean
  isLiked?: boolean
  isFavorited?: boolean
  reactions?: Record<PostReactionKey, number>
}

export interface Report {
  id: string
  postId: string
  reporterId: string
  reason: string
  detail?: string
  status: 'open' | 'reviewing' | 'resolved' | 'rejected'
  createdAt: string
}

export interface Comment {
  id: string
  postId: string
  userId: string
  parentId?: string
  content: string
  likeCount: number
  createdAt: string
}

export interface AnimeRecord {
  id: string
  userId: string
  title: string
  coverUrl: string
  status: AnimeStatus
  rating: number
  review: string
  updatedAt: string
}

export interface AnimeRecordPayload {
  title: string
  status: AnimeStatus
  rating: number
  review: string
}

export interface ProfileUpdatePayload {
  nickname: string
  bio: string
  creatorBadge?: string
  theme: ProfileTheme
  favoriteCharacter: FavoriteCharacter
}

export interface Draft {
  title: string
  content: string
  tags: string[]
  images: string[]
  savedAt?: string
}

export interface NewPostPayload {
  title: string
  content: string
  tags: string[]
  images: string[]
  type: PostType
}

export interface SearchResult {
  posts: Post[]
  users: User[]
  tags: string[]
}

export interface LoginPayload {
  identifier: string
  password: string
}

export interface RegisterPayload {
  username: string
  nickname: string
  email: string
  password: string
}

export interface AuthResult {
  token: string
  user: User
}

export interface AdminStats {
  users: number
  posts: number
  comments: number
  animeRecords: number
  reports?: number
}
