<script setup lang="ts">
import { ArrowDown, ArrowUp, Image as ImageIcon, Link2, Plus, RotateCcw, Save, X } from 'lucide-vue-next'
import type { HomeCarouselSlide } from '@/types/content'
import type { AdminCarouselImageChoice } from './adminTypes'

defineProps<{
  drafts: HomeCarouselSlide[]
  selectedId: string
  selectedSlide: HomeCarouselSlide | null
  enabledCount: number
  imageChoices: AdminCarouselImageChoice[]
  saving: boolean
  previewUrl: (url?: string) => string
  normalizeImageUrl: (url?: string) => string
}>()

const emit = defineEmits<{
  select: [id: string]
  add: []
  reset: []
  save: []
  move: [id: string, direction: -1 | 1]
  remove: [id: string]
  'update-slide': [id: string, payload: Partial<HomeCarouselSlide>]
  'select-image': [choice: AdminCarouselImageChoice]
}>()
</script>

<template>
  <section class="admin-carousel-manager">
    <div class="admin-carousel-toolbar">
      <div>
        <strong>首页首屏轮播</strong>
        <small>{{ enabledCount }} 张启用 · 最多建议保留 5 张主图</small>
      </div>
      <div class="admin-row-actions">
        <button type="button" class="ghost-button compact" @click="emit('add')"><Plus :size="15" />新增</button>
        <button type="button" class="ghost-button compact" :disabled="saving" @click="emit('reset')">
          <RotateCcw :size="15" />
          重置主推
        </button>
        <button type="button" class="primary-button compact" :disabled="saving || !drafts.length" @click="emit('save')">
          <Save :size="15" />
          {{ saving ? '保存中' : '保存轮播' }}
        </button>
      </div>
    </div>

    <div class="admin-carousel-grid">
      <div class="admin-carousel-list" aria-label="轮播列表">
        <article v-for="(slide, index) in drafts" :key="slide.id" :class="['admin-carousel-item', { active: slide.id === selectedId }]">
          <button type="button" class="admin-carousel-select" @click="emit('select', slide.id)">
            <img :src="previewUrl(slide.imageUrl)" :alt="slide.title" :style="{ objectPosition: slide.imagePosition ?? 'center' }" />
            <span>
              <strong>{{ index + 1 }}. {{ slide.title }}</strong>
              <small>{{ slide.enabled ? '展示中' : '已停用' }} · #{{ slide.tag }}</small>
            </span>
          </button>
          <div class="admin-carousel-item-actions">
            <button type="button" title="上移" :disabled="index === 0" @click="emit('move', slide.id, -1)"><ArrowUp :size="14" /></button>
            <button type="button" title="下移" :disabled="index === drafts.length - 1" @click="emit('move', slide.id, 1)"><ArrowDown :size="14" /></button>
            <button type="button" title="移除" :disabled="drafts.length <= 1" @click="emit('remove', slide.id)"><X :size="14" /></button>
          </div>
        </article>
      </div>

      <div v-if="selectedSlide" class="admin-carousel-editor">
        <div class="admin-carousel-preview">
          <img :src="previewUrl(selectedSlide.imageUrl)" :alt="selectedSlide.title" :style="{ objectPosition: selectedSlide.imagePosition ?? 'center' }" />
          <div>
            <span class="section-kicker"><ImageIcon :size="15" /> #{{ selectedSlide.tag }}</span>
            <strong>{{ selectedSlide.title }}</strong>
            <small>{{ selectedSlide.excerpt }}</small>
          </div>
        </div>

        <div class="admin-carousel-form">
          <label>
            轮播标题
            <input
              :value="selectedSlide.title"
              maxlength="80"
              @input="emit('update-slide', selectedSlide.id, { title: ($event.target as HTMLInputElement).value })"
            />
          </label>
          <label>
            摘要文案
            <textarea
              :value="selectedSlide.excerpt"
              rows="3"
              maxlength="180"
              @input="emit('update-slide', selectedSlide.id, { excerpt: ($event.target as HTMLTextAreaElement).value })"
            />
          </label>
          <div class="admin-carousel-fields">
            <label>
              标签
              <input
                :value="selectedSlide.tag"
                maxlength="16"
                @input="emit('update-slide', selectedSlide.id, { tag: ($event.target as HTMLInputElement).value })"
              />
            </label>
            <label>
              图片焦点
              <select
                :value="selectedSlide.imagePosition ?? 'center'"
                @change="emit('update-slide', selectedSlide.id, { imagePosition: ($event.target as HTMLSelectElement).value })"
              >
                <option value="center">居中</option>
                <option value="20% 40%">偏左</option>
                <option value="70% 28%">偏右人物</option>
                <option value="35% 55%">偏下主体</option>
                <option value="50% 20%">偏上主体</option>
              </select>
            </label>
          </div>
          <label>
            跳转链接
            <span class="admin-input-with-icon">
              <Link2 :size="15" />
              <input
                :value="selectedSlide.link"
                placeholder="/post/xxx 或 /discover"
                @input="emit('update-slide', selectedSlide.id, { link: ($event.target as HTMLInputElement).value })"
              />
            </span>
          </label>
          <label class="toggle-row">
            <input
              type="checkbox"
              :checked="selectedSlide.enabled"
              @change="emit('update-slide', selectedSlide.id, { enabled: ($event.target as HTMLInputElement).checked })"
            />
            <span>在首页轮播中启用</span>
          </label>
        </div>

        <div class="admin-image-picker">
          <div class="admin-carousel-toolbar compact">
            <div>
              <strong>更换轮播图</strong>
              <small>可使用内置封面或任意文章封面</small>
            </div>
          </div>
          <button
            v-for="choice in imageChoices"
            :key="choice.url"
            type="button"
            :class="{ active: normalizeImageUrl(selectedSlide.imageUrl) === normalizeImageUrl(choice.url) }"
            @click="emit('select-image', choice)"
          >
            <img :src="previewUrl(choice.url)" :alt="choice.label" :style="{ objectPosition: choice.position }" />
            <span>
              <strong>{{ choice.label }}</strong>
              <small>{{ choice.desc }}</small>
            </span>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
