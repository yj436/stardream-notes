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
    username: 'open-culture-desk',
    email: 'admin@stardream.local',
    passwordHash: hashPassword('admin123'),
    nickname: '公开资料编辑部',
    avatarUrl: asset.creators,
    avatarPosition: 'center',
    coverUrl: asset.hero,
    bio: '站内资料整理账号：只收录公开来源、开放授权图片和原创整理文本。',
    level: 18,
    creatorBadge: '站点编辑',
    favoriteCharacter: json({
      name: '资料来源',
      anime: '站点内容治理',
      quote: '每一张图、每一段说明都要能回到公开来源。',
    }),
    stats: json({ posts: 1, followers: 0, following: 0, likes: 0 }),
    role: 'admin',
    status: 'active',
    isFollowing: false,
    theme: 'sakura',
  },
  {
    id: 'u_events',
    username: 'event-archive',
    email: 'events@stardream.local',
    passwordHash: hashPassword('events123'),
    nickname: 'ACGN 活动档案组',
    avatarUrl: asset.moonlightCos,
    avatarPosition: 'center',
    coverUrl: asset.hero,
    bio: '整理 Comic Market、AnimeJapan 等公开活动资料，偏重时间、地点、参与方式和现场图像来源。',
    level: 13,
    creatorBadge: '活动资料',
    favoriteCharacter: json({
      name: '东京 Big Sight',
      anime: '展会与同人文化',
      quote: '活动信息先看官方页面，再写成读者能快速理解的资料卡。',
    }),
    stats: json({ posts: 2, followers: 0, following: 0, likes: 0 }),
    role: 'creator',
    status: 'active',
    isFollowing: false,
    theme: 'starlight',
  },
  {
    id: 'u_manga',
    username: 'manga-archive',
    email: 'manga@stardream.local',
    passwordHash: hashPassword('manga123'),
    nickname: '漫画馆藏资料组',
    avatarUrl: asset.starryDesk,
    avatarPosition: 'center',
    coverUrl: asset.galaxySchool,
    bio: '关注漫画馆藏、阅读空间、创作工具和漫画史材料，把博物馆公开信息转成站内资料。',
    level: 15,
    creatorBadge: '馆藏资料',
    favoriteCharacter: json({
      name: '京都国际漫画博物馆',
      anime: '漫画文化资料',
      quote: '漫画不只是一页读物，也是一套可以被保存、检索和研究的文化材料。',
    }),
    stats: json({ posts: 1, followers: 0, following: 0, likes: 0 }),
    role: 'creator',
    status: 'active',
    isFollowing: false,
    theme: 'mint',
  },
  {
    id: 'u_media',
    username: 'legal-reading',
    email: 'media@stardream.local',
    passwordHash: hashPassword('media123'),
    nickname: '正版阅读与资料组',
    avatarUrl: asset.novelKitchen,
    avatarPosition: 'center',
    coverUrl: asset.creators,
    bio: '整理正版阅读入口、日常场景参考和创作素材规范，避免使用未经授权的截图、海报和正文摘录。',
    level: 12,
    creatorBadge: '资料整理',
    favoriteCharacter: json({
      name: 'MANGA Plus',
      anime: '正版阅读入口',
      quote: '把入口讲清楚，比堆砌作品海报更适合长期维护。',
    }),
    stats: json({ posts: 2, followers: 0, following: 0, likes: 0 }),
    role: 'creator',
    status: 'active',
    isFollowing: false,
    theme: 'sakura',
  },
]

