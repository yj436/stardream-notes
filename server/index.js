import cors from 'cors'
import express from 'express'
import multer from 'multer'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PrismaClient } from '@prisma/client'
import crypto from 'node:crypto'

const prisma = new PrismaClient()
const app = express()
const port = Number(process.env.PORT ?? process.env.API_PORT ?? 3001)
const tokenSecret = process.env.AUTH_SECRET ?? 'stardream-local-secret'
const allowedOrigins = (process.env.CORS_ORIGIN ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)
const serverDir = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(serverDir, '..')
const uploadsDir = path.join(projectRoot, 'uploads')

app.set('trust proxy', 1)
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        callback(null, true)
        return
      }
      callback(new Error(`Origin ${origin} is not allowed by CORS`))
    },
  }),
)
app.use(express.json({ limit: '5mb' }))
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })
app.use('/uploads', express.static(uploadsDir))

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png'
    cb(null, `${Date.now()}_${crypto.randomBytes(4).toString('hex')}${ext}`)
  },
})
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, allowed.includes(ext))
  },
})

const createId = (prefix) => `${prefix}_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`

const hashPassword = (password, salt = crypto.randomBytes(8).toString('hex')) =>
  `${salt}:${crypto.createHash('sha256').update(`${salt}:${password}`).digest('hex')}`

const verifyPassword = (password, passwordHash) => {
  if (!passwordHash) return false
  const [salt, hash] = passwordHash.split(':')
  return hashPassword(password, salt) === `${salt}:${hash}`
}

const signToken = (user) => {
  const payload = Buffer.from(
    JSON.stringify({ sub: user.id, role: user.role, exp: Date.now() + 1000 * 60 * 60 * 24 * 7 }),
  ).toString('base64url')
  const signature = crypto.createHmac('sha256', tokenSecret).update(payload).digest('base64url')
  return `${payload}.${signature}`
}

const verifyToken = (token) => {
  if (!token || !token.includes('.')) return null
  const [payload, signature] = token.split('.')
  const expected = crypto.createHmac('sha256', tokenSecret).update(payload).digest('base64url')
  if (signature !== expected) return null
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    return data.exp > Date.now() ? data : null
  } catch {
    return null
  }
}

app.use(async (req, _res, next) => {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null
  const session = verifyToken(token)
  if (session?.sub) {
    req.user = await prisma.user.findUnique({ where: { id: session.sub } })
  }
  next()
})

const requireAuth = (req, res, next) => {
  if (!req.user || req.user.status === 'banned') return res.status(401).json({ message: 'Authentication required' })
  next()
}

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Admin required' })
  next()
}

const parse = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

const stringify = (value) => JSON.stringify(value ?? [])
const imageUrlOf = (image) => {
  if (!image) return ''
  return typeof image === 'string' ? image : String(image.url ?? '')
}
const imageAltOf = (image, fallback = '作品图') => {
  if (!image || typeof image === 'string') return fallback
  return String(image.alt ?? fallback).replace(/\s+/g, ' ').trim() || fallback
}
const imageAsset = (url, alt = '作品图') => ({ url, alt })
const normalizeImageAssets = (images = [], fallbackAlt = '作品图') =>
  (Array.isArray(images) ? images : [])
    .map((image) => {
      const url = imageUrlOf(image).trim()
      return url ? imageAsset(url, imageAltOf(image, fallbackAlt)) : null
    })
    .filter(Boolean)
const defaultStats = { posts: 0, followers: 0, following: 0, likes: 0 }
const defaultReactions = { heart: 0, laugh: 0, cry: 0, fire: 0 }
const reactionKeys = new Set(Object.keys(defaultReactions))
const publicPostWhere = { status: 'published' }
const readStats = (user) => parse(user?.stats, defaultStats)
const readReactions = (post) => ({ ...defaultReactions, ...parse(post?.reactions, {}) })
const homeCarouselKey = 'home.carousel'
const defaultCarouselTags = ['Featured', 'Cover', 'Popular', 'New', 'Editor pick']

const cleanCarouselText = (value, fallback) => {
  const text = String(value ?? '').trim()
  return text || fallback
}

const sanitizeCarouselSlides = (slides) =>
  Array.isArray(slides)
    ? slides.slice(0, 8).map((slide, index) => ({
        id: cleanCarouselText(slide?.id, `hero_custom_${Date.now()}_${index}`),
        title: cleanCarouselText(slide?.title, 'Stardream Notes'),
        excerpt: cleanCarouselText(slide?.excerpt, 'Featured writing, gallery work, and anime notes.'),
        imageUrl: cleanCarouselText(slide?.imageUrl, 'asset:hero'),
        imagePosition: cleanCarouselText(slide?.imagePosition, 'center'),
        tag: cleanCarouselText(slide?.tag, defaultCarouselTags[index] ?? 'Featured'),
        link: cleanCarouselText(slide?.link, '/'),
        sourcePostId: slide?.sourcePostId ? String(slide.sourcePostId) : undefined,
        enabled: slide?.enabled !== false,
        updatedAt: new Date().toISOString(),
      }))
    : []

