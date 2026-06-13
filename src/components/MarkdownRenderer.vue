<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

const props = defineProps<{
  content: string
}>()

const rendered = ref('')

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const renderMarkdown = async (text: string) => {
  try {
    const { marked } = await import('marked')
    const result = await marked.parse(text, { breaks: true, gfm: true })
    rendered.value = typeof result === 'string' ? result : ''
  } catch {
    rendered.value = text
      .split('\n\n')
      .map((p) => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
      .join('')
  }
}

onMounted(() => {
  void renderMarkdown(props.content)
})

watch(
  () => props.content,
  (content) => {
    void renderMarkdown(content)
  },
)
</script>

<template>
  <div class="markdown-body" v-html="rendered" />
</template>
