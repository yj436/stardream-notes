const now = Date.now()
const url = new URL(window.location.href)

url.searchParams.set('stale', String(now))
if (!url.hash) {
  url.hash = '#/'
}

window.location.replace(url.toString())

export {}
