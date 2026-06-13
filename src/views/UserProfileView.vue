<script setup lang="ts">
import { computed, onMounted, reactive, watch } from 'vue'
import { useRoute } from 'vue-router'
import { BadgeCheck, Clapperboard, HeartHandshake, Palette, Plus, Save, Star } from 'lucide-vue-next'
import PostCard from '@/components/PostCard.vue'
import StatGrid from '@/components/StatGrid.vue'
import TimestampPill from '@/components/TimestampPill.vue'
import { useBlogStore } from '@/stores/blog'
import type { AnimeStatus, ProfileTheme } from '@/types/content'

const route = useRoute()
const blog = useBlogStore()
const userId = computed(() => String(route.params.id))
const user = computed(() => blog.users.find((item) => item.id === userId.value))
const userPosts = computed(() => blog.posts.filter((post) => post.authorId === userId.value))
const isOwnProfile = computed(() => userId.value === blog.currentUserId)

const profileForm = reactive({
  nickname: '',
  bio: '',
  creatorBadge: '',
  theme: 'sakura' as ProfileTheme,
  characterName: '',
  characterAnime: '',
  characterQuote: '',
})

const recordForm = reactive({
  title: '',
  status: 'watching' as AnimeStatus,
  rating: 8,
  review: '',
})

const themeOptions: Array<{ label: string; value: ProfileTheme }> = [
  { label: '樱花柔光', value: 'sakura' },
  { label: '星夜蓝调', value: 'starlight' },
  { label: '薄荷清晨', value: 'mint' },
]

const statusLabels: Record<AnimeStatus, string> = {
  want_to_watch: '想看',
  watching: '在看',
  watched: '看过',
}

const syncProfileForm = () => {
  if (!user.value) return
  profileForm.nickname = user.value.nickname
  profileForm.bio = user.value.bio
  profileForm.creatorBadge = user.value.creatorBadge ?? ''
  profileForm.theme = user.value.theme ?? 'sakura'
  profileForm.characterName = user.value.favoriteCharacter.name
  profileForm.characterAnime = user.value.favoriteCharacter.anime
  profileForm.characterQuote = user.value.favoriteCharacter.quote
}

const load = async () => {
  await blog.bootstrap()
  await blog.loadAnimeRecords(userId.value)
  syncProfileForm()
}

const saveProfile = async () => {
  if (!profileForm.nickname.trim() || !profileForm.bio.trim()) {
    blog.notify('昵称和简介不能为空', 'warning')
    return
  }
  await blog.updateProfile({
    nickname: profileForm.nickname.trim(),
    bio: profileForm.bio.trim(),
    creatorBadge: profileForm.creatorBadge.trim() || undefined,
    theme: profileForm.theme,
    favoriteCharacter: {
      name: profileForm.characterName.trim() || '未设置',
      anime: profileForm.characterAnime.trim() || '原创企划',
      quote: profileForm.characterQuote.trim() || '今天也要继续发光。',
    },
  })
}

const addRecord = async () => {
  if (!recordForm.title.trim() || !recordForm.review.trim()) {
    blog.notify('作品名和短评不能为空', 'warning')
    return
  }
  await blog.addAnimeRecord({
    title: recordForm.title,
    status: recordForm.status,
    rating: Number(recordForm.rating),
    review: recordForm.review,
  })
  recordForm.title = ''
  recordForm.status = 'watching'
  recordForm.rating = 8
  recordForm.review = ''
}

const nextStatus = (status: AnimeStatus): AnimeStatus => {
  if (status === 'want_to_watch') return 'watching'
  if (status === 'watching') return 'watched'
  return 'want_to_watch'
}

onMounted(load)
watch(userId, load)
watch(user, syncProfileForm)
</script>

