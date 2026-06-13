import heroImage from '@/assets/images/stardream-hero.png'
import creatorSheet from '@/assets/images/creator-sheet.png'
import coverGalaxySchool from '@/assets/images/cover-galaxy-school.png'
import coverHealingAnime from '@/assets/images/cover-healing-anime.png'
import coverMoonlightCos from '@/assets/images/cover-moonlight-cos.png'
import coverNovelKitchen from '@/assets/images/cover-novel-kitchen.png'
import coverSakuraWatercolor from '@/assets/images/cover-sakura-watercolor.png'
import coverStarryDesk from '@/assets/images/cover-starry-desk.png'
import type {
  AnimeRecord,
  AnimeRecordPayload,
  Comment,
  Draft,
  NewPostPayload,
  Post,
  PostReactionKey,
  ProfileUpdatePayload,
  SearchResult,
  User,
} from '@/types/content'

const wait = (ms = 120) => new Promise((resolve) => window.setTimeout(resolve, ms))

export const imageAssets = {
  hero: heroImage,
  creators: creatorSheet,
  starryDesk: coverStarryDesk,
  sakuraWatercolor: coverSakuraWatercolor,
  moonlightCos: coverMoonlightCos,
  healingAnime: coverHealingAnime,
  novelKitchen: coverNovelKitchen,
  galaxySchool: coverGalaxySchool,
}

const storageKeys = {
  version: 'stardream:data-version',
  users: 'stardream:users',
  posts: 'stardream:posts',
  comments: 'stardream:comments',
  animeRecords: 'stardream:anime-records',
  draft: 'stardream:draft',
}

const dataVersion = 'acgn-blog-2026-06-12-reactions'
const emptyReactions: Record<PostReactionKey, number> = { heart: 0, laugh: 0, cry: 0, fire: 0 }

const readStorage = <T>(key: string, fallback: T): T => {
  try {
    const value = window.localStorage.getItem(key)
    return value ? (JSON.parse(value) as T) : fallback
  } catch {
    return fallback
  }
}

const writeStorage = <T>(key: string, value: T) => {
  window.localStorage.setItem(key, JSON.stringify(value))
}

const resetIfNeeded = () => {
  if (window.localStorage.getItem(storageKeys.version) === dataVersion) return
  Object.values(storageKeys).forEach((key) => window.localStorage.removeItem(key))
  window.localStorage.setItem(storageKeys.version, dataVersion)
}

resetIfNeeded()

const initialUsers: User[] = [
  {
    id: 'u_mika',
    username: 'mika-stars',
    nickname: '米卡星屿',
    avatarUrl: creatorSheet,
    avatarPosition: '20% 25%',
    coverUrl: coverGalaxySchool,
    bio: '同人插画师，喜欢把星空、校园和柔光少女画进轻博客封面。',
    level: 18,
    creatorBadge: '认证画师',
    favoriteCharacter: {
      name: '星野璃',
      anime: '原创企划《银河放课后》',
      quote: '今天也要把梦画得亮一点。',
    },
    stats: { posts: 42, followers: 12800, following: 315, likes: 98600 },
    isFollowing: true,
    theme: 'sakura',
  },
  {
    id: 'u_rin',
    username: 'rin-coslog',
    nickname: '凛月记录本',
    avatarUrl: creatorSheet,
    avatarPosition: '72% 28%',
    coverUrl: coverMoonlightCos,
    bio: 'Coser / 服装手作 / 写一点舞台幕后和修图笔记。',
    level: 14,
    creatorBadge: 'Coser',
    favoriteCharacter: {
      name: '月见遥',
      anime: '原创企划《夏夜摄影棚》',
      quote: '镜头会记住认真发光的人。',
    },
    stats: { posts: 28, followers: 6200, following: 188, likes: 40300 },
    theme: 'starlight',
  },
  {
    id: 'u_nano',
    username: 'nano-gamepad',
    nickname: '纳诺手柄',
    avatarUrl: creatorSheet,
    avatarPosition: '42% 70%',
    coverUrl: coverHealingAnime,
    bio: 'Galgame、独立游戏和追番记录重度用户，偶尔写长评。',
    level: 11,
    favoriteCharacter: {
      name: '浅川千叶',
      anime: '原创企划《像素雨季》',
      quote: '存档点就在下一盏路灯下。',
    },
    stats: { posts: 35, followers: 3400, following: 522, likes: 29100 },
    theme: 'mint',
  },
  {
    id: 'u_sakura',
    username: 'sakura-pen',
    nickname: '樱笔绘卷',
    avatarUrl: creatorSheet,
    avatarPosition: '55% 18%',
    coverUrl: coverSakuraWatercolor,
    bio: '水彩插画师，专注和风与幻想题材角色设计。',
    level: 22,
    creatorBadge: '认证画师',
    favoriteCharacter: {
      name: '樱庭未央',
      anime: '原创企划《花鸟风月》',
      quote: '用画笔留下不会凋谢的瞬间。',
    },
    stats: { posts: 56, followers: 18900, following: 210, likes: 142000 },
    isFollowing: true,
    theme: 'sakura',
  },
]

