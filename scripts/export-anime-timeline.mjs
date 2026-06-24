import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import process from 'node:process'

const port = Number(process.env.TIMELINE_EXPORT_PORT ?? 3199)
const before = Number(process.env.TIMELINE_BEFORE ?? 3)
const after = Number(process.env.TIMELINE_AFTER ?? 7)
const timeoutMs = Number(process.env.TIMELINE_EXPORT_TIMEOUT_MS ?? 120000)
const minEpisodes = Number(process.env.TIMELINE_MIN_EPISODES ?? 180)
const requiredSources = (process.env.TIMELINE_REQUIRED_SOURCES ?? 'myanimelist,bangumi,bilibili')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean)
const outputPath = resolve(process.env.TIMELINE_OUTPUT ?? 'public/data/anime-timeline.json')
const fallbackUrl = process.env.TIMELINE_FALLBACK_URL ?? 'https://yj436.github.io/stardream-notes/data/anime-timeline.json'
const endpoint = `http://127.0.0.1:${port}/api/anime-timeline?category=all&before=${before}&after=${after}`

const sleep = (ms) => new Promise((resolveSleep) => setTimeout(resolveSleep, ms))

const summarizeTimeline = (payload) => {
  const sources = Array.isArray(payload?.sources) ? payload.sources : []
  const days = Array.isArray(payload?.days) ? payload.days : []
  const episodeCount = days.reduce((sum, day) => sum + (Array.isArray(day.episodes) ? day.episodes.length : 0), 0)
  const sourceStatuses = new Map(sources.map((source) => [source.id, source]))
  const sourceSummary = sources.map((source) => `${source.id}:${source.status}:${source.count ?? 0}`).join(', ')
  const missingSources = requiredSources.filter((id) => sourceStatuses.get(id)?.status !== 'ok')
  return {
    episodeCount,
    sourceSummary,
    missingSources,
    healthy: episodeCount >= minEpisodes && missingSources.length === 0,
  }
}

const formatSummary = (summary) =>
  `${summary.episodeCount} episodes; sources: ${summary.sourceSummary || 'none'}${
    summary.missingSources.length ? `; missing required: ${summary.missingSources.join(',')}` : ''
  }`

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
  let bestPayload = null
  let bestSummary = null

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const payload = await readTimeline()
      const summary = summarizeTimeline(payload)
      console.log(`Timeline export attempt: ${formatSummary(summary)}`)
      if (!bestSummary || summary.episodeCount > bestSummary.episodeCount || summary.missingSources.length < bestSummary.missingSources.length) {
        bestPayload = payload
        bestSummary = summary
      }
      if (summary.healthy) return payload
      lastError = new Error(`Timeline payload is incomplete: ${formatSummary(summary)}`)
    } catch (error) {
      lastError = error
    }
    await sleep(4000)
  }

  if (bestPayload && bestSummary) {
    lastError = new Error(`Best timeline payload is still incomplete: ${formatSummary(bestSummary)}`)
  }
  throw lastError ?? new Error('Timed out while exporting anime timeline')
}

const readFallbackTimeline = async () => {
  const candidates = [
    {
      source: 'local seed',
      enabled: existsSync(outputPath),
      load: async () => JSON.parse(readFileSync(outputPath, 'utf8')),
    },
    {
      source: 'current Pages data',
      enabled: !!fallbackUrl,
      load: async () => {
        const response = await fetch(`${fallbackUrl}?fallback=${Date.now()}`)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return response.json()
      },
    },
  ]

  for (const candidate of candidates) {
    if (!candidate.enabled) continue
    try {
      const payload = await candidate.load()
      const summary = summarizeTimeline(payload)
      console.warn(`Timeline fallback candidate (${candidate.source}): ${formatSummary(summary)}`)
      if (summary.healthy) return { payload, source: candidate.source, summary }
    } catch (error) {
      console.warn(`Timeline fallback candidate failed (${candidate.source}):`, error)
    }
  }

  return null
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
  let payload
  let fallbackSource = null
  try {
    payload = await waitForTimeline()
  } catch (error) {
    console.error('Fresh timeline export did not pass quality checks.')
    if (serverOutput.trim()) console.error(serverOutput.trim())
    console.error(error)
    const fallback = await readFallbackTimeline()
    if (!fallback) throw error
    payload = fallback.payload
    fallbackSource = fallback.source
    console.warn(`Using timeline fallback from ${fallback.source}: ${formatSummary(fallback.summary)}`)
  }
  const summary = summarizeTimeline(payload)
  const exportPayload = {
    ...payload,
    exportedAt: new Date().toISOString(),
    exportWindow: { before, after },
    ...(fallbackSource ? { exportFallback: { source: fallbackSource, reason: 'fresh export failed quality checks' } } : {}),
  }

  mkdirSync(dirname(outputPath), { recursive: true })
  writeFileSync(outputPath, `${JSON.stringify(exportPayload, null, 2)}\n`)
  console.log(`Exported anime timeline: ${formatSummary(summary)} -> ${outputPath}`)
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
