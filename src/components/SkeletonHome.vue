<script setup lang="ts">
import { computed } from 'vue'
import { useBlogStore } from '@/stores/blog'

defineProps<{ count?: number }>()

const blog = useBlogStore()
const loading = computed(() => blog.loading)
</script>

<template>
  <div v-if="loading" class="home-magazine">
    <div class="hero-panel skeleton" style="min-height: 430px" />
    <div class="featured-grid">
      <div v-for="i in 3" :key="i" class="feature-tile skeleton" style="min-height: 190px" />
    </div>
    <div class="home-grid">
      <div class="main-column">
        <div class="section-block">
          <div class="section-title">
            <div class="skeleton" style="width: 200px; height: 32px" />
          </div>
          <div class="post-list">
            <div v-for="i in (count ?? 3)" :key="i" class="post-card">
              <div class="post-cover">
                <div class="skeleton" style="width: 100%; height: 100%; min-height: 210px" />
              </div>
              <div class="post-body">
                <div class="post-meta">
                  <div class="skeleton" style="width: 100px; height: 24px" />
                  <div class="skeleton" style="width: 70px; height: 20px" />
                </div>
                <div class="skeleton" style="width: 75%; height: 24px" />
                <div class="skeleton" style="width: 90%; height: 14px" />
                <div class="skeleton" style="width: 55%; height: 14px" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <aside class="side-column">
        <div class="side-card">
          <div class="skeleton" style="width: 100%; height: 200px" />
        </div>
        <div class="side-card">
          <div class="skeleton" style="width: 100%; height: 160px" />
        </div>
      </aside>
    </div>
  </div>
  <slot v-else />
</template>
