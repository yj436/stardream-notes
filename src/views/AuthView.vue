<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { LogIn, UserPlus } from 'lucide-vue-next'
import { useBlogStore } from '@/stores/blog'

const router = useRouter()
const blog = useBlogStore()
const mode = ref<'login' | 'register'>('login')
const error = ref('')
const loginForm = reactive({ identifier: 'admin@stardream.local', password: 'admin123' })
const registerForm = reactive({ username: '', nickname: '', email: '', password: '' })
const isLogin = computed(() => mode.value === 'login')

const submit = async () => {
  error.value = ''
  try {
    if (isLogin.value) {
      const user = await blog.login(loginForm)
      await router.push(user.role === 'admin' ? '/admin' : `/user/${user.id}`)
      return
    }
    const user = await blog.register(registerForm)
    await router.push(`/user/${user.id}`)
  } catch {
    error.value = '账号信息有误，请检查后重试。'
  }
}
</script>

<template>
  <section class="auth-layout">
    <div class="auth-card section-block">
      <span class="section-kicker">{{ isLogin ? '欢迎回来' : '加入星梦' }}</span>
      <h1>{{ isLogin ? '登录星梦笔记' : '注册资料账号' }}</h1>
      <p>登录后可以发布文章、评论互动、管理个人空间；管理员账号可进入后台。</p>

      <div class="segmented auth-switch">
        <button type="button" :class="{ active: isLogin }" @click="mode = 'login'">登录</button>
        <button type="button" :class="{ active: !isLogin }" @click="mode = 'register'">注册</button>
      </div>

      <form class="auth-form" @submit.prevent="submit">
        <template v-if="isLogin">
          <label>邮箱或用户名<input v-model="loginForm.identifier" autocomplete="username" /></label>
          <label>密码<input v-model="loginForm.password" type="password" autocomplete="current-password" /></label>
        </template>
        <template v-else>
          <label>用户名<input v-model="registerForm.username" autocomplete="username" /></label>
          <label>昵称<input v-model="registerForm.nickname" /></label>
          <label>邮箱<input v-model="registerForm.email" type="email" autocomplete="email" /></label>
          <label>密码<input v-model="registerForm.password" type="password" autocomplete="new-password" /></label>
        </template>

        <p v-if="error" class="form-error">{{ error }}</p>
        <button type="submit" class="primary-button">
          <LogIn v-if="isLogin" :size="18" />
          <UserPlus v-else :size="18" />
          {{ isLogin ? '登录' : '注册' }}
        </button>
      </form>
    </div>
  </section>
</template>
