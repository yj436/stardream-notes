import type { ImageAsset } from '@/types/content'

export type ImageLike = ImageAsset | string | null | undefined

export const defaultImageAlt = '作品图'

export const imageUrl = (image: ImageLike) => {
  if (!image) return ''
  return typeof image === 'string' ? image : image.url || ''
}

export const imageLabel = (image: ImageLike, fallback = '文章图片') => {
  const url = imageUrl(image)
  const fileName = decodeURIComponent(url.split('/').pop() || '').replace(/\.[a-z0-9]+$/i, '')
  return fileName || fallback
}

export const imageAlt = (image: ImageLike, fallback = defaultImageAlt) => {
  if (!image) return fallback
  if (typeof image === 'string') return fallback
  return image.alt?.trim() || fallback
}

export const normalizeImageAsset = (image: ImageLike, fallbackAlt = defaultImageAlt): ImageAsset | null => {
  const url = imageUrl(image).trim()
  if (!url) return null
  return {
    url,
    alt: imageAlt(image, fallbackAlt).replace(/\s+/g, ' ').trim() || fallbackAlt,
  }
}

export const normalizeImageAssets = (images: ImageLike[] = [], fallbackAlt = defaultImageAlt): ImageAsset[] =>
  images.map((image) => normalizeImageAsset(image, fallbackAlt)).filter((image): image is ImageAsset => Boolean(image))

export const markdownImageAlt = (alt: string) => alt.replace(/[\[\]\r\n]+/g, ' ').replace(/\s+/g, ' ').trim() || defaultImageAlt
