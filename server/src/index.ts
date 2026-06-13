import express from 'express'
import cors from 'cors'
import { authRouter } from './routes/auth'
import { postRouter } from './routes/posts'
import { userRouter } from './routes/users'
import { commentRouter } from './routes/comments'
import { animeRouter } from './routes/anime'
import { draftRouter } from './routes/draft'
import { searchRouter } from './routes/search'
import { adminRouter } from './routes/admin'
import { uploadRouter } from './routes/upload'
import { authMiddleware } from './middleware/auth'
import { uploadsDir } from './paths'

const app = express()
const PORT = process.env.PORT ?? 3001

app.use(cors({ origin: true, credentials: true }))
app.use(express.json({ limit: '10mb' }))
app.use('/uploads', express.static(uploadsDir))

// Health
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Public routes
app.use('/api/auth', authRouter)
app.use('/api/search', searchRouter)

// Auth-required routes
app.use('/api/posts', postRouter)
app.use('/api/users', userRouter)
app.use('/api/comments', commentRouter)
app.use('/api/anime-records', animeRouter)
app.use('/api/draft', authMiddleware, draftRouter)
app.use('/api/upload', authMiddleware, uploadRouter)
app.use('/api/admin', authMiddleware, adminRouter)

app.listen(PORT, () => {
  console.log(`✨ 星梦笔记 API 已启动 → http://127.0.0.1:${PORT}`)
})
