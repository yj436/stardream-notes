import tokyoBigSightNight from '@/assets/images/content-tokyo-big-sight-night.jpg'
import digitalTablet from '@/assets/images/content-digital-tablet.jpg'
import mangaMuseumMain from '@/assets/images/content-manga-museum-main.jpg'
import mangaArtistTools from '@/assets/images/content-manga-artist-tools.jpg'
import comiketCosplay from '@/assets/images/content-comiket-cosplay.jpg'
import comiketCosplayers from '@/assets/images/content-comiket-cosplayers.jpg'
import gameController from '@/assets/images/content-game-controller.jpg'
import kareRaisu from '@/assets/images/content-kare-raisu.jpg'
import mangaMuseumReading from '@/assets/images/content-manga-museum-reading.jpg'
import animeNightCity from '@/assets/images/wallpaper-anime-night-sakura-city.jpg'
import animeForestPath from '@/assets/images/wallpaper-anime-forest-path.jpg'
import animeSummerGarden from '@/assets/images/wallpaper-anime-summer-garden.jpg'
import animeCountrysideField from '@/assets/images/wallpaper-anime-countryside-field.jpg'
import { normalizeImageAssets } from '@/utils/image'
import type {
  AdminBackupCounts,
  AdminBackupImportResult,
  AdminBackupPayload,
  AnimeTimelineDay,
  AnimeTimelinePayload,
  AnimeTimelineQuery,
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
  hero: animeNightCity,
  creators: digitalTablet,
  starryDesk: animeForestPath,
  sakuraWatercolor: animeSummerGarden,
  moonlightCos: comiketCosplay,
  cosplayStage: comiketCosplayers,
  gameController,
  healingAnime: animeNightCity,
  novelKitchen: animeCountrysideField,
  galaxySchool: animeForestPath,
  animeNightCity,
  animeForestPath,
  animeSummerGarden,
  animeCountrysideField,
  tokyoBigSightNight,
  mangaMuseumMain,
  mangaArtistTools,
  mangaMuseumReading,
  kareRaisu,
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

const dataVersion = 'anime-wallpaper-refresh-2026-06-25'
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
  tokyoGameShow2026: 'https://tgs.cesa.or.jp/en/',
  tokyoGameShowTrade: 'https://www.trade.gov/japan-trade-events',
  commonsSearch: 'https://search.creativecommons.org/',
}

const initialUsers: User[] = [
  {
    id: 'u_editorial',
    username: 'stardream-desk',
    email: 'admin@stardream.local',
    nickname: '星梦编辑台',
    avatarUrl: digitalTablet,
    avatarPosition: 'center',
    coverUrl: animeNightCity,
    bio: '维护番剧、COS、游戏和图廊四个主板块，负责来源、版权标注和首页轮播。',
    level: 18,
    creatorBadge: '站点主理',
    favoriteCharacter: {
      name: '星梦笔记',
      anime: 'ACGN 图廊运营',
      quote: '可以有番剧味、同人味和玩家味，也要把来源与权利归属写清楚。',
    },
    stats: { posts: 2, followers: 0, following: 0, likes: 0 },
    role: 'admin',
    status: 'active',
    theme: 'sakura',
  },
  {
    id: 'u_anime',
    username: 'anime-room',
    email: 'anime@stardream.local',
    nickname: '番剧放映室',
    avatarUrl: animeNightCity,
    avatarPosition: 'center',
    coverUrl: animeSummerGarden,
    bio: '整理 AnimeJapan、新番入口、正版阅读平台和动画制作相关资料。',
    level: 15,
    creatorBadge: '番剧板块',
    favoriteCharacter: {
      name: 'AnimeJapan',
      anime: '番剧前哨站',
      quote: '新番情报先看官方入口，再写成读者能快速浏览的番剧卡。',
    },
    stats: { posts: 2, followers: 0, following: 0, likes: 0 },
    role: 'creator',
    status: 'active',
    theme: 'starlight',
  },
  {
    id: 'u_cos',
    username: 'cos-gallery',
    email: 'cos@stardream.local',
    nickname: 'COS 影廊记录',
    avatarUrl: comiketCosplayers,
    avatarPosition: 'center',
    coverUrl: comiketCosplay,
    bio: '收集 Comiket、Cosplay 活动照片与拍摄礼仪资料，让图廊有现场感。',
    level: 14,
    creatorBadge: 'COS 图廊',
    favoriteCharacter: {
      name: 'Comiket',
      anime: '同人现场',
      quote: '一张好图不只是角色服装，也包括场地、队列、授权和拍摄边界。',
    },
    stats: { posts: 1, followers: 0, following: 0, likes: 0 },
    role: 'creator',
    status: 'active',
    theme: 'mint',
  },
  {
    id: 'u_game',
    username: 'game-archive',
    email: 'game@stardream.local',
    nickname: '游戏档案部',
    avatarUrl: gameController,
    avatarPosition: 'center',
    coverUrl: gameController,
    bio: '整理 Tokyo Game Show、主机硬件、试玩动线和玩家文化资料。',
    level: 13,
    creatorBadge: '游戏板块',
    favoriteCharacter: {
      name: 'Tokyo Game Show',
      anime: '玩家现场',
      quote: '游戏板块要能看到展会、硬件、试玩和玩家动线。',
    },
    stats: { posts: 1, followers: 0, following: 0, likes: 0 },
    role: 'creator',
    status: 'active',
    theme: 'starlight',
  },
]

