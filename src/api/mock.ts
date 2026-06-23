import tokyoBigSightNight from '@/assets/images/content-tokyo-big-sight-night.jpg'
import digitalTablet from '@/assets/images/content-digital-tablet.jpg'
import mangaMuseumMain from '@/assets/images/content-manga-museum-main.jpg'
import mangaArtistTools from '@/assets/images/content-manga-artist-tools.jpg'
import comiketCosplay from '@/assets/images/content-comiket-cosplay.jpg'
import kareRaisu from '@/assets/images/content-kare-raisu.jpg'
import mangaMuseumReading from '@/assets/images/content-manga-museum-reading.jpg'
import { normalizeImageAssets } from '@/utils/image'
import type {
  AdminBackupCounts,
  AdminBackupImportResult,
  AdminBackupPayload,
  AnimeRecord,
  AnimeRecordPayload,
  Comment,
  Draft,
  DraftSnapshot,
  HomeCarouselSlide,
  ImageAsset,
  NewPostPayload,
  Post,
  PostReactionKey,
  ProfileUpdatePayload,
  Report,
  SearchResult,
  User,
} from '@/types/content'

const wait = (ms = 120) => new Promise((resolve) => window.setTimeout(resolve, ms))

export const imageAssets = {
  hero: tokyoBigSightNight,
  creators: digitalTablet,
  starryDesk: mangaMuseumMain,
  sakuraWatercolor: mangaArtistTools,
  moonlightCos: comiketCosplay,
  healingAnime: tokyoBigSightNight,
  novelKitchen: kareRaisu,
  galaxySchool: mangaMuseumReading,
}

const storageKeys = {
  version: 'stardream:data-version',
  users: 'stardream:users',
  posts: 'stardream:posts',
  comments: 'stardream:comments',
  reports: 'stardream:reports',
  homeCarousel: 'stardream:home-carousel',
  animeRecords: 'stardream:anime-records',
  draft: 'stardream:draft',
  draftSnapshots: 'stardream:draft-snapshots',
}

const dataVersion = 'acgn-public-sources-2026-06-23'
const emptyReactions: Record<PostReactionKey, number> = { heart: 0, laugh: 0, cry: 0, fire: 0 }
const imageAsset = (url: string, alt: string): ImageAsset => ({ url, alt })
const cloneData = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const readStorage = <T>(key: string, fallback: T): T => {
  try {
    const value = window.localStorage.getItem(key)
    return value ? (JSON.parse(value) as T) : fallback
  } catch {
    return fallback
  }
}

const writeStorage = <T>(key: string, value: T) => {
  window.localStorage.setItem(key, JSON.stringify(value))
}

const resetIfNeeded = () => {
  if (window.localStorage.getItem(storageKeys.version) === dataVersion) return
  Object.values(storageKeys).forEach((key) => window.localStorage.removeItem(key))
  window.localStorage.setItem(storageKeys.version, dataVersion)
}

resetIfNeeded()

const sourceLinks = {
  comiket: 'https://www.comiket.co.jp/index_e.html',
  comiketOverseas: 'https://www.comiket.co.jp/info-a/TAFO/',
  kyotoMangaMuseum: 'https://kyotomm.jp/en/',
  kyotoCollection: 'https://kyotomm.jp/en/collection/',
  animeJapan: 'https://anime-japan.jp/en/about/',
  mangaPlus: 'https://mangaplus.shueisha.co.jp/updates',
  mangaPlusApp: 'https://apps.apple.com/us/app/manga-plus-by-shueisha/id1442476536',
  commonsSearch: 'https://search.creativecommons.org/',
}

