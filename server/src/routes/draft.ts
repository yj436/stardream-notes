import { Router } from 'express'
import prisma from '../db'
import { authMiddleware, type AuthRequest } from '../middleware/auth'

export const draftRouter = Router()

draftRouter.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const draft = await prisma.draft.findUnique({ where: { userId: req.userId! } })
    const tags = safeParseArray(draft?.tags)
    const images = safeParseArray(draft?.images)
    res.json(draft ? { ...draft, tags, images } : { title: '', content: '', tags: [], images: [] })
  } catch (err) {
    res.status(500).json({ error: '获取草稿失败' })
  }
})

draftRouter.put('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { title, content, tags, images } = req.body
    const draft = await prisma.draft.upsert({
      where: { userId: req.userId! },
      update: {
        title: title ?? '',
        content: content ?? '',
        tags: JSON.stringify(tags ?? []),
        images: JSON.stringify(images ?? []),
      },
      create: {
        userId: req.userId!,
        title: title ?? '',
        content: content ?? '',
        tags: JSON.stringify(tags ?? []),
        images: JSON.stringify(images ?? []),
      },
    })
    res.json({ ...draft, tags: safeParseArray(draft.tags), images: safeParseArray(draft.images) })
  } catch (err) {
    res.status(500).json({ error: '保存草稿失败' })
  }
})

function safeParseArray(val: any): string[] {
  if (Array.isArray(val)) return val
  try { return JSON.parse(val ?? '[]') } catch { return [] }
}
