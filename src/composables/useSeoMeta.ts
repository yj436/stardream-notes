import siteCoverUrl from '@/assets/images/stardream-hero.png'

const SITE_NAME = '星梦笔记'
const DEFAULT_TITLE = '星梦笔记 | 二次元轻博客社区'
const DEFAULT_DESCRIPTION = '星梦笔记是一个记录 ACGN 创作、追番短评、作品画廊和轻博客灵感的个人社区。'
const DEFAULT_TYPE = 'website'
const MAX_DESCRIPTION_LENGTH = 160

export interface PageMetaInput {
  title?: string
  description?: string
  image?: string
  type?: 'website' | 'article'
  routePath?: string
  publishedTime?: string
  tags?: string[]
}

interface RouteLike {
  fullPath: string
  meta: Record<string | number | symbol, unknown>
}

const stripMarkdown = (value: string) =>
  value
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[#>*_`~|[\]()-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

export const summarizeForMeta = (value?: string, maxLength = MAX_DESCRIPTION_LENGTH) => {
  const clean = stripMarkdown(value ?? '')
  if (!clean) return DEFAULT_DESCRIPTION
  return clean.length > maxLength ? `${clean.slice(0, maxLength - 1)}…` : clean
}

const formatTitle = (title?: string) => {
  const clean = title?.trim()
  if (!clean) return DEFAULT_TITLE
  return clean.includes(SITE_NAME) ? clean : `${clean} | ${SITE_NAME}`
}

const normalizeRoutePath = (routePath = '/') => {
  const path = routePath.startsWith('/') ? routePath : `/${routePath}`
  const base = import.meta.env.BASE_URL || '/'
  const normalizedBase = base.endsWith('/') ? base : `${base}/`

  if (import.meta.env.VITE_ROUTER_MODE === 'hash') return `${normalizedBase}#${path}`
  return `${normalizedBase.replace(/\/$/, '')}${path}`
}

export const toAbsoluteUrl = (value: string) => {
  if (!value || typeof window === 'undefined') return value
  if (/^(data|blob):/i.test(value)) return value
  return new URL(value, window.location.origin).href
}

export const buildAppUrl = (routePath = '/') => toAbsoluteUrl(normalizeRoutePath(routePath))

const ensureMeta = (attribute: 'name' | 'property', key: string) => {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }
  return element
}

const setMeta = (attribute: 'name' | 'property', key: string, content: string) => {
  ensureMeta(attribute, key).setAttribute('content', content)
}

const removeMeta = (attribute: 'name' | 'property', key: string) => {
  document.head.querySelectorAll(`meta[${attribute}="${key}"]`).forEach((item) => item.remove())
}

const setCanonicalUrl = (url: string) => {
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!element) {
    element = document.createElement('link')
    element.setAttribute('rel', 'canonical')
    document.head.appendChild(element)
  }
  element.setAttribute('href', url)
}

export const updatePageMeta = (input: PageMetaInput = {}) => {
  if (typeof document === 'undefined') return

  const title = formatTitle(input.title)
  const description = summarizeForMeta(input.description)
  const image = toAbsoluteUrl(input.image || siteCoverUrl)
  const url = buildAppUrl(input.routePath)
  const type = input.type || DEFAULT_TYPE

  document.title = title
  setCanonicalUrl(url)

  setMeta('name', 'description', description)
  setMeta('name', 'robots', 'index,follow')
  setMeta('name', 'application-name', SITE_NAME)

  setMeta('property', 'og:locale', 'zh_CN')
  setMeta('property', 'og:site_name', SITE_NAME)
  setMeta('property', 'og:type', type)
  setMeta('property', 'og:title', title)
  setMeta('property', 'og:description', description)
  setMeta('property', 'og:image', image)
  setMeta('property', 'og:url', url)

  setMeta('name', 'twitter:card', 'summary_large_image')
  setMeta('name', 'twitter:title', title)
  setMeta('name', 'twitter:description', description)
  setMeta('name', 'twitter:image', image)

  if (type === 'article' && input.publishedTime) {
    setMeta('property', 'article:published_time', input.publishedTime)
  } else {
    removeMeta('property', 'article:published_time')
  }

  if (type === 'article' && input.tags?.length) {
    setMeta('property', 'article:tag', input.tags.join(', '))
  } else {
    removeMeta('property', 'article:tag')
  }
}

export const metaFromRoute = (route: RouteLike): PageMetaInput => ({
  title: typeof route.meta.title === 'string' ? route.meta.title : undefined,
  description: typeof route.meta.description === 'string' ? route.meta.description : undefined,
  routePath: route.fullPath,
})