const initialPosts: Post[] = [
  {
    id: 'p_animejapan_2026',
    authorId: 'u_anime',
    title: '2026 春季番剧前哨：AnimeJapan 公共日与 AJ Stage 看点整理',
    excerpt: '把 AnimeJapan 2026 官方 About 信息整理成番剧板块入口：公共日、商务日、舞台、展位和官方周边都能在这里串起来。',
    content: `番剧板块不应该只是一串虚构评分，它需要能回到官方活动和正版入口。AnimeJapan 适合作为“新番情报前哨”，因为它把动画产业展示、舞台活动、商品和商务交流放在同一个场景里。

## 可整理的信息
- AnimeJapan 2026 官方 About 页面显示，公共日场馆为 Tokyo Big Sight，日期为 2026 年 3 月 28 日至 3 月 29 日。
- 商务日同样在 Tokyo Big Sight，日期为 2026 年 3 月 30 日至 3 月 31 日。
- 页面列出的内容包括 Exhibit booths、AJ Stage、Organized events、Official merchandise，以及商务日的 seminar、business concierge 等。

## 站内呈现方式
首页把这篇作为“番剧前哨”主推，不搬运商业海报和截图；首屏使用原创二次元夜樱城市壁纸，资料图廊继续保留场馆、创作工具和正版入口相关图片，并在正文标出来源。后续如果加入某部番剧海报，应把图片来源、权利归属、是否官方允许传播写在图注或来源文档里。

## 资料来源
- AnimeJapan 2026 About：${sourceLinks.animeJapan}
- 场馆图片：Wikimedia Commons / Masato Ohta / CC BY 2.0
- 首屏壁纸：项目本地生成原创壁纸，见 docs/content-sources.md`,
    coverUrl: animeNightCity,
    imagePosition: 'center',
    isPinned: true,
    type: 'record',
    tags: ['番剧', 'AnimeJapan', '新番情报'],
    series: '番剧放映室',
    gallery: [
      imageAsset(animeNightCity, '原创二次元夜樱城市壁纸，项目本地生成'),
      imageAsset(tokyoBigSightNight, '东京 Big Sight 夜景，Masato Ohta 摄，CC BY 2.0'),
      imageAsset(digitalTablet, '数位板绘制场景，Piknuz 摄，CC BY-SA 4.0'),
    ],
    viewCount: 0,
    likeCount: 0,
    favoriteCount: 0,
    commentCount: 0,
    createdAt: '2026-06-23T09:10:00+08:00',
    reactions: { ...emptyReactions },
  },
  {
    id: 'p_comiket_cos_gallery',
    authorId: 'u_cos',
    title: 'Comiket COS 图廊：从角色扮演区看同人现场氛围',
    excerpt: '使用 Comiket 69 与 Comiket 84 的可追溯照片，把 COS 板块做成角色、场地、队列和拍摄礼仪并重的图廊。',
    content: `COS 图廊要有“现场感”，但不能只堆角色照片。Comiket 的照片很适合作为基础素材：它既能看到角色扮演，也能看到同人活动的空间、队列和社群氛围。

## 可整理的信息
- Comic Market 也常被称作 Comiket，官方英文站和海外参与者说明页提供活动入口。
- 站内使用的 Comiket 69 群像照片来自 Flickr，经 Wikimedia Commons 确认授权为 CC BY-SA 2.0。
- 站内使用的 Comiket 84 Cosplay 区域照片来自 Wikimedia Commons，授权为 CC BY 2.0。

## 图廊呈现方式
图廊按“COS”“Comiket”“同人现场”标签聚合，读者进入图库时会先看到角色扮演和活动现场，而不是抽象素材库。涉及真人照片时，站内保留作者、授权和来源提醒；后续若上传个人拍摄作品，后台文章也应记录拍摄许可和被摄者授权。

## 资料来源
- Comic Market 官方英文站：${sourceLinks.comiket}
- Comic Market 海外参与者说明：${sourceLinks.comiketOverseas}
- 图片来源：Wikimedia Commons / stormstill / CC BY-SA 2.0；Guilhem Vellut / CC BY 2.0`,
    coverUrl: comiketCosplayers,
    imagePosition: 'center',
    isPinned: true,
    type: 'gallery',
    tags: ['COS', 'Comiket', '同人现场'],
    series: 'COS 影廊',
    gallery: [
      imageAsset(comiketCosplayers, 'Comiket 69 COS 群像，stormstill 摄，CC BY-SA 2.0'),
      imageAsset(comiketCosplay, 'Comiket 84 Cosplay 区域，Guilhem Vellut 摄，CC BY 2.0'),
      imageAsset(animeNightCity, '原创二次元夜樱城市壁纸，项目本地生成'),
    ],
    viewCount: 0,
    likeCount: 0,
    favoriteCount: 0,
    commentCount: 0,
    createdAt: '2026-06-23T10:00:00+08:00',
    reactions: { ...emptyReactions },
  },
  {
    id: 'p_tokyo_game_show_2026',
    authorId: 'u_game',
    title: 'Tokyo Game Show 2026：游戏板块的展会日程与试玩动线',
    excerpt: '根据 U.S. Commercial Service Japan 活动列表与 TGS 官方入口整理 2026 年 9 月 17 日至 21 日会期、场馆和玩家体验方向。',
    content: `游戏板块需要有“玩家现场”的感觉：展会、硬件、试玩、周边、独立游戏和电竞都可以成为文章入口。Tokyo Game Show 2026 是一个合适的主线。

## 可整理的信息
- U.S. Commercial Service Japan 的贸易活动列表列出 Tokyo Game Show 2026，日期为 2026 年 9 月 17 日至 9 月 21 日，地点为 Makuhari Messe, Chiba。
- TGS 官方入口仍可作为活动官网入口；具体购票、展区与公众日安排应以官网后续更新为准。
- 参照 TGS 官方站当前展区结构，游戏板块可以覆盖 General Exhibition、Smartphone Game、Gaming Hardware、VR/AR、eSports、Indie Game、Merchandise Sales 等方向。

## 站内呈现方式
这篇文章作为“游戏档案部”的入口，封面使用可追溯的游戏手柄照片，不直接打包商业游戏截图。后续如果要加入具体游戏截图，可以在图注里标出发行商、官网来源、用途和权利归属。

## 资料来源
- Tokyo Game Show 2026 官方网站：${sourceLinks.tokyoGameShow2026}
- U.S. Commercial Service Japan 活动列表：${sourceLinks.tokyoGameShowTrade}
- 图片来源：Wikimedia Commons / Evan-Amos / CC BY-SA 3.0`,
    coverUrl: gameController,
    imagePosition: 'center',
    isPinned: true,
    type: 'record',
    tags: ['游戏', 'Tokyo Game Show', '玩家文化'],
    series: '游戏档案部',
    gallery: [
      imageAsset(gameController, 'Panasonic Q 游戏手柄，Evan-Amos 摄，CC BY-SA 3.0'),
      imageAsset(digitalTablet, '数位创作设备，Piknuz 摄，CC BY-SA 4.0'),
    ],
    viewCount: 0,
    likeCount: 0,
    favoriteCount: 0,
    commentCount: 0,
    createdAt: '2026-06-23T10:50:00+08:00',
    reactions: { ...emptyReactions },
  },
  {
    id: 'p_manga_plus',
    authorId: 'u_anime',
    title: '漫画补番入口：MANGA Plus 与正版阅读平台怎么放进站内',
    excerpt: 'MANGA Plus by SHUEISHA 是集英社官方漫画阅读服务，适合作为番剧与漫画板块的正版补全入口。',
    content: `番剧站常常会延伸到漫画原作、外传和补充阅读。这里不搬运漫画页，而是把正版入口写清楚，让读者知道可以从哪里继续看。

## 可整理的信息
- MANGA Plus by SHUEISHA 的应用商店页面称它是 Shueisha 的官方漫画阅读服务。
- 公开页面介绍其最新章节可与日本同步阅读；免费章节范围会随服务规则调整，读者应以官方应用和网页为准。
- 作为站内入口，它适合放在“番剧补完”“漫画原作”“正版阅读”标签下。

## 站内使用原则
文章正文使用原创整理，不上传漫画分镜、彩页或商业封面。需要展示作品封面时，优先使用官方可嵌入资源或只提供来源链接，并明确版权归属。

## 资料来源
- MANGA Plus 更新入口：${sourceLinks.mangaPlus}
- App Store 介绍页：${sourceLinks.mangaPlusApp}
- 图片来源：Wikimedia Commons / Piknuz / CC BY-SA 4.0`,
    coverUrl: digitalTablet,
    imagePosition: 'center',
    isPinned: false,
    type: 'article',
    tags: ['番剧补完', 'MANGA Plus', '正版阅读'],
    series: '番剧放映室',
    gallery: [imageAsset(digitalTablet, '数位板绘制场景，Piknuz 摄，CC BY-SA 4.0')],
    viewCount: 0,
    likeCount: 0,
    favoriteCount: 0,
    commentCount: 0,
    createdAt: '2026-06-23T11:30:00+08:00',
    reactions: { ...emptyReactions },
  },
  {
    id: 'p_gallery_copyright_note',
    authorId: 'u_editorial',
    title: '图廊运营规则：番剧海报、COS 照片、游戏截图怎么标注版权',
    excerpt: '站点可以收录更有二次元味道的图片，但每张图都要区分 CC 授权、官方素材、用户投稿和仅可链接来源。',
    content: `你说可以使用有版权的内容，只要标注好。实际落地时，我们把它做成一套图廊规则：可以更有二次元味道，但不能让后续维护失控。

## 四类图片
- CC / 公有领域：可以打包进仓库，但要标注作者、协议、来源链接。
- 官方素材：可以在文章里标注版权归属和官方来源，是否下载入库要看官网条款。
- 用户投稿：需要保留拍摄者、授权范围、被摄者许可，尤其是 COS 真人照片。
- 商业海报 / 游戏截图：默认先用外链、来源说明或文章引用，不直接批量打包原图。

## 后台字段建议
后续可以在文章或图片资源里增加“版权类型”“来源 URL”“权利方”“是否允许商用”“是否允许二次编辑”字段。这样图廊既能放番剧、COS、游戏内容，也能在后台管理里一眼看出风险等级。

## 资料来源
- Creative Commons Search：${sourceLinks.commonsSearch}
- Wikimedia Commons 文件页见 docs/content-sources.md`,
    coverUrl: mangaArtistTools,
    imagePosition: 'center',
    isPinned: false,
    type: 'article',
    tags: ['图廊', '版权标注', '后台管理'],
    series: '图廊治理',
    gallery: [
      imageAsset(mangaArtistTools, '漫画工具展示，Maplestrip 摄，CC BY 3.0'),
      imageAsset(gameController, 'Panasonic Q 游戏手柄，Evan-Amos 摄，CC BY-SA 3.0'),
      imageAsset(comiketCosplayers, 'Comiket 69 COS 群像，stormstill 摄，CC BY-SA 2.0'),
    ],
    viewCount: 0,
    likeCount: 0,
    favoriteCount: 0,
    commentCount: 0,
    createdAt: '2026-06-23T12:05:00+08:00',
    reactions: { ...emptyReactions },
  },
  {
    id: 'p_kare_popculture',
    authorId: 'u_editorial',
    title: '日常番场景资料：咖喱饭、放学后与生活感镜头',
    excerpt: '用一张 CC0 日式咖喱饭照片做日常番场景参考，让图库不只服务展会，也能服务轻小说和动画生活镜头。',
    content: `番剧和轻小说里常见的生活感，不一定来自大事件。食物、桌面、社团活动和放学后的街景，都能成为图廊里的“日常番资料”。

## 可整理的信息
- 站内使用的咖喱饭照片来自 Wikimedia Commons，文件说明为家庭制作的日式咖喱饭。
- 该图片使用 CC0 公共领域贡献，适合作为“日常场景资料”配图。
- 这类素材能替代虚构厨房图，让创作者在写饮食、便当、深夜餐桌时有真实参考。

## 写作提示
把“咖喱饭”写进场景时，可以关注气味、锅具、等待时间、共同分食和剩菜再加热，而不是只写菜名。真实照片提供的是质感，不是剧情本身。

## 资料来源
- Wikimedia Commons：Kare-Raisu.jpg
- 图片作者 Ocdp，CC0 1.0`,
    coverUrl: animeCountrysideField,
    imagePosition: 'center',
    isPinned: false,
    type: 'article',
    tags: ['日常番', '场景资料', '轻小说'],
    series: '番剧生活感资料',
    gallery: [
      imageAsset(animeCountrysideField, '原创二次元田园晴空壁纸，项目本地生成'),
      imageAsset(kareRaisu, '家庭制作的日式咖喱饭，Ocdp 摄，CC0 1.0'),
    ],
    viewCount: 0,
    likeCount: 0,
    favoriteCount: 0,
    commentCount: 0,
    createdAt: '2026-06-23T12:35:00+08:00',
    reactions: { ...emptyReactions },
  },
]

