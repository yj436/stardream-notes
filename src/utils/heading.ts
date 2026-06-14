export interface ArticleHeading {
  id: string
  text: string
  depth: number
  line: number
}

export interface HeadingExtractionOptions {
  minDepth?: number
  maxDepth?: number
}

const plainHeadingText = (text: string) =>
  text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[`*_~]/g, '')
    .replace(/\s+#*$/, '')
    .trim()

export const createHeadingSlug = (text: string) => {
  const slug = plainHeadingText(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  return slug || 'section'
}

export const getUniqueHeadingId = (text: string, usedIds: Map<string, number>) => {
  const slug = createHeadingSlug(text)
  const usedCount = usedIds.get(slug) ?? 0
  usedIds.set(slug, usedCount + 1)
  return usedCount ? `${slug}-${usedCount + 1}` : slug
}

export const extractArticleHeadings = (
  markdown: string,
  limit = 8,
  options: HeadingExtractionOptions = {},
): ArticleHeading[] => {
  const minDepth = options.minDepth ?? 2
  const maxDepth = options.maxDepth ?? 3
  const usedIds = new Map<string, number>()
  const headings: ArticleHeading[] = []

  for (const [index, line] of markdown.split('\n').entries()) {
    const match = line.match(/^(#{1,6})\s+(.+)$/)
    if (!match) continue
    const depth = match[1].length
    if (depth < minDepth || depth > maxDepth) continue

    const text = plainHeadingText(match[2])
    if (!text) continue

    headings.push({
      id: getUniqueHeadingId(text, usedIds),
      text,
      depth,
      line: index + 1,
    })

    if (headings.length >= limit) break
  }

  return headings
}
