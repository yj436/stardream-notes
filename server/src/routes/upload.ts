import { Router } from 'express'
import multer from 'multer'
import path from 'node:path'
import fs from 'node:fs'
import { uploadsDir } from '../paths'

export const uploadRouter = Router()

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })
const allowedExtensions = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp'])

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, `img_${Date.now()}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    cb(null, allowedExtensions.has(path.extname(file.originalname).toLowerCase()))
  },
})

uploadRouter.post('/', upload.single('image'), (req, res) => {
  const file = req.file
  if (!file) {
    res.status(400).json({ error: '未上传文件' })
    return
  }
  res.json({ url: `/uploads/${file.filename}` })
})