const initialComments: Comment[] = []
const initialAnimeRecords: AnimeRecord[] = []
const initialReports: Report[] = []

const initialTimelineDays: AnimeTimelineDay[] = [
  {
    date: '6-23',
    dateTimestamp: 1782144000,
    dayOfWeek: 2,
    isToday: true,
    episodes: [
      {
        id: 'guochuang_3065327',
        kind: 'guochuang',
        title: '盗妖行',
        pubIndex: '第38话',
        pubTime: '09:00',
        pubTimestamp: 1782176400,
        published: true,
        isDelayed: false,
        seasonId: 148433,
        episodeId: 3065327,
        coverUrl: 'https://i0.hdslb.com/bfs/bangumi/image/526229b935e3ef9274136ba257f783d6a13ba7b4.jpg',
        squareCoverUrl: 'https://i0.hdslb.com/bfs/bangumi/image/44e0343ce31c26b4f05ccc94de9a6c1853f4c970.jpg',
        sourceUrl: 'https://www.bilibili.com/bangumi/play/ss148433',
      },
      {
        id: 'guochuang_3648904',
        kind: 'guochuang',
        title: '非人哉 第三季',
        pubIndex: '第21话',
        pubTime: '12:00',
        pubTimestamp: 1782187200,
        published: true,
        isDelayed: false,
        seasonId: 101854,
        episodeId: 3648904,
        coverUrl: 'https://i0.hdslb.com/bfs/bangumi/image/e47db61c92e8e9cb8add1c99bc1bb676492570a6.png',
        squareCoverUrl: 'https://i0.hdslb.com/bfs/bangumi/image/e87f9ed620951578ad3b4df499d2cf942cb8756f.png',
        sourceUrl: 'https://www.bilibili.com/bangumi/play/ss101854',
      },
    ],
  },
  {
    date: '6-27',
    dateTimestamp: 1782489600,
    dayOfWeek: 6,
    isToday: false,
    episodes: [
      {
        id: 'guochuang_3854804',
        kind: 'guochuang',
        title: '凡人修仙传',
        pubIndex: '第180话',
        pubTime: '11:00',
        pubTimestamp: 1782529200,
        published: false,
        isDelayed: false,
        seasonId: 28747,
        episodeId: 3854804,
        coverUrl: 'https://i0.hdslb.com/bfs/bangumi/image/19a2d01429bcba6b31791277c016e0d1aa465974.png',
        squareCoverUrl: 'https://i0.hdslb.com/bfs/bangumi/image/e498647cae38ac05efb4f1119b36e8e911b22b34.png',
        sourceUrl: 'https://www.bilibili.com/bangumi/play/ss28747',
      },
      {
        id: 'anime_4391800',
        kind: 'anime',
        title: '名侦探柯南',
        pubIndex: '第1264话',
        pubTime: '19:30',
        pubTimestamp: 1781955000,
        published: true,
        isDelayed: false,
        seasonId: 33378,
        episodeId: 4391800,
        coverUrl: 'https://i0.hdslb.com/bfs/bangumi/image/38e2a273f528fd01c34f1fc4df0f69c64487efad.png',
        squareCoverUrl: 'https://i0.hdslb.com/bfs/bangumi/image/a8d4dad96d5eef87c1ef985c29f42d4189992f84.png',
        sourceUrl: 'https://www.bilibili.com/bangumi/play/ss33378',
      },
    ],
  },
  {
    date: '6-28',
    dateTimestamp: 1782576000,
    dayOfWeek: 7,
    isToday: false,
    episodes: [
      {
        id: 'anime_3781141',
        kind: 'anime',
        title: '假面骑士ZZZ',
        pubIndex: '第41话',
        pubTime: '10:00',
        pubTimestamp: 1782612000,
        published: false,
        isDelayed: false,
        seasonId: 109700,
        episodeId: 3781141,
        coverUrl: 'https://i0.hdslb.com/bfs/bangumi/image/88406f07db1dad1f2663b93f6035eeb222bde0b5.jpg',
        squareCoverUrl: 'https://i0.hdslb.com/bfs/bangumi/image/b650f40fb0eeb3dc6e51f41798ac78ae2b05c3c1.png',
        sourceUrl: 'https://www.bilibili.com/bangumi/play/ss109700',
      },
      {
        id: 'guochuang_3537935',
        kind: 'guochuang',
        title: '牧神记',
        pubIndex: '第89话',
        pubTime: '11:00',
        pubTimestamp: 1782615600,
        published: false,
        isDelayed: false,
        seasonId: 45969,
        episodeId: 3537935,
        coverUrl: 'https://i0.hdslb.com/bfs/bangumi/image/1a321192dd267265573b6f198d025d2da9e75ae1.png',
        squareCoverUrl: 'https://i0.hdslb.com/bfs/bangumi/image/eb6054ae7d37283a484019152197c69b2950da2e.png',
        sourceUrl: 'https://www.bilibili.com/bangumi/play/ss45969',
      },
    ],
  },
]

