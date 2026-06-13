<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Bookmark, Folder, FolderPlus, Plus } from 'lucide-vue-next'
import PostCard from '@/components/PostCard.vue'
import { useBlogStore } from '@/stores/blog'
import { useCollectionStore } from '@/composables/useCollections'

const blog = useBlogStore()
const colStore = useCollectionStore()
const router = useRouter()
const favorites = computed(() => blog.posts.filter((post) => post.isFavorited))
const selectedCol = ref<string | null>(null)
const newColName = ref('')
const showNewCol = ref(false)

const currentPosts = computed(() => {
  if (!selectedCol.value) return favorites.value
  const ids = colStore.getPostsInCollection(selectedCol.value)
  return blog.posts.filter((post) => post.isFavorited && ids.includes(post.id))
})

const createCollection = () => {
  if (!newColName.value.trim()) {
    blog.notify('请输入收藏集名称', 'warning')
    return
  }
  colStore.create(newColName.value.trim())
  newColName.value = ''
  showNewCol.value = false
  blog.notify('收藏集已创建', 'success')
}

const addToCollection = (collectionId: string, postId: string) => {
  colStore.addToCollection(collectionId, postId)
  blog.notify('已添加到收藏集', 'success')
}

const deleteCollection = () => {
  if (!selectedCol.value) return
  colStore.delete(selectedCol.value)
  selectedCol.value = null
  blog.notify('收藏集已删除', 'info')
}

onMounted(async () => {
  await blog.bootstrap()
  if (!blog.isAuthenticated) await router.replace('/login')
})
</script>

<template>
  <section class="feed-layout">
    <div class="section-block">
      <div class="section-title">
        <div>
          <span class="section-kicker"><Bookmark :size="16" /> 收藏夹</span>
          <h1>个人星盒</h1>
        </div>
        <button type="button" class="ghost-button" @click="showNewCol = !showNewCol">
          <FolderPlus :size="18" /> 新建收藏集
        </button>
      </div>
      <p class="empty-note">按收藏集整理你喜欢的笔记，更轻松地回看和发现。</p>
    </div>

    <form v-if="showNewCol" class="section-block collection-form" @submit.prevent="createCollection">
      <input v-model="newColName" placeholder="收藏集名称，例如「画风参考」" />
      <button type="submit" class="primary-button"><Plus :size="18" /> 创建</button>
    </form>

    <section v-if="colStore.collections.length" class="collections-bar">
      <button type="button" :class="{ active: !selectedCol }" @click="selectedCol = null">
        <Folder :size="16" /> 全部收藏 ({{ colStore.totalFavorites }})
      </button>
      <button v-for="col in colStore.collections" :key="col.id" type="button" :class="{ active: selectedCol === col.id }" @click="selectedCol = col.id">
        <Folder :size="16" /> {{ col.name }} ({{ col.postIds.length }})
      </button>
    </section>

    <section v-if="selectedCol" class="section-block">
      <div class="section-title">
        <div><h2>{{ colStore.collections.find((c) => c.id === selectedCol)?.name }}</h2></div>
        <button type="button" class="text-button danger" @click="deleteCollection">删除收藏集</button>
      </div>
    </section>

    <div v-if="favorites.length" class="post-list">
      <div v-for="post in currentPosts" :key="post.id">
        <div v-if="colStore.collections.length" class="collection-move">
          <select :value="''" @change="(e) => { const v = (e.target as HTMLSelectElement).value; if (v) addToCollection(v, post.id) }">
            <option value="" disabled>移入收藏集</option>
            <option v-for="col in colStore.collections" :key="col.id" :value="col.id">{{ col.name }}</option>
          </select>
        </div>
        <PostCard :post="post" :author="blog.users.find((user) => user.id === post.authorId)" />
      </div>
    </div>
    <p v-else class="empty-state">还没有收藏内容。看到喜欢的笔记时，点一下收藏吧。</p>
  </section>
</template>