const initialPosts: Post[] = [
  {
    id: 'p_aurora',
    authorId: 'u_mika',
    title: '把星空画进博客封面：柔光上色流程拆解',
    excerpt: '从草图、配色到柔光叠加，把一张 ACGN 风封面整理成可复用的创作笔记。',
    content:
      '这次练习的目标，是让封面在首页小卡片里也能保持清晰的情绪。\n\n## 先确定光源\n我会先用低饱和星蓝铺背景，再用樱粉和薄荷青做视觉锚点。人物周围不要堆太多特效，给标题和标签留下呼吸感。\n\n## 再处理层次\n柔光图层只负责氛围，真正的重点仍然放在眼睛、发丝和便签边缘。缩成卡片时，读者仍然能一眼看到主题。\n\n> 好看的二次元博客不是把页面填满，而是让每一张图都像一扇入口。',
    coverUrl: coverStarryDesk,
    imagePosition: 'center',
    type: 'article',
    tags: ['绘画教程', '星空', '原创企划'],
    gallery: [coverStarryDesk, coverGalaxySchool],
    viewCount: 38620,
    likeCount: 2840,
    favoriteCount: 932,
    commentCount: 8,
    createdAt: '2026-06-08T21:12:00+08:00',
    isPinned: true,
    isFavorited: true,
    reactions: { heart: 128, laugh: 12, cry: 36, fire: 91 },
  },
  {
    id: 'p_cos',
    authorId: 'u_rin',
    title: '摄影棚里的月光感：低成本 Cos 布光清单',
    excerpt: '一盏柔光灯、两张反光纸、三种角度，让小房间也能拍出舞台感。',
    content:
      '这套布光最重要的不是器材，而是先决定画面的情绪。\n\n主灯放在人物侧前方，背景用低亮度蓝紫色补一点夜色，最后用小灯串制造轮廓边缘。修图时不要把肤色推得过白，保留一点暖色会更像真人站在故事里。',
    coverUrl: coverMoonlightCos,
    imagePosition: '70% 28%',
    type: 'gallery',
    tags: ['Cosplay', '摄影', '布光'],
    gallery: [coverMoonlightCos, creatorSheet],
    viewCount: 15940,
    likeCount: 1296,
    favoriteCount: 441,
    commentCount: 5,
    createdAt: '2026-06-07T18:35:00+08:00',
    reactions: { heart: 84, laugh: 18, cry: 9, fire: 67 },
  },
  {
    id: 'p_watch',
    authorId: 'u_nano',
    title: '六月追番清单：三部适合深夜看的治愈系',
    excerpt: '无剧透短评，记录“想看 / 在看 / 看过”的轻量追番流程。',
    content:
      '本月想看一点节奏慢但余味长的故事。\n\n第一部适合睡前看，镜头很安静；第二部配乐很适合写作业；第三部虽然是奇幻设定，但人物关系特别生活化。我喜欢把每集看完的心情写成一句话，不追求完整影评，只留下当时的温度。',
    coverUrl: coverHealingAnime,
    imagePosition: '35% 55%',
    type: 'record',
    tags: ['追番记录', '治愈系', '短评'],
    gallery: [coverHealingAnime],
    viewCount: 21800,
    likeCount: 1720,
    favoriteCount: 508,
    commentCount: 6,
    createdAt: '2026-06-05T23:10:00+08:00',
    reactions: { heart: 96, laugh: 10, cry: 58, fire: 24 },
  },
  {
    id: 'p_sakura_1',
    authorId: 'u_sakura',
    title: '水彩入门：从零开始画一片樱花瓣',
    excerpt: '用最简单的水彩技巧画出层次感，适合零基础同人画入门。',
    content:
      '水彩的魅力在于不可控的扩散感。\n\n先用清水打湿纸面，再用淡粉色薄涂第一层。等半干后，用稍微浓一点的粉色画出花瓣脉络。关键在于留白，不是画出来，而是留出来。',
    coverUrl: coverSakuraWatercolor,
    imagePosition: '20% 40%',
    type: 'article',
    tags: ['绘画教程', '水彩', '同人画'],
    gallery: [coverSakuraWatercolor],
    viewCount: 25840,
    likeCount: 2210,
    favoriteCount: 874,
    commentCount: 12,
    createdAt: '2026-06-09T14:22:00+08:00',
    isPinned: true,
    reactions: { heart: 115, laugh: 7, cry: 31, fire: 45 },
  },
  {
    id: 'p_yuki_1',
    authorId: 'u_mika',
    title: '轻小说连载：异世界料理人日记・第一话',
    excerpt: '被召唤到异世界的厨师，用料理征服魔王军的故事。',
    content:
      '睁开眼睛的时候，我站在巨大的魔法阵中央。\n\n“勇者大人，请拯救我们的世界。”王国公主单膝跪地。\n\n我沉默片刻，问她：“你们这里的厨房在哪里？”\n\n不是因为我不关心这个世界，而是我刚做完晚班，还没有吃饭。',
    type: 'article',
    tags: ['轻小说', '原创企划', '异世界'],
    gallery: [coverNovelKitchen],
    coverUrl: coverNovelKitchen,
    imagePosition: 'center',
    viewCount: 38900,
    likeCount: 3150,
    favoriteCount: 1420,
    commentCount: 24,
    createdAt: '2026-06-10T08:15:00+08:00',
    reactions: { heart: 143, laugh: 76, cry: 14, fire: 118 },
  },
  {
    id: 'p_rei_1',
    authorId: 'u_nano',
    title: '2026 春季番完结简评：今年春天你追对了吗？',
    excerpt: '无剧透盘点十部春季番，说说哪部值得补、哪部能出第二季。',
    content:
      '春季番已经陆续完结，趁记忆还新鲜整理一份私人简评。\n\n值得追满的作品通常不是设定最复杂的，而是每一集都能把情绪推进一点。评论区也欢迎分享你的本季最佳。',
    type: 'record',
    tags: ['追番记录', '动画', '2026春番'],
    gallery: [coverHealingAnime],
    coverUrl: coverHealingAnime,
    imagePosition: '50% 60%',
    viewCount: 45200,
    likeCount: 3890,
    favoriteCount: 1250,
    commentCount: 31,
    createdAt: '2026-06-06T12:00:00+08:00',
    reactions: { heart: 102, laugh: 28, cry: 41, fire: 88 },
  },
]

