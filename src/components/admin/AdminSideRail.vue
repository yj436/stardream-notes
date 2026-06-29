<script setup lang="ts">
import { ref } from 'vue'
import {
  Activity,
  BarChart3,
  BellRing,
  Database,
  Download,
  FileText,
  Flag,
  Megaphone,
  MessageSquareText,
  Send,
  Upload,
  Users,
} from 'lucide-vue-next'
import type { Report } from '@/types/content'

defineProps<{
  broadcastText: string
  broadcastSent: boolean
  backupBusy: boolean
  backupMessage: string
  backupCounts: {
    users: number
    posts: number
    comments: number
  }
  openReports: Report[]
  totalViews: number
  commentCount: number
  reportPostTitle: (report: Report) => string
}>()

const emit = defineEmits<{
  'update:broadcastText': [value: string]
  sendBroadcast: []
  exportBackup: []
  importBackup: [file: File]
}>()

const backupFileInputRef = ref<HTMLInputElement | null>(null)

const triggerBackupImport = () => {
  backupFileInputRef.value?.click()
}

const handleBackupImport = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) emit('importBackup', file)
  input.value = ''
}
</script>

<template>
  <aside class="admin-side-rail">
    <section class="admin-side-panel">
      <div class="admin-panel-head compact">
        <div>
          <span class="section-kicker"><Megaphone :size="16" /> 系统广播</span>
          <h2>全站通知</h2>
        </div>
      </div>
      <form class="admin-broadcast-form" @submit.prevent="emit('sendBroadcast')">
        <textarea
          :value="broadcastText"
          rows="4"
          placeholder="输入广播消息，发送后写入当前通知中心。"
          @input="emit('update:broadcastText', ($event.target as HTMLTextAreaElement).value)"
        />
        <button type="submit" class="primary-button" :disabled="!broadcastText.trim()">
          <Send :size="16" />
          {{ broadcastSent ? '已发送' : '发送通知' }}
        </button>
      </form>
    </section>

    <section class="admin-side-panel admin-backup-panel">
      <div class="admin-panel-head compact">
        <div>
          <span class="section-kicker"><Database :size="16" /> 数据备份</span>
          <h2>JSON 备份</h2>
        </div>
      </div>
      <div class="admin-backup-stats">
        <span><Users :size="14" />{{ backupCounts.users }}</span>
        <span><FileText :size="14" />{{ backupCounts.posts }}</span>
        <span><MessageSquareText :size="14" />{{ backupCounts.comments }}</span>
      </div>
      <div class="admin-backup-actions">
        <button type="button" class="primary-button compact" :disabled="backupBusy" @click="emit('exportBackup')">
          <Download :size="15" />
          {{ backupBusy ? '处理中' : '导出 JSON' }}
        </button>
        <button type="button" class="ghost-button compact" :disabled="backupBusy" @click="triggerBackupImport">
          <Upload :size="15" />
          导入 JSON
        </button>
        <input ref="backupFileInputRef" class="file-input-hidden" type="file" accept="application/json,.json" @change="handleBackupImport" />
      </div>
      <small v-if="backupMessage" class="admin-backup-message">{{ backupMessage }}</small>
    </section>

    <section class="admin-side-panel">
      <div class="admin-panel-head compact">
        <div>
          <span class="section-kicker"><BellRing :size="16" /> 待办队列</span>
          <h2>需要关注</h2>
        </div>
      </div>
      <div class="admin-task-list">
        <RouterLink v-for="report in openReports.slice(0, 4)" :key="report.id" class="admin-task-item" :to="`/post/${report.postId}`">
          <span><Flag :size="15" /></span>
          <strong>{{ report.reason }}</strong>
          <small>{{ reportPostTitle(report) }}</small>
        </RouterLink>
        <p v-if="!openReports.length" class="empty-state">当前没有待处理举报。</p>
      </div>
    </section>

    <section class="admin-side-panel">
      <div class="admin-mini-chart">
        <span><BarChart3 :size="20" /></span>
        <div>
          <strong>{{ totalViews.toLocaleString() }}</strong>
          <small>累计内容浏览</small>
        </div>
      </div>
      <div class="admin-mini-chart">
        <span><Activity :size="20" /></span>
        <div>
          <strong>{{ commentCount }}</strong>
          <small>评论审核样本</small>
        </div>
      </div>
    </section>
  </aside>
</template>
