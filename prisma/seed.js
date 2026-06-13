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

const json = (value) => JSON.stringify(value)
const hashPassword = (password) => {
  const salt = 'stardream-seed'
  return `${salt}:${crypto.createHash('sha256').update(`${salt}:${password}`).digest('hex')}`
}

const users = [
  {
    id: 'u_mika',
    username: 'mika-stars',
    email: 'admin@stardream.local',
    passwordHash: hashPassword('admin123'),
    nickname: '米卡星屿',
    avatarUrl: asset.creators,
    avatarPosition: '20% 25%',
    coverUrl: asset.galaxySchool,
    bio: '同人插画师，喜欢把星空、校园和柔光少女画进轻博客封面。',
    level: 18,
    creatorBadge: '认证画师',
    favoriteCharacter: json({
      name: '星野璃',
      anime: '原创企划《银河放课后》',
      quote: '今天也要把梦画得亮一点。',
    }),
    stats: json({ posts: 42, followers: 12800, following: 315, likes: 98600 }),
    role: 'admin',
    status: 'active',
    isFollowing: false,
    theme: 'sakura',
  },
  {
    id: 'u_rin',
    username: 'rin-coslog',
    email: 'rin@stardream.local',
    passwordHash: hashPassword('rin123'),
    nickname: '凛月记录本',
    avatarUrl: asset.creators,
    avatarPosition: '72% 28%',
    coverUrl: asset.moonlightCos,
    bio: 'Coser / 服装手作 / 写一点舞台幕后和修图笔记。',
    level: 14,
    creatorBadge: 'Coser',
    favoriteCharacter: json({
      name: '月见遥',
      anime: '原创企划《夏夜摄影棚》',
      quote: '镜头会记住认真发光的人。',
    }),
    stats: json({ posts: 28, followers: 6200, following: 188, likes: 40300 }),
    role: 'creator',
    status: 'active',
    isFollowing: true,
    theme: 'starlight',
  },
  {
    id: 'u_nano',
    username: 'nano-gamepad',
    email: 'nano@stardream.local',
    passwordHash: hashPassword('nano123'),
    nickname: '纳诺手柄',
    avatarUrl: asset.creators,
    avatarPosition: '42% 70%',
    coverUrl: asset.healingAnime,
    bio: 'Galgame、独立游戏和追番记录重度用户，偶尔写长评。',
    level: 11,
    favoriteCharacter: json({
      name: '浅川千叶',
      anime: '原创企划《像素雨季》',
      quote: '存档点就在下一盏路灯下。',
    }),
    stats: json({ posts: 35, followers: 3400, following: 522, likes: 29100 }),
    role: 'user',
    status: 'active',
    theme: 'mint',
  },
  {
    id: 'u_sakura',
    username: 'sakura-pen',
    email: 'sakura@stardream.local',
    passwordHash: hashPassword('sakura123'),
    nickname: '樱笔绘卷',
    avatarUrl: asset.creators,
    avatarPosition: '55% 18%',
    coverUrl: asset.sakuraWatercolor,
    bio: '水彩插画师，专注和风与幻想题材角色设计。',
    level: 22,
    creatorBadge: '认证画师',
    favoriteCharacter: json({
      name: '樱庭未央',
      anime: '原创企划《花鸟风月》',
      quote: '用画笔留下不会凋谢的瞬间。',
    }),
    stats: json({ posts: 56, followers: 18900, following: 210, likes: 142000 }),
    role: 'creator',
    status: 'active',
    isFollowing: true,
    theme: 'sakura',
  },
]

