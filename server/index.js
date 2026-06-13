import cors from 'cors'
import express from 'express'
import multer from 'multer'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import prismaPkg from '../node_modules/@prisma/client/index.js'
import crypto from 'node:crypto'

const { PrismaClient } = prismaPkg
const prisma = new PrismaClient()
const app = express()
const port = Number(process.env.API_PORT ?? 3001)
const tokenSecret = process.env.AUTH_SECRET ?? 'stardream-local-secret'
const serverDir = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(serverDir, '..')
const uploadsDir = path.join(projectRoot, 'uploads')

app.use(cors())
app.use(express.json({ limit: '1mb' }))
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
const defaultStats = { posts: 0, followers: 0, following: 0, likes: 0 }
const defaultReactions = { heart: 0, laugh: 0, cry: 0, fire: 0 }
const reactionKeys = new Set(Object.keys(defaultReactions))
const readStats = (user) => parse(user?.stats, defaultStats)
const readReactions = (post) => ({ ...defaultReactions, ...parse(post?.reactions, {}) })

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
  gallery: parse(post.gallery, []),
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
  images: parse(draft?.images, []),
  savedAt: draft?.savedAt?.toISOString(),
})

const createExcerpt = (content) => {
  const clean = String(content ?? '').replace(/\s+/g, ' ').trim()
  return clean.length > 72 ? `${clean.slice(0, 72)}...` : clean || '一篇刚刚诞生的星梦笔记。'
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

app.post('/api/upload', requireAuth, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' })
  res.json({ url: `/uploads/${req.file.filename}`, filename: req.file.filename })
})

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, name: 'stardream-api' })
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
  const posts = await prisma.post.findMany({ orderBy: { createdAt: 'desc' } })
  res.json(posts.map(toPost))
})

app.get('/api/posts/:id', async (req, res) => {
  const post = await prisma.post.findUnique({ where: { id: req.params.id } })
  if (!post) return res.status(404).json({ message: 'Post not found' })
  res.json(toPost(post))
})

app.post('/api/posts', requireAuth, async (req, res) => {
  const { title, content, tags = [], images = [], type = 'article' } = req.body
  if (!title || !content) return res.status(400).json({ message: 'title and content are required' })
  const firstImage = images[0] ?? 'asset:hero'
  const post = await prisma.post.create({
    data: {
      id: `p_${Date.now()}`,
      authorId: req.user.id,
      title: title.trim(),
      excerpt: createExcerpt(content),
      content: content.trim(),
      coverUrl: firstImage,
      imagePosition: firstImage === 'asset:creators' ? '70% 28%' : 'center',
      type,
      tags: stringify(tags.length ? tags : ['原创企划']),
      gallery: stringify(images.length ? images : ['asset:hero']),
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
  res.status(201).json(toPost(post))
})

app.put('/api/posts/:id', requireAuth, async (req, res) => {
  const existing = await prisma.post.findUnique({ where: { id: req.params.id } })
  if (!existing) return res.status(404).json({ message: 'Post not found' })
  if (existing.authorId !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' })
  const { title, content, tags = [], images = [], type = existing.type } = req.body
  if (!title || !content) return res.status(400).json({ message: 'title and content are required' })
  const firstImage = images[0] ?? existing.coverUrl
  const updated = await prisma.post.update({
    where: { id: existing.id },
    data: {
      title: title.trim(),
      excerpt: createExcerpt(content),
      content: content.trim(),
      coverUrl: firstImage,
      imagePosition: firstImage === 'asset:creators' ? '70% 28%' : 'center',
      type,
      tags: stringify(tags.length ? tags : ['原创企划']),
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
  const post = await prisma.post.findUnique({ where: { id: req.params.id } })
  if (!post) return res.status(404).json({ message: 'Post not found' })
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
  const post = await prisma.post.findUnique({ where: { id: req.params.id } })
  if (!post) return res.status(404).json({ message: 'Post not found' })
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
  const post = await prisma.post.findUnique({ where: { id: req.params.id } })
  if (!post) return res.status(404).json({ message: 'Post not found' })
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
  const post = await prisma.post.findUnique({ where: { id: req.params.id } })
  if (!post) return res.status(404).json({ message: 'Post not found' })
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
  const comments = await prisma.comment.findMany({
    where: { postId: req.params.id },
    orderBy: { createdAt: 'desc' },
  })
  res.json(comments.map(toComment))
})

app.post('/api/posts/:id/comments', requireAuth, async (req, res) => {
  const { content, parentId } = req.body
  if (!content) return res.status(400).json({ message: 'content is required' })
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

app.put('/api/draft', requireAuth, async (req, res) => {
  const { title = '', content = '', tags = [], images = [] } = req.body
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
  res.json(toDraft(draft))
})

app.get('/api/search', async (req, res) => {
  const query = String(req.query.q ?? '').toLowerCase()
  const type = String(req.query.type ?? 'all')
  const [posts, users] = await Promise.all([prisma.post.findMany(), prisma.user.findMany()])
  const normalizedPosts = posts.map(toPost)
  const normalizedUsers = users.map(toUser)
  const allTags = [...new Set(normalizedPosts.flatMap((post) => post.tags))]
  if (!query) return res.json({ posts: normalizedPosts, users: normalizedUsers, tags: allTags })

  res.json({
    posts:
      type === 'all' || type === 'post'
        ? normalizedPosts.filter((post) =>
            [post.title, post.excerpt, post.content, ...post.tags].some((text) => text.toLowerCase().includes(query)),
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

app.listen(port, () => {
  console.log(`Stardream API running on http://127.0.0.1:${port}`)
})