<template>
  <section v-if="user" class="profile-layout">
    <div :class="['profile-hero', `theme-${user.theme ?? 'sakura'}`]">
      <img :src="user.coverUrl" :alt="`${user.nickname} 的封面`" />
      <div class="profile-card">
        <span class="profile-avatar" :style="{ backgroundImage: `url(${user.avatarUrl})`, backgroundPosition: user.avatarPosition }" />
        <div>
          <div class="profile-heading">
            <h1>{{ user.nickname }}</h1>
            <span v-if="user.creatorBadge"><BadgeCheck :size="16" /> {{ user.creatorBadge }}</span>
          </div>
          <p>@{{ user.username }} · Lv.{{ user.level }}</p>
          <p>{{ user.bio }}</p>
        </div>
        <button type="button" class="follow-button large" @click="blog.toggleFollow(user.id)">
          <HeartHandshake :size="18" />
          {{ user.isFollowing ? '已关注' : '关注 Ta' }}
        </button>
      </div>
    </div>

    <StatGrid
      :items="[
        { label: '笔记', value: user.stats.posts },
        { label: '粉丝', value: user.stats.followers.toLocaleString() },
        { label: '关注', value: user.stats.following },
        { label: '获赞', value: user.stats.likes.toLocaleString() },
      ]"
    />

    <div class="profile-grid">
      <section class="section-block">
        <div v-if="isOwnProfile" class="profile-tools">
          <div class="section-title">
            <div>
              <span class="section-kicker"><Palette :size="16" /> 空间装扮</span>
              <h2>编辑个人空间</h2>
            </div>
          </div>
          <label>昵称<input v-model="profileForm.nickname" maxlength="24" /></label>
          <label>简介<textarea v-model="profileForm.bio" rows="3" maxlength="180" /></label>
          <label>认证标识<input v-model="profileForm.creatorBadge" placeholder="例如 认证画师 / Coser" /></label>
          <label>
            空间主题
            <select v-model="profileForm.theme">
              <option v-for="theme in themeOptions" :key="theme.value" :value="theme.value">{{ theme.label }}</option>
            </select>
          </label>
          <label>本命角色<input v-model="profileForm.characterName" /></label>
          <label>出自作品<input v-model="profileForm.characterAnime" /></label>
          <label>角色台词<input v-model="profileForm.characterQuote" /></label>
          <button type="button" class="primary-button" @click="saveProfile"><Save :size="18" />保存空间</button>
        </div>

        <div class="section-title">
          <div>
            <span class="section-kicker"><Star :size="16" /> 本命角色</span>
            <h2>{{ user.favoriteCharacter.name }}</h2>
          </div>
        </div>
        <div class="character-card">
          <strong>{{ user.favoriteCharacter.anime }}</strong>
          <p>{{ user.favoriteCharacter.quote }}</p>
        </div>

        <div class="section-title compact-title">
          <div>
            <span class="section-kicker"><Clapperboard :size="16" /> 追番记录</span>
            <h2>最近看过</h2>
          </div>
        </div>
        <form v-if="isOwnProfile" class="record-form" @submit.prevent="addRecord">
          <input v-model="recordForm.title" placeholder="作品名" />
          <select v-model="recordForm.status">
            <option value="want_to_watch">想看</option>
            <option value="watching">在看</option>
            <option value="watched">看过</option>
          </select>
          <input v-model.number="recordForm.rating" type="number" min="1" max="10" />
          <textarea v-model="recordForm.review" rows="3" placeholder="一句短评" />
          <button type="submit" class="ghost-button"><Plus :size="18" />添加记录</button>
        </form>
        <div class="record-list">
          <article v-for="record in blog.animeRecords" :key="record.id" class="record-card">
            <img :src="record.coverUrl" :alt="record.title" />
            <div>
              <strong>{{ record.title }}</strong>
              <button v-if="isOwnProfile" type="button" class="status-pill" @click="blog.updateAnimeStatus(record.id, nextStatus(record.status))">
                {{ statusLabels[record.status] }} · {{ record.rating }}/10
              </button>
              <span v-else>{{ statusLabels[record.status] }} · {{ record.rating }}/10</span>
              <p>{{ record.review }}</p>
              <TimestampPill :value="record.updatedAt" label="更新" compact />
            </div>
          </article>
        </div>
      </section>

      <section class="section-block">
        <div class="section-title">
          <div>
            <span class="section-kicker">个人时间线</span>
            <h2>公开笔记</h2>
          </div>
        </div>
        <div class="post-list">
          <PostCard v-for="post in userPosts" :key="post.id" :post="post" :author="user" compact />
        </div>
      </section>
    </div>
  </section>
</template>
