const CACHE_NAME = 'stardream-v2'

const PRECACHE_URLS = [
  '/',
  '/index.html',
]

self.addEventListener('install', (event) => {
  const promise = caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  // Don't block activation on precache failures
  event.waitUntil(promise.catch(() => Promise.resolve()))
  // Activate immediately
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  const promise = caches.keys().then((keys) =>
    Promise.all(
      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
    ),
  )
  event.waitUntil(promise)
  // Claim all clients
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  // Only handle GET requests
  if (request.method !== 'GET') return
  // Skip non-http(s) requests
  if (!request.url.startsWith('http')) return
  const url = new URL(request.url)
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/uploads/')) return

  event.respondWith(
    caches.match(request).then((cached) => {
      const fetched = fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.ok && response.type === 'basic') {
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
