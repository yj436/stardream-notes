import { Router } from 'express'
import prisma from '../db'
import { authMiddleware, type AuthRequest } from '../middleware/auth'

export const animeRouter = Router()

animeRouter.patch('/:id/status', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { status } = req.body
    const record = await prisma.animeRecord.update({
      where: { id: req.params.id },
      data: { status },
    })
    res.json(record)
  } catch (err) {
    res.status(500).json({ error: '更新失败' })
  }
})
