import { Router } from 'express'
import prisma from '../db'
import { type AuthRequest } from '../middleware/auth'

export const adminRouter = Router()

// Middleware: require admin
adminRouter.use(async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } })
    if (user?.role !== 'admin') {
      res.status(403).json({ error: '需要管理员权限' })
      return
    }
    next()
  } catch {
    res.status(500).json({ error: '鉴权失败' })
  }
})

adminRouter.get('/stats', async (_req, res) => {
  try {
    const [users, posts, comments, animeRecords, reports] = await Promise.all([
      prisma.user.count(),
      prisma.post.count(),
      prisma.comment.count(),
      prisma.animeRecord.count(),
      prisma.report.count({ where: { status: 'open' } }),
    ])
    res.json({ users, posts, comments, animeRecords, reports })
  } catch (err) {
    res.status(500).json({ error: '获取统计数据失败' })
  }
})

adminRouter.get('/users', async (_req, res) => {
  try {
    const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } })
    res.json(users.map((u) => {
      const { passwordHash, ...rest } = u
      return rest
    }))
  } catch (err) {
    res.status(500).json({ error: '获取用户列表失败' })
  }
})

adminRouter.patch('/users/:id', async (req, res) => {
  try {
    const { status, role } = req.body
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { status: status ?? undefined, role: role ?? undefined },
    })
    const { passwordHash, ...rest } = user
    res.json(rest)
  } catch (err) {
    res.status(500).json({ error: '更新用户失败' })
  }
})

adminRouter.get('/posts', async (_req, res) => {
  try {
    const posts = await prisma.post.findMany({ orderBy: { createdAt: 'desc' } })
    res.json(posts)
  } catch (err) {
    res.status(500).json({ error: '获取文章列表失败' })
  }
})

adminRouter.patch('/posts/:id', async (req, res) => {
  try {
    const { isPinned } = req.body
    const post = await prisma.post.update({
      where: { id: req.params.id },
      data: { isPinned: isPinned ?? undefined },
    })
    res.json(post)
  } catch (err) {
    res.status(500).json({ error: '更新文章失败' })
  }
})

adminRouter.delete('/posts/:id', async (req, res) => {
  try {
    await prisma.post.delete({ where: { id: req.params.id } })
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: '删除失败' })
  }
})

adminRouter.get('/comments', async (_req, res) => {
  try {
    const comments = await prisma.comment.findMany({ orderBy: { createdAt: 'desc' } })
    res.json(comments)
  } catch (err) {
    res.status(500).json({ error: '获取评论列表失败' })
  }
})

adminRouter.get('/reports', async (_req, res) => {
  try {
    const reports = await prisma.report.findMany({ orderBy: { createdAt: 'desc' } })
    res.json(reports)
  } catch (err) {
    res.status(500).json({ error: '获取举报列表失败' })
  }
})

adminRouter.patch('/reports/:id', async (req, res) => {
  try {
    const { status, hidePost } = req.body
    const report = await prisma.report.update({
      where: { id: req.params.id },
      data: { status },
    })
    if (hidePost && report.postId) {
      await prisma.post.update({
        where: { id: report.postId },
        data: { status: 'hidden' },
      })
    }
    res.json(report)
  } catch (err) {
    res.status(500).json({ error: '更新举报状态失败' })
  }
})
