import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seed() {
  console.log('🌱 正在写入种子数据...')

  // Clean
  await prisma.report.deleteMany()
  await prisma.favorite.deleteMany()
  await prisma.like.deleteMany()
  await prisma.follow.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.animeRecord.deleteMany()
  await prisma.post.deleteMany()
  await prisma.draft.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.refreshToken.deleteMany()
  await prisma.user.deleteMany()

  const pw = bcrypt.hashSync('admin123', 10)
  const userPw = bcrypt.hashSync('test123', 10)

  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@stardream.local',
      nickname: '管理员',
      passwordHash: pw,
      role: 'admin',
      avatarUrl: '',
      coverUrl: '',
      bio: '星梦笔记管理员',
      level: 99,
      postsCount: 0,
      followersCount: 0,
      followingCount: 0,
    },
  })

  const mika = await prisma.user.create({
    data: {
      username: 'mika-stars',
      email: 'mika@stardream.local',
      nickname: '米卡星屑',
      passwordHash: userPw,
      role: 'creator',
      creatorBadge: '认证画师',
      avatarUrl: '',
      coverUrl: '',
      bio: '同人画师，偏爱夜空、机甲少女和让人心软的日常短篇。',
      level: 18,
      exp: 3800,
      postsCount: 2,
      followersCount: 12800,
      followingCount: 315,
      likesReceived: 98600,
      favoriteCharName: '星野璃',
      favoriteCharAnime: '原创企划「银河放课后」',
      favoriteCharQuote: '今天也要把梦画得亮一点。',
      theme: 'sakura',
    },
  })

  const rin = await prisma.user.create({
    data: {
      username: 'rin-coslog',
      email: 'rin@stardream.local',
      nickname: '凛月记录本',
      passwordHash: userPw,
      role: 'creator',
      creatorBadge: 'Coser',
      avatarUrl: '',
      coverUrl: '',
      bio: 'Coser / 手作服装 / 写一点舞台幕后和修图笔记。',
      level: 14,
      postsCount: 2,
      followersCount: 6200,
      followingCount: 188,
      likesReceived: 40300,
      favoriteCharName: '月见遥',
      favoriteCharAnime: '原创企划「夏夜摄影棚」',
      favoriteCharQuote: '镜头会记住认真闪光的人。',
      theme: 'starlight',
    },
  })

  const nano = await prisma.user.create({
    data: {
      username: 'nano-gamepad',
      email: 'nano@stardream.local',
      nickname: '纳诺手柄',
      passwordHash: userPw,
      bio: 'Galgame、独立游戏和追番记录重度用户，偶尔写长评。',
      level: 11,
      postsCount: 2,
      followersCount: 3400,
      followingCount: 522,
      likesReceived: 29100,
      favoriteCharName: '浅川千叶',
      favoriteCharAnime: '原创企划「像素雨季」',
      favoriteCharQuote: '存档点就在下一盏路灯下。',
      theme: 'mint',
    },
  })

  const sakura = await prisma.user.create({
    data: {
      username: 'sakura-pen',
      email: 'sakura@stardream.local',
      nickname: '樱笔绘卷',
      passwordHash: userPw,
      role: 'creator',
      creatorBadge: '认证画师',
      avatarUrl: '',
      coverUrl: '',
      bio: '水彩插画师，专注和风与幻想题材的角色设计。',
      level: 22,
      postsCount: 2,
      followersCount: 18900,
      followingCount: 210,
      likesReceived: 142000,
      favoriteCharName: '樱庭月',
      favoriteCharAnime: '原创企划「花鸟风月」',
      favoriteCharQuote: '用画笔留下不会凋谢的瞬间。',
      theme: 'sakura',
    },
  })

  const kira = await prisma.user.create({
    data: {
      username: 'kira-light',
      email: 'kira@stardream.local',
      nickname: '光之轨迹',
      passwordHash: userPw,
      role: 'creator',
      creatorBadge: '摄影师',
      avatarUrl: '',
      coverUrl: '',
      bio: '摄影 / 后期合成 / ACGN 场景还原，用镜头讲二次元故事。',
      level: 16,
      postsCount: 2,
      followersCount: 9500,
      followingCount: 156,
      likesReceived: 76400,
      favoriteCharName: '天羽光',
      favoriteCharAnime: '原创企划「晨星航路」',
      favoriteCharQuote: '每一帧都是通往异世界的窗户。',
      theme: 'starlight',
    },
  })

  const yuki = await prisma.user.create({
    data: {
      username: 'yuki-novel',
      email: 'yuki@stardream.local',
      nickname: '雪之下笔',
      passwordHash: userPw,
      bio: '轻小说写手，专注校园奇幻与异世界日常。',
      level: 13,
      postsCount: 1,
      followersCount: 4200,
      followingCount: 342,
      likesReceived: 31200,
      favoriteCharName: '白鸟雪',
      favoriteCharAnime: '原创企划「冬日的约定」',
      favoriteCharQuote: '故事是从一颗不想忘记的心开始的。',
      theme: 'mint',
    },
  })

  const haru = await prisma.user.create({
    data: {
      username: 'haru-beats',
      email: 'haru@stardream.local',
      nickname: '春日节拍',
      passwordHash: userPw,
      bio: '同人音乐 / Vocaloid调教 / 偶尔写曲评。',
      level: 9,
      postsCount: 1,
      followersCount: 2800,
      followingCount: 488,
      likesReceived: 19700,
      favoriteCharName: '音无春',
      favoriteCharAnime: '原创企划「音之叶」',
      favoriteCharQuote: '旋律是记得一个人最好的方式。',
      theme: 'sakura',
    },
  })

  const rei = await prisma.user.create({
    data: {
      username: 'rei-journal',
      email: 'rei@stardream.local',
      nickname: '零度日记',
      passwordHash: userPw,
      bio: '追番记录 / 动画短评 / 角色分析。正在修行成为一名番剧评论家。',
      level: 7,
      postsCount: 2,
      followersCount: 1500,
      followingCount: 110,
      likesReceived: 24300,
      favoriteCharName: '灰羽零',
      favoriteCharAnime: '原创企划「黑键与白键」',
      favoriteCharQuote: '即使世界末日，也要把这一集看完。',
      theme: 'starlight',
    },
  })

  // Posts
  const p1 = await prisma.post.create({
    data: {
      authorId: mika.id,
      title: '把星空画进博客封面：柔光上色流程拆解',
      excerpt: '从草图、配色到柔光叠加，把一张 ACGN 风封面整理成可复用的创作笔记。',
      content: '这次的练习目标是让画面有"轻博客首页可以直接使用"的完成度。\n\n我会先用低饱和星蓝铺背景，再用樱粉和薄荷青做视觉锚点。人物周围不要堆太多特效，给标题和标签留下呼吸感。\n\n最后一步是把高光控制在眼睛、灯串和便签边缘。这样缩成小卡片时也能看清重点。',
      type: 'article',
      tags: JSON.stringify(['绘画教程', '星空', '原创企划']),
      gallery: JSON.stringify([]),
      viewCount: 38620,
      likeCount: 2840,
      favoriteCount: 932,
      commentCount: 2,
      isPinned: true,
    },
  })

  const p2 = await prisma.post.create({
    data: {
      authorId: rin.id,
      title: '摄影棚里的月光感：低成本 Cos 布光清单',
      excerpt: '一盏柔光灯、两张反光纸、三种角度，让小房间也能拍出舞台感。',
      content: '这套布光最重要的不是器材，而是先决定画面的情绪。\n\n我会把主灯放在人物侧前方，背景用低亮度蓝紫色补一点夜色，最后用小灯串制造轮廓边缘。\n\n修图时不要把肤色推得过白，保留一点暖色会更像真人站在故事里。',
      type: 'gallery',
      tags: JSON.stringify(['Cosplay', '摄影', '布光']),
      gallery: JSON.stringify([]),
      viewCount: 15940,
      likeCount: 1296,
      favoriteCount: 441,
      commentCount: 1,
    },
  })

  const p3 = await prisma.post.create({
    data: {
      authorId: nano.id,
      title: '六月追番清单：三部适合深夜看的治愈系',
      excerpt: '不剧透短评，记录"想看 / 在看 / 看过"的轻量追番流程。',
      content: '本月想看一点节奏慢但余味长的故事。\n\n第一部适合睡前看，镜头很安静；第二部的配乐很适合写作业；第三部虽然是奇幻设定，但人物关系特别生活化。\n\n我喜欢把每集看完的心情写成一句话，不追求完整影评，只留下当时的温度。',
      type: 'record',
      tags: JSON.stringify(['追番记录', '治愈系', '短评']),
      gallery: JSON.stringify([]),
      viewCount: 21800,
      likeCount: 1720,
      favoriteCount: 508,
      commentCount: 0,
    },
  })

  // Comments
  await prisma.comment.create({
    data: { postId: p1.id, userId: rin.id, content: '"给标题留下呼吸感"这句太有用了，我每次都忍不住把星星撒满全图。', likeCount: 42 },
  })
  await prisma.comment.create({
    data: { postId: p1.id, userId: nano.id, content: '小卡片可读性这个角度很棒，感觉适合做成系列教程。', likeCount: 31 },
  })
  await prisma.comment.create({
    data: { postId: p2.id, userId: mika.id, content: '反光纸那段学到了，周末就试试。', likeCount: 18 },
  })

  // Anime records
  await prisma.animeRecord.create({
    data: { userId: nano.id, title: '银河放课后', status: 'watching', rating: 9, review: '美术太舒服，像把日记写进星云里。' },
  })
  await prisma.animeRecord.create({
    data: { userId: nano.id, title: '像素雨季', status: 'watched', rating: 8, review: '节奏慢，但结尾那场雨很值。' },
  })
  await prisma.animeRecord.create({
    data: { userId: rei.id, title: '花鸟风月', status: 'watching', rating: 10, review: '本季霸权，每一帧都能当壁纸。' },
  })

  // Some likes
  await prisma.like.create({ data: { postId: p1.id, userId: rin.id } })
  await prisma.like.create({ data: { postId: p1.id, userId: nano.id } })
  await prisma.like.create({ data: { postId: p2.id, userId: mika.id } })

  // Some favorites
  await prisma.favorite.create({ data: { postId: p1.id, userId: nano.id } })

  // Some follows
  await prisma.follow.create({ data: { followerId: mika.id, followingId: rin.id } })
  await prisma.follow.create({ data: { followerId: rin.id, followingId: mika.id } })

  console.log('✅ 种子数据写入完成')
  console.log(`   👤 管理员: admin@stardream.local / admin123`)
  console.log(`   👤 用户: mika-stars / test123`)
}

seed()
  .catch((e) => { console.error(e); pro
  .finally(() => prisma.\())
