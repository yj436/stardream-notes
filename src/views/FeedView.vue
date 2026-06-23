<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Radio, UserPlus } from 'lucide-vue-next'
import PostCard from '@/components/PostCard.vue'
import UserPanel from '@/components/UserPanel.vue'
import { useBlogStore } from '@/stores/blog'

const blog = useBlogStore()
const router = useRouter()
const followedUsers = computed(() => blog.users.filter((user) => user.isFollowing && user.id !== blog.currentUserId))
const feedPosts = computed(() => blog.posts.filter((post) => followedUsers.value.some((user) => user.id === post.authorId)))

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
          <span class="section-kicker"><Radio :size="16" /> 关注动态</span>
          <h1>资料组时间线</h1>
        </div>
        <RouterLink class="ghost-button" to="/discover">发现更多资料组</RouterLink>
      </div>
      <p class="empty-note">这里聚合你关注的资料组新文章、图集和平台资料。</p>
    </div>

    <div v-if="feedPosts.length" class="post-list">
      <PostCard v-for="post in feedPosts" :key="post.id" :post="post" :author="blog.users.find((user) => user.id === post.authorId)" />
    </div>

    <section v-else class="section-block">
      <div class="section-title">
        <div>
          <span class="section-kicker"><UserPlus :size="16" /> 还没有动态</span>
          <h2>先关注几个资料组</h2>
        </div>
      </div>
      <div class="creator-grid">
        <UserPanel v-for="user in blog.users.filter((item) => item.id !== blog.currentUserId)" :key="user.id" :user="user" />
      </div>
    </section>
  </section>
</template>
