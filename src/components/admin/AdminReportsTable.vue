<script setup lang="ts">
import TimestampPill from '@/components/TimestampPill.vue'
import type { Report } from '@/types/content'
import type { AdminReportActionPayload, AdminReportStatusCount, AdminReportStatusFilter } from './adminTypes'

defineProps<{
  reports: Report[]
  statusCounts: AdminReportStatusCount[]
  statusFilter: AdminReportStatusFilter
  selectedIds: string[]
  allSelected: boolean
  reportPostTitle: (report: Report) => string
  reportTone: (status: Report['status']) => string
  reportStatusLabel: (status: Report['status']) => string
}>()

const emit = defineEmits<{
  'update:statusFilter': [filter: AdminReportStatusFilter]
  toggleVisible: []
  toggleReport: [id: string]
  runBatch: [payload: AdminReportActionPayload]
  updateReport: [id: string, payload: AdminReportActionPayload]
}>()
</script>

<template>
  <section class="admin-table reports-table">
    <div class="admin-report-toolbar">
      <div class="segmented admin-report-filters" aria-label="举报状态筛选">
        <button
          v-for="option in statusCounts"
          :key="option.key"
          type="button"
          :class="{ active: statusFilter === option.key }"
          @click="emit('update:statusFilter', option.key)"
        >
          {{ option.label }}
          <small>{{ option.count }}</small>
        </button>
      </div>
      <div class="admin-report-bulk">
        <span>{{ selectedIds.length }} 已选</span>
        <button type="button" class="ghost-button compact" :disabled="!reports.length" @click="emit('toggleVisible')">
          {{ allSelected ? '取消全选' : '选择当前' }}
        </button>
        <button type="button" class="ghost-button compact" :disabled="!selectedIds.length" @click="emit('runBatch', { status: 'reviewing' })">
          批量复核
        </button>
        <button
          type="button"
          class="ghost-button compact"
          :disabled="!selectedIds.length"
          @click="emit('runBatch', { status: 'resolved', hidePost: true })"
        >
          批量隐藏
        </button>
        <button type="button" class="text-button compact" :disabled="!selectedIds.length" @click="emit('runBatch', { status: 'rejected' })">
          批量驳回
        </button>
      </div>
    </div>

    <div class="admin-table-row admin-table-head">
      <span class="admin-check-cell">
        <input type="checkbox" :checked="allSelected" :disabled="!reports.length" @change="emit('toggleVisible')" />
      </span>
      <span>举报原因</span>
      <span>关联文章</span>
      <span>状态</span>
      <span>提交时间</span>
      <span>操作</span>
    </div>
    <div v-for="report in reports" :key="report.id" class="admin-table-row">
      <span class="admin-check-cell">
        <input type="checkbox" :checked="selectedIds.includes(report.id)" @change="emit('toggleReport', report.id)" />
      </span>
      <span class="admin-report-copy">
        <strong>{{ report.reason }}</strong>
        <small>{{ report.detail || '无补充说明' }}</small>
      </span>
      <RouterLink class="admin-link" :to="`/post/${report.postId}`">{{ reportPostTitle(report) }}</RouterLink>
      <span :class="['admin-status-chip', reportTone(report.status)]">{{ reportStatusLabel(report.status) }}</span>
      <TimestampPill :value="report.createdAt" compact show-copy />
      <div class="admin-row-actions">
        <button type="button" class="ghost-button compact" @click="emit('updateReport', report.id, { status: 'reviewing' })">复核</button>
        <button
          type="button"
          class="ghost-button compact"
          @click="emit('updateReport', report.id, { status: 'resolved', hidePost: true })"
        >
          隐藏
        </button>
        <button type="button" class="text-button compact" @click="emit('updateReport', report.id, { status: 'rejected' })">驳回</button>
      </div>
    </div>
    <p v-if="!reports.length" class="empty-state">没有匹配的举报。</p>
  </section>
</template>
