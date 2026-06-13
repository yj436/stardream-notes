import { Router } from 'express'
import prisma from '../db'
import { authMiddleware, type AuthRequest } from '../middleware/auth'

export const commentRouter = Router()

// Get comments for a post
commentRouter.get('/post/:postId', async (req, res) => {
  try {
    const comments = await prisma.comment.findMany({
      where: { postId: req.params.postId },
      orderBy: { createdAt: 'desc' },
    })
    res.json(comments)
  } catch (err) {
    res.status(500).json({ error: '获取评论失败' })
  }
})

// Add comment
commentRouter.post('/post/:postId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { content, parentId } = req.body
    if (!content?.trim()) {
      res.status(400).json({ error: '请输入评论内容' })
      return
    }
    const comment = await prisma.comment.create({
      data: { postId: req.params.postId, userId: req.userId!, content: content.trim(), parentId: parentId ?? null },
    })
    await prisma.post.update({
      where: { id: req.params.postId },
      data: { commentCount: { increment: 1 } },
    })
    res.status(201).json(comment)
  } catch (err) {
    res.status(500).json({ error: '评论失败' })
  }
})

// Delete comment
commentRouter.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const comment = await prisma.comment.findUnique({ where: { id: req.params.id } })
    if (!comment) { res.status(404).json({ error: '评论不存在' }); return }
    // Check ownership or admin
    const user = await prisma.user.findUnique({ where: { id: req.userId } })
    const post = await prisma.post.findUnique({ where: { id: comment.postId } })
    if (comment.userId !== req.userId && post?.authorId !== req.userId && user?.role !== 'admin') {
      res.status(403).json({ error: '无权删除' })
      return
    }
    await prisma.comment.delete({ where: { id: req.params.id } })
    res.json({ postId: comment.postId })
  } catch (err) {
    res.status(500).json({ error: '删除失败' })
  }
})

// Like comment
commentRouter.post('/:id/like', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const comment = await prisma.comment.update({
      where: { id: req.params.id },
      data: { likeCount: { increment: 1 } },
    })
    res.json(comment)
  } catch (err) {
    res.status(500).json({ error: '点赞失败' })
  }
})
