<script setup lang="ts">
import { onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { Bot, ExternalLink, Eye, Lock, Moon, Save, ShieldCheck, Sun, User } from 'lucide-vue-next'
import { useBlogStore } from '@/stores/blog'
import { useAppTheme } from '@/composables/useAppTheme'
import { useLive2DCompanion } from '@/composables/useLive2DCompanion'
import { useTheme } from '@/composables/useTheme'
import type { ProfileTheme } from '@/types/content'

const router = useRouter()
const blog = useBlogStore()
const { isDark, toggle: toggleAppTheme } = useAppTheme()
const { current: profileTheme, setTheme: setProfileTheme } = useTheme()
const { enabled: live2dEnabled, modelSourceUrl, toggle: toggleLive2D } = useLive2DCompanion()

const form = reactive({
  nickname: '',
  email: '',
  bio: '',
  privacy: 'public' as 'public' | 'followers' | 'private',
  allowComments: true,
  showFollowList: true,
  currentPassword: '',
  newPassword: '',
})

onMounted(async () => {
  await blog.bootstrap()
  if (!blog.isAuthenticated) {
    await router.replace('/login')
    return
  }
  if (blog.currentUser) {
    form.nickname = blog.currentUser.nickname
    form.bio = blog.currentUser.bio
    form.email = blog.currentUser.email ?? ''
  }
})

const saveSettings = async () => {
  await blog.updateProfile({
    nickname: form.nickname,
    bio: form.bio,
    theme: profileTheme.value,
    favoriteCharacter: blog.currentUser?.favoriteCharacter ?? { name: '', anime: '', quote: '' },
  })
  blog.notify('设置已保存', 'success')
}

const changeProfileTheme = (event: Event) => {
  setProfileTheme((event.target as HTMLSelectElement).value as ProfileTheme)
}

const openLive2DSource = () => {
  window.open(modelSourceUrl, '_blank', 'noopener,noreferrer')
}
</script>

<template>
  <section class="settings-layout">
    <section class="section-block">
      <div class="section-title">
        <div>
          <span class="section-kicker"><ShieldCheck :size="16" /> 账号设置</span>
          <h1>管理你的星梦账号</h1>
        </div>
      </div>
      <p class="empty-note">在这里管理隐私选项、账号信息和外观偏好。</p>
    </section>

    <div class="settings-grid">
      <section class="section-block">
        <span class="section-kicker"><User :size="16" /> 个人信息</span>
        <h2>公开资料</h2>
        <label>昵称<input v-model="form.nickname" maxlength="24" /></label>
        <label>简介<textarea v-model="form.bio" rows="3" maxlength="180" /></label>
        <label>邮箱<input v-model="form.email" type="email" disabled /></label>
      </section>

      <section class="section-block">
        <span class="section-kicker"><Eye :size="16" /> 隐私与安全</span>
        <h2>空间可见性</h2>
        <label>
          谁可以看到我的主页
          <select v-model="form.privacy">
            <option value="public">所有人可见</option>
            <option value="followers">仅关注者可见</option>
            <option value="private">仅自己可见</option>
          </select>
        </label>
        <label class="toggle-row">
          <span>允许非关注者评论</span>
          <span class="toggle-switch" :class="{ on: form.allowComments }" @click="form.allowComments = !form.allowComments">
            <span class="toggle-knob" />
          </span>
        </label>
        <label class="toggle-row">
          <span>公开关注列表</span>
          <span class="toggle-switch" :class="{ on: form.showFollowList }" @click="form.showFollowList = !form.showFollowList">
            <span class="toggle-knob" />
          </span>
        </label>
      </section>

      <section class="section-block">
        <span class="section-kicker"><Lock :size="16" /> 修改密码</span>
        <h2>账号安全</h2>
        <label>当前密码<input v-model="form.currentPassword" type="password" placeholder="输入当前密码" /></label>
        <label>新密码<input v-model="form.newPassword" type="password" placeholder="输入新密码（至少 6 位）" /></label>
      </section>
    </div>

    <section class="section-block">
      <span class="section-kicker">外观偏好</span>
      <h2>主题设置</h2>
      <label class="toggle-row">
        <span>
          <Moon v-if="isDark" :size="16" />
          <Sun v-else :size="16" />
          暗黑模式
        </span>
        <span class="toggle-switch" :class="{ on: isDark }" @click="toggleAppTheme">
          <span class="toggle-knob" />
        </span>
      </label>
      <label class="toggle-row">
        <span>
          <Bot :size="16" />
          Live2D 看板娘
        </span>
        <span class="toggle-switch" :class="{ on: live2dEnabled }" @click="toggleLive2D">
          <span class="toggle-knob" />
        </span>
      </label>
      <button type="button" class="settings-link-button" @click="openLive2DSource">
        <ExternalLink :size="16" />
        Live2D 模型来源
      </button>
      <label>
        个人主页主题
        <select :value="profileTheme" @change="changeProfileTheme">
          <option value="sakura">樱花 Sakura</option>
          <option value="starlight">星光 Starlight</option>
          <option value="mint">薄荷 Mint</option>
        </select>
      </label>
    </section>

    <div class="settings-actions">
      <button type="button" class="primary-button" @click="saveSettings"><Save :size="18" />保存设置</button>
    </div>
  </section>
</template>