const buildDefaultCarousel = (sourcePosts) =>
  sourcePosts.slice(0, 5).map((post, index) => {
    const tags = parse(post.tags, [])
    return {
      id: `hero_${post.id}`,
      title: post.title,
      excerpt: post.excerpt,
      imageUrl: post.coverUrl,
      imagePosition: post.imagePosition || 'center',
      tag: tags[0] || defaultCarouselTags[index] || 'Featured',
      link: `/post/${post.id}`,
      sourcePostId: post.id,
      enabled: true,
      updatedAt: new Date().toISOString(),
    }
  })

const getDefaultCarousel = async () => {
  const posts = await prisma.post.findMany({
    where: publicPostWhere,
    orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
    take: 5,
  })
  return buildDefaultCarousel(posts)
}

const getCarouselSlides = async ({ includeDisabled = false } = {}) => {
  const setting = await prisma.siteSetting.findUnique({ where: { key: homeCarouselKey } })
  const slides = setting ? sanitizeCarouselSlides(parse(setting.value, [])) : await getDefaultCarousel()
  return includeDisabled ? slides : slides.filter((slide) => slide.enabled)
}

const saveCarouselSlides = async (slides) => {
  const sanitized = sanitizeCarouselSlides(slides)
  await prisma.siteSetting.upsert({
    where: { key: homeCarouselKey },
    update: { value: stringify(sanitized) },
    create: { key: homeCarouselKey, value: stringify(sanitized) },
  })
  return sanitized
}

const canAccessPost = (req, post) =>
  post?.status === 'published' || Boolean(req.user && (req.user.role === 'admin' || req.user.id === post.authorId))

const findAccessiblePost = async (req, res, id) => {
  const post = await prisma.post.findUnique({ where: { id } })
  if (!post || !canAccessPost(req, post)) {
    res.status(404).json({ message: 'Post not found' })
    return null
  }
  return post
}

const getDatabaseHealth = async () => {
  const startedAt = Date.now()
  try {
    await prisma.$queryRawUnsafe('SELECT 1')
    const [users, posts, comments, reports] = await Promise.all([
      prisma.user.count(),
      prisma.post.count(),
      prisma.comment.count(),
      prisma.report.count(),
    ])
    return {
      ok: true,
      provider: 'mysql',
      latencyMs: Date.now() - startedAt,
      counts: { users, posts, comments, reports },
    }
  } catch (error) {
    return {
      ok: false,
      provider: 'mysql',
      latencyMs: Date.now() - startedAt,
      code: error?.code,
      message: error?.message,
    }
  }
}

const backupCollections = [
  'users',
  'posts',
  'comments',
  'animeRecords',
  'drafts',
  'draftSnapshots',
  'reports',
  'siteSettings',
]

const backupDateFields = {
  users: ['createdAt', 'updatedAt'],
  posts: ['createdAt'],
  comments: ['createdAt'],
  animeRecords: ['updatedAt'],
  drafts: ['savedAt'],
  draftSnapshots: ['createdAt'],
  reports: ['createdAt'],
  siteSettings: ['updatedAt'],
}

const backupJsonFields = {
  users: ['favoriteCharacter', 'stats'],
  posts: ['tags', 'gallery', 'reactions'],
  drafts: ['tags', 'images'],
  draftSnapshots: ['tags', 'images'],
}

const backupCounts = (data) =>
  Object.fromEntries(backupCollections.map((key) => [key, Array.isArray(data[key]) ? data[key].length : 0]))

const normalizeBackupRows = (rows, { dateFields = [], jsonFields = [] } = {}) =>
  (Array.isArray(rows) ? rows : []).map((row) => {
    const next = { ...row }
    dateFields.forEach((field) => {
      if (next[field]) next[field] = new Date(next[field])
    })
    jsonFields.forEach((field) => {
      if (next[field] !== undefined && typeof next[field] !== 'string') next[field] = stringify(next[field])
    })
    return next
  })

const createRows = (model, rows) => (rows.length ? model.createMany({ data: rows }) : null)

const readBackupPayload = (body) => (body?.backup?.data ? body.backup : body)

const validateBackupPayload = (backup) => {
  if (!backup?.data || typeof backup.data !== 'object') return 'Invalid backup payload'
  const users = Array.isArray(backup.data.users) ? backup.data.users : []
  if (!users.length) return 'Backup must include at least one user'
  if (!users.some((user) => user?.role === 'admin')) return 'Backup must include at least one admin user'
  return ''
}

