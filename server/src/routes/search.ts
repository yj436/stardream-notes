import { Router } from 'express'
import prisma from '../db'

export const searchRouter = Router()

searchRouter.get('/', async (req, res) => {
  try {
    const query = (req.query.q as string ?? '').trim().toLowerCase()
    const type = (req.query.type as string) ?? 'all'

    const allPosts = await prisma.post.findMany({ where: { status: 'published' } })
    const allUsers = await prisma.user.findMany({ where: { status: 'active' } })
    const allTags = Array.from(new Set(allPosts.flatMap((p) => safeParseArray(p.tags))))

    if (!query) {
      res.json({ posts: allPosts, users: allUsers, tags: allTags })
      return
    }

    const foundPosts = (type === 'all' || type === 'post')
      ? allPosts.filter((p) =>
          [p.title, p.excerpt, p.content, ...safeParseArray(p.tags)].some((t) => t.toLowerCase().includes(query)),
        )
      : []
    const foundUsers = (type === 'all' || type === 'user')
      ? allUsers.filter((u) =>
          [u.nickname, u.username, u.bio, u.creatorBadge ?? ''].some((t) => t.toLowerCase().includes(query)),
        )
      : []
    const foundTags = (type === 'all' || type === 'tag')
      ? allTags.filter((t) => t.toLowerCase().includes(query))
      : []

    res.json({ posts: foundPosts, users: foundUsers, tags: foundTags })
  } catch (err) {
    res.status(500).json({ error: '搜索失败' })
  }
})

function safeParseArray(val: any): string[] {
  if (Array.isArray(val)) return val
  try { return JSON.parse(val ?? '[]') } catch { return [] }
}
