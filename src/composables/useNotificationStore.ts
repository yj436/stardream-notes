import { defineStore } from 'pinia'

export interface AppNotification {
  id: string
  type: 'like' | 'comment' | 'follow' | 'system'
  message: string
  fromUserId?: string
  targetId?: string
  read: boolean
  createdAt: string
}

const storageKey = 'stardream:notifications'

const loadFromStorage = (): AppNotification[] => {
  try {
    const str = window.localStorage.getItem(storageKey)
    return str ? JSON.parse(str) : []
  } catch {
    return []
  }
}

const saveToStorage = (items: AppNotification[]) => {
  window.localStorage.setItem(storageKey, JSON.stringify(items))
}

export const useNotificationStore = defineStore('notifications', {
  state: () => ({
    items: loadFromStorage(),
    unreadCount: 0,
    panelOpen: false,
  }),

  getters: {
    unread(state) {
      return state.items.filter((n) => !n.read).length
    },
    sorted(state) {
      return [...state.items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    },
  },

  actions: {
    add(notification: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) {
      const item: AppNotification = {
        ...notification,
        id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        read: false,
        createdAt: new Date().toISOString(),
      }
      this.items = [item, ...this.items]
      saveToStorage(this.items)
    },

    markRead(id: string) {
      this.items = this.items.map((n) => (n.id === id ? { ...n, read: true } : n))
      saveToStorage(this.items)
    },

    markAllRead() {
      this.items = this.items.map((n) => ({ ...n, read: true }))
      saveToStorage(this.items)
    },

    togglePanel() {
      this.panelOpen = !this.panelOpen
    },

    closePanel() {
      this.panelOpen = false
    },

    clear() {
      this.items = []
      saveToStorage(this.items)
    },
  },
})