const toUser = (user) => {
  const { passwordHash: _passwordHash, ...safeUser } = user
  return {
    ...safeUser,
    favoriteCharacter: parse(user.favoriteCharacter, { name: '未设置', anime: '原创企划', quote: '' }),
    stats: readStats(user),
  }
}

const toPost = (post) => ({
  ...post,
  tags: parse(post.tags, []),
  series: post.series ?? undefined,
  gallery: normalizeImageAssets(parse(post.gallery, []), post.title),
  reactions: readReactions(post),
  createdAt: post.createdAt.toISOString(),
})

const toReport = (report) => ({
  ...report,
  createdAt: report.createdAt.toISOString(),
})

const toComment = (comment) => ({
  ...comment,
  createdAt: comment.createdAt.toISOString(),
})

const toAnimeRecord = (record) => ({
  ...record,
  updatedAt: record.updatedAt.toISOString(),
})

const toDraft = (draft) => ({
  title: draft?.title ?? '',
  content: draft?.content ?? '',
  tags: parse(draft?.tags, ['原创企划']),
  images: normalizeImageAssets(parse(draft?.images, []), draft?.title || '草稿图片'),
  savedAt: draft?.savedAt?.toISOString(),
})

const toDraftSnapshot = (snapshot) => ({
  id: snapshot.id,
  title: snapshot.title,
  content: snapshot.content,
  tags: parse(snapshot.tags, []),
  images: normalizeImageAssets(parse(snapshot.images, []), snapshot.title || '草稿图片'),
  savedAt: snapshot.createdAt.toISOString(),
  createdAt: snapshot.createdAt.toISOString(),
})

const createExcerpt = (content) => {
  const clean = String(content ?? '').replace(/\s+/g, ' ').trim()
  return clean.length > 72 ? `${clean.slice(0, 72)}...` : clean || '一篇刚刚诞生的星梦笔记。'
}

const normalizeSeries = (value) => {
  const text = String(value ?? '').trim()
  return text ? text.slice(0, 120) : null
}

const getDraft = async (userId) =>
  prisma.draft.upsert({
    where: { userId },
    update: {},
    create: {
      id: `draft_${userId}`,
      userId,
      title: '',
      content: '',
      tags: stringify(['原创企划']),
      images: stringify([]),
    },
  })

const hasDraftContent = ({ title = '', content = '', images = [] }) =>
  Boolean(String(title).trim() || String(content).trim() || images.length)

const createDraftSnapshot = async (userId, payload) => {
  if (!hasDraftContent(payload)) return
  const tags = payload.tags ?? []
  const images = normalizeImageAssets(payload.images ?? [], payload.title || '草稿图片')
  const latest = await prisma.draftSnapshot.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })
  if (
    latest &&
    latest.title === payload.title &&
    latest.content === payload.content &&
    latest.tags === stringify(tags) &&
    latest.images === stringify(images)
  ) {
    return
  }

  await prisma.draftSnapshot.create({
    data: {
      id: createId('ds'),
      userId,
      title: payload.title,
      content: payload.content,
      tags: stringify(tags),
      images: stringify(images),
    },
  })

  const stale = await prisma.draftSnapshot.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    skip: 5,
    select: { id: true },
  })
  if (stale.length) {
    await prisma.draftSnapshot.deleteMany({ where: { id: { in: stale.map((item) => item.id) } } })
  }
}

app.post('/api/upload', requireAuth, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' })
  res.json({ url: `/uploads/${req.file.filename}`, filename: req.file.filename })
})

app.get('/api/health', async (_req, res) => {
  const database = await getDatabaseHealth()
  res.status(database.ok ? 200 : 503).json({ ok: database.ok, name: 'stardream-api', database })
})

app.post('/api/auth/register', async (req, res) => {
  const { username, nickname, email, password } = req.body
  if (!username || !nickname || !email || !password) {
    return res.status(400).json({ message: 'username, nickname, email and password are required' })
  }
  if (String(password).length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' })
  const exists = await prisma.user.findFirst({
    where: { OR: [{ username }, { email }] },
  })
  if (exists) return res.status(409).json({ message: 'Username or email already exists' })
  const user = await prisma.user.create({
    data: {
      id: createId('u'),
      username: username.trim(),
      email: email.trim(),
      passwordHash: hashPassword(password),
      nickname: nickname.trim(),
      avatarUrl: 'asset:creators',
      avatarPosition: '20% 25%',
      coverUrl: 'asset:hero',
      bio: '刚刚来到星梦笔记的新创作者。',
      level: 1,
      favoriteCharacter: JSON.stringify({
        name: '未设置',
        anime: '原创企划',
        quote: '今天也要继续发光。',
      }),
      stats: JSON.stringify({ posts: 0, followers: 0, following: 0, likes: 0 }),
      role: 'user',
      status: 'active',
      theme: 'sakura',
    },
  })
  const token = signToken(user)
  res.status(201).json({ token, user: toUser(user) })
})

app.post('/api/auth/login', async (req, res) => {
  const { identifier, password } = req.body
  const user = await prisma.user.findFirst({
    where: { OR: [{ username: identifier }, { email: identifier }] },
  })
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ message: 'Invalid credentials' })
  }
  if (user.status === 'banned') return res.status(403).json({ message: 'User is banned' })
  const token = signToken(user)
  res.json({ token, user: toUser(user) })
})

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json(toUser(req.user))
})

