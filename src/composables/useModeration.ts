// 内容审核系统 — 对应规划文档 P0 内容审核
export const SENSITIVE_WORDS = [
  '暴力', '血腥', '毒品', '赌博', '色情', '欺诈',
  '恐怖主义', '极端', '仇恨言论', '垃圾广告', '辱骂',
  '人身攻击', '骚扰', '虚假信息', '恶意软件',
]

export interface ModerationResult {
  passed: boolean
  flaggedWords: string[]
  severity: 'clean' | 'suggest' | 'block'
  message: string
}

export function moderateContent(text: string): ModerationResult {
  const found = SENSITIVE_WORDS.filter((word) => text.toLowerCase().includes(word))
  if (found.length === 0) {
    return { passed: true, flaggedWords: [], severity: 'clean', message: '内容检查通过' }
  }
  if (found.length <= 3) {
    return {
      passed: true,
      flaggedWords: found,
      severity: 'suggest',
      message: `内容中包含敏感词：${found.join('、')}，建议修改后发布`,
    }
  }
  return {
    passed: false,
    flaggedWords: found,
    severity: 'block',
    message: `内容因包含不当词汇（${found.join('、')}）已被拦截，请修改后重试`,
  }
}

export function moderateImageCheck(): ModerationResult {
  // 模拟图片审核 — 真实场景对接阿里云/网易易盾
  return { passed: true, flaggedWords: [], severity: 'clean', message: '图片检查通过（模拟）' }
}

export interface ModerationQueueItem {
  id: string
  postId: string
  title: string
  flaggedWords: string[]
  severity: 'suggest' | 'block'
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

const storageKey = 'stardream:moderation-queue'

export function getModerationQueue(): ModerationQueueItem[] {
  try {
    const str = window.localStorage.getItem(storageKey)
    return str ? JSON.parse(str) : []
  } catch {
    return []
  }
}

export function addToModerationQueue(item: Omit<ModerationQueueItem, 'status' | 'createdAt'>) {
  const queue = getModerationQueue()
  const newItem: ModerationQueueItem = {
    ...item,
    status: 'pending',
    createdAt: new Date().toISOString(),
  }
  queue.push(newItem)
  window.localStorage.setItem(storageKey, JSON.stringify(queue))
  return newItem
}

export function updateModerationStatus(id: string, status: 'approved' | 'rejected') {
  const queue = getModerationQueue()
  const updated = queue.map((item) => (item.id === id ? { ...item, status } : item))
  window.localStorage.setItem(storageKey, JSON.stringify(updated))
}
