const dateTimeFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
})

const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

export const toDate = (value: string | number | Date) => {
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? new Date(0) : date
}

export const formatDateTime = (value: string | number | Date) => dateTimeFormatter.format(toDate(value))

export const formatDateOnly = (value: string | number | Date) => dateFormatter.format(toDate(value))

export const formatUnixTimestamp = (value: string | number | Date) => Math.floor(toDate(value).getTime() / 1000)

export const formatRelativeTime = (value: string | number | Date, now = new Date()) => {
  const date = toDate(value)
  const diffSeconds = Math.round((date.getTime() - now.getTime()) / 1000)
  const absSeconds = Math.abs(diffSeconds)
  const suffix = diffSeconds > 0 ? '后' : '前'

  if (absSeconds < 45) return diffSeconds > 0 ? '即将' : '刚刚'
  if (absSeconds < 3600) return `${Math.round(absSeconds / 60)} 分钟${suffix}`
  if (absSeconds < 86400) return `${Math.round(absSeconds / 3600)} 小时${suffix}`
  if (absSeconds < 604800) return `${Math.round(absSeconds / 86400)} 天${suffix}`

  return formatDateOnly(date)
}

export const getTimestampTitle = (value: string | number | Date) => {
  const date = toDate(value)
  return `精确时间：${formatDateTime(date)} · ISO：${date.toISOString()} · Unix：${formatUnixTimestamp(date)}`
}