app.get('/api/users', async (_req, res) => {
  const users = await prisma.user.findMany({ orderBy: { level: 'desc' } })
  res.json(users.map(toUser))
})

app.get('/api/users/:id', async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } })
  if (!user) return res.status(404).json({ message: 'User not found' })
  res.json(toUser(user))
})

app.put('/api/users/:id/profile', requireAuth, async (req, res) => {
  if (req.user.id !== req.params.id && req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' })
  const { nickname, bio, creatorBadge, theme, favoriteCharacter } = req.body
  if (!nickname || !bio) return res.status(400).json({ message: 'nickname and bio are required' })
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: {
      nickname,
      bio,
      creatorBadge: creatorBadge || null,
      theme: theme || 'sakura',
      favoriteCharacter: JSON.stringify(favoriteCharacter ?? { name: '未设置', anime: '原创企划', quote: '' }),
    },
  })
  res.json(toUser(user))
})

app.post('/api/users/:id/follow', requireAuth, async (req, res) => {
  if (req.user.id === req.params.id) return res.status(400).json({ message: 'Cannot follow yourself' })
  const user = await prisma.user.findUnique({ where: { id: req.params.id } })
  if (!user) return res.status(404).json({ message: 'User not found' })
  const stats = readStats(user)
  const currentStats = readStats(req.user)
  const isFollowing = !user.isFollowing
  const [updated] = await prisma.$transaction([
    prisma.user.update({
    where: { id: user.id },
    data: {
      isFollowing,
      stats: JSON.stringify({ ...stats, followers: Math.max(0, stats.followers + (isFollowing ? 1 : -1)) }),
    },
    }),
    prisma.user.update({
      where: { id: req.user.id },
      data: {
        stats: JSON.stringify({
          ...currentStats,
          following: Math.max(0, currentStats.following + (isFollowing ? 1 : -1)),
        }),
      },
    }),
  ])
  res.json(toUser(updated))
})

app.get('/api/posts', async (_req, res) => {
  const posts = await prisma.post.findMany({ where: publicPostWhere, orderBy: { createdAt: 'desc' } })
  res.json(posts.map(toPost))
})

app.get('/api/posts/:id', async (req, res) => {
  const post = await findAccessiblePost(req, res, req.params.id)
  if (!post) return
  res.json(toPost(post))
})

app.post('/api/posts', requireAuth, async (req, res) => {
  const { title, content, tags = [], series = '', images: rawImages = [], type = 'article' } = req.body
  if (!title || !content) return res.status(400).json({ message: 'title and content are required' })
  const images = normalizeImageAssets(rawImages, title.trim() || '作品图')
  const fallbackImage = imageAsset('asset:hero', title.trim() || '星梦笔记封面')
  const firstImage = images[0] ?? fallbackImage
  const post = await prisma.post.create({
    data: {
      id: `p_${Date.now()}`,
      authorId: req.user.id,
      title: title.trim(),
      excerpt: createExcerpt(content),
      content: content.trim(),
      coverUrl: firstImage.url,
      imagePosition: firstImage.url === 'asset:creators' ? '70% 28%' : 'center',
      type,
      tags: stringify(tags.length ? tags : ['原创企划']),
      series: normalizeSeries(series),
      gallery: stringify(images.length ? images : [fallbackImage]),
      reactions: stringify(defaultReactions),
    },
  })
  const user = await prisma.user.findUnique({ where: { id: req.user.id } })
  if (user) {
    const stats = readStats(user)
    await prisma.user.update({
      where: { id: req.user.id },
      data: { stats: JSON.stringify({ ...stats, posts: stats.posts + 1 }) },
    })
  }
  await prisma.draft.upsert({
    where: { userId: req.user.id },
    update: { title: '', content: '', tags: stringify(['原创企划']), images: stringify([]), savedAt: new Date() },
    create: {
      id: `draft_${req.user.id}`,
      userId: req.user.id,
      title: '',
      content: '',
      tags: stringify(['原创企划']),
      images: stringify([]),
      savedAt: new Date(),
    },
  })
  await prisma.draftSnapshot.deleteMany({ where: { userId: req.user.id } })
  res.status(201).json(toPost(post))
})

