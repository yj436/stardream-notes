import { Router } from 'express'
import prisma from '../db'
import { authMiddleware, optionalAuth, type AuthRequest } from '../middleware/auth'

export const userRouter = Router()

function formatUser(user: any) {
  const { passwordHash, ...rest } = user
  return {
    ...rest,
    favoriteCharacter: {
      name: user.favoriteCharName,
      anime: user.favoriteCharAnime,
      quote: user.favoriteCharQuote,
    },
    stats: {
      posts: user.postsCount,
      followers: user.followersCount,
      following: user.followingCount,
      likes: user.likesReceived,
    },
  }
}

userRouter.get('/', async (_req, res) => {
  try {
    const users = await prisma.user.findMany({ where: { status: 'active' }, orderBy: { postsCount: 'desc' } })
    res.json(users.map(formatUser))
  } catch (err) {
    res.status(500).json({ error: '获取用户列表失败' })
  }
})

userRouter.get('/:id', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } })
    if (!user) { res.status(404).json({ error: '用户不存在' }); return }
    let isFollowing = false
    if (req.userId) {
      isFollowing = !!(await prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: req.userId, followingId: user.id } },
      }))
    }
    res.json({ ...formatUser(user), isFollowing })
  } catch (err) {
    res.status(500).json({ error: '获取用户失败' })
  }
})

userRouter.put('/:id/profile', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (req.params.id !== req.userId) { res.status(403).json({ error: '无权修改' }); return }
    const { nickname, bio, creatorBadge, theme, favoriteCharacter } = req.body
    const updated = await prisma.user.update({
      where: { id: req.userId },
      data: {
        nickname: nickname ?? undefined,
        bio: bio ?? undefined,
        creatorBadge: creatorBadge ?? undefined,
        theme: theme ?? undefined,
        favoriteCharName: favoriteCharacter?.name ?? undefined,
        favoriteCharAnime: favoriteCharacter?.anime ?? undefined,
        favoriteCharQuote: favoriteCharacter?.quote ?? undefined,
      },
    })
    res.json(formatUser(updated))
  } catch (err) {
    res.status(500).json({ error: '更新失败' })
  }
})

userRouter.post('/:id/follow', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const targetId = req.params.id
    if (targetId === req.userId) { res.status(400).json({ error: '不能关注自己' }); return }
    const existing = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: req.userId!, followingId: targetId } },
    })
    if (existing) {
      await prisma.follow.delete({ where: { id: existing.id } })
      await prisma.user.update({ where: { id: targetId }, data: { followersCount: { decrement: 1 } } })
      await prisma.user.update({ where: { id: req.userId! }, data: { followingCount: { decrement: 1 } } })
    } else {
      await prisma.follow.create({ data: { followerId: req.userId!, followingId: targetId } })
      await prisma.user.update({ where: { id: targetId }, data: { followersCount: { increment: 1 } } })
      await prisma.user.update({ where: { id: req.userId! }, data: { followingCount: { increment: 1 } } })
    }
    const user = await prisma.user.findUnique({ where: { id: targetId } })
    const isFollowing = !existing
    res.json({ ...formatUser(user), isFollowing })
  } catch (err) {
    res.status(500).json({ error: '操作失败' })
  }
})

// Anime records
userRouter.get('/:id/anime-records', async (req, res) => {
  try {
    const records = await prisma.animeRecord.findMany({
      where: { userId: req.params.id },
      orderBy: { updatedAt: 'desc' },
    })
    res.json(records)
  } catch (err) {
    res.status(500).json({ error: '获取追番记录失败' })
  }
})

userRouter.post('/:id/anime-records', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { title, status, rating, review } = req.body
    const record = await prisma.animeRecord.create({
      data: { userId: req.userId!, title, status: status ?? 'want_to_watch', rating: rating ?? 0, review: review ?? '' },
    })
    res.status(201).json(record)
  } catch (err) {
    res.status(500).json({ error: '添加失败' })
  }
})
