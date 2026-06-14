export interface ArticleHeading {
  id: string
  text: string
  depth: number
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

export const extractArticleHeadings = (markdown: string, limit = 8): ArticleHeading[] => {
  const usedIds = new Map<string, number>()
  const headings: ArticleHeading[] = []

  for (const line of markdown.split('\n')) {
    const match = line.match(/^(#{2,3})\s+(.+)$/)
    if (!match) continue

    const text = plainHeadingText(match[2])
    if (!text) continue

    headings.push({
      id: getUniqueHeadingId(text, usedIds),
      text,
      depth: match[1].length,
    })

    if (headings.length >= limit) break
  }

  return headings
}