app.put('/api/posts/:id', requireAuth, async (req, res) => {
  const existing = await prisma.post.findUnique({ where: { id: req.params.id } })
  if (!existing) return res.status(404).json({ message: 'Post not found' })
  if (existing.authorId !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' })
  const { title, content, tags = [], series = '', images: rawImages = [], type = existing.type } = req.body
  if (!title || !content) return res.status(400).json({ message: 'title and content are required' })
  const images = normalizeImageAssets(rawImages, title.trim() || '作品图')
  const existingCover = imageAsset(existing.coverUrl, title.trim() || existing.title)
  const firstImage = images[0] ?? existingCover
  const updated = await prisma.post.update({
    where: { id: existing.id },
    data: {
      title: title.trim(),
      excerpt: createExcerpt(content),
      content: content.trim(),
      coverUrl: firstImage.url,
      imagePosition: firstImage.url === 'asset:creators' ? '70% 28%' : 'center',
      type,
      tags: stringify(tags.length ? tags : ['原创企划']),
      series: normalizeSeries(series),
      gallery: stringify(images.length ? images : [firstImage]),
    },
  })
  res.json(toPost(updated))
})

app.delete('/api/posts/:id', requireAuth, async (req, res) => {
  const existing = await prisma.post.findUnique({ where: { id: req.params.id } })
  if (!existing) return res.status(404).json({ message: 'Post not found' })
  if (existing.authorId !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' })
  const author = await prisma.user.findUnique({ where: { id: existing.authorId } })
  await prisma.$transaction([
    prisma.post.delete({ where: { id: existing.id } }),
    ...(author
      ? [
          prisma.user.update({
            where: { id: author.id },
            data: {
              stats: JSON.stringify({
                ...readStats(author),
                posts: Math.max(0, readStats(author).posts - 1),
                likes: Math.max(0, readStats(author).likes - existing.likeCount),
              }),
            },
          }),
        ]
      : []),
  ])
  res.json({ ok: true })
})

app.post('/api/posts/:id/reports', requireAuth, async (req, res) => {
  const { reason, detail } = req.body
  if (!reason) return res.status(400).json({ message: 'reason is required' })
  const post = await findAccessiblePost(req, res, req.params.id)
  if (!post) return
  const report = await prisma.report.create({
    data: {
      id: createId('r'),
      postId: post.id,
      reporterId: req.user.id,
      reason,
      detail: detail || null,
    },
  })
  res.status(201).json(toReport(report))
})

app.post('/api/posts/:id/like', requireAuth, async (req, res) => {
  const post = await findAccessiblePost(req, res, req.params.id)
  if (!post) return
  const isLiked = !post.isLiked
  const author = await prisma.user.findUnique({ where: { id: post.authorId } })
  const [updated] = await prisma.$transaction([
    prisma.post.update({
      where: { id: post.id },
      data: { isLiked, likeCount: Math.max(0, post.likeCount + (isLiked ? 1 : -1)) },
    }),
    ...(author
      ? [
          prisma.user.update({
            where: { id: author.id },
            data: {
              stats: JSON.stringify({
                ...readStats(author),
                likes: Math.max(0, readStats(author).likes + (isLiked ? 1 : -1)),
              }),
            },
          }),
        ]
      : []),
  ])
  res.json(toPost(updated))
})

app.post('/api/posts/:id/favorite', requireAuth, async (req, res) => {
  const post = await findAccessiblePost(req, res, req.params.id)
  if (!post) return
  const isFavorited = !post.isFavorited
  const updated = await prisma.post.update({
    where: { id: post.id },
    data: { isFavorited, favoriteCount: Math.max(0, post.favoriteCount + (isFavorited ? 1 : -1)) },
  })
  res.json(toPost(updated))
})

app.post('/api/posts/:id/reactions/:reaction', requireAuth, async (req, res) => {
  const reaction = String(req.params.reaction)
  if (!reactionKeys.has(reaction)) return res.status(400).json({ message: 'Unsupported reaction' })
  const post = await findAccessiblePost(req, res, req.params.id)
  if (!post) return
  const selected = Boolean(req.body?.selected)
  const current = readReactions(post)
  const next = {
    ...current,
    [reaction]: Math.max(0, (current[reaction] ?? 0) + (selected ? 1 : -1)),
  }
  const updated = await prisma.post.update({
    where: { id: post.id },
    data: { reactions: stringify(next) },
  })
  res.json(toPost(updated))
})

app.get('/api/posts/:id/comments', async (req, res) => {
  const post = await findAccessiblePost(req, res, req.params.id)
  if (!post) return
  const comments = await prisma.comment.findMany({
    where: { postId: req.params.id },
    orderBy: { createdAt: 'desc' },
  })
  res.json(comments.map(toComment))
})

app.post('/api/posts/:id/comments', requireAuth, async (req, res) => {
  const { content, parentId } = req.body
  if (!content) return res.status(400).json({ message: 'content is required' })
  const post = await findAccessiblePost(req, res, req.params.id)
  if (!post) return
  const comment = await prisma.comment.create({
    data: {
      id: `c_${Date.now()}`,
      postId: req.params.id,
      userId: req.user.id,
      parentId: parentId || null,
      content: content.trim(),
    },
  })
  await prisma.post.update({
    where: { id: req.params.id },
    data: { commentCount: { increment: 1 } },
  })
  res.status(201).json(toComment(comment))
})

app.delete('/api/comments/:id', requireAuth, async (req, res) => {
  const target = await prisma.comment.findUnique({ where: { id: req.params.id } })
  if (!target) return res.status(404).json({ message: 'Comment not found' })
  const post = await prisma.post.findUnique({ where: { id: target.postId } })
  if (target.userId !== req.user.id && post?.authorId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' })
  }
  const replies = await prisma.comment.findMany({ where: { parentId: target.id } })
  const ids = [target.id, ...replies.map((reply) => reply.id)]
  const nextCount = Math.max(0, (post?.commentCount ?? ids.length) - ids.length)
  await prisma.$transaction([
    prisma.comment.deleteMany({ where: { id: { in: ids } } }),
    prisma.post.update({
      where: { id: target.postId },
      data: { commentCount: nextCount },
    }),
  ])
 res.json({ postId: target.postId })
})

app.post('/api/comments/:id/like', requireAuth, async (req, res) => {
  const comment = await prisma.comment.findUnique({ where: { id: req.params.id } })
  if (!comment) return res.status(404).json({ message: 'Comment not found' })
  const updated = await prisma.comment.update({
    where: { id: comment.id },
    data: { likeCount: { increment: 1 } },
  })
  res.json(toComment(updated))
})

app.get('/api/users/:id/anime-records', async (req, res) => {
  const records = await prisma.animeRecord.findMany({
    where: { userId: req.params.id },
    orderBy: { updatedAt: 'desc' },
  })
  res.json(records.map(toAnimeRecord))
})

app.post('/api/users/:id/anime-records', requireAuth, async (req, res) => {
  if (req.user.id !== req.params.id && req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' })
  const { title, status = 'watching', rating = 8, review } = req.body
  if (!title || !review) return res.status(400).json({ message: 'title and review are required' })
  const record = await prisma.animeRecord.create({
    data: {
      id: `a_${Date.now()}`,
      userId: req.params.id,
      title: title.trim(),
      coverUrl: status === 'watched' ? 'asset:creators' : 'asset:hero',
      status,
      rating: Number(rating),
      review: review.trim(),
    },
  })
  res.status(201).json(toAnimeRecord(record))
})

app.patch('/api/anime-records/:id/status', requireAuth, async (req, res) => {
  const { status } = req.body
  const existing = await prisma.animeRecord.findUnique({ where: { id: req.params.id } })
  if (!existing) return res.status(404).json({ message: 'Anime record not found' })
  if (existing.userId !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' })
  const record = await prisma.animeRecord.update({
    where: { id: req.params.id },
    data: { status },
  })
  res.json(toAnimeRecord(record))
})

app.get('/api/draft', requireAuth, async (req, res) => {
  const draft = await getDraft(req.user.id)
  res.json(toDraft(draft))
})

app.get('/api/draft/snapshots', requireAuth, async (req, res) => {
  const snapshots = await prisma.draftSnapshot.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })
  res.json(snapshots.map(toDraftSnapshot))
})

app.put('/api/draft', requireAuth, async (req, res) => {
  const { title = '', content = '', tags = [], images: rawImages = [] } = req.body
  const images = normalizeImageAssets(rawImages, title || '草稿图片')
  const draft = await prisma.draft.upsert({
    where: { userId: req.user.id },
    update: { title, content, tags: stringify(tags), images: stringify(images), savedAt: new Date() },
    create: {
      id: `draft_${req.user.id}`,
      userId: req.user.id,
      title,
      content,
      tags: stringify(tags),
      images: stringify(images),
      savedAt: new Date(),
    },
  })
  await createDraftSnapshot(req.user.id, { title, content, tags, images })
  res.json(toDraft(draft))
})

app.post('/api/draft/snapshots/:id/restore', requireAuth, async (req, res) => {
  const snapshot = await prisma.draftSnapshot.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  })
  if (!snapshot) return res.status(404).json({ message: 'Draft snapshot not found' })
  const draft = await prisma.draft.upsert({
    where: { userId: req.user.id },
    update: {
      title: snapshot.title,
      content: snapshot.content,
      tags: snapshot.tags,
      images: snapshot.images,
      savedAt: new Date(),
    },
    create: {
      id: `draft_${req.user.id}`,
      userId: req.user.id,
      title: snapshot.title,
      content: snapshot.content,
      tags: snapshot.tags,
      images: snapshot.images,
      savedAt: new Date(),
    },
  })
  res.json(toDraft(draft))
})