const initialUsers: User[] = [
  {
    id: 'u_editorial',
    username: 'open-culture-desk',
    email: 'admin@stardream.local',
    nickname: '公开资料编辑部',
    avatarUrl: digitalTablet,
    avatarPosition: 'center',
    coverUrl: tokyoBigSightNight,
    bio: '站内资料整理账号：只收录公开来源、开放授权图片和原创整理文本。',
    level: 18,
    creatorBadge: '站点编辑',
    favoriteCharacter: {
      name: '资料来源',
      anime: '站点内容治理',
      quote: '每一张图、每一段说明都要能回到公开来源。',
    },
    stats: { posts: 1, followers: 0, following: 0, likes: 0 },
    role: 'admin',
    status: 'active',
    theme: 'sakura',
  },
  {
    id: 'u_events',
    username: 'event-archive',
    email: 'events@stardream.local',
    nickname: 'ACGN 活动档案组',
    avatarUrl: comiketCosplay,
    avatarPosition: 'center',
    coverUrl: tokyoBigSightNight,
    bio: '整理 Comic Market、AnimeJapan 等公开活动资料，偏重时间、地点、参与方式和现场图像来源。',
    level: 15,
    creatorBadge: '活动资料',
    favoriteCharacter: {
      name: '东京 Big Sight',
      anime: '展会与同人文化',
      quote: '活动信息先看官方页面，再写成读者能快速理解的资料卡。',
    },
    stats: { posts: 2, followers: 0, following: 0, likes: 0 },
    role: 'creator',
    status: 'active',
    theme: 'starlight',
  },
  {
    id: 'u_manga',
    username: 'manga-archive',
    email: 'manga@stardream.local',
    nickname: '漫画馆藏资料组',
    avatarUrl: mangaMuseumMain,
    avatarPosition: 'center',
    coverUrl: mangaMuseumReading,
    bio: '关注漫画馆藏、阅读空间、创作工具和漫画史材料，把博物馆公开信息转成站内资料。',
    level: 14,
    creatorBadge: '馆藏资料',
    favoriteCharacter: {
      name: '京都国际漫画博物馆',
      anime: '漫画文化资料',
      quote: '漫画不只是一页读物，也是一套可以被保存、检索和研究的文化材料。',
    },
    stats: { posts: 1, followers: 0, following: 0, likes: 0 },
    role: 'creator',
    status: 'active',
    theme: 'mint',
  },
  {
    id: 'u_media',
    username: 'legal-reading',
    email: 'media@stardream.local',
    nickname: '正版阅读与资料组',
    avatarUrl: mangaArtistTools,
    avatarPosition: 'center',
    coverUrl: digitalTablet,
    bio: '整理正版阅读入口、日常场景参考和创作素材规范，避免使用未经授权的截图、海报和正文摘录。',
    level: 12,
    creatorBadge: '资料整理',
    favoriteCharacter: {
      name: 'MANGA Plus',
      anime: '正版阅读入口',
      quote: '把入口讲清楚，比堆砌作品海报更适合长期维护。',
    },
    stats: { posts: 2, followers: 0, following: 0, likes: 0 },
    role: 'creator',
    status: 'active',
    theme: 'starlight',
  },
]