const initialComments: Comment[] = [
  {
    id: 'c_1',
    postId: 'p_aurora',
    userId: 'u_rin',
    content: '“给标题和标签留下呼吸感”这句太有用了，我每次都忍不住把星星撒满全图。',
    likeCount: 42,
    createdAt: '2026-06-08T22:01:00+08:00',
  },
  {
    id: 'c_2',
    postId: 'p_aurora',
    userId: 'u_nano',
    content: '小卡片可读性这个角度很棒，感觉适合做成系列教程。',
    likeCount: 31,
    createdAt: '2026-06-09T09:18:00+08:00',
  },
  {
    id: 'c_3',
    postId: 'p_cos',
    userId: 'u_mika',
    content: '反光纸那段学到了，周末就试试。',
    likeCount: 18,
    createdAt: '2026-06-08T11:45:00+08:00',
  },
]

const initialAnimeRecords: AnimeRecord[] = [
  {
    id: 'a_1',
    userId: 'u_nano',
    title: '银河放课后',
    coverUrl: heroImage,
    status: 'watching',
    rating: 9,
    review: '美术太舒服，像把日记写进星云里。',
    updatedAt: '2026-06-08T20:00:00+08:00',
  },
  {
    id: 'a_2',
    userId: 'u_nano',
    title: '像素雨季',
    coverUrl: creatorSheet,
    status: 'watched',
    rating: 8,
    review: '节奏慢，但结尾那场雨很值。',
    updatedAt: '2026-06-02T19:30:00+08:00',
  },
]

