import prismaPkg from '@prisma/client'
import crypto from 'node:crypto'

const { PrismaClient } = prismaPkg
const prisma = new PrismaClient()

const asset = {
  hero: 'asset:hero',
  creators: 'asset:creators',
  starryDesk: 'asset:starryDesk',
  sakuraWatercolor: 'asset:sakuraWatercolor',
  moonlightCos: 'asset:moonlightCos',
  cosplayStage: 'asset:cosplayStage',
  gameController: 'asset:gameController',
  healingAnime: 'asset:healingAnime',
  novelKitchen: 'asset:novelKitchen',
  galaxySchool: 'asset:galaxySchool',
}

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

const json = (value) => JSON.stringify(value)
const image = (url, alt) => ({ url, alt })
const readJson = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}
const hashPassword = (password) => {
  const salt = 'stardream-seed'
  return `${salt}:${crypto.createHash('sha256').update(`${salt}:${password}`).digest('hex')}`
}

const emptyReactions = { heart: 0, laugh: 0, cry: 0, fire: 0 }

const users = [
  {
    id: 'u_editorial',
    username: 'stardream-desk',
    email: 'admin@stardream.local',
    passwordHash: hashPassword('admin123'),
    nickname: '星梦编辑台',
    avatarUrl: asset.creators,
    avatarPosition: 'center',
    coverUrl: asset.hero,
    bio: '维护番剧、COS、游戏和图廊四个主板块，负责来源、版权标注和首页轮播。',
    level: 18,
    creatorBadge: '站点主理',
    favoriteCharacter: json({
      name: '星梦笔记',
      anime: 'ACGN 图廊运营',
      quote: '可以有番剧味、同人味和玩家味，也要把来源与权利归属写清楚。',
    }),
    stats: json({ posts: 2, followers: 0, following: 0, likes: 0 }),
    role: 'admin',
    status: 'active',
    isFollowing: false,
    theme: 'sakura',
  },
  {
    id: 'u_anime',
    username: 'anime-room',
    email: 'anime@stardream.local',
    passwordHash: hashPassword('anime123'),
    nickname: '番剧放映室',
    avatarUrl: asset.healingAnime,
    avatarPosition: 'center',
    coverUrl: asset.galaxySchool,
    bio: '整理 AnimeJapan、新番入口、正版阅读平台和动画制作相关资料。',
    level: 15,
    creatorBadge: '番剧板块',
    favoriteCharacter: json({
      name: 'AnimeJapan',
      anime: '番剧前哨站',
      quote: '新番情报先看官方入口，再写成读者能快速浏览的番剧卡。',
    }),
    stats: json({ posts: 2, followers: 0, following: 0, likes: 0 }),
    role: 'creator',
    status: 'active',
    isFollowing: false,
    theme: 'starlight',
  },
  {
    id: 'u_cos',
    username: 'cos-gallery',
    email: 'cos@stardream.local',
    passwordHash: hashPassword('cos123'),
    nickname: 'COS 影廊记录',
    avatarUrl: asset.cosplayStage,
    avatarPosition: 'center',
    coverUrl: asset.moonlightCos,
    bio: '收集 Comiket、Cosplay 活动照片与拍摄礼仪资料，让图廊有现场感。',
    level: 14,
    creatorBadge: 'COS 图廊',
    favoriteCharacter: json({
      name: 'Comiket',
      anime: '同人现场',
      quote: '一张好图不只是角色服装，也包括场地、队列、授权和拍摄边界。',
    }),
    stats: json({ posts: 1, followers: 0, following: 0, likes: 0 }),
    role: 'creator',
    status: 'active',
    isFollowing: false,
    theme: 'mint',
  },
  {
    id: 'u_game',
    username: 'game-archive',
    email: 'game@stardream.local',
    passwordHash: hashPassword('game123'),
    nickname: '游戏档案部',
    avatarUrl: asset.gameController,
    avatarPosition: 'center',
    coverUrl: asset.gameController,
    bio: '整理 Tokyo Game Show、主机硬件、试玩动线和玩家文化资料。',
    level: 13,
    creatorBadge: '游戏板块',
    favoriteCharacter: json({
      name: 'Tokyo Game Show',
      anime: '玩家现场',
      quote: '游戏板块要能看到展会、硬件、试玩和玩家动线。',
    }),
    stats: json({ posts: 1, followers: 0, following: 0, likes: 0 }),
    role: 'creator',
    status: 'active',
    isFollowing: false,
    theme: 'starlight',
  },
]