const initialPosts: Post[] = [
  {
    id: 'p_comiket_guide',
    authorId: 'u_events',
    title: 'Comiket：从同人志即卖会看创作社群如何运转',
    excerpt: '基于 Comic Market 官方信息和开放授权现场照片，整理同人创作、摊位日程和东京 Big Sight 场景。',
    content: `这是一张给博客读者看的资料卡，正文由站点原创整理，不复制活动页面长文。

## 可整理的信息
- Comic Market 也常被称作 Comiket，核心场景是同人志、自出版作品和创作者社群。
- 官方英文站提供面向海外参与者的说明入口；不同日期的社团、类型和入场规则需要以官方页面为准。
- 站内使用的现场照片来自 Wikimedia Commons，照片记录的是 2013 年夏季 Comiket 84 的 Cosplay 区域。

Comiket 适合放在 ACGN 博客首页，因为它同时连接创作、交流、展示和购买。相比虚构的同人创作教程，真实资料可以让读者知道活动如何组织，创作者为什么需要提前准备摊位、作品目录、交通与排队策略。

## 资料来源
- Comic Market 官方英文站：${sourceLinks.comiket}
- Comic Market 海外参与者说明：${sourceLinks.comiketOverseas}
- 图片来源：Wikimedia Commons / Guilhem Vellut / CC BY 2.0`,
    coverUrl: comiketCosplay,
    imagePosition: 'center',
    isPinned: true,
    type: 'gallery',
    tags: ['Comiket', '同人文化', '东京展会'],
    series: 'ACGN 公开资料笔记',
    gallery: [
      imageAsset(comiketCosplay, 'Comiket 84 Cosplay 区域，Guilhem Vellut 摄，CC BY 2.0'),
      imageAsset(tokyoBigSightNight, '东京 Big Sight 夜景，Masato Ohta 摄，CC BY 2.0'),
    ],
    viewCount: 0,
    likeCount: 0,
    favoriteCount: 0,
    commentCount: 0,
    createdAt: '2026-06-23T09:10:00+08:00',
    reactions: { ...emptyReactions },
  },
  {
    id: 'p_kyoto_manga_museum',
    authorId: 'u_manga',
    title: '京都国际漫画博物馆：把漫画从消费品变成可检索的文化资料',
    excerpt: '京都国际漫画博物馆公开页面显示馆内约 300,000 项资料可检索，馆藏覆盖江户戏画、明治期杂志和复制原画。',
    content: `京都国际漫画博物馆适合做成站内“漫画馆藏”板块，因为它说明漫画如何被保存、检索和研究。

## 可整理的信息
- 博物馆官网首页提供数据库检索入口，并说明馆内约 300,000 项资料可检索。
- Collection 页面介绍馆藏包含 Edo giga、明治时期漫画杂志，以及被称为 Genga'(Dash) 的复制原画资料。
- 官网还介绍 Manga Wall、Research Reference Room、Manga Studio 等面向参观和研究的空间。

站内没有搬运漫画正文或馆内展品细节图，而是使用 Commons 上的室内空间与阅读场景照片。这类素材更适合博客：它呈现“漫画被阅读和保存的场域”，不会误用商业作品封面。

## 资料来源
- 京都国际漫画博物馆官网：${sourceLinks.kyotoMangaMuseum}
- 馆藏介绍：${sourceLinks.kyotoCollection}
- 图片来源：Wikimedia Commons / Kento Ikeda、Maplestrip、Tatyana Temirbulatova / CC BY 系列授权`,
    coverUrl: mangaMuseumMain,
    imagePosition: 'center',
    isPinned: true,
    type: 'article',
    tags: ['京都国际漫画博物馆', '漫画馆藏', '资料整理'],
    series: 'ACGN 公开资料笔记',
    gallery: [
      imageAsset(mangaMuseumMain, '京都国际漫画博物馆主展区，Kento Ikeda 摄，CC BY 2.0'),
      imageAsset(mangaArtistTools, '京都国际漫画博物馆内的漫画工具展示，Maplestrip 摄，CC BY 3.0'),
      imageAsset(mangaMuseumReading, '京都国际漫画博物馆户外阅读场景，Tatyana Temirbulatova 摄，CC BY 2.0'),
    ],
    viewCount: 0,
    likeCount: 0,
    favoriteCount: 0,
    commentCount: 0,
    createdAt: '2026-06-23T10:20:00+08:00',
    reactions: { ...emptyReactions },
  },
  {
    id: 'p_animejapan_2026',
    authorId: 'u_events',
    title: 'AnimeJapan 2026：动画产业展会的公共日与商务日',
    excerpt: '根据 AnimeJapan 官方 About 页面整理 2026 年会期、场馆和公共日、商务日的内容结构。',
    content: `AnimeJapan 的价值不只在“看展”，也在于它把动画产业的展示、舞台、商品、商务交流放在同一套活动结构里。

## 可整理的信息
- AnimeJapan 2026 官方 About 页面显示，公共日场馆为 Tokyo Big Sight，日期为 2026 年 3 月 28 日至 3 月 29 日。
- 商务日同样在 Tokyo Big Sight，日期为 2026 年 3 月 30 日至 3 月 31 日。
- 页面列出的内容包括 Exhibit booths、AJ Stage、Organized events、Official merchandise，以及商务日的 seminar、business concierge 等。

这篇文章使用东京 Big Sight 的开放授权夜景作为主图，而不使用活动主视觉或商业海报。这样更适合长期部署：图片可追溯，页面也不会因为活动素材版权而增加维护成本。

## 资料来源
- AnimeJapan 2026 About：${sourceLinks.animeJapan}
- 图片来源：Wikimedia Commons / Masato Ohta / CC BY 2.0`,
    coverUrl: tokyoBigSightNight,
    imagePosition: 'center',
    isPinned: true,
    type: 'record',
    tags: ['AnimeJapan', '动画产业', '东京展会'],
    series: 'ACGN 活动资料',
    gallery: [imageAsset(tokyoBigSightNight, '东京 Big Sight 夜景，Masato Ohta 摄，CC BY 2.0')],
    viewCount: 0,
    likeCount: 0,
    favoriteCount: 0,
    commentCount: 0,
    createdAt: '2026-06-23T11:05:00+08:00',
    reactions: { ...emptyReactions },
  },
  {
    id: 'p_manga_plus',
    authorId: 'u_media',
    title: 'MANGA Plus：同步连载服务如何改善海外正版阅读入口',
    excerpt: 'MANGA Plus by SHUEISHA 是集英社官方漫画阅读服务，公开介绍强调与日本同步更新最新章节。',
    content: `这篇资料不评价具体作品剧情，只整理“正版入口”本身。对博客来说，说明读者从哪里合法阅读，比使用未经授权的漫画截图更重要。

## 可整理的信息
- MANGA Plus by SHUEISHA 的应用商店页面称它是 Shueisha 的官方漫画阅读服务。
- 公开页面介绍其最新章节可与日本同步阅读；免费章节范围会随服务规则调整，读者应以官方应用和网页为准。
- 服务适合放在“正版阅读入口”板块，帮助读者找到官方平台，而不是在站内复制漫画内容。

我们只写原创说明，不上传漫画分镜、彩页或商业封面。页面配图使用开放授权的数位板照片，表达“数字阅读与数字创作”的主题。

## 资料来源
- MANGA Plus 更新入口：${sourceLinks.mangaPlus}
- App Store 介绍页：${sourceLinks.mangaPlusApp}
- 图片来源：Wikimedia Commons / Piknuz / CC BY-SA 4.0`,
    coverUrl: digitalTablet,
    imagePosition: 'center',
    isPinned: false,
    type: 'article',
    tags: ['MANGA Plus', '正版阅读', '漫画平台'],
    series: '正版阅读入口',
    gallery: [imageAsset(digitalTablet, '数位板绘制场景，Piknuz 摄，CC BY-SA 4.0')],
    viewCount: 0,
    likeCount: 0,
    favoriteCount: 0,
    commentCount: 0,
    createdAt: '2026-06-23T11:35:00+08:00',
    reactions: { ...emptyReactions },
  },
  {
    id: 'p_open_licensed_images',
    authorId: 'u_editorial',
    title: '开放授权图片怎么进博客：从 Commons 图库到站内来源表',
    excerpt: '把图片资源替换成可追溯资产后，站内需要记录作者、授权协议、来源链接和使用场景。',
    content: `这一轮内容更新的重点，是让博客里的图片不再只是“好看”，而是可追溯、可替换、可维护。

## 采集规则
- 优先选择 Wikimedia Commons、Creative Commons 搜索入口和官方机构页面。
- 图片进入站内前记录文件名、作者、授权协议和来源链接。
- 文章正文使用原创整理，不复制新闻、官网长文或漫画正文。
- 对可能包含非自由商业画面的活动照片保持谨慎；默认用场馆、工具、阅读空间和生活场景图替代。

后台轮播图现在可以选择“东京 Big Sight 夜景”“京都漫画博物馆主展区”“Comiket 现场”“漫画工具展示”等真实资产。运营时换图不再依赖占位插画，也能在文档里找到每张图的授权说明。

## 资料来源
- Creative Commons Search：${sourceLinks.commonsSearch}
- Wikimedia Commons 文件页见 docs/content-sources.md`,
    coverUrl: mangaArtistTools,
    imagePosition: 'center',
    isPinned: false,
    type: 'article',
    tags: ['Wikimedia Commons', '开放授权', '内容治理'],
    series: '站点内容治理',
    gallery: [
      imageAsset(mangaArtistTools, '漫画工具展示，Maplestrip 摄，CC BY 3.0'),
      imageAsset(digitalTablet, '数位板绘制场景，Piknuz 摄，CC BY-SA 4.0'),
      imageAsset(mangaMuseumReading, '漫画博物馆户外阅读场景，Tatyana Temirbulatova 摄，CC BY 2.0'),
    ],
    viewCount: 0,
    likeCount: 0,
    favoriteCount: 0,
    commentCount: 0,
    createdAt: '2026-06-23T12:00:00+08:00',
    reactions: { ...emptyReactions },
  },
  {
    id: 'p_kare_popculture',
    authorId: 'u_media',
    title: '咖喱饭为什么适合写进轻小说与动画场景资料库',
    excerpt: '用一张 CC0 的日式咖喱饭照片，替代虚构厨房插画，整理日常饮食场景如何服务轻小说叙事。',
    content: `日常食物是轻小说、动画和漫画里很常见的场景锚点。它不需要夸张设定，也能帮助读者快速理解角色的生活节奏。

## 可整理的信息
- 站内使用的咖喱饭照片来自 Wikimedia Commons，文件说明为家庭制作的日式咖喱饭。
- 该图片使用 CC0 公共领域贡献，适合作为“日常场景资料”配图。
- 这类素材能替代虚构厨房图，让创作者在写饮食、便当、深夜餐桌时有真实参考。

把“咖喱饭”写进场景时，可以关注气味、锅具、等待时间、共同分食和剩菜再加热，而不是只写菜名。真实照片提供的是质感，不是剧情本身。

## 资料来源
- Wikimedia Commons：Kare-Raisu.jpg
- 图片作者 Ocdp，CC0 1.0`,
    coverUrl: kareRaisu,
    imagePosition: 'center',
    isPinned: false,
    type: 'article',
    tags: ['日本咖喱', '场景资料', '日常叙事'],
    series: '日常场景资料',
    gallery: [imageAsset(kareRaisu, '家庭制作的日式咖喱饭，Ocdp 摄，CC0 1.0')],
    viewCount: 0,
    likeCount: 0,
    favoriteCount: 0,
    commentCount: 0,
    createdAt: '2026-06-23T12:25:00+08:00',
    reactions: { ...emptyReactions },
  },
]

