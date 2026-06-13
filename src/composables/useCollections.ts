import { defineStore } from 'pinia'

export interface Collection {
  id: string
  name: string
  description: string
  postIds: string[]
  createdAt: string
}

const storageKey = 'stardream:collections'

export const useCollectionStore = defineStore('collections', {
  state: () => ({
    collections: JSON.parse(window.localStorage.getItem(storageKey) || '[]') as Collection[],
  }),

  getters: {
    collectionCount(state) {
      return state.collections.length
    },
    totalFavorites(state) {
      return state.collections.reduce((sum, c) => sum + c.postIds.length, 0)
    },
  },

  actions: {
    save() {
      window.localStorage.setItem(storageKey, JSON.stringify(this.collections))
    },

    create(name: string, description = '') {
      const col: Collection = {
        id: `col_${Date.now()}`,
        name: name.trim(),
        description: description.trim(),
        postIds: [],
        createdAt: new Date().toISOString(),
      }
      this.collections.push(col)
      this.save()
      return col
    },

    delete(id: string) {
      this.collections = this.collections.filter((c) => c.id !== id)
      this.save()
    },

    addToCollection(collectionId: string, postId: string) {
      const col = this.collections.find((c) => c.id === collectionId)
      if (col && !col.postIds.includes(postId)) {
        col.postIds.push(postId)
        this.save()
      }
    },

    removeFromCollection(collectionId: string, postId: string) {
      const col = this.collections.find((c) => c.id === collectionId)
      if (col) {
        col.postIds = col.postIds.filter((id) => id !== postId)
        this.save()
      }
    },

    getPostsInCollection(collectionId: string): string[] {
      return this.collections.find((c) => c.id === collectionId)?.postIds ?? []
    },

    rename(id: string, name: string) {
      const col = this.collections.find((c) => c.id === id)
      if (col) {
        col.name = name.trim()
        this.save()
      }
    },
  },
})
