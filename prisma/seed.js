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
  vue35: 'https://blog.vuejs.org/posts/vue-3-5',
  viteReleases: 'https://vite.dev/releases',
  vite7: 'https://vite.dev/blog/announcing-vite7',
  typescript7Rc: 'https://devblogs.microsoft.com/typescript/announcing-typescript-7-0-rc/',
  typescriptConfig: 'https://www.typescriptlang.org/tsconfig/',
  prismaMigrate: 'https://www.prisma.io/docs/orm/prisma-migrate/workflows/development-and-production',
  mysql84: 'https://dev.mysql.com/doc/refman/8.4/en/',
  githubPages: 'https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site',
  webVitals: 'https://web.dev/articles/vitals',
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
  {
    id: 'u_tech',
    username: 'tech-lab',
    email: 'tech@stardream.local',
    passwordHash: hashPassword('tech123'),
    nickname: '技术实验室',
    avatarUrl: asset.creators,
    avatarPosition: 'center',
    coverUrl: asset.starryDesk,
    bio: '把 Vue、Vite、TypeScript、数据库和部署这些站点工程经验，写成能直接落地的技术笔记。',
    level: 12,
    creatorBadge: 'IT 技术栏',
    favoriteCharacter: json({
      name: 'Vue / Vite',
      anime: '前端工程研究',
      quote: '热门技术要回到本站真实构建、部署和数据库链路里验证。',
    }),
    stats: json({ posts: 4, followers: 0, following: 0, likes: 0 }),
    role: 'creator',
    status: 'active',
    isFollowing: false,
    theme: 'mint',
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
  {
    id: 'p_vue_vite_stack_2026',
    authorId: 'u_tech',
    title: 'Vue 3.5 到 Vite 8：本站前端工程栈的升级观察',
    excerpt: '把当前博客的 Vue 3.5、Vite、Pinia、Markdown 编辑器链路对照官方更新整理成一篇可执行的前端升级笔记。',
    content: `这篇不是泛泛而谈“前端很热”，而是把本站正在使用的技术栈放到 2026 年的官方更新里看：Vue 负责组件和状态交互，Vite 负责构建和开发体验，TypeScript 与 vue-tsc 负责上线前的类型约束。技术文章要有热度，也要能回到项目里执行。本站当前依赖里已经使用 Vue 3.5 系列，构建脚本是 vue-tsc 类型检查后再执行 Vite build。

## Vue 3.5 值得关注的点
- Vue 3.5 官方发布文章重点提到 Reactive Props Destructure、useTemplateRef、延迟 hydration、useId 和 Deferred Teleport 等能力。
- 对博客项目来说，后台轮播管理、富文本编辑器、图片资源表单这类复杂组件，最先受益的是更清晰的 props、模板 ref 和跨层 UI 组织方式。
- 不建议为了“追新”一次性重写组件；更适合从 AdminView、EditorView 这两个高交互页面开始，逐步拆出可测试的小组件。

## Vite 升级策略
Vite 官方 releases 页面显示 8.x 已进入当前发布线，而本站 package.json 仍处在较保守的 Vite 6 依赖。这里的建议不是立刻强升，而是先建立升级检查表：Node 版本、Vue 插件版本、GitHub Pages 的 BASE_PATH、hash 路由、图片资源导入、preview 构建验证都要逐项跑过。Vite 7 官方公告里对运行环境和默认构建目标有明确调整，跨大版本升级时尤其要看这些基础项。

## 站内落地清单
- 后台管理页和编辑器优先拆成可复用表单控件，避免一个 Vue 文件继续膨胀。
- 构建前保持 vue-tsc --noEmit，防止文章、图库和轮播数据类型漂移。
- 每次改 mock 数据版本时同步检查 GitHub Pages 预览，避免用户本地 localStorage 继续读旧内容。
- 升级 Vite 前先在单独分支跑 build、preview、首页轮播、文章详情和后台轮播保存。

## 资料来源
- [Vue 3.5 官方发布](${sourceLinks.vue35})
- [Vite releases](${sourceLinks.viteReleases})
- [Vite 7 官方公告](${sourceLinks.vite7})
- 本文项目事实来自 package.json 与 src/api/mock.ts。`,
    coverUrl: asset.creators,
    imagePosition: 'center',
    type: 'article',
    tags: json(['IT技术', 'Vue', 'Vite']),
    series: '技术实验室',
    gallery: json([
      image(asset.creators, '数位板与创作设备，适合作为前端工程笔记封面，Piknuz 摄，CC BY-SA 4.0'),
      image(asset.starryDesk, '原创二次元森林小路壁纸，项目本地生成'),
    ]),
    viewCount: 0,
    likeCount: 0,
    favoriteCount: 0,
    commentCount: 0,
    createdAt: new Date('2026-06-25T18:20:00+08:00'),
    reactions: json(emptyReactions),
  },
  {
    id: 'p_typescript_7_rc_blog_notes',
    authorId: 'u_tech',
    title: 'TypeScript 7.0 RC 观察：博客项目该先看什么',
    excerpt: 'TypeScript 7.0 RC 已经进入官方博客视野，但本站更适合先做类型边界清理，而不是盲目替换生产工具链。',
    content: `TypeScript 的热度不只来自版本号，也来自它会影响 Vue、Vite、Prisma、编辑器组件和后台数据表单的稳定性。TypeScript 7.0 RC 官方文章值得关注，但对一个正在上线中的博客来说，正确姿势是“先读懂影响面，再做小步验证”。

## 为什么要关注 RC
- RC 代表 release candidate，适合提前验证生态兼容性，不等于所有生产项目都应该立刻升级。
- Vue 项目还依赖 vue-tsc、Vite 插件和 IDE 类型服务，任何一个环节不兼容都会影响开发体验。
- 本站已经有文章、用户、评论、轮播、番剧时间表、草稿快照等结构化类型，类型系统越严，后台越不容易把脏数据写进去。

## 先做三件事
第一，清理 Post、User、HomeCarouselSlide 这些核心类型，把“可选字段”和“必须字段”区分得更清楚。第二，给 mock 数据、服务端 API 返回值、备份导入归一化函数补齐边界检查。第三，在升级 TypeScript 前先保存一份能稳定通过的 build 日志，避免升级后不知道是依赖问题还是业务改动问题。

## 推荐配置方向
技术文章里常见的严格配置包括 noUncheckedIndexedAccess、exactOptionalPropertyTypes、noImplicitOverride 等，但不应该一次全开。更好的路线是先从内容模型开始：文章必须有 title、excerpt、content、tags、coverUrl；图库图片必须有 url 和 alt；外部来源必须写进正文或 docs/content-sources.md。

## 站内落地清单
- 新增文章时优先使用 Post 类型约束，不在页面里临时拼匿名对象。
- 后台导入备份时继续用 normalizeBackupPosts 做兼容，但对缺失字段给出默认值。
- TypeScript 升级放到独立分支，至少验证首页、发现页、文章详情、编辑器、后台和构建产物。

## 资料来源
- [TypeScript 7.0 RC 官方博客](${sourceLinks.typescript7Rc})
- [TypeScript TSConfig 官方参考](${sourceLinks.typescriptConfig})`,
    coverUrl: asset.starryDesk,
    imagePosition: 'center',
    type: 'article',
    tags: json(['IT技术', 'TypeScript', '工程质量']),
    series: '技术实验室',
    gallery: json([
      image(asset.starryDesk, '原创二次元森林小路壁纸，项目本地生成'),
      image(asset.sakuraWatercolor, '漫画工具展示，Maplestrip 摄，CC BY 3.0'),
    ]),
    viewCount: 0,
    likeCount: 0,
    favoriteCount: 0,
    commentCount: 0,
    createdAt: new Date('2026-06-25T18:05:00+08:00'),
    reactions: json(emptyReactions),
  },
  {
    id: 'p_mysql_prisma_production_notes',
    authorId: 'u_tech',
    title: '从 SQLite 到 MySQL：博客上线数据库的稳定落点',
    excerpt: '围绕 Prisma Migrate、MySQL 8.4 LTS、备份和连接配置，整理博客从本地数据走向线上数据库的最小稳定方案。',
    content: `前面已经把博客从纯前端假数据推到了可接数据库的结构，这一步最重要的不是“换一个更响亮的数据库名”，而是让文章、图库、用户、评论和后台设置在生产环境里可迁移、可备份、可恢复。MySQL 是主流选择，Prisma Migrate 则适合把 schema 变更纳入版本控制。

## 为什么用 MySQL
MySQL 8.4 是官方文档中的 LTS 线，适合需要长期维护的内容站。对于本站来说，MySQL 的价值主要在四点：文章和图库数据不依赖浏览器 localStorage，后台管理修改能持久化，后续评论和收藏量可以增长，迁移脚本能和 Git 版本绑定。

## Prisma Migrate 的正确用法
Prisma 官方文档把开发与生产迁移流程区分得很清楚：开发环境生成并验证 migration，生产环境使用 migrate deploy 应用已经提交的迁移。本站 package.json 里已经有 db:migrate、db:seed、db:doctor 这类脚本，后续应把它们接入部署流程，而不是在线上手动改表。

## 上线前检查清单
- DATABASE_URL 不写进仓库，放在部署平台的环境变量里。
- 每次 schema.prisma 变更都生成 migration，并在本地种子数据验证中文、JSON 字段和图片资源。
- 文章内容、gallery、reactions、siteSetting 这类 JSON 字段要有解析失败兜底。
- 生产库定期备份，至少覆盖 posts、users、comments、siteSetting 和 draftSnapshot。

## 对本站的建议
短期继续保留 mock 数据作为 GitHub Pages 静态降级；线上 API 版则使用 MySQL + Prisma。这样无数据库环境仍能展示 ACGN 内容，有服务器环境时后台管理和文章编辑可以写入真实数据库。

## 资料来源
- [Prisma Migrate 生产流程](${sourceLinks.prismaMigrate})
- [MySQL 8.4 Reference Manual](${sourceLinks.mysql84})
- 本文项目事实来自 package.json、prisma/schema.prisma 与 server/index.js。`,
    coverUrl: asset.sakuraWatercolor,
    imagePosition: 'center',
    type: 'article',
    tags: json(['IT技术', 'MySQL', 'Prisma']),
    series: '技术实验室',
    gallery: json([
      image(asset.sakuraWatercolor, '原创二次元夏日庭院壁纸，项目本地生成'),
      image(asset.creators, '数位创作设备，Piknuz 摄，CC BY-SA 4.0'),
    ]),
    viewCount: 0,
    likeCount: 0,
    favoriteCount: 0,
    commentCount: 0,
    createdAt: new Date('2026-06-25T17:45:00+08:00'),
    reactions: json(emptyReactions),
  },
  {
    id: 'p_github_pages_web_vitals_spa',
    authorId: 'u_tech',
    title: 'GitHub Pages 上的 Vue SPA：静态部署与 Web Vitals 清单',
    excerpt: '把本站 GitHub Pages 部署、hash 路由、BASE_PATH、图片资源和 LCP/CLS/INP 指标整理成上线检查表。',
    content: `GitHub Pages 很适合承载当前这种 ACGN 内容站的静态版本：成本低、部署透明、代码和页面发布链路都在 GitHub 里。但 Vue SPA 部署到仓库路径时，路由、资源路径和浏览器缓存必须认真处理，否则线上就会出现刷新 404、图片丢失或用户继续读旧数据。

## 静态部署的关键点
- GitHub Pages 官方文档支持从分支或 GitHub Actions 发布站点。
- 本站部署到 /stardream-notes/，因此构建时需要 BASE_PATH=/stardream-notes/。
- 使用 hash 路由可以降低 Pages 子路径刷新 404 的风险，适合没有自定义服务器重写规则的静态站。
- mock 数据版本号要跟内容更新一起提升，让旧 localStorage 在用户浏览器里自动失效。

## Web Vitals 怎么看
Web.dev 的 Core Web Vitals 关注 LCP、CLS、INP。对本站来说，最影响体验的是首页轮播首图、图廊大图、富文本编辑器加载和移动端布局稳定性。二次元图片可以好看，但不应该把首屏压到几 MB；图廊缩略图、详情图和背景壁纸要分清尺寸。

## 上线前检查清单
- npm run build 必须通过，并用 preview 检查首页、发现页、图库、文章详情、编辑器和后台。
- 首页轮播至少保留一张本地可用图，避免外链失效导致首屏空白。
- 新文章和图片来源写进 docs/content-sources.md，方便以后清理资源。
- 部署后打开线上地址做一次硬刷新，确认 hash 路由、图片和数据版本都生效。

## 资料来源
- [GitHub Pages 发布源文档](${sourceLinks.githubPages})
- [Web.dev Core Web Vitals](${sourceLinks.webVitals})
- 本文项目事实来自 Vite 构建命令、路由配置和 src/api/mock.ts。`,
    coverUrl: asset.hero,
    imagePosition: 'center',
    type: 'article',
    tags: json(['IT技术', 'GitHub Pages', 'Web Vitals']),
    series: '技术实验室',
    gallery: json([
      image(asset.hero, '原创二次元夜樱城市壁纸，项目本地生成'),
      image(asset.healingAnime, '东京 Big Sight 夜景，Masato Ohta 摄，CC BY 2.0'),
    ]),
    viewCount: 0,
    likeCount: 0,
    favoriteCount: 0,
    commentCount: 0,
    createdAt: new Date('2026-06-25T17:25:00+08:00'),
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
