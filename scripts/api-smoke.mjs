const rawBaseUrl =
  process.env.API_BASE_URL ||
  process.env.VITE_API_BASE_URL ||
  `http://127.0.0.1:${process.env.PORT || process.env.API_PORT || 3001}/api`

const baseUrl = rawBaseUrl.replace(/\/+$/, '')

const readJson = async (path) => {
  const url = `${baseUrl}${path}`
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
  })
  const text = await response.text()
  let body = null
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = text
  }

  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}: ${text.slice(0, 300)}`)
  }

  return { status: response.status, body }
}

const assertArray = (value, label) => {
  if (!Array.isArray(value)) throw new Error(`${label} response is not an array`)
}

const main = async () => {
  const health = await readJson('/health')
  if (!health.body?.ok) throw new Error(`API health check failed: ${JSON.stringify(health.body)}`)
  if (health.body.database && !health.body.database.ok) {
    throw new Error(`Database health check failed: ${JSON.stringify(health.body.database)}`)
  }

  const posts = await readJson('/posts')
  assertArray(posts.body, 'Posts')

  const users = await readJson('/users')
  assertArray(users.body, 'Users')

  console.log(
    JSON.stringify(
      {
        ok: true,
        baseUrl,
        health: health.body,
        counts: {
          posts: posts.body.length,
          users: users.body.length,
        },
      },
      null,
      2,
    ),
  )
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
