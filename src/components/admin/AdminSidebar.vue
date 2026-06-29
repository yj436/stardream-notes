<script setup lang="ts">
import {
  AlertTriangle,
  CircleGauge,
  Cloud,
  Database,
  FileText,
  Flag,
  MessageSquareText,
  Server,
  ShieldCheck,
  Users,
} from 'lucide-vue-next'
import type { AdminNavItem, AdminStatusInfo } from './adminTypes'

defineProps<{
  tab: string
  navItems: AdminNavItem[]
  status: AdminStatusInfo
}>()

const emit = defineEmits<{
  select: [key: string]
  refreshHealth: []
}>()
</script>

<template>
  <aside class="admin-sidebar">
    <div class="admin-brand-block">
      <span class="admin-brand-icon"><ShieldCheck :size="20" /></span>
      <div>
        <strong>星梦运营台</strong>
        <small>Stardream Admin</small>
      </div>
    </div>

    <nav class="admin-menu" aria-label="后台模块">
      <button
        v-for="item in navItems"
        :key="item.key"
        type="button"
        :class="['admin-menu-item', { active: tab === item.key }]"
        @click="emit('select', item.key)"
      >
        <component :is="item.icon" :size="18" />
        <span>
          <strong>{{ item.title }}</strong>
          <small>{{ item.desc }}</small>
        </span>
        <em>{{ item.alert || item.count }}</em>
      </button>
    </nav>

    <div class="admin-system-card">
      <span class="section-kicker"><CircleGauge :size="15" /> 系统状态</span>
      <strong>{{ status.dataModeLabel }}</strong>
      <small class="admin-endpoint"><Cloud :size="13" /> {{ status.apiEndpointLabel }}</small>
      <div class="admin-health-row">
        <span :class="['admin-health-pill', status.apiHealthTone]">
          <component :is="status.apiHealthIcon" :size="14" :class="{ 'spin-icon': status.systemLoading }" />
          {{ status.apiHealthLabel }}
        </span>
        <span :class="['admin-health-pill', status.databaseHealthTone]">
          <Database :size="14" />
          {{ status.databaseHealthLabel }}
        </span>
      </div>
      <div class="admin-health-details">
        <span v-for="item in status.healthDetailRows" :key="item.label">
          <component :is="item.icon" :size="13" :class="{ 'spin-icon': item.spinning }" />
          <small>{{ item.label }}</small>
          <strong>{{ item.value }}</strong>
        </span>
      </div>
      <p v-if="status.healthIssueMessage" class="admin-health-message">
        <AlertTriangle :size="14" />
        {{ status.healthIssueMessage }}
      </p>
      <div v-if="status.healthCounts" class="admin-health-counts">
        <span><Users :size="13" />{{ status.healthCounts.users }}</span>
        <span><FileText :size="13" />{{ status.healthCounts.posts }}</span>
        <span><MessageSquareText :size="13" />{{ status.healthCounts.comments }}</span>
        <span><Flag :size="13" />{{ status.healthCounts.reports }}</span>
      </div>
      <button
        type="button"
        class="ghost-button compact admin-health-refresh"
        :disabled="status.systemLoading"
        @click="emit('refreshHealth')"
      >
        <Server :size="15" />
        {{ status.systemLoading ? '检测中' : '重新检测' }}
      </button>
    </div>
  </aside>
</template>
