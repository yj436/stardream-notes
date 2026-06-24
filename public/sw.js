const CACHE_NAME = 'stardream-v4'
const scopeUrl = self.registration.scope

const isCacheableImage = (request, response) =>
  request.destination === 'image' && response.ok && response.type === 'basic'

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).catch(() => Promise.resolve()))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  const promise = caches.keys().then((keys) =>
    Promise.all(
      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
    ),
  )
  event.waitUntil(promise)
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  // Only handle GET requests
  if (request.method !== 'GET') return
  // Skip non-http(s) requests
  if (!request.url.startsWith('http')) return
  const url = new URL(request.url)
  const scopePath = new URL(scopeUrl).pathname

  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/uploads/') ||
    url.pathname.startsWith(`${scopePath}data/`) ||
    url.pathname.startsWith(`${scopePath}api/`) ||
    url.pathname.startsWith(`${scopePath}uploads/`)
  ) {
    return
  }

  if (request.mode === 'navigate' || ['script', 'style', 'document'].includes(request.destination)) {
    event.respondWith(fetch(request).catch(() => caches.match(request)))
    return
  }

  if (request.destination !== 'image') return

  event.respondWith(
    caches.match(request).then((cached) => {
      const fetched = fetch(request)
        .then((response) => {
          if (isCacheableImage(request, response)) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clone)
            })
          }
          return response
        })
        .catch(() => cached ?? new Response('Offline', { status: 503 }))
      return cached ?? fetched
    }),
  )
})