const initialComments: Comment[] = []
const initialAnimeRecords: AnimeRecord[] = []
const initialReports: Report[] = []

const initialDraft: Draft = {
  title: '',
  content: '',
  tags: ['公开资料整理'],
  images: [],
}

const buildDefaultHomeCarousel = (sourcePosts: Post[] = initialPosts): HomeCarouselSlide[] => {
  const pinned = sourcePosts.filter((post) => post.isPinned)
  const candidates = [...pinned, ...sourcePosts.filter((post) => !pinned.some((item) => item.id === post.id))]
  return candidates.slice(0, 5).map((post, index) => ({
    id: `hero_${post.id}`,
    title: post.title,
    excerpt: post.excerpt,
    imageUrl: post.coverUrl,
    imagePosition: post.imagePosition ?? 'center',
    tag: post.tags[0] ?? ['今日主推', '馆藏资料', '活动现场', '正版入口', '编辑精选'][index] ?? '精选',
    link: `/post/${post.id}`,
    sourcePostId: post.id,
    enabled: true,
    updatedAt: new Date().toISOString(),
  }))
}

const sanitizeHomeCarousel = (slides: HomeCarouselSlide[]) =>
  slides.slice(0, 8).map((slide, index) => ({
    id: slide.id || `hero_custom_${Date.now()}_${index}`,
    title: slide.title?.trim() || '公开资料主视觉',
    excerpt: slide.excerpt?.trim() || '收录公开来源、开放授权图片和原创整理文本。',
    imageUrl: slide.imageUrl || tokyoBigSightNight,
    imagePosition: slide.imagePosition || 'center',
    tag: slide.tag?.trim() || '资料精选',
    link: slide.link?.trim() || '/',
    sourcePostId: slide.sourcePostId,
    enabled: Boolean(slide.enabled),
    updatedAt: new Date().toISOString(),
  }))