const posts = [
  {
    id: 'p_comiket_guide',
    authorId: 'u_events',
    title: 'Comiket：从同人志即卖会看创作社群如何运转',
    excerpt: '基于 Comic Market 官方信息和开放授权现场照片，整理同人创作、摊位日程和东京 Big Sight 场景。',
    content: `这是一张给博客读者看的资料卡，正文由站点原创整理，不复制活动页面长文。

## 核心事实

- Comic Market 也常被称作 Comiket，核心场景是同人志、自出版作品和创作者社群。
- 官方英文站提供面向海外参加者的说明入口；不同日期的社团、类型和入场规则需要以官方页面为准。
- 站内使用的现场照片来自 Wikimedia Commons，照片记录的是 2013 年夏季 Comiket 84 的 Cosplay 区域。

## 放进博客的意义

Comiket 很适合放在 ACGN 博客首页，因为它同时连接创作、交流、展示和购买。相比虚构的“同人创作教程”，真实资料可以让读者知道活动如何组织，创作者为什么需要提前准备摊位、作品目录、交通与排队策略。

## 资料来源

- [Comic Market 官方英文站](${sourceLinks.comiket})
- [面向海外参加者的信息页](${sourceLinks.comiketOverseas})
- 图片来源：Wikimedia Commons / Guilhem Vellut / CC BY 2.0`,
    coverUrl: asset.moonlightCos,
    imagePosition: 'center',
    type: 'gallery',
    tags: json(['Comiket', '同人文化', '东京展会']),
    series: 'ACGN 公开资料笔记',
    gallery: json([
      image(asset.moonlightCos, 'Comiket 84 的 Cosplay 区域，Guilhem Vellut 摄，CC BY 2.0'),
      image(asset.hero, '东京 Big Sight 夜景，Masato Ohta 摄，CC BY 2.0'),
    ]),
    viewCount: 0,
    likeCount: 0,
    favoriteCount: 0,
    commentCount: 0,
    createdAt: new Date('2026-06-23T09:20:00+08:00'),
    isPinned: true,
    reactions: json(emptyReactions),
  },
  {
    id: 'p_kyoto_manga_museum',
    authorId: 'u_manga',
    title: '京都国际漫画博物馆：把漫画从消费品变成可检索的文化资料',
    excerpt: '京都国际漫画博物馆公开页面显示馆内约 300,000 项资料可检索，馆藏覆盖江户戏画、明治期杂志和复制原画。',
    content: `京都国际漫画博物馆适合做成站内“漫画馆藏”板块，因为它不是单纯展示热门作品，而是在说明漫画如何被保存、检索和研究。

## 核心事实

- 博物馆官网首页提供数据库检索入口，并说明馆内约 300,000 项资料可检索。
- Collection 页面介绍馆藏包含 Edo giga、明治时期漫画杂志，以及被称为 Genga'(Dash) 的复制原画资料。
- 官网还介绍了 Manga Wall、Research Reference Room、Manga Studio 等面向参观和研究的空间。

## 编辑整理

站内没有搬运漫画正文或馆内展品细节图，而是使用 Commons 上的室内空间与阅读场景照片。这样的素材更适合博客：它呈现“漫画被阅读和保存的场域”，不会误用商业作品封面。

## 资料来源

- [京都国际漫画博物馆英文官网](${sourceLinks.kyotoMangaMuseum})
- [馆藏介绍页面](${sourceLinks.kyotoCollection})
- 图片来源：Wikimedia Commons / Kento Ikeda、Maplestrip、Tatyana Temirbulatova / CC BY 系列授权`,
    coverUrl: asset.starryDesk,
    imagePosition: 'center',
    type: 'article',
    tags: json(['京都国际漫画博物馆', '漫画馆藏', '资料整理']),
    series: 'ACGN 公开资料笔记',
    gallery: json([
      image(asset.starryDesk, '京都国际漫画博物馆主展区，Kento Ikeda 摄，CC BY 2.0'),
      image(asset.galaxySchool, '京都国际漫画博物馆户外阅读场景，Tatyana Temirbulatova 摄，CC BY 2.0'),
      image(asset.sakuraWatercolor, '京都国际漫画博物馆内的漫画工具展示，Maplestrip 摄，CC BY 3.0'),
    ]),
    viewCount: 0,
    likeCount: 0,
    favoriteCount: 0,
    commentCount: 0,
    createdAt: new Date('2026-06-23T10:05:00+08:00'),
    isPinned: true,
    reactions: json(emptyReactions),
  },
  {
    id: 'p_animejapan_2026',
    authorId: 'u_events',
    title: 'AnimeJapan 2026：动画产业展会的公共日与商务日',
    excerpt: '根据 AnimeJapan 官方 About 页面整理 2026 年会期、场馆和公共日、商务日的内容结构。',
    content: `AnimeJapan 的价值不只在“看展”，也在于它把动画产业的展示、舞台、商品、商务交流放在同一套活动结构里。

## 核心事实

- AnimeJapan 2026 官方 About 页面显示，公共日场馆为 Tokyo Big Sight，日期为 2026 年 3 月 28 日至 3 月 29 日。
- 商务日同样在 Tokyo Big Sight，日期为 2026 年 3 月 30 日至 3 月 31 日。
- 页面列出的内容包括 Exhibit booths、AJ Stage、Organized events、Official merchandise，以及商务日的 seminar、business concierge 等。

## 站内呈现方式

这篇文章使用东京 Big Sight 的开放授权夜景作为主图，而不使用活动主视觉或商业海报。这样更适合长期部署：图片可追溯，页面也不会因为活动素材版权而增加维护成本。

## 资料来源

- [AnimeJapan 2026 About 页面](${sourceLinks.animeJapan})
- 图片来源：Wikimedia Commons / Masato Ohta / CC BY 2.0`,
    coverUrl: asset.hero,
    imagePosition: 'center',
    type: 'article',
    tags: json(['AnimeJapan', '动画产业', '东京展会']),
    series: '2026 动画产业观察',
    gallery: json([
      image(asset.hero, '东京 Big Sight 夜景，Masato Ohta 摄，CC BY 2.0'),
      image(asset.creators, '数字绘画板上的创作手部特写，Piknuz 摄，CC BY-SA 4.0'),
    ]),
    viewCount: 0,
    likeCount: 0,
    favoriteCount: 0,
    commentCount: 0,
    createdAt: new Date('2026-06-23T10:40:00+08:00'),
    reactions: json(emptyReactions),
  },
  {
    id: 'p_manga_plus',
    authorId: 'u_media',
    title: 'MANGA Plus：同步连载服务如何改善海外正版阅读入口',
    excerpt: 'MANGA Plus by SHUEISHA 是集英社官方漫画阅读服务，公开介绍强调与日本同步更新最新章节。',
    content: `这篇资料不评价具体作品剧情，只整理“正版入口”本身。对博客来说，说明读者从哪里合法阅读，比使用未经授权的漫画截图更重要。

## 核心事实

- MANGA Plus by SHUEISHA 的应用商店页面称它是 Shueisha 的官方漫画阅读服务。
- 公开页面介绍其最新章节可与日本同步阅读；免费章节范围会随服务规则调整，读者应以官方应用和网页为准。
- 服务适合放在“正版阅读入口”板块，帮助读者找到官方平台，而不是在站内复制漫画内容。

## 站内使用原则

我们只写原创说明，不上传漫画分镜、彩页或商业封面。页面配图使用开放授权的数位板照片，表达“数字阅读与数字创作”的主题。

## 资料来源

- [MANGA Plus by SHUEISHA 更新页](${sourceLinks.mangaPlus})
- [MANGA Plus App Store 页面](${sourceLinks.mangaPlusApp})
- 图片来源：Wikimedia Commons / Piknuz / CC BY-SA 4.0`,
    coverUrl: asset.creators,
    imagePosition: 'center',
    type: 'record',
    tags: json(['MANGA Plus', '正版阅读', '漫画平台']),
    series: '正版阅读入口',
    gallery: json([image(asset.creators, '数字绘画板上的创作手部特写，Piknuz 摄，CC BY-SA 4.0')]),
    viewCount: 0,
    likeCount: 0,
    favoriteCount: 0,
    commentCount: 0,
    createdAt: new Date('2026-06-23T11:15:00+08:00'),
    reactions: json(emptyReactions),
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

## 对后台的影响

后台轮播图现在可以选择“东京 Big Sight 夜景”“京都漫画博物馆主展区”“Comiket 现场”“漫画工具展示”等真实资产。运营时换图不再依赖占位插画，也能在文档里找到每张图的授权说明。

## 资料来源

- [Creative Commons Search Portal](${sourceLinks.commonsSearch})
- [Wikimedia Commons](https://commons.wikimedia.org/)
- 站内文档：docs/content-sources.md`,
    coverUrl: asset.sakuraWatercolor,
    imagePosition: 'center',
    type: 'article',
    tags: json(['Wikimedia Commons', '开放授权', '内容治理']),
    series: '站点内容治理',
    gallery: json([
      image(asset.sakuraWatercolor, '漫画工具展示，Maplestrip 摄，CC BY 3.0'),
      image(asset.creators, '数字绘画板上的创作手部特写，Piknuz 摄，CC BY-SA 4.0'),
      image(asset.galaxySchool, '京都国际漫画博物馆户外阅读场景，Tatyana Temirbulatova 摄，CC BY 2.0'),
    ]),
    viewCount: 0,
    likeCount: 0,
    favoriteCount: 0,
    commentCount: 0,
    createdAt: new Date('2026-06-23T11:50:00+08:00'),
    reactions: json(emptyReactions),
  },
  {
    id: 'p_kare_popculture',
    authorId: 'u_media',
    title: '咖喱饭为什么适合写进轻小说与动画场景资料库',
    excerpt: '用一张 CC0 的日式咖喱饭照片，替代虚构厨房插画，整理日常饮食场景如何服务轻小说叙事。',
    content: `日常食物是轻小说、动画和漫画里很常见的场景锚点。它不需要夸张设定，也能帮助读者快速理解角色的生活节奏。

## 核心事实

- 站内使用的咖喱饭照片来自 Wikimedia Commons，文件说明为家庭制作的日式咖喱饭，包含牛肉、洋葱、胡萝卜和土豆。
- 该图片使用 CC0 公共领域贡献，适合作为“日常场景资料”配图。
- 这类素材能替代虚构厨房图，让创作者在写饮食、便当、深夜餐桌时有真实参考。

## 写作提示

把“咖喱饭”写进场景时，可以关注气味、锅具、等待时间、共同分食和剩菜再加热，而不是只写菜名。真实照片提供的是质感，不是剧情本身。

## 资料来源

- 图片来源：Wikimedia Commons / Ocdp / CC0 1.0`,
    coverUrl: asset.novelKitchen,
    imagePosition: 'center',
    type: 'article',
    tags: json(['日本咖喱', '场景资料', '日常叙事']),
    series: '日常场景资料',
    gallery: json([image(asset.novelKitchen, '家庭制作的日式咖喱饭，Ocdp 摄，CC0 1.0')]),
    viewCount: 0,
    likeCount: 0,
    favoriteCount: 0,
    commentCount: 0,
    createdAt: new Date('2026-06-23T12:25:00+08:00'),
    reactions: json(emptyReactions),
  },
]

const legacyUserIds = ['u_mika', 'u_rin', 'u_nano', 'u_sakura']
const legacyPostIds = ['p_aurora', 'p_cos', 'p_watch', 'p_sakura_1', 'p_yuki_1', 'p_rei_1', 'p_novel']
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
      tag: tags[0] || ['今日主推', '馆藏资料', '活动现场', '正版入口', '编辑精选'][index] || '精选',
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
    tags: json(['公开资料整理']),
    images: json([]),
  },
  create: {
    id: 'draft_u_editorial',
    userId: 'u_editorial',
    title: '',
    content: '',
    tags: json(['公开资料整理']),
    images: json([]),
  },
})

console.log(`Seeded ${users.length} sourced users, ${posts.length} sourced posts, 0 comments, 0 anime records.`)

await prisma.$disconnect()
