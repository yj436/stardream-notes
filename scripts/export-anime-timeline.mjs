import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import process from 'node:process'

const port = Number(process.env.TIMELINE_EXPORT_PORT ?? 3199)
const before = Number(process.env.TIMELINE_BEFORE ?? 3)
const after = Number(process.env.TIMELINE_AFTER ?? 7)
const timeoutMs = Number(process.env.TIMELINE_EXPORT_TIMEOUT_MS ?? 120000)
const outputPath = resolve(process.env.TIMELINE_OUTPUT ?? 'public/data/anime-timeline.json')
const endpoint = `http://127.0.0.1:${port}/api/anime-timeline?category=all&before=${before}&after=${after}`

const sleep = (ms) => new Promise((resolveSleep) => setTimeout(resolveSleep, ms))

const readTimeline = async () => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000)
  try {
    const response = await fetch(endpoint, { signal: controller.signal })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return await response.json()
  } finally {
    clearTimeout(timeout)
  }
}

const waitForTimeline = async () => {
  const startedAt = Date.now()
  let lastError = null

  while (Date.now() - startedAt < timeoutMs) {
    try {
      return await readTimeline()
    } catch (error) {
      lastError = error
      await sleep(1200)
    }
  }

  throw lastError ?? new Error('Timed out while exporting anime timeline')
}

const server = spawn(process.execPath, ['server/index.js'], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    API_PORT: String(port),
    PORT: String(port),
  },
  stdio: ['ignore', 'pipe', 'pipe'],
})

let serverOutput = ''
server.stdout.on('data', (chunk) => {
  serverOutput += chunk.toString()
})
server.stderr.on('data', (chunk) => {
  serverOutput += chunk.toString()
})

try {
  const payload = await waitForTimeline()
  const episodeCount = payload.days?.reduce((sum, day) => sum + (day.episodes?.length ?? 0), 0) ?? 0
  const exportPayload = {
    ...payload,
    exportedAt: new Date().toISOString(),
    exportWindow: { before, after },
  }

  mkdirSync(dirname(outputPath), { recursive: true })
  writeFileSync(outputPath, `${JSON.stringify(exportPayload, null, 2)}\n`)
  console.log(`Exported anime timeline: ${episodeCount} episodes -> ${outputPath}`)
} catch (error) {
  console.error('Failed to export anime timeline.')
  if (serverOutput.trim()) console.error(serverOutput.trim())
  throw error
} finally {
  if (server.exitCode === null) {
    server.kill('SIGTERM')
    setTimeout(() => {
      if (server.exitCode === null) server.kill('SIGKILL')
    }, 1500).unref()
  }
}