let users = readStorage(storageKeys.users, initialUsers)
let posts = readStorage(storageKeys.posts, initialPosts)
let comments = readStorage(storageKeys.comments, initialComments)
let reports = readStorage(storageKeys.reports, initialReports)
let homeCarousel = readStorage(storageKeys.homeCarousel, buildDefaultHomeCarousel())
let animeRecords = readStorage(storageKeys.animeRecords, initialAnimeRecords)
let draft = readStorage(storageKeys.draft, initialDraft)
let draftSnapshots = readStorage<DraftSnapshot[]>(storageKeys.draftSnapshots, [])

const persistUsers = () => writeStorage(storageKeys.users, users)
const persistPosts = () => writeStorage(storageKeys.posts, posts)
const persistComments = () => writeStorage(storageKeys.comments, comments)
const persistReports = () => writeStorage(storageKeys.reports, reports)
const persistHomeCarousel = () => writeStorage(storageKeys.homeCarousel, homeCarousel)
const persistAnimeRecords = () => writeStorage(storageKeys.animeRecords, animeRecords)
const persistDraft = () => writeStorage(storageKeys.draft, draft)
const persistDraftSnapshots = () => writeStorage(storageKeys.draftSnapshots, draftSnapshots)

const resetCoreSeedDataIfNeeded = () => {
  const hasSourceUsers = users.some((user) => user.id === 'u_editorial')
  const hasSourcePosts = posts.some((post) => post.id === 'p_comiket_guide')
  if (hasSourceUsers && hasSourcePosts && homeCarousel.length) return

  users = cloneData(initialUsers)
  posts = cloneData(initialPosts)
  comments = cloneData(initialComments)
  reports = cloneData(initialReports)
  homeCarousel = buildDefaultHomeCarousel(posts)
  animeRecords = cloneData(initialAnimeRecords)
  persistUsers()
  persistPosts()
  persistComments()
  persistReports()
  persistHomeCarousel()
  persistAnimeRecords()
}

resetCoreSeedDataIfNeeded()

const backupCollections = [
  'users',
  'posts',
  'comments',
  'animeRecords',
  'drafts',
  'draftSnapshots',
  'reports',
  'homeCarousel',
] as const

const backupCounts = (data: AdminBackupPayload['data']): AdminBackupCounts =>
  Object.fromEntries(backupCollections.map((key) => [key, Array.isArray(data[key]) ? data[key]?.length ?? 0 : 0]))