const initialDraft: Draft = {
  title: '',
  content: '',
  tags: ['番剧', 'COS', '游戏'],
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
    tag: post.tags[0] ?? ['番剧前哨', 'COS图廊', '游戏现场', '正版入口', '图廊治理'][index] ?? '精选',
    link: `/post/${post.id}`,
    sourcePostId: post.id,
    enabled: true,
    updatedAt: new Date().toISOString(),
  }))
}

const sanitizeHomeCarousel = (slides: HomeCarouselSlide[]) =>
  slides.slice(0, 8).map((slide, index) => ({
    id: slide.id || `hero_custom_${Date.now()}_${index}`,
    title: slide.title?.trim() || '星梦图廊主视觉',
    excerpt: slide.excerpt?.trim() || '收录番剧、COS、游戏和图廊资料，保留来源与版权说明。',
    imageUrl: slide.imageUrl || tokyoBigSightNight,
    imagePosition: slide.imagePosition || 'center',
    tag: slide.tag?.trim() || 'ACGN精选',
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
  const hasSourceUsers = users.some((user) => user.id === 'u_anime')
  const hasSourcePosts = posts.some((post) => post.id === 'p_tokyo_game_show_2026')
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
      anime: '番剧 / COS / 游戏资料',
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
    tags: parseBackupJson((item as { tags?: unknown }).tags, ['番剧', 'COS', '游戏']),
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
  return clean.length > 72 ? `${clean.slice(0, 72)}...` : clean || '一篇刚刚诞生的 ACGN 笔记。'
}

const isPublicPost = (post: Post) => (post.status ?? 'published') === 'published'
const getPublicPosts = () => posts.filter(isPublicPost)
const filterTimelineDays = (days: AnimeTimelineDay[], category: AnimeTimelineQuery['category'] = 'all') =>
  days
    .map((day) => ({
      ...day,
      episodes: day.episodes.filter((episode) => category === 'all' || !category || episode.kind === category),
    }))
    .filter((day) => day.episodes.length || day.isToday)

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

  async getAnimeTimeline(query: AnimeTimelineQuery = {}): Promise<AnimeTimelinePayload> {
    await wait(120)
    return {
      source: 'mock',
      fetchedAt: new Date().toISOString(),
      sources: [
        {
          id: 'mock',
          label: '本地兜底样例',
          status: 'fallback',
          count: filterTimelineDays(cloneData(initialTimelineDays), query.category).reduce((sum, day) => sum + day.episodes.length, 0),
          url: '',
          message: '静态站或远端接口不可用时展示。',
        },
      ],
      days: filterTimelineDays(cloneData(initialTimelineDays), query.category),
    }
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
    const fallbackImage = imageAsset(tokyoBigSightNight, payload.title.trim() || 'ACGN 笔记封面')
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
      tags: payload.tags.length ? payload.tags : ['番剧', 'COS', '游戏'],
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