app.get('/api/search', async (req, res) => {
  const query = String(req.query.q ?? '').toLowerCase()
  const type = String(req.query.type ?? 'all')
  const [posts, users] = await Promise.all([prisma.post.findMany({ where: publicPostWhere }), prisma.user.findMany()])
  const normalizedPosts = posts.map(toPost)
  const normalizedUsers = users.map(toUser)
  const allTags = [...new Set(normalizedPosts.flatMap((post) => post.tags))]
  if (!query) return res.json({ posts: normalizedPosts, users: normalizedUsers, tags: allTags })

  res.json({
    posts:
      type === 'all' || type === 'post'
        ? normalizedPosts.filter((post) =>
            [post.title, post.excerpt, post.content, post.series ?? '', ...post.tags].some((text) => text.toLowerCase().includes(query)),
          )
        : [],
    users:
      type === 'all' || type === 'user'
        ? normalizedUsers.filter((user) =>
            [user.nickname, user.username, user.bio, user.creatorBadge ?? ''].some((text) =>
              text.toLowerCase().includes(query),
            ),
          )
        : [],
    tags: type === 'all' || type === 'tag' ? allTags.filter((tag) => tag.toLowerCase().includes(query)) : [],
  })
})

app.get('/api/site/carousel', async (_req, res) => {
  const slides = await getCarouselSlides()
  res.json(slides)
})

