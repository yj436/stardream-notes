import prismaPkg from '@prisma/client'

const { PrismaClient } = prismaPkg
const prisma = new PrismaClient()

const redactDatabaseUrl = (value) => {
  if (!value) return null
  try {
    const url = new URL(value)
    if (url.password) url.password = '***'
    if (url.username) url.username = url.username ? `${url.username}` : ''
    return url.toString()
  } catch {
    return '<invalid DATABASE_URL>'
  }
}

const main = async () => {
  const startedAt = Date.now()
  const result = {
    ok: false,
    databaseUrl: redactDatabaseUrl(process.env.DATABASE_URL),
    provider: 'mysql',
    checks: {},
  }

  try {
    await prisma.$connect()
    await prisma.$queryRawUnsafe('SELECT 1')
    const [users, posts, comments, animeRecords, drafts, reports, adminUser] = await Promise.all([
      prisma.user.count(),
      prisma.post.count(),
      prisma.comment.count(),
      prisma.animeRecord.count(),
      prisma.draft.count(),
      prisma.report.count(),
      prisma.user.findFirst({ where: { role: 'admin', status: 'active' }, select: { id: true, email: true } }),
    ])

    result.ok = Boolean(adminUser)
    result.checks = {
      connection: true,
      schema: true,
      counts: { users, posts, comments, animeRecords, drafts, reports },
      adminUser: adminUser ?? false,
      latencyMs: Date.now() - startedAt,
    }
  } catch (error) {
    result.checks = {
      connection: false,
      errorCode: error?.code,
      error: error?.message,
    }
  } finally {
    await prisma.$disconnect().catch(() => undefined)
  }

  console.log(JSON.stringify(result, null, 2))
  if (!result.ok) process.exit(1)
}

main()