const posts = [
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

首页把这篇作为“番剧前哨”主推，不搬运商业海报和截图；图廊使用场馆、创作工具和正版入口相关图片，并在正文标出来源。后续如果加入某部番剧海报，应把图片来源、权利归属、是否官方允许传播写在图注或来源文档里。

## 资料来源

- [AnimeJapan 2026 About](${sourceLinks.animeJapan})
- 图片来源：Wikimedia Commons / Masato Ohta / CC BY 2.0`,
    coverUrl: asset.healingAnime,
    imagePosition: 'center',
    type: 'record',
    tags: json(['番剧', 'AnimeJapan', '新番情报']),
    series: '番剧放映室',
    gallery: json([
      image(asset.healingAnime, '东京 Big Sight 夜景，Masato Ohta 摄，CC BY 2.0'),
      image(asset.creators, '数位板绘制场景，Piknuz 摄，CC BY-SA 4.0'),
    ]),
    viewCount: 0,
    likeCount: 0,
    favoriteCount: 0,
    commentCount: 0,
    createdAt: new Date('2026-06-23T09:10:00+08:00'),
    isPinned: true,
    reactions: json(emptyReactions),
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

- [Comic Market 官方英文站](${sourceLinks.comiket})
- [Comic Market 海外参与者说明](${sourceLinks.comiketOverseas})
- 图片来源：Wikimedia Commons / stormstill / CC BY-SA 2.0；Guilhem Vellut / CC BY 2.0`,
    coverUrl: asset.cosplayStage,
    imagePosition: 'center',
    type: 'gallery',
    tags: json(['COS', 'Comiket', '同人现场']),
    series: 'COS 影廊',
    gallery: json([
      image(asset.cosplayStage, 'Comiket 69 COS 群像，stormstill 摄，CC BY-SA 2.0'),
      image(asset.moonlightCos, 'Comiket 84 Cosplay 区域，Guilhem Vellut 摄，CC BY 2.0'),
      image(asset.healingAnime, '东京 Big Sight 夜景，Masato Ohta 摄，CC BY 2.0'),
    ]),
    viewCount: 0,
    likeCount: 0,
    favoriteCount: 0,
    commentCount: 0,
    createdAt: new Date('2026-06-23T10:00:00+08:00'),
    isPinned: true,
    reactions: json(emptyReactions),
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

- [Tokyo Game Show 2026 官方网站](${sourceLinks.tokyoGameShow2026})
- [U.S. Commercial Service Japan 活动列表](${sourceLinks.tokyoGameShowTrade})
- 图片来源：Wikimedia Commons / Evan-Amos / CC BY-SA 3.0`,
    coverUrl: asset.gameController,
    imagePosition: 'center',
    type: 'record',
    tags: json(['游戏', 'Tokyo Game Show', '玩家文化']),
    series: '游戏档案部',
    gallery: json([
      image(asset.gameController, 'Panasonic Q 游戏手柄，Evan-Amos 摄，CC BY-SA 3.0'),
      image(asset.creators, '数位创作设备，Piknuz 摄，CC BY-SA 4.0'),
    ]),
    viewCount: 0,
    likeCount: 0,
    favoriteCount: 0,
    commentCount: 0,
    createdAt: new Date('2026-06-23T10:50:00+08:00'),
    isPinned: true,
    reactions: json(emptyReactions),
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

- [MANGA Plus 更新入口](${sourceLinks.mangaPlus})
- [App Store 介绍页](${sourceLinks.mangaPlusApp})
- 图片来源：Wikimedia Commons / Piknuz / CC BY-SA 4.0`,
    coverUrl: asset.creators,
    imagePosition: 'center',
    type: 'article',
    tags: json(['番剧补完', 'MANGA Plus', '正版阅读']),
    series: '番剧放映室',
    gallery: json([image(asset.creators, '数位板绘制场景，Piknuz 摄，CC BY-SA 4.0')]),
    viewCount: 0,
    likeCount: 0,
    favoriteCount: 0,
    commentCount: 0,
    createdAt: new Date('2026-06-23T11:30:00+08:00'),
    reactions: json(emptyReactions),
  },
  {
    id: 'p_gallery_copyright_note',
    authorId: 'u_editorial',
    title: '图廊运营规则：番剧海报、COS 照片、游戏截图怎么标注版权',
    excerpt: '站点可以收录更有二次元味道的图片，但每张图都要区分 CC 授权、官方素材、用户投稿和仅可链接来源。',
    content: `可以更有二次元味道，但不能让后续维护失控。图廊需要把图片来源和权利归属写清楚，尤其是番剧海报、COS 真人照片和游戏截图。

## 四类图片

- CC / 公有领域：可以打包进仓库，但要标注作者、协议、来源链接。
- 官方素材：可以在文章里标注版权归属和官方来源，是否下载入库要看官网条款。
- 用户投稿：需要保留拍摄者、授权范围、被摄者许可，尤其是 COS 真人照片。
- 商业海报 / 游戏截图：默认先用外链、来源说明或文章引用，不直接批量打包原图。

## 后台字段建议

后续可以在文章或图片资源里增加“版权类型”“来源 URL”“权利方”“是否允许商用”“是否允许二次编辑”字段。这样图廊既能放番剧、COS、游戏内容，也能在后台管理里一眼看出风险等级。

## 资料来源

- [Creative Commons Search](${sourceLinks.commonsSearch})
- Wikimedia Commons 文件页见 docs/content-sources.md`,
    coverUrl: asset.sakuraWatercolor,
    imagePosition: 'center',
    type: 'article',
    tags: json(['图廊', '版权标注', '后台管理']),
    series: '图廊治理',
    gallery: json([
      image(asset.sakuraWatercolor, '漫画工具展示，Maplestrip 摄，CC BY 3.0'),
      image(asset.gameController, 'Panasonic Q 游戏手柄，Evan-Amos 摄，CC BY-SA 3.0'),
      image(asset.cosplayStage, 'Comiket 69 COS 群像，stormstill 摄，CC BY-SA 2.0'),
    ]),
    viewCount: 0,
    likeCount: 0,
    favoriteCount: 0,
    commentCount: 0,
    createdAt: new Date('2026-06-23T12:05:00+08:00'),
    reactions: json(emptyReactions),
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

## 资料来源

- Wikimedia Commons：Kare-Raisu.jpg
- 图片作者 Ocdp，CC0 1.0`,
    coverUrl: asset.novelKitchen,
    imagePosition: 'center',
    type: 'article',
    tags: json(['日常番', '场景资料', '轻小说']),
    series: '番剧生活感资料',
    gallery: json([image(asset.novelKitchen, '家庭制作的日式咖喱饭，Ocdp 摄，CC0 1.0')]),
    viewCount: 0,
    likeCount: 0,
    favoriteCount: 0,
    commentCount: 0,
    createdAt: new Date('2026-06-23T12:35:00+08:00'),
    reactions: json(emptyReactions),
  },
]

const legacyUserIds = ['u_mika', 'u_rin', 'u_nano', 'u_sakura', 'u_events', 'u_manga', 'u_media']
const legacyPostIds = [
  'p_aurora',
  'p_cos',
  'p_watch',
  'p_sakura_1',
  'p_yuki_1',
  'p_rei_1',
  'p_novel',
  'p_comiket_guide',
  'p_kyoto_manga_museum',
  'p_open_licensed_images',
]
const managedUserIds = [...legacyUserIds, ...users.map((user) => user.id)]
const managedPostIds = [...legacyPostIds, ...posts.map((post) => post.id)]

await prisma.report.deleteMany({
  where: { OR: [{ postId: { in: managedPostIds } }, { reporterId: { in: managedUserIds } }] },
})
await prisma.comment.deleteMany({
  where: { OR: [{ postId: { in: managedPostIds } }, { userId: { in: managedUserIds } }] },
})
await prisma.animeRecord.deleteMany({ where: { userId: { in: managedUserIds } } })
await prisma.draftSnapshot.deleteMany({ where: { userId: { in: managedUserIds } } })
await prisma.draft.deleteMany({ where: { userId: { in: managedUserIds } } })
await prisma.post.deleteMany({ where: { id: { in: legacyPostIds } } })
await prisma.user.deleteMany({ where: { id: { in: legacyUserIds } } })

for (const user of users) {
  await prisma.user.upsert({
    where: { id: user.id },
    update: user,
    create: user,
  })
}

for (const post of posts) {
  await prisma.post.upsert({
    where: { id: post.id },
    update: post,
    create: post,
  })
}

const carouselSlides = [...posts.filter((post) => post.isPinned), ...posts.filter((post) => !post.isPinned)]
  .slice(0, 5)
  .map((post, index) => {
    const tags = readJson(post.tags, [])
    return {
      id: `hero_${post.id}`,
      title: post.title,
      excerpt: post.excerpt,
      imageUrl: post.coverUrl,
      imagePosition: post.imagePosition || 'center',
      tag: tags[0] || ['番剧前哨', 'COS图廊', '游戏现场', '正版入口', '图廊治理'][index] || '精选',
      link: `/post/${post.id}`,
      sourcePostId: post.id,
      enabled: true,
      updatedAt: new Date().toISOString(),
    }
  })

await prisma.siteSetting.upsert({
  where: { key: 'home.carousel' },
  update: { value: json(carouselSlides) },
  create: { key: 'home.carousel', value: json(carouselSlides) },
})

await prisma.draft.upsert({
  where: { userId: 'u_editorial' },
  update: {
    title: '',
    content: '',
    tags: json(['番剧', 'COS', '游戏']),
    images: json([]),
  },
  create: {
    id: 'draft_u_editorial',
    userId: 'u_editorial',
    title: '',
    content: '',
    tags: json(['番剧', 'COS', '游戏']),
    images: json([]),
  },
})

console.log(`Seeded ${users.length} ACGN users, ${posts.length} fandom posts, 0 comments, 0 anime records.`)

await prisma.$disconnect()