const initialDraft: Draft = {
  title: '',
  content: '',
  tags: ['原创企划'],
  images: [],
}

let users = readStorage(storageKeys.users, initialUsers)
let posts = readStorage(storageKeys.posts, initialPosts)
let comments = readStorage(storageKeys.comments, initialComments)
let animeRecords = readStorage(storageKeys.animeRecords, initialAnimeRecords)
let draft = readStorage(storageKeys.draft, initialDraft)

const persistUsers = () => writeStorage(storageKeys.users, users)
const persistPosts = () => writeStorage(storageKeys.posts, posts)
const persistComments = () => writeStorage(storageKeys.comments, comments)
const persistAnimeRecords = () => writeStorage(storageKeys.animeRecords, animeRecords)
const persistDraft = () => writeStorage(storageKeys.draft, draft)

const createExcerpt = (content: string) => {
  const clean = content.replace(/\s+/g, ' ').trim()
  return clean.length > 72 ? `${clean.slice(0, 72)}...` : clean || '一篇刚刚诞生的星梦笔记。'
}

export const mockApi = {
  async getPosts() {
    await wait()
    return [...posts]
  },

  async getPostById(id: string) {
    await wait()
    return posts.find((post) => post.id === id)
  },

  async getUsers() {
    await wait()
    return [...users]
  },

  async getUserById(id: string) {
    await wait()
    return users.find((user) => user.id === id)
  },

  async getComments(postId: string) {
    await wait()
    return comments.filter((comment) => comment.postId === postId)
  },

  async getAnimeRecords(userId: string) {
    await wait()
    return animeRecords.filter((record) => record.userId === userId)
  },

  async updateUserProfile(userId: string, payload: ProfileUpdatePayload) {
    await wait(140)
    users = users.map((user) => (user.id === userId ? { ...user, ...payload } : user))
    persistUsers()
    return users.find((user) => user.id === userId)
  },

  async toggleLike(postId: string) {
    await wait(80)
    posts = posts.map((post) => {
      if (post.id !== postId) return post
      const isLiked = !post.isLiked
      return { ...post, isLiked, likeCount: Math.max(0, post.likeCount + (isLiked ? 1 : -1)) }
    })
    persistPosts()
    return posts.find((post) => post.id === postId)
  },

  async toggleFavorite(postId: string) {
    await wait(80)
    posts = posts.map((post) => {
      if (post.id !== postId) return post
      const isFavorited = !post.isFavorited
      return { ...post, isFavorited, favoriteCount: Math.max(0, post.favoriteCount + (isFavorited ? 1 : -1)) }
    })
    persistPosts()
    return posts.find((post) => post.id === postId)
  },

  async toggleReaction(postId: string, reaction: PostReactionKey, selected: boolean) {
    await wait(70)
    posts = posts.map((post) => {
      if (post.id !== postId) return post
      const reactions = { ...emptyReactions, ...post.reactions }
      return {
        ...post,
        reactions: {
          ...reactions,
          [reaction]: Math.max(0, reactions[reaction] + (selected ? 1 : -1)),
        },
      }
    })
    persistPosts()
    return posts.find((post) => post.id === postId)
  },

  async toggleFollow(userId: string) {
    await wait(80)
    const user = users.find((item) => item.id === userId)
    if (user) {
      user.isFollowing = !user.isFollowing
      user.stats.followers = Math.max(0, user.stats.followers + (user.isFollowing ? 1 : -1))
    }
    persistUsers()
    return user
  },

  async addComment(postId: string, userId: string, content: string, parentId?: string) {
    await wait(100)
    const comment: Comment = {
      id: `c_${Date.now()}`,
      postId,
      userId,
      parentId,
      content,
      likeCount: 0,
      createdAt: new Date().toISOString(),
    }
    comments = [comment, ...comments]
    posts = posts.map((post) => (post.id === postId ? { ...post, commentCount: post.commentCount + 1 } : post))
    persistComments()
    persistPosts()
    return comment
  },

  async deleteComment(commentId: string) {
    await wait(80)
    const target = comments.find((comment) => comment.id === commentId)
    if (!target) return null
    const removedIds = new Set([commentId, ...comments.filter((comment) => comment.parentId === commentId).map((item) => item.id)])
    comments = comments.filter((comment) => !removedIds.has(comment.id))
    posts = posts.map((post) =>
      post.id === target.postId ? { ...post, commentCount: Math.max(0, post.commentCount - removedIds.size) } : post,
    )
    persistComments()
    persistPosts()
    return target.postId
  },

  async toggleCommentLike(commentId: string) {
    await wait(60)
    comments = comments.map((comment) =>
      comment.id === commentId ? { ...comment, likeCount: comment.likeCount + 1 } : comment,
    )
    persistComments()
    return comments.find((comment) => comment.id === commentId)
  },

  async addAnimeRecord(userId: string, payload: AnimeRecordPayload) {
    await wait(140)
    const record: AnimeRecord = {
      id: `a_${Date.now()}`,
      userId,
      title: payload.title.trim(),
      coverUrl: payload.status === 'watched' ? creatorSheet : heroImage,
      status: payload.status,
      rating: payload.rating,
      review: payload.review.trim(),
      updatedAt: new Date().toISOString(),
    }
    animeRecords = [record, ...animeRecords]
    persistAnimeRecords()
    return record
  },

  async updateAnimeStatus(recordId: string, status: AnimeRecord['status']) {
    await wait(90)
    animeRecords = animeRecords.map((record) =>
      record.id === recordId ? { ...record, status, updatedAt: new Date().toISOString() } : record,
    )
    persistAnimeRecords()
    return animeRecords.find((record) => record.id === recordId)
  },

  async publishPost(authorId: string, payload: NewPostPayload) {
    await wait(160)
    const firstImage = payload.images[0] ?? heroImage
    const post: Post = {
      id: `p_${Date.now()}`,
      authorId,
      title: payload.title.trim(),
      excerpt: createExcerpt(payload.content),
      content: payload.content.trim(),
      coverUrl: firstImage,
      imagePosition: firstImage === creatorSheet ? '70% 28%' : 'center',
      type: payload.type,
      tags: payload.tags.length ? payload.tags : ['原创企划'],
      gallery: payload.images.length ? payload.images : [heroImage],
      viewCount: 0,
      likeCount: 0,
      favoriteCount: 0,
      commentCount: 0,
      createdAt: new Date().toISOString(),
      reactions: { ...emptyReactions },
    }
    posts = [post, ...posts]
    users = users.map((user) =>
      user.id === authorId ? { ...user, stats: { ...user.stats, posts: user.stats.posts + 1 } } : user,
    )
    draft = { ...initialDraft, savedAt: new Date().toISOString() }
    persistPosts()
    persistUsers()
    persistDraft()
    return post
  },

  async searchContent(query: string, type: 'all' | 'post' | 'user' | 'tag' = 'all'): Promise<SearchResult> {
    await wait()
    const keyword = query.trim().toLowerCase()
    const allTags = Array.from(new Set(posts.flatMap((post) => post.tags)))
    if (!keyword) return { posts, users, tags: allTags }

    const foundPosts =
      type === 'all' || type === 'post'
        ? posts.filter((post) =>
            [post.title, post.excerpt, post.content, ...post.tags].some((text) => text.toLowerCase().includes(keyword)),
          )
        : []
    const foundUsers =
      type === 'all' || type === 'user'
        ? users.filter((user) =>
            [user.nickname, user.username, user.bio, user.creatorBadge ?? ''].some((text) => text.toLowerCase().includes(keyword)),
          )
        : []
    const foundTags = type === 'all' || type === 'tag' ? allTags.filter((tag) => tag.toLowerCase().includes(keyword)) : []

    return { posts: foundPosts, users: foundUsers, tags: foundTags }
  },

  async getDraft() {
    await wait(70)
    return { ...draft }
  },

  async saveDraft(payload: Draft) {
    await wait(100)
    draft = { ...payload, savedAt: new Date().toISOString() }
    persistDraft()
    return { ...draft }
  },
}
