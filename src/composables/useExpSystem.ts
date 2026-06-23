// 经验等级系统 — 对应规划文档 P2 等级与经验
export const EXP_THRESHOLDS: number[] = [
  0, 100, 280, 520, 840, 1260, 1800, 2500, 3400, 4500,
  5800, 7400, 9200, 11400, 14000, 17000, 20600, 24800, 29800, 35800,
]

export interface ExpChange {
  gained: number
  total: number
  newLevel: number
  leveledUp: boolean
}

export const MAX_LEVEL = EXP_THRESHOLDS.length

export function expForLevel(level: number): number {
  const idx = Math.max(0, Math.min(level - 1, EXP_THRESHOLDS.length - 1))
  return EXP_THRESHOLDS[idx]
}

export function nextLevelExp(level: number): number {
  return expForLevel(level + 1) - expForLevel(level)
}

export function calcLevel(totalExp: number): { level: number; currentExp: number } {
  let level = 1
  for (let i = EXP_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalExp >= EXP_THRESHOLDS[i]) {
      level = i + 1
      break
    }
  }
  const baseExp = expForLevel(level)
  const currentExp = totalExp - baseExp
  return { level, currentExp }
}

export function addExp(
  currentTotal: number,
  amount: number,
): ExpChange {
  const before = calcLevel(currentTotal)
  const newTotal = currentTotal + amount
  const after = calcLevel(newTotal)
  return {
    gained: amount,
    total: newTotal,
    newLevel: after.level,
    leveledUp: after.level > before.level,
  }
}

export const EXP_EVENTS = {
  PUBLISH_POST: 50,
  GET_LIKE: 5,
  GIVE_LIKE: 2,
  COMMENT: 5,
  GET_COMMENT: 3,
  GET_FOLLOW: 10,
  DAILY_LOGIN: 10,
  DRAFT_SAVE: 1,
} as const

export const LEVEL_TITLES: Record<number, string> = {
  1: '星梦新人',
  5: '资料旅人',
  10: '来源整理者',
  15: '资料编辑',
  20: '星梦达人',
}

export function levelTitle(level: number): string {
  const keys = Object.keys(LEVEL_TITLES).map(Number).sort((a, b) => b - a)
  for (const key of keys) {
    if (level >= key) return LEVEL_TITLES[key]
  }
  return '星梦新人'
}
