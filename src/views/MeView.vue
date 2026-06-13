<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Edit3, FileText, PenLine, Trash2 } from 'lucide-vue-next'
import PostCard from '@/components/PostCard.vue'
import StatGrid from '@/components/StatGrid.vue'
import { useBlogStore } from '@/stores/blog'

const router = useRouter()
const blog = useBlogStore()
const myPosts = computed(() => blog.posts.filter((post) => post.authorId === blog.currentUserId))
const draftPreview = computed(() => blog.draft.title || blog.draft.content || blog.draft.tags.length)

onMounted(async () => {
  await blog.bootstrap()
  if (!blog.isAuthenticated) await router.replace('/login')
})
</script>

<template>
  <section v-if="blog.currentUser" class="me-layout">
    <div class="section-block">
      <div class="section-title">
        <div>
          <span class="section-kicker">个人工作台</span>
          <h1>{{ blog.currentUser.nickname }} 的创作中心</h1>
        </div>
        <RouterLink class="primary-button" to="/editor"><PenLine :size="18" />写新文章</RouterLink>
      </div>
      <StatGrid
        :items="[
          { label: '我的文章', value: myPosts.length },
          { label: '粉丝', value: blog.currentUser.stats.followers.toLocaleString() },
          { label: '获赞', value: blog.currentUser.stats.likes.toLocaleString() },
        ]"
      />
    </div>

    <section class="section-block">
      <div class="section-title">
        <div>
          <span class="section-kicker"><FileText :size="16" /> 草稿箱</span>
          <h2>{{ draftPreview ? blog.draft.title || '未命名草稿' : '暂无草稿' }}</h2>
        </div>
        <RouterLink class="ghost-button" to="/editor">继续编辑</RouterLink>
      </div>
      <p v-if="draftPreview" class="empty-note">{{ blog.draft.content || '这篇草稿还没有正文。' }}</p>
      <div v-if="draftPreview" class="tag-row">
        <span v-for="tag in blog.draft.tags" :key="tag">#{{ tag }}</span>
      </div>
    </section>

    <section class="section-block">
      <div class="section-title">
        <div>
          <span class="section-kicker">我的文章</span>
          <h2>已发布内容</h2>
        </div>
      </div>
      <div class="post-list">
        <article v-for="post in myPosts" :key="post.id" class="managed-post">
          <PostCard :post="post" :author="blog.currentUser" compact />
          <div class="managed-actions">
            <RouterLink class="text-button" :to="`/editor?edit=${post.id}`"><Edit3 :size="15" />编辑</RouterLink>
            <button class="text-button danger" type="button" @click="blog.deletePost(post.id)"><Trash2 :size="15" />删除</button>
          </div>
        </article>
      </div>
    </section>
  </section>
</template>
