<script setup lang="ts">
import { BadgeCheck, HeartHandshake, Sparkles } from 'lucide-vue-next'
import type { User } from '@/types/content'
import { useBlogStore } from '@/stores/blog'

defineProps<{ user: User }>()

const blog = useBlogStore()
</script>

<template>
  <article class="user-panel">
    <div class="user-cover" :style="{ backgroundImage: `url(${user.coverUrl})` }" />
    <div class="user-info">
      <RouterLink :to="`/user/${user.id}`" class="user-avatar" :style="{ backgroundImage: `url(${user.avatarUrl})`, backgroundPosition: user.avatarPosition }" />
      <div>
        <RouterLink :to="`/user/${user.id}`" class="user-name">{{ user.nickname }}</RouterLink>
        <p>@{{ user.username }} · Lv.{{ user.level }}</p>
      </div>
      <button type="button" class="icon-button" aria-label="关注作者" @click="blog.toggleFollow(user.id)">
        <HeartHandshake :size="17" />
      </button>
    </div>
    <p class="user-bio">{{ user.bio }}</p>
    <div class="character-chip">
      <span><Sparkles :size="14" /> 资料焦点</span>
      <strong>{{ user.favoriteCharacter.name }}</strong>
      <small>{{ user.favoriteCharacter.anime }}</small>
    </div>
    <div class="creator-badge" v-if="user.creatorBadge">
      <BadgeCheck :size="15" />
      {{ user.creatorBadge }}
    </div>
  </article>
</template>