app.get('/api/admin/stats', requireAuth, requireAdmin, async (_req, res) => {
  const [users, posts, comments, animeRecords, reports] = await Promise.all([
    prisma.user.count(),
    prisma.post.count(),
    prisma.comment.count(),
    prisma.animeRecord.count(),
    prisma.report.count({ where: { status: { in: ['open', 'reviewing'] } } }),
  ])
  res.json({ users, posts, comments, animeRecords, reports })
})

app.get('/api/admin/users', requireAuth, requireAdmin, async (_req, res) => {
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } })
  res.json(users.map(toUser))
})

app.get('/api/admin/backup', requireAuth, requireAdmin, async (_req, res) => {
  const [users, posts, comments, animeRecords, drafts, draftSnapshots, reports, siteSettings] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.post.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.comment.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.animeRecord.findMany({ orderBy: { updatedAt: 'desc' } }),
    prisma.draft.findMany(),
    prisma.draftSnapshot.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.report.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.siteSetting.findMany(),
  ])
  const data = { users, posts, comments, animeRecords, drafts, draftSnapshots, reports, siteSettings }
  res.json({
    version: 'stardream-backup-v1',
    exportedAt: new Date().toISOString(),
    source: 'api',
    counts: backupCounts(data),
    data,
  })
})

app.post('/api/admin/backup/import', requireAuth, requireAdmin, async (req, res) => {
  const backup = readBackupPayload(req.body)
  const validationMessage = validateBackupPayload(backup)
  if (validationMessage) return res.status(400).json({ message: validationMessage })

  const rawData = backup.data
  const siteSettings =
    Array.isArray(rawData.siteSettings) && rawData.siteSettings.length
      ? rawData.siteSettings
      : Array.isArray(rawData.homeCarousel)
        ? [{ key: homeCarouselKey, value: stringify(rawData.homeCarousel), updatedAt: new Date() }]
        : []

  const data = {
    users: normalizeBackupRows(rawData.users, {
      dateFields: backupDateFields.users,
      jsonFields: backupJsonFields.users,
    }),
    posts: normalizeBackupRows(rawData.posts, {
      dateFields: backupDateFields.posts,
      jsonFields: backupJsonFields.posts,
    }),
    comments: normalizeBackupRows(rawData.comments, { dateFields: backupDateFields.comments }),
    animeRecords: normalizeBackupRows(rawData.animeRecords, { dateFields: backupDateFields.animeRecords }),
    drafts: normalizeBackupRows(rawData.drafts, {
      dateFields: backupDateFields.drafts,
      jsonFields: backupJsonFields.drafts,
    }),
    draftSnapshots: normalizeBackupRows(rawData.draftSnapshots, {
      dateFields: backupDateFields.draftSnapshots,
      jsonFields: backupJsonFields.draftSnapshots,
    }),
    reports: normalizeBackupRows(rawData.reports, { dateFields: backupDateFields.reports }),
    siteSettings: normalizeBackupRows(siteSettings, { dateFields: backupDateFields.siteSettings }),
  }

  try {
    await prisma.$transaction(
      [
        prisma.draftSnapshot.deleteMany(),
        prisma.draft.deleteMany(),
        prisma.comment.deleteMany(),
        prisma.report.deleteMany(),
        prisma.animeRecord.deleteMany(),
        prisma.post.deleteMany(),
        prisma.siteSetting.deleteMany(),
        prisma.user.deleteMany(),
        createRows(prisma.user, data.users),
        createRows(prisma.post, data.posts),
        createRows(prisma.comment, data.comments),
        createRows(prisma.animeRecord, data.animeRecords),
        createRows(prisma.draft, data.drafts),
        createRows(prisma.draftSnapshot, data.draftSnapshots),
        createRows(prisma.report, data.reports),
        createRows(prisma.siteSetting, data.siteSettings),
      ].filter(Boolean),
    )
  } catch (error) {
    return res.status(400).json({ message: error?.message || 'Backup import failed' })
  }

  res.json({ ok: true, importedAt: new Date().toISOString(), counts: backupCounts(data) })
})

