import { Router } from 'express'
import bcrypt from 'bcryptjs'
import prisma from '../db'
import { signToken, authMiddleware, type AuthRequest } from '../middleware/auth'

export const authRouter = Router()

authRouter.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body
    if (!identifier || !password) {
      res.status(400).json({ error: '请输入账号和密码' })
      return
    }
    const user = await prisma.user.findFirst({
      where: { OR: [{ email: identifier }, { username: identifier }] },
    })
    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      res.status(401).json({ error: '账号或密码错误' })
      return
    }
    if (user.status === 'banned') {
      res.status(403).json({ error: '账号已被封禁' })
      return
    }
    const token = signToken(user.id)
    res.json({
      token,
      user: formatUser(user),
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: '登录失败' })
  }
})

authRouter.post('/register', async (req, res) => {
  try {
    const { username, nickname, email, password } = req.body
    if (!username || !nickname || !email || !password) {
      res.status(400).json({ error: '请填写完整信息' })
      return
    }
    if (password.length < 6) {
      res.status(400).json({ error: '密码至少 6 位' })
      return
    }
    const exists = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    })
    if (exists) {
      res.status(409).json({ error: '用户名或邮箱已被注册' })
      return
    }
    const user = await prisma.user.create({
      data: {
        username,
        nickname,
        email,
        passwordHash: bcrypt.hashSync(password, 10),
        avatarUrl: '',
        coverUrl: '',
      },
    })
    const token = signToken(user.id)
    res.status(201).json({ token, user: formatUser(user) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: '注册失败' })
  }
})

authRouter.get('/me', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } })
    if (!user) {
      res.status(404).json({ error: '用户不存在' })
      return
    }
    res.json(formatUser(user))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: '获取用户信息失败' })
  }
})

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
