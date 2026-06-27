import { computed, ref, watch } from 'vue'
import { useBlogStore } from '@/stores/blog'
import type { ImageAsset, Post, PostType } from '@/types/content'
import { normalizeImageAsset } from '@/utils/image'

export type GallerySort = 'latest' | 'hot' | 'views'
export type GalleryTypeFilter = 'all' | PostType

export interface GalleryItem {
  id: string
  image: ImageAsset
  post: Post
  index: number
  authorName: string
  authorAvatar?: string
  authorAvatarPosition?: string
  shape: 'square' | 'tall' | 'wide'
}

export const galleryAllTag = '全部'

export const galleryTypeOptions: Array<{ label: string; value: GalleryTypeFilter }> = [
  { label: '全部图廊', value: 'all' },
  { label: '番剧图文', value: 'article' },
  { label: 'COS 图集', value: 'gallery' },
  { label: '游戏资料', value: 'record' },
]

export const gallerySortOptions: Array<{ label: string; value: GallerySort }> = [
  { label: '热度', value: 'hot' },
  { label: '最新', value: 'latest' },
  { label: '浏览', value: 'views' },
]

const animeAssetKeys = ['asset:hero', 'asset:healingAnime', 'asset:sakuraWatercolor', 'asset:starryDesk', 'asset:novelKitchen', 'asset:galaxySchool']
const acgnTags = ['番剧', '番剧补完', 'AnimeJapan', '新番情报', 'COS', 'Comiket', '同人现场', '游戏', 'Tokyo Game Show', '玩家文化', '图廊', '版权标注', '日常番', '场景资料', '轻小说']
const techTags = ['IT技术', 'Vue', 'Vite', 'TypeScript', '工程质量', 'MySQL', 'Prisma', 'GitHub Pages', 'Web Vitals']

const itemShapeFor = (index: number): GalleryItem['shape'] => (index % 5 === 1 ? 'tall' : index % 5 === 3 ? 'wide' : 'square')

const visualImageScore = (item: GalleryItem) => {
  const url = item.image.url
  let score = 0
  if (url.includes('wallpaper-anime') || animeAssetKeys.includes(url)) score += 4
  if (item.post.tags.some((tag) => acgnTags.includes(tag))) score += 3
  if (item.post.type === 'gallery') score += 2
  if (item.index === 0 && ['gallery', 'article', 'record'].includes(item.post.type)) score += 1
  if (item.post.tags.some((tag) => techTags.includes(tag))) score -= 4
  if (url.includes('content-digital-tablet') || url.includes('content-game-controller')) score -= 2
  if (url.includes('content-comiket-cosplayers') || url.includes('content-comiket-cosplay')) score -= 1
  return score
}

const itemMatchesKeyword = (item: GalleryItem, keyword: string) =>
  !keyword || [item.post.title, item.post.excerpt, item.authorName, ...item.post.tags].some((text) => text.toLowerCase().includes(keyword))

export const useGalleryBoard = () => {
  const blog = useBlogStore()
  const selectedTag = ref(galleryAllTag)
  const selectedType = ref<GalleryTypeFilter>('all')
  const selectedSort = ref<GallerySort>('hot')
  const galleryQuery = ref('')
  const activeImageId = ref<string | null>(null)

  const galleryItems = computed<GalleryItem[]>(() =>
    blog.posts.flatMap((post) => {
      const author = blog.users.find((user) => user.id === post.authorId)
      const fallback = normalizeImageAsset(post.coverUrl, post.title)
      const images = post.gallery.length ? post.gallery : fallback ? [fallback] : []
      return images.map((image, index) => ({
        id: `${post.id}-${index}`,
        image,
        post,
        index,
        authorName: author?.nickname ?? '板块编辑',
        authorAvatar: author?.avatarUrl,
        authorAvatarPosition: author?.avatarPosition,
        shape: itemShapeFor(index),
      }))
    }),
  )

  const galleryTags = computed(() => {
    const tagCounts = new Map<string, number>()
    galleryItems.value.forEach((item) => {
      item.post.tags.forEach((tag) => tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1))
    })
    return [...tagCounts.entries()].sort((a, b) => b[1] - a[1])
  })

  const filteredItems = computed(() => {
    const keyword = galleryQuery.value.trim().toLowerCase()
    const items = galleryItems.value.filter((item) => {
      const tagMatched = selectedTag.value === galleryAllTag || item.post.tags.includes(selectedTag.value)
      const typeMatched = selectedType.value === 'all' || item.post.type === selectedType.value
      return tagMatched && typeMatched && itemMatchesKeyword(item, keyword)
    })

    return [...items].sort((a, b) => {
      const visualDiff = visualImageScore(b) - visualImageScore(a)
      if (selectedSort.value === 'latest') {
        const latestDiff = new Date(b.post.createdAt).getTime() - new Date(a.post.createdAt).getTime()
        return latestDiff || visualDiff
      }
      if (selectedSort.value === 'views') return b.post.viewCount - a.post.viewCount || visualDiff
      const engagementDiff = b.post.likeCount + b.post.favoriteCount - (a.post.likeCount + a.post.favoriteCount)
      return visualDiff || engagementDiff || new Date(b.post.createdAt).getTime() - new Date(a.post.createdAt).getTime()
    })
  })

  const featuredItem = computed(() => filteredItems.value[0] ?? galleryItems.value[0])
  const activeItem = computed(() => filteredItems.value.find((item) => item.id === activeImageId.value) ?? null)
  const activeIndex = computed(() => filteredItems.value.findIndex((item) => item.id === activeImageId.value))
  const galleryStats = computed(() => ({
    images: filteredItems.value.length,
    posts: new Set(filteredItems.value.map((item) => item.post.id)).size,
    creators: new Set(filteredItems.value.map((item) => item.post.authorId)).size,
    likes: filteredItems.value.reduce((sum, item) => sum + item.post.likeCount, 0),
  }))

  const selectTag = (tag: string) => {
    selectedTag.value = tag
  }

  const openLightbox = (item: GalleryItem) => {
    activeImageId.value = item.id
  }

  const closeLightbox = () => {
    activeImageId.value = null
  }

  const moveLightbox = (direction: 1 | -1) => {
    if (!filteredItems.value.length) return
    const current = activeIndex.value >= 0 ? activeIndex.value : 0
    const next = (current + direction + filteredItems.value.length) % filteredItems.value.length
    activeImageId.value = filteredItems.value[next].id
  }

  watch([selectedTag, selectedType, selectedSort, galleryQuery], () => {
    if (activeImageId.value && !filteredItems.value.some((item) => item.id === activeImageId.value)) {
      activeImageId.value = null
    }
  })

  return {
    blog,
    activeIndex,
    activeItem,
    closeLightbox,
    featuredItem,
    filteredItems,
    galleryItems,
    galleryQuery,
    galleryStats,
    galleryTags,
    moveLightbox,
    openLightbox,
    selectTag,
    selectedSort,
    selectedTag,
    selectedType,
    sortOptions: gallerySortOptions,
    typeOptions: galleryTypeOptions,
  }
}