const posts = [
  {
    id: 'p_aurora',
    authorId: 'u_mika',
    title: '把星空画进博客封面：柔光上色流程拆解',
    excerpt: '从草图、配色到柔光叠加，把一张 ACGN 风封面整理成可复用的创作笔记。',
    content:
      '这次练习的目标，是让封面在首页小卡片里也能保持清晰的情绪。\n\n## 先确定光源\n我会先用低饱和星蓝铺背景，再用樱粉和薄荷青做视觉锚点。人物周围不要堆太多特效，给标题和标签留下呼吸感。\n\n## 再处理层次\n柔光图层只负责氛围，真正的重点仍然放在眼睛、发丝和便签边缘。缩成卡片时，读者仍然能一眼看到主题。\n\n> 好看的二次元博客不是把页面填满，而是让每一张图都像一扇入口。',
    coverUrl: asset.starryDesk,
    imagePosition: 'center',
    type: 'article',
    tags: json(['绘画教程', '星空', '原创企划']),
    gallery: json([asset.starryDesk, asset.galaxySchool]),
    viewCount: 38620,
    likeCount: 2840,
    favoriteCount: 932,
    commentCount: 2,
    createdAt: new Date('2026-06-08T21:12:00+08:00'),
    isPinned: true,
    isFavorited: true,
    reactions: json({ heart: 128, laugh: 12, cry: 36, fire: 91 }),
  },
  {
    id: 'p_cos',
    authorId: 'u_rin',
    title: '摄影棚里的月光感：低成本 Cos 布光清单',
    excerpt: '一盏柔光灯、两张反光纸、三种角度，让小房间也能拍出舞台感。',
    content:
      '这套布光最重要的不是器材，而是先决定画面的情绪。\n\n主灯放在人物侧前方，背景用低亮度蓝紫色补一点夜色，最后用小灯串制造轮廓边缘。修图时不要把肤色推得过白，保留一点暖色会更像真人站在故事里。',
    coverUrl: asset.moonlightCos,
    imagePosition: '70% 28%',
    type: 'gallery',
    tags: json(['Cosplay', '摄影', '布光']),
    gallery: json([asset.moonlightCos, asset.creators]),
    viewCount: 15940,
    likeCount: 1296,
    favoriteCount: 441,
    commentCount: 1,
    createdAt: new Date('2026-06-07T18:35:00+08:00'),
    reactions: json({ heart: 84, laugh: 18, cry: 9, fire: 67 }),
  },
  {
    id: 'p_watch',
    authorId: 'u_nano',
    title: '六月追番清单：三部适合深夜看的治愈系',
    excerpt: '无剧透短评，记录“想看 / 在看 / 看过”的轻量追番流程。',
    content:
      '本月想看一点节奏慢但余味长的故事。\n\n第一部适合睡前看，镜头很安静；第二部配乐很适合写作业；第三部虽然是奇幻设定，但人物关系特别生活化。我喜欢把每集看完的心情写成一句话，不追求完整影评，只留下当时的温度。',
    coverUrl: asset.healingAnime,
    imagePosition: '35% 55%',
    type: 'record',
    tags: json(['追番记录', '治愈系', '短评']),
    gallery: json([asset.healingAnime]),
    viewCount: 21800,
    likeCount: 1720,
    favoriteCount: 508,
    commentCount: 0,
    createdAt: new Date('2026-06-05T23:10:00+08:00'),
    reactions: json({ heart: 96, laugh: 10, cry: 58, fire: 24 }),
  },
  {
    id: 'p_sakura_1',
    authorId: 'u_sakura',
    title: '水彩入门：从零开始画一片樱花瓣',
    excerpt: '用最简单的水彩技巧画出层次感，适合零基础同人画入门。',
    content:
      '水彩的魅力在于不可控的扩散感。\n\n先用清水打湿纸面，再用淡粉色薄涂第一层。等半干后，用稍微浓一点的粉色画出花瓣脉络。关键在于留白，不是画出来，而是留出来。',
    coverUrl: asset.sakuraWatercolor,
    imagePosition: '20% 40%',
    type: 'article',
    tags: json(['绘画教程', '水彩', '同人画']),
    gallery: json([asset.sakuraWatercolor]),
    viewCount: 25840,
    likeCount: 2210,
    favoriteCount: 874,
    commentCount: 0,
    createdAt: new Date('2026-06-09T14:22:00+08:00'),
    isPinned: true,
    reactions: json({ heart: 115, laugh: 7, cry: 31, fire: 45 }),
  },
  {
    id: 'p_novel',
    authorId: 'u_mika',
    title: '轻小说连载：异世界料理人日记・第一话',
    excerpt: '被召唤到异世界的厨师，用料理征服魔王军的故事。',
    content:
      '睁开眼睛的时候，我站在巨大的魔法阵中央。\n\n“勇者大人，请拯救我们的世界。”王国公主单膝跪地。\n\n我沉默片刻，问她：“你们这里的厨房在哪里？”\n\n不是因为我不关心这个世界，而是我刚做完晚班，还没有吃饭。',
    coverUrl: asset.novelKitchen,
    imagePosition: 'center',
    type: 'article',
    tags: json(['轻小说', '原创企划', '异世界']),
    gallery: json([asset.novelKitchen]),
    viewCount: 38900,
    likeCount: 3150,
    favoriteCount: 1420,
    commentCount: 0,
    createdAt: new Date('2026-06-10T08:15:00+08:00'),
    reactions: json({ heart: 143, laugh: 76, cry: 14, fire: 118 }),
  },
]

const comments = [
  {
    id: 'c_1',
    postId: 'p_aurora',
    userId: 'u_rin',
    content: '“给标题和标签留下呼吸感”这句太有用了，我每次都忍不住把星星撒满全图。',
    likeCount: 42,
    createdAt: new Date('2026-06-08T22:01:00+08:00'),
  },
  {
    id: 'c_2',
    postId: 'p_aurora',
    userId: 'u_nano',
    content: '小卡片可读性这个角度很棒，感觉适合做成系列教程。',
    likeCount: 31,
    createdAt: new Date('2026-06-09T09:18:00+08:00'),
  },
  {
    id: 'c_3',
    postId: 'p_cos',
    userId: 'u_mika',
    content: '反光纸那段学到了，周末就试试。',
    likeCount: 18,
    createdAt: new Date('2026-06-08T11:45:00+08:00'),
  },
]

const animeRecords = [
  {
    id: 'a_1',
    userId: 'u_nano',
    title: '银河放课后',
    coverUrl: asset.galaxySchool,
    status: 'watching',
    rating: 9,
    review: '美术太舒服，像把日记写进星云里。',
    updatedAt: new Date('2026-06-08T20:00:00+08:00'),
  },
  {
    id: 'a_2',
    userId: 'u_nano',
    title: '像素雨季',
    coverUrl: asset.creators,
    status: 'watched',
    rating: 8,
    review: '节奏慢，但结尾那场雨很值。',
    updatedAt: new Date('2026-06-02T19:30:00+08:00'),
  },
]

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

for (const comment of comments) {
  await prisma.comment.upsert({
    where: { id: comment.id },
    update: comment,
    create: comment,
  })
}

for (const record of animeRecords) {
  await prisma.animeRecord.upsert({
    where: { id: record.id },
    update: record,
    create: record,
  })
}
await prisma.draft.upsert({
  where: { userId: 'u_mika' },
  update: {
    title: '',
    content: '',
    tags: json(['鍘熷垱浼佸垝']),
    images: json([]),
  },
  create: {
    id: 'draft_u_mika',
    userId: 'u_mika',
    title: '',
    content: '',
    tags: json(['原创企划']),
    images: json([]),
  },
})

console.log(`Seeded ${users.length} users, ${posts.length} posts, ${comments.length} comments, ${animeRecords.length} anime records.`)

await prisma.$disconnect()
