import type { Component } from 'vue'
import type { Post } from '@/types/content'

export interface AdminNavItem<Key extends string = string> {
  key: Key
  label: string
  title: string
  desc: string
  icon: Component
  count: number
  alert: number
}

export interface AdminKpiItem {
  label: string
  value: string | number
  helper: string
  icon: Component
  tone: string
}

export interface AdminHealthDetail {
  label: string
  value: string
  icon: Component
  spinning?: boolean
}

export interface AdminHealthCounts {
  users?: number
  posts?: number
  comments?: number
  reports?: number
}

export interface AdminStatusInfo {
  dataModeLabel: string
  apiEndpointLabel: string
  apiHealthTone: string
  apiHealthLabel: string
  apiHealthIcon: Component
  databaseHealthTone: string
  databaseHealthLabel: string
  healthDetailRows: AdminHealthDetail[]
  healthIssueMessage: string
  healthCounts?: AdminHealthCounts
  systemLoading: boolean
}

export interface AdminCarouselImageChoice {
  label: string
  desc: string
  url: string
  position: string
  post?: Post
}