const parseBackupJson = <T>(value: unknown, fallback: T): T => {
  if (typeof value !== 'string') return (value ?? fallback) as T
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

const normalizeBackupDate = (value: unknown) =>
  value ? new Date(String(value)).toISOString() : new Date().toISOString()

const normalizeBackupUsers = (value: unknown): User[] =>
  (Array.isArray(value) ? value : []).map((user) => ({
    ...(user as User),
    favoriteCharacter: parseBackupJson((user as { favoriteCharacter?: unknown }).favoriteCharacter, {
      name: '未设置',
      anime: '公开资料整理',
      quote: '',
    }),
    stats: parseBackupJson((user as { stats?: unknown }).stats, { posts: 0, followers: 0, following: 0, likes: 0 }),
  }))

const normalizeBackupPosts = (value: unknown): Post[] =>
  (Array.isArray(value) ? value : []).map((post) => ({
    ...(post as Post),
    tags: parseBackupJson((post as { tags?: unknown }).tags, []),
    gallery: normalizeImageAssets(parseBackupJson((post as { gallery?: unknown }).gallery, []), (post as Post).title),
    createdAt: normalizeBackupDate((post as { createdAt?: unknown }).createdAt),
    reactions: {
      ...emptyReactions,
      ...parseBackupJson((post as { reactions?: unknown }).reactions, {}),
    },
  }))

const normalizeBackupDraft = (value: unknown): Draft => {
  const item = Array.isArray(value) ? value[0] : value
  if (!item || typeof item !== 'object') return initialDraft
  const draftLike = item as Draft
  return {
    title: draftLike.title ?? '',
    content: draftLike.content ?? '',
    tags: parseBackupJson((item as { tags?: unknown }).tags, ['公开资料整理']),
    images: normalizeImageAssets(parseBackupJson((item as { images?: unknown }).images, []), draftLike.title || '资料图片'),
    savedAt: (item as { savedAt?: string }).savedAt,
  }
}

const normalizeBackupDraftSnapshots = (value: unknown): DraftSnapshot[] =>
  (Array.isArray(value) ? value : []).map((snapshot) => {
    const item = snapshot as DraftSnapshot
    return {
      ...item,
      tags: parseBackupJson((snapshot as { tags?: unknown }).tags, []),
      images: normalizeImageAssets(parseBackupJson((snapshot as { images?: unknown }).images, []), item.title || '资料图片'),
      createdAt: normalizeBackupDate((snapshot as { createdAt?: unknown }).createdAt),
    }
  })

const carouselFromSiteSettings = (settings: unknown) => {
  const setting = Array.isArray(settings)
    ? settings.find((item) => (item as { key?: string }).key === 'home.carousel')
    : null
  return parseBackupJson((setting as { value?: unknown } | null)?.value, [])
}

const isMeaningfulDraft = (payload: Draft) =>
  Boolean(payload.title?.trim() || payload.content?.trim() || payload.images?.length)

const sameDraftSnapshot = (snapshot: DraftSnapshot | undefined, payload: Draft) =>
  Boolean(
    snapshot &&
      snapshot.title === payload.title &&
      snapshot.content === payload.content &&
      JSON.stringify(snapshot.tags) === JSON.stringify(payload.tags) &&
      JSON.stringify(normalizeImageAssets(snapshot.images, payload.title || '资料图片')) ===
        JSON.stringify(normalizeImageAssets(payload.images, payload.title || '资料图片')),
  )

const createDraftSnapshot = (payload: Draft) => {
  if (!isMeaningfulDraft(payload) || sameDraftSnapshot(draftSnapshots[0], payload)) return
  const images = normalizeImageAssets(payload.images, payload.title || '资料图片')
  const snapshot: DraftSnapshot = {
    id: `ds_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
    title: payload.title,
    content: payload.content,
    tags: [...payload.tags],
    images,
    savedAt: payload.savedAt,
    createdAt: new Date().toISOString(),
  }
  draftSnapshots = [snapshot, ...draftSnapshots].slice(0, 5)
  persistDraftSnapshots()
}

const createExcerpt = (content: string) => {
  const clean = content.replace(/\s+/g, ' ').trim()
  return clean.length > 72 ? `${clean.slice(0, 72)}...` : clean || '一篇刚刚诞生的公开资料笔记。'
}

const isPublicPost = (post: Post) => (post.status ?? 'published') === 'published'
const getPublicPosts = () => posts.filter(isPublicPost)

export const mockApi = {
  async getPosts() {
    await wait()
    return [...getPublicPosts()]
  },

  async getPostById(id: string) {
    await wait()
    return getPublicPosts().find((post) => post.id === id)
  },

  async getUsers() {
    await wait()
    return [...users]
  },

  async getHomeCarousel() {
    await wait()
    const slides = homeCarousel.length ? homeCarousel : buildDefaultHomeCarousel(posts)
    return slides.filter((slide) => slide.enabled)
  },

  async getAdminHomeCarousel() {
    await wait()
    if (!homeCarousel.length) {
      homeCarousel = buildDefaultHomeCarousel(posts)
      persistHomeCarousel()
    }
    return [...homeCarousel]
  },

  async updateAdminHomeCarousel(slides: HomeCarouselSlide[]) {
    await wait(120)
    homeCarousel = sanitizeHomeCarousel(slides)
    persistHomeCarousel()
    return [...homeCarousel]
  },

  async resetAdminHomeCarousel() {
    await wait(120)
    homeCarousel = buildDefaultHomeCarousel(posts)
    persistHomeCarousel()
    return [...homeCarousel]
  },

  async getUserById(id: string) {
    await wait()
    return users.find((user) => user.id === id)
  },

  async getComments(postId: string) {
    await wait()
    return comments.filter((comment) => comment.postId === postId)
  },

  async getAnimeRecords(userId: string) {
    await wait()
    return animeRecords.filter((record) => record.userId === userId)
  },

  async updateUserProfile(userId: string, payload: ProfileUpdatePayload) {
    await wait(140)
    users = users.map((user) => (user.id === userId ? { ...user, ...payload } : user))
    persistUsers()
    return users.find((user) => user.id === userId)
  },

  async toggleLike(postId: string) {
    await wait(80)
    posts = posts.map((post) => {
      if (post.id !== postId) return post
      const isLiked = !post.isLiked
      return { ...post, isLiked, likeCount: Math.max(0, post.likeCount + (isLiked ? 1 : -1)) }
    })
    persistPosts()
    return posts.find((post) => post.id === postId)
  },

  async toggleFavorite(postId: string) {
    await wait(80)
    posts = posts.map((post) => {
      if (post.id !== postId) return post
      const isFavorited = !post.isFavorited
      return { ...post, isFavorited, favoriteCount: Math.max(0, post.favoriteCount + (isFavorited ? 1 : -1)) }
    })
    persistPosts()
    return posts.find((post) => post.id === postId)
  },

  async toggleReaction(postId: string, reaction: PostReactionKey, selected: boolean) {
    await wait(70)
    posts = posts.map((post) => {
      if (post.id !== postId) return post
      const reactions = { ...emptyReactions, ...post.reactions }
      return {
        ...post,
        reactions: {
          ...reactions,
          [reaction]: Math.max(0, reactions[reaction] + (selected ? 1 : -1)),
        },
      }
    })
    persistPosts()
    return posts.find((post) => post.id === postId)
  },

  async toggleFollow(userId: string) {
    await wait(80)
    const user = users.find((item) => item.id === userId)
    if (user) {
      user.isFollowing = !user.isFollowing
      user.stats.followers = Math.max(0, user.stats.followers + (user.isFollowing ? 1 : -1))
    }
    persistUsers()
    return user
  },

  async addComment(postId: string, userId: string, content: string, parentId?: string) {
    await wait(100)
    const comment: Comment = {
      id: `c_${Date.now()}`,
      postId,
      userId,
      parentId,
      content,
      likeCount: 0,
      createdAt: new Date().toISOString(),
    }
    comments = [comment, ...comments]
    posts = posts.map((post) => (post.id === postId ? { ...post, commentCount: post.commentCount + 1 } : post))
    persistComments()
    persistPosts()
    return comment
  },

  async deleteComment(commentId: string) {
    await wait(80)
    const target = comments.find((comment) => comment.id === commentId)
    if (!target) return null
    const removedIds = new Set([commentId, ...comments.filter((comment) => comment.parentId === commentId).map((item) => item.id)])
    comments = comments.filter((comment) => !removedIds.has(comment.id))
    posts = posts.map((post) =>
      post.id === target.postId ? { ...post, commentCount: Math.max(0, post.commentCount - removedIds.size) } : post,
    )
    persistComments()
    persistPosts()
    return target.postId
  },

  async toggleCommentLike(commentId: string) {
    await wait(60)
    comments = comments.map((comment) =>
      comment.id === commentId ? { ...comment, likeCount: comment.likeCount + 1 } : comment,
    )
    persistComments()
    return comments.find((comment) => comment.id === commentId)
  },

  async reportPost(postId: string, reporterId: string, payload: { reason: string; detail?: string }) {
    await wait(90)
    const report: Report = {
      id: `r_${Date.now()}`,
      postId,
      reporterId,
      reason: payload.reason,
      detail: payload.detail,
      status: 'open',
      createdAt: new Date().toISOString(),
    }
    reports = [report, ...reports]
    persistReports()
    return report
  },

  async addAnimeRecord(userId: string, payload: AnimeRecordPayload) {
    await wait(140)
    const record: AnimeRecord = {
      id: `a_${Date.now()}`,
      userId,
      title: payload.title.trim(),
      coverUrl: payload.status === 'watched' ? mangaMuseumReading : digitalTablet,
      status: payload.status,
      rating: payload.rating,
      review: payload.review.trim(),
      updatedAt: new Date().toISOString(),
    }
    animeRecords = [record, ...animeRecords]
    persistAnimeRecords()
    return record
  },

  async updateAnimeStatus(recordId: string, status: AnimeRecord['status']) {
    await wait(90)
    animeRecords = animeRecords.map((record) =>
      record.id === recordId ? { ...record, status, updatedAt: new Date().toISOString() } : record,
    )
    persistAnimeRecords()
    return animeRecords.find((record) => record.id === recordId)
  },

  async publishPost(authorId: string, payload: NewPostPayload) {
    await wait(160)
    const images = normalizeImageAssets(payload.images, payload.title.trim() || '作品图片')
    const fallbackImage = imageAsset(tokyoBigSightNight, payload.title.trim() || '公开资料笔记封面')
    const firstImage = images[0] ?? fallbackImage
    const post: Post = {
      id: `p_${Date.now()}`,
      authorId,
      title: payload.title.trim(),
      excerpt: createExcerpt(payload.content),
      content: payload.content.trim(),
      coverUrl: firstImage.url,
      imagePosition: 'center',
      type: payload.type,
      tags: payload.tags.length ? payload.tags : ['公开资料整理'],
      series: payload.series?.trim() || undefined,
      gallery: images.length ? images : [fallbackImage],
      viewCount: 0,
      likeCount: 0,
      favoriteCount: 0,
      commentCount: 0,
      createdAt: new Date().toISOString(),
      status: 'published',
      isPinned: false,
      reactions: { ...emptyReactions },
    }
    posts = [post, ...posts]
    users = users.map((user) =>
      user.id === authorId ? { ...user, stats: { ...user.stats, posts: user.stats.posts + 1 } } : user,
    )
    draft = { ...initialDraft, savedAt: new Date().toISOString() }
    draftSnapshots = []
    persistPosts()
    persistUsers()
    persistDraft()
    persistDraftSnapshots()
    return post
  },

  async searchContent(query: string, type: 'all' | 'post' | 'user' | 'tag' = 'all'): Promise<SearchResult> {
    await wait()
    const keyword = query.trim().toLowerCase()
    const publicPosts = getPublicPosts()
    const allTags = Array.from(new Set(publicPosts.flatMap((post) => post.tags)))
    if (!keyword) return { posts: publicPosts, users, tags: allTags }

    const foundPosts =
      type === 'all' || type === 'post'
        ? publicPosts.filter((post) =>
            [post.title, post.excerpt, post.content, post.series ?? '', ...post.tags].some((text) => text.toLowerCase().includes(keyword)),
          )
        : []
    const foundUsers =
      type === 'all' || type === 'user'
        ? users.filter((user) =>
            [user.nickname, user.username, user.bio, user.creatorBadge ?? ''].some((text) => text.toLowerCase().includes(keyword)),
          )
        : []
    const foundTags = type === 'all' || type === 'tag' ? allTags.filter((tag) => tag.toLowerCase().includes(keyword)) : []

    return { posts: foundPosts, users: foundUsers, tags: foundTags }
  },

  async getDraft() {
    await wait(70)
    return { ...draft }
  },

  async getDraftSnapshots() {
    await wait(70)
    return [...draftSnapshots]
  },

  async saveDraft(payload: Draft) {
    await wait(100)
    draft = { ...payload, images: normalizeImageAssets(payload.images, payload.title || '资料图片'), savedAt: new Date().toISOString() }
    persistDraft()
    createDraftSnapshot(draft)
    return { ...draft }
  },

  async restoreDraftSnapshot(id: string) {
    await wait(100)
    const snapshot = draftSnapshots.find((item) => item.id === id)
    if (!snapshot) return { ...draft }
    draft = {
      title: snapshot.title,
      content: snapshot.content,
      tags: [...snapshot.tags],
      images: normalizeImageAssets(snapshot.images, snapshot.title || '资料图片'),
      savedAt: new Date().toISOString(),
    }
    persistDraft()
    return { ...draft }
  },

  async getAdminPosts() {
    await wait()
    return [...posts]
  },

  async getAdminReports() {
    await wait()
    return [...reports].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
  },

  async updateAdminUser(id: string, payload: { status?: User['status']; role?: User['role'] }) {
    await wait(90)
    users = users.map((user) => (user.id === id ? { ...user, ...payload } : user))
    persistUsers()
    return users.find((user) => user.id === id)
  },

  async updateAdminPost(id: string, payload: { isPinned?: boolean; status?: Post['status'] }) {
    await wait(90)
    posts = posts.map((post) => (post.id === id ? { ...post, ...payload } : post))
    persistPosts()
    return posts.find((post) => post.id === id)
  },

  async deleteAdminPost(id: string) {
    await wait(90)
    const existing = posts.find((post) => post.id === id)
    posts = posts.filter((post) => post.id !== id)
    comments = comments.filter((comment) => comment.postId !== id)
    if (existing) {
      users = users.map((user) =>
        user.id === existing.authorId
          ? {
              ...user,
              stats: {
                ...user.stats,
                posts: Math.max(0, user.stats.posts - 1),
                likes: Math.max(0, user.stats.likes - existing.likeCount),
              },
            }
          : user,
      )
    }
    persistPosts()
    persistComments()
    persistUsers()
    return true
  },

  async updateAdminReport(id: string, payload: { status: Report['status']; hidePost?: boolean }) {
    await wait(90)
    const current = reports.find((report) => report.id === id)
    if (!current) return undefined
    reports = reports.map((report) => (report.id === id ? { ...report, status: payload.status } : report))
    if (payload.hidePost) {
      posts = posts.map((post) => (post.id === current.postId ? { ...post, status: 'hidden' } : post))
      persistPosts()
    }
    persistReports()
    return reports.find((report) => report.id === id)
  },

  async exportAdminBackup(): Promise<AdminBackupPayload> {
    await wait(120)
    const data: AdminBackupPayload['data'] = {
      users,
      posts,
      comments,
      animeRecords,
      reports,
      homeCarousel,
      drafts: [
        {
          id: `draft_${users[0]?.id ?? 'mock'}`,
          userId: users[0]?.id ?? 'u_editorial',
          ...draft,
        },
      ],
      draftSnapshots,
    }
    return {
      version: 'stardream-backup-v1',
      exportedAt: new Date().toISOString(),
      source: 'mock',
      counts: backupCounts(data),
      data,
    }
  },

  async importAdminBackup(backup: AdminBackupPayload): Promise<AdminBackupImportResult> {
    await wait(180)
    const data = backup?.data ?? {}
    const nextUsers = normalizeBackupUsers(data.users)
    if (!nextUsers.length || !nextUsers.some((user) => user.role === 'admin')) {
      throw new Error('备份文件需要至少包含一个管理员账号')
    }

    users = nextUsers
    posts = normalizeBackupPosts(data.posts)
    comments = (Array.isArray(data.comments) ? data.comments : []) as Comment[]
    animeRecords = (Array.isArray(data.animeRecords) ? data.animeRecords : []) as AnimeRecord[]
    reports = (Array.isArray(data.reports) ? data.reports : []) as Report[]
    draft = normalizeBackupDraft(data.drafts)
    draftSnapshots = normalizeBackupDraftSnapshots(data.draftSnapshots)
    homeCarousel = sanitizeHomeCarousel(
      Array.isArray(data.homeCarousel) ? (data.homeCarousel as HomeCarouselSlide[]) : carouselFromSiteSettings(data.siteSettings),
    )

    persistUsers()
    persistPosts()
    persistComments()
    persistReports()
    persistAnimeRecords()
    persistHomeCarousel()
    persistDraft()
    persistDraftSnapshots()

    const importedData: AdminBackupPayload['data'] = {
      users,
      posts,
      comments,
      animeRecords,
      reports,
      homeCarousel,
      drafts: [draft],
      draftSnapshots,
    }
    return {
      ok: true,
      importedAt: new Date().toISOString(),
      counts: backupCounts(importedData),
    }
  },
}
