import { writeFileSync } from 'node:fs'

const normalizeBasePath = (value) => {
  if (!value) return '/'
  const withLeadingSlash = value.startsWith('/') ? value : `/${value}`
  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`
}

const basePath = normalizeBasePath(process.env.BASE_PATH)

const html = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex" />
    <title>星梦笔记 | 跳转中</title>
    <script>
      ;(function () {
        var basePath = ${JSON.stringify(basePath)}
        var pathname = window.location.pathname
        var routePath = '/'
        if (basePath === '/') {
          routePath = pathname || '/'
        } else if (pathname.indexOf(basePath) === 0) {
          routePath = pathname.slice(basePath.length - 1) || '/'
        }
        var target = basePath + '#' + routePath + window.location.search
        window.location.replace(target)
      })()
    </script>
  </head>
  <body>
    <p>正在跳转到星梦笔记...</p>
  </body>
</html>
`

writeFileSync('dist/404.html', html)
