<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import type { Tokens } from 'marked'
import { getUniqueHeadingId } from '@/utils/heading'

const props = defineProps<{
  content: string
}>()

const rendered = ref('')

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const renderMarkdown = async (text: string) => {
  try {
    const { marked, Renderer } = await import('marked')
    const renderer = new Renderer()
    const usedHeadingIds = new Map<string, number>()

    renderer.heading = ({ tokens, depth, text: headingText }: Tokens.Heading) => {
      const id = getUniqueHeadingId(headingText, usedHeadingIds)
      const content = renderer.parser.parseInline(tokens)
      return `<h${depth} id="${id}" tabindex="-1">${content}</h${depth}>\n`
    }

    const result = await marked.parse(text, { breaks: true, gfm: true, renderer })
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
