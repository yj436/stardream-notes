import { Router } from 'express'
import prisma from '../db'
import { authMiddleware, optionalAuth, type AuthRequest } from '../middleware/auth'

export const postRouter = Router()

// Parse JSON string fields on a post
function parsePost(post: any) {
  if (!post) return post
  return {
    ...post,
    tags: safeParseArray(post.tags),
    gallery: safeParseArray(post.gallery),
    isLiked: post.isLiked ?? false,
    isFavorited: post.isFavorited ?? false,
  }
}

function safeParseArray(val: any): string[] {
  if (Array.isArray(val)) return val
  try { return JSON.parse(val ?? '[]') } catch { return [] }
}

// Get all posts
postRouter.get('/', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const posts = await prisma.post.findMany({
      where: { status: 'published' },
      orderBy: { createdAt: 'desc' },
    })
    const liked = req.userId
      ? new Set((await prisma.like.findMany({ where: { userId: req.userId } })).map((l) => l.postId))
      : new Set<string>()
    const favorited = req.userId
      ? new Set((await prisma.favorite.findMany({ where: { userId: req.userId } })).map((f) => f.postId))
      : new Set<string>()

    res.json(posts.map((p) => parsePost({ ...p, isLiked: liked.has(p.id), isFavorited: favorited.has(p.id) })))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: '获取文章失败' })
  }
})

// Get single post
postRouter.get('/:id', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const post = await prisma.post.findUnique({ where: { id: req.params.id } })
    if (!post) { res.status(404).json({ error: '文章不存在' }); return }

    const liked = req.userId
      ? !!(await prisma.like.findUnique({ where: { postId_userId: { postId: post.id, userId: req.userId } } }))
      : false
    const favorited = req.userId
      ? !!(await prisma.favorite.findUnique({ where: { postId_userId: { postId: post.id, userId: req.userId } } }))
      : false

    // Increment view
    await prisma.post.update({ where: { id: post.id }, data: { viewCount: post.viewCount + 1 } })

    res.json(parsePost({ ...post, viewCount: post.viewCount + 1, isLiked: liked, isFavorited: favorited }))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: '获取文章失败' })
  }
})

// Create post
postRouter.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { title, content, tags, images, type } = req.body
    if (!title?.trim() || !content?.trim()) {
      res.status(400).json({ error: '标题和内容不能为空' })
      return
    }
    const post = await prisma.post.create({
      data: {
        authorId: req.userId!,
        title: title.trim(),
        content: content.trim(),
        excerpt: content.trim().replace(/\s+/g, ' ').slice(0, 72),
        tags: JSON.stringify(tags ?? []),
        gallery: JSON.stringify(images ?? []),
        type: type ?? 'article',
        coverUrl: images?.[0] ?? '',
      },
    })
    await prisma.user.update({
      where: { id: req.userId },
      data: { postsCount: { increment: 1 } },
    })
    res.status(201).json(parsePost({ ...post, isLiked: false, isFavorited: false }))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: '发布失败' })
  }
})

// Update post
postRouter.put('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const post = await prisma.post.findUnique({ where: { id: req.params.id } })
    if (!post || post.authorId !== req.userId) {
      res.status(403).json({ error: '无权编辑此文章' })
      return
    }
    const { title, content, tags, images, type } = req.body
    const updated = await prisma.post.update({
      where: { id: req.params.id },
      data: {
        title: title?.trim() ?? post.title,
        content: content?.trim() ?? post.content,
        excerpt: content?.trim()?.replace(/\s+/g, ' ').slice(0, 72) ?? post.excerpt,
        tags: tags ? JSON.stringify(tags) : post.tags,
        gallery: images ? JSON.stringify(images) : post.gallery,
        type: type ?? post.type,
        coverUrl: images?.[0] ?? post.coverUrl,
      },
    })
    res.json(parsePost(updated))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: '更新失败' })
  }
})

// Delete post
postRouter.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const post = await prisma.post.findUnique({ where: { id: req.params.id } })
    if (!post || post.authorId !== req.userId) {
      res.status(403).json({ error: '无权删除此文章' })
      return
    }
    await prisma.post.delete({ where: { id: req.params.id } })
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: '删除失败' })
  }
})

// Like
postRouter.post('/:id/like', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const postId = req.params.id
    const existing = await prisma.like.findUnique({ where: { postId_userId: { postId, userId: req.userId! } } })
    if (existing) {
      await prisma.like.delete({ where: { id: existing.id } })
      await prisma.post.update({ where: { id: postId }, data: { likeCount: { decrement: 1 } } })
    } else {
      await prisma.like.create({ data: { postId, userId: req.userId! } })
      await prisma.post.update({ where: { id: postId }, data: { likeCount: { increment: 1 } } })
    }
    const post = await prisma.post.findUnique({ where: { id: postId } })
    const isLiked = !existing
    res.json(parsePost({ ...post, isLiked, isFavorited: false }))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: '操作失败' })
  }
})

// Favorite
postRouter.post('/:id/favorite', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const postId = req.params.id
    const existing = await prisma.favorite.findUnique({ where: { postId_userId: { postId, userId: req.userId! } } })
    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } })
      await prisma.post.update({ where: { id: postId }, data: { favoriteCount: { decrement: 1 } } })
    } else {
      await prisma.favorite.create({ data: { postId, userId: req.userId! } })
      await prisma.post.update({ where: { id: postId }, data: { favoriteCount: { increment: 1 } } })
    }
    const post = await prisma.post.findUnique({ where: { id: postId } })
    res.json(parsePost({ ...post, isFavorited: !existing, isLiked: false }))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: '操作失败' })
  }
})

// Report
postRouter.post('/:id/reports', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { reason, detail } = req.body
    const report = await prisma.report.create({
      data: { postId: req.params.id, reporterId: req.userId!, reason: reason ?? '其他', detail },
    })
    res.status(201).json(report)
  } catch (err) {
    res.status(500).json({ error: '举报失败' })
  }
})