app.get('/api/admin/carousel', requireAuth, requireAdmin, async (_req, res) => {
  const slides = await getCarouselSlides({ includeDisabled: true })
  res.json(slides)
})

app.put('/api/admin/carousel', requireAuth, requireAdmin, async (req, res) => {
  const slides = await saveCarouselSlides(req.body?.slides ?? [])
  res.json(slides)
})

app.post('/api/admin/carousel/reset', requireAuth, requireAdmin, async (_req, res) => {
  const slides = await getDefaultCarousel()
  res.json(await saveCarouselSlides(slides))
})

app.patch('/api/admin/users/:id', requireAuth, requireAdmin, async (req, res) => {
  const { status, role } = req.body
  if (req.params.id === req.user.id && status === 'banned') {
    return res.status(400).json({ message: 'Cannot ban yourself' })
  }
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: {
      ...(status ? { status } : {}),
      ...(role ? { role } : {}),
    },
  })
  res.json(toUser(user))
})

app.get('/api/admin/posts', requireAuth, requireAdmin, async (_req, res) => {
  const posts = await prisma.post.findMany({ orderBy: { createdAt: 'desc' } })
  res.json(posts.map(toPost))
})

app.patch('/api/admin/posts/:id', requireAuth, requireAdmin, async (req, res) => {
  const { isPinned, status } = req.body
  const post = await prisma.post.update({
    where: { id: req.params.id },
    data: {
      ...(isPinned === undefined ? {} : { isPinned: Boolean(isPinned) }),
      ...(status ? { status } : {}),
    },
  })
  res.json(toPost(post))
})

app.delete('/api/admin/posts/:id', requireAuth, requireAdmin, async (req, res) => {
  const existing = await prisma.post.findUnique({ where: { id: req.params.id } })
  if (!existing) return res.status(404).json({ message: 'Post not found' })
  const author = await prisma.user.findUnique({ where: { id: existing.authorId } })
  await prisma.$transaction([
    prisma.post.delete({ where: { id: req.params.id } }),
    ...(author
      ? [
          prisma.user.update({
            where: { id: author.id },
            data: {
              stats: JSON.stringify({
                ...readStats(author),
                posts: Math.max(0, readStats(author).posts - 1),
                likes: Math.max(0, readStats(author).likes - existing.likeCount),
              }),
            },
          }),
        ]
      : []),
  ])
  res.json({ ok: true })
})

app.get('/api/admin/comments', requireAuth, requireAdmin, async (_req, res) => {
  const comments = await prisma.comment.findMany({ orderBy: { createdAt: 'desc' } })
  res.json(comments.map(toComment))
})

app.get('/api/admin/reports', requireAuth, requireAdmin, async (_req, res) => {
  const reports = await prisma.report.findMany({ orderBy: { createdAt: 'desc' } })
  res.json(reports.map(toReport))
})

app.patch('/api/admin/reports/:id', requireAuth, requireAdmin, async (req, res) => {
  const { status, hidePost } = req.body
  const report = await prisma.report.update({
    where: { id: req.params.id },
    data: { status: status || 'reviewing' },
  })
  if (hidePost) {
    await prisma.post.update({
      where: { id: report.postId },
      data: { status: 'hidden' },
    })
  }
  res.json(toReport(report))
})

app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ message: 'Internal server error' })
})

const shutdown = async () => {
  await prisma.$disconnect().catch(() => undefined)
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

const start = async () => {
  const database = await getDatabaseHealth()
  if (!database.ok) {
    console.warn('Database health check failed during startup:', database.message)
  }
  app.listen(port, () => {
    console.log(`Stardream API running on http://127.0.0.1:${port}`)
  })
}

start().catch(async (error) => {
  console.error('Failed to start Stardream API:', error)
  await prisma.$disconnect().catch(() => undefined)
  process.exit(1)
})
