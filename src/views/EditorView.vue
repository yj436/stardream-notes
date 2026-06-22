<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { MdEditor } from 'md-editor-v3'
import type { Footers, ToolbarNames } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import {
  CalendarClock,
  CheckCircle2,
  Code2,
  Columns3,
  Eye,
  FileText,
  History,
  ImagePlus,
  Link2,
  Minus,
  RotateCcw,
  Save,
  Send,
  Smile,
} from 'lucide-vue-next'
import MarkdownRenderer from '@/components/MarkdownRenderer.vue'
import { imageAssets } from '@/api/mock'
import { useBlogStore } from '@/stores/blog'
import type { ImageAsset, PostType } from '@/types/content'
import { formatDateTime, formatUnixTimestamp } from '@/utils/time'
import { extractArticleHeadings, type ArticleHeading } from '@/utils/heading'
import { appApi } from '@/api/appApi'
import { moderateContent } from '@/composables/useModeration'
import { useAppTheme } from '@/composables/useAppTheme'
import { imageAlt, imageLabel, imageUrl, markdownImageAlt, normalizeImageAsset, normalizeImageAssets } from '@/utils/image'

const blog = useBlogStore()
const router = useRouter()
const route = useRoute()
const { isDark } = useAppTheme()
const savedMessage = ref('')
const editingPostId = ref<string | null>(null)
const autosaveTimer = ref<number | null>(null)
const uploading = ref(false)
const uploadInputRef = ref<HTMLInputElement | null>(null)
const editorMode = ref<'write' | 'split' | 'preview'>('split')
const activeOutlineId = ref('')
const editorToolbars: ToolbarNames[] = [
  'bold',
  'italic',
  'strikeThrough',
  'title',
  'quote',
  'unorderedList',
  'orderedList',
  'task',
  'codeRow',
  'code',
  'link',
  'table',
  'revoke',
  'next',
  'save',
]
const editorToolbarExclude: ToolbarNames[] = []
const editorFooters: Footers[] = ['markdownTotal', '=', 'scrollSwitch']
const form = reactive({
  title: '',
  content: '',
  tagsText: '原创企划,绘画教程',
  type: 'article' as PostType,
  images: [] as ImageAsset[],
})

const tags = computed(() => form.tagsText.split(',').map((tag) => tag.trim()).filter(Boolean))
const canPublish = computed(() => form.title.trim().length >= 4 && form.content.trim().length >= 20)
const editingPost = computed(() => blog.posts.find((post) => post.id === editingPostId.value))
const wordCount = computed(() => form.content.replace(/\s/g, '').length)
const readingMinutes = computed(() => Math.max(1, Math.ceil(wordCount.value / 350)))
const draftSnapshotCount = computed(() => blog.draftSnapshots.length)
const coverImage = computed(() => form.images[0])
const paragraphCount = computed(() => form.content.split(/\n{2,}/).filter((item) => item.trim()).length)
const outline = computed(() => extractArticleHeadings(form.content, 12, { minDepth: 1, maxDepth: 3 }))
const outlineSummary = computed(() => (outline.value.length ? `${outline.value.length} 个标题` : '等待标题'))
const sensitiveWords = ['暴力', '血腥', '广告', '辱骂']
const contentWarnings = computed(() => sensitiveWords.filter((word) => `${form.title} ${form.content} ${form.tagsText}`.includes(word)))
const writingScore = computed(() => publishChecks.value.filter((item) => item.ok).length / publishChecks.value.length)
const writingStatus = computed(() => {
  if (writingScore.value >= 1 && !contentWarnings.value.length) return '可发布'
  if (writingScore.value >= 0.75) return '接近完成'
  return '继续打磨'
})

const publishChecks = computed(() => [
  { label: '已登录创作者账号', ok: blog.isAuthenticated },
  { label: '标题不少于 4 个字', ok: form.title.trim().length >= 4 },
  { label: '正文不少于 20 个字', ok: form.content.trim().length >= 20 },
  { label: '至少设置 1 个标签', ok: tags.value.length > 0 },
])
const publishProgress = computed(() => publishChecks.value.filter((item) => item.ok).length)
const publishHint = computed(() => {
  if (!blog.isAuthenticated) return '登录后即可发布，当前内容仍可继续编辑。'
  if (!canPublish.value) return '补齐标题和正文长度后即可发布。'
  if (contentWarnings.value.length) return '检测到敏感词提示，建议确认表达后再发布。'
  return editingPost.value ? '内容已满足保存修改条件。' : '内容已满足发布条件，可以投递到推荐流。'
})

const formatSnapshotTime = (value: string) =>
  new Date(value).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })

const snapshotExcerpt = (content: string) => {
  const clean = content.replace(/\s+/g, ' ').trim()
  return clean.length > 54 ? `${clean.slice(0, 54)}...` : clean || '空白版本'
}

const appendMarkdownBlock = (text: string) => {
  const block = text.trimEnd()
  const separator = form.content.trim() ? (form.content.endsWith('\n') ? '\n' : '\n\n') : ''
  form.content = `${form.content}${separator}${block}`
}

const insertEmoji = (emoji: string) => {
  form.content = `${form.content}${emoji}`
}

const insertTimestamp = () => {
  const now = new Date()
  appendMarkdownBlock(`> 时间戳：${formatDateTime(now)} | Unix ${formatUnixTimestamp(now)}`)
}

const insertLink = () => {
  appendMarkdownBlock('[链接文字](https://example.com)')
}

const insertCodeBlock = () => {
  appendMarkdownBlock('```ts\n// 写下代码片段或创作参数\n```')
}

const insertDivider = () => {
  appendMarkdownBlock('---')
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const lineToOffset = (line: number) => {
  const lines = form.content.split('\n')
  return lines.slice(0, Math.max(0, line - 1)).reduce((total, item) => total + item.length + 1, 0)
}

const focusEditorLine = async (item: ArticleHeading) => {
  if (editorMode.value === 'preview') editorMode.value = 'split'
  activeOutlineId.value = item.id
  await nextTick()

  const offset = lineToOffset(item.line)
  const editor = document.getElementById('stardream-post-editor')
  const textarea = editor?.querySelector<HTMLTextAreaElement>('textarea')
  if (textarea) {
    const lineHeight = textarea.scrollHeight / Math.max(1, form.content.split('\n').length)
    textarea.focus()
    textarea.setSelectionRange(offset, offset)
    textarea.scrollTop = Math.max(0, (item.line - 3) * lineHeight)
    return
  }

  const content = editor?.querySelector<HTMLElement>('.cm-content')
  const line = editor?.querySelectorAll<HTMLElement>('.cm-line')[item.line - 1]
  content?.focus()
  line?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  if (!line) return

  const range = document.createRange()
  range.selectNodeContents(line)
  range.collapse(true)
  const selection = window.getSelection()
  selection?.removeAllRanges()
  selection?.addRange(range)
}

const insertTemplate = (type: 'inspiration' | 'tutorial' | 'review') => {
  const templates = {
    inspiration: `## 灵感捕捉\n\n- 画面关键词：星空、柔光、角色剪影\n- 想传达的情绪：\n- 参考场景：\n\n## 创作过程\n\n1. 草图构图\n2. 色彩试验\n3. 最终细化`,
    tutorial: `## 本次教程目标\n\n先用一句话说明读者看完能学会什么。\n\n## 步骤拆解\n\n1. 准备素材\n2. 建立基础形状\n3. 添加光影层次\n4. 导出与发布\n\n## 常见问题\n\n- 问题：\n- 解决方式：`,
    review: `## 追番短评\n\n**推荐指数：** ★★★★☆\n\n## 最喜欢的一幕\n\n写下角色、场景或台词。\n\n## 适合谁看\n\n- 喜欢治愈系节奏的观众\n- 想找深夜放松作品的人`,
  }
  appendMarkdownBlock(templates[type])
}

const triggerUpload = () => {
  uploadInputRef.value?.click()
}

const addImageAsset = (url: string, alt = '作品图') => {
  const asset = normalizeImageAsset({ url, alt }, alt)
  if (!asset) return
  const exists = form.images.some((image) => imageUrl(image) === asset.url)
  if (!exists) form.images.push(asset)
}

const insertImageMarkdown = (url: string, alt = '作品图') => {
  const asset = normalizeImageAsset({ url, alt }, alt)
  if (!asset) return
  addImageAsset(asset.url, asset.alt)
  appendMarkdownBlock(`![${markdownImageAlt(asset.alt)}](${asset.url})`)
}

const createFallbackImage = () => (form.images.length % 2 === 0 ? imageAssets.hero : imageAssets.creators)

const save = async () => {
  if (!blog.isAuthenticated) {
    blog.notify('请先登录后保存草稿', 'warning')
    await router.push('/login')
    return
  }
  await blog.saveDraft({ title: form.title, content: form.content, tags: tags.value, images: normalizeImageAssets(form.images, form.title || '草稿图片') })
  savedMessage.value = `草稿已保存：${new Date(blog.draft.savedAt ?? '').toLocaleTimeString('zh-CN')}`
}

const handleEditorSave = () => {
  void save()
}

const restoreSnapshot = async (id: string) => {
  const restored = await blog.restoreDraftSnapshot(id)
  if (!restored) return
  form.title = restored.title
  form.content = restored.content
  form.tagsText = restored.tags.join(',')
  form.images = normalizeImageAssets(restored.images, restored.title || '草稿图片')
  savedMessage.value = `已恢复版本：${new Date(restored.savedAt ?? '').toLocaleTimeString('zh-CN')}`
}

const addMockImage = () => {
  insertImageMarkdown(createFallbackImage())
}

const updateImageAlt = (url: string, alt: string) => {
  const safeAlt = markdownImageAlt(alt)
  form.images = form.images.map((image) => (imageUrl(image) === url ? { ...image, alt: safeAlt } : image))
  const markdownPattern = new RegExp(`!\\[[^\\]]*\\]\\(${escapeRegExp(url)}\\)`, 'g')
  form.content = form.content.replace(markdownPattern, `![${safeAlt}](${url})`)
}

const removeImage = (image: ImageAsset) => {
  const url = imageUrl(image)
  form.images = form.images.filter((item) => imageUrl(item) !== url)
}

const uploadImageFile = async (file: File) => {
  if (!file) return
  uploading.value = true
  const url = await appApi.uploadImage(file)
  if (url) {
    insertImageMarkdown(url, file.name || '上传图片')
    blog.notify('图片上传成功', 'success')
  } else {
    blog.notify('图片上传失败，已使用模拟图片替代', 'warning')
    insertImageMarkdown(createFallbackImage())
  }
  uploading.value = false
}

const handleFileUpload = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) await uploadImageFile(file)
  ;(e.target as HTMLInputElement).value = ''
}

const handleMdUploadImg = async (
  files: Array<File>,
  callback: (urls: Array<{ url: string; alt: string; title: string }>) => void,
) => {
  uploading.value = true
  const uploaded: Array<{ url: string; alt: string; title: string }> = []
  for (const file of files) {
    const url = await appApi.uploadImage(file)
    if (url) {
      addImageAsset(url, file.name || '上传图片')
      uploaded.push({ url, alt: file.name || '上传图片', title: file.name || '上传图片' })
    }
  }
  if (!uploaded.length) {
    const fallback = createFallbackImage()
    addImageAsset(fallback, '作品图')
    uploaded.push({ url: fallback, alt: '作品图', title: '模拟图片' })
    blog.notify('图片上传失败，已使用模拟图片替代', 'warning')
  } else {
    blog.notify(`已上传 ${uploaded.length} 张图片`, 'success')
  }
  callback(uploaded)
  uploading.value = false
}

const publish = async () => {
  if (!blog.isAuthenticated) {
    blog.notify('请先登录后发布文章', 'warning')
    await router.push('/login')
    return
  }
  if (!canPublish.value) {
    blog.notify('标题至少 4 个字，正文至少 20 个字', 'warning')
    return
  }
  const moderation = moderateContent(`${form.title} ${form.content} ${form.tagsText}`)
  if (moderation.severity === 'block') {
    blog.notify(moderation.message, 'warning')
    return
  }
  if (moderation.severity === 'suggest') blog.notify(moderation.message, 'warning')
  const payload = { title: form.title, content: form.content, tags: tags.value, images: normalizeImageAssets(form.images, form.title || '作品图'), type: form.type }
  const post = editingPostId.value ? await blog.updatePost(editingPostId.value, payload) : await blog.publishPost(payload)
  if (!post) return
  form.title = ''
  form.content = ''
  form.tagsText = '原创企划'
  form.type = 'article'
  form.images = []
  void router.push(`/post/${post.id}`)
}

onMounted(async () => {
  await blog.bootstrap()
  const editId = typeof route.query.edit === 'string' ? route.query.edit : null
  editingPostId.value = editId
  if (editId) {
    const target = blog.posts.find((post) => post.id === editId)
    if (!target || (target.authorId !== blog.currentUserId && !blog.isAdmin)) {
      blog.notify('只能编辑自己的文章', 'warning')
      await router.replace('/')
      return
    }
    form.title = target.title
    form.content = target.content
    form.tagsText = target.tags.join(',')
    form.type = target.type
    form.images = normalizeImageAssets(target.gallery, target.title || '作品图')
    return
  }
  form.title = blog.draft.title
  form.content = blog.draft.content
  form.tagsText = blog.draft.tags.join(',')
  form.images = normalizeImageAssets(blog.draft.images, blog.draft.title || '草稿图片')
})

watch(
  () => [form.title, form.content, form.tagsText, form.type, JSON.stringify(form.images)],
  () => {
    if (!blog.isAuthenticated || editingPostId.value) return
    if (autosaveTimer.value) window.clearTimeout(autosaveTimer.value)
    autosaveTimer.value = window.setTimeout(() => {
      void blog.saveDraft({ title: form.title, content: form.content, tags: tags.value, images: normalizeImageAssets(form.images, form.title || '草稿图片') })
      savedMessage.value = `已自动保存：${new Date().toLocaleTimeString('zh-CN')}`
    }, 1600)
  },
)
</script>

<template>
  <section :class="['editor-layout', `mode-${editorMode}`]">
    <form class="editor-panel editor-workbench" @submit.prevent="publish">
      <div class="section-title">
        <div>
          <span class="section-kicker">创作工作台</span>
          <h1>{{ editingPost ? '编辑星梦笔记' : '写一篇新的星梦笔记' }}</h1>
        </div>
      </div>

      <div class="editor-command">
        <div>
          <strong>{{ editingPost ? '正在修改已发布内容' : '发布到星梦推荐流' }}</strong>
          <span>{{ publishHint }}</span>
        </div>
        <span class="status-pill">{{ publishProgress }}/{{ publishChecks.length }} 项完成</span>
      </div>

      <label>
        标题
        <input v-model="form.title" maxlength="80" placeholder="例如：把星空画进博客封面" />
      </label>

      <div class="editor-meta-grid">
        <label>
          标签
          <input v-model="form.tagsText" placeholder="用英文逗号分隔，例如：原创企划,追番记录" />
        </label>
        <label>
          内容类型
          <select v-model="form.type">
            <option value="article">文章</option>
            <option value="gallery">作品画廊</option>
            <option value="record">追番记录</option>
          </select>
        </label>
      </div>

      <div class="rich-editor-shell">
        <div class="rich-editor-head">
          <div>
            <span class="section-kicker">富文本编辑</span>
            <strong>Markdown 增强编辑器</strong>
          </div>
          <div class="editor-modebar" aria-label="编辑模式">
            <button type="button" :class="{ active: editorMode === 'write' }" title="专注编辑" @click="editorMode = 'write'">
              <FileText :size="16" />编辑
            </button>
            <button type="button" :class="{ active: editorMode === 'split' }" title="编辑与预览分屏" @click="editorMode = 'split'">
              <Columns3 :size="16" />分屏
            </button>
            <button type="button" :class="{ active: editorMode === 'preview' }" title="只看预览" @click="editorMode = 'preview'">
              <Eye :size="16" />预览
            </button>
          </div>
        </div>

        <div class="editor-snippet-row">
          <button type="button" class="text-button" @click="insertTemplate('inspiration')">灵感结构</button>
          <button type="button" class="text-button" @click="insertTemplate('tutorial')">教程结构</button>
          <button type="button" class="text-button" @click="insertTemplate('review')">追番短评</button>
          <button type="button" class="text-button" title="插入链接" @click="insertLink"><Link2 :size="16" />链接</button>
          <button type="button" class="text-button" title="插入代码块" @click="insertCodeBlock"><Code2 :size="16" />代码</button>
          <button type="button" class="text-button" title="插入分割线" @click="insertDivider"><Minus :size="16" />分割线</button>
          <button type="button" class="text-button" title="插入星标" @click="insertEmoji(' ★')"><Smile :size="16" />星标</button>
          <button type="button" class="text-button" title="插入当前时间戳" @click="insertTimestamp"><CalendarClock :size="16" />时间</button>
        </div>

        <MdEditor
          v-if="editorMode !== 'preview'"
          v-model="form.content"
          id="stardream-post-editor"
          class="stardream-md-editor"
          language="zh-CN"
          preview-theme="github"
          code-theme="atom"
          placeholder="写下你的灵感、过程、追番短评... 支持粘贴/上传图片、表格、任务列表和代码块。"
          :theme="isDark ? 'dark' : 'light'"
          :preview="editorMode === 'split'"
          :input-box-width="editorMode === 'write' ? '100%' : '54%'"
          :toolbars="editorToolbars"
          :toolbars-exclude="editorToolbarExclude"
          :footers="editorFooters"
          :no-mermaid="true"
          :no-katex="true"
          :no-echarts="true"
          :no-highlight="true"
          :no-prettier="true"
          :no-upload-img="true"
          :show-toolbar-name="false"
          :on-save="handleEditorSave"
          :on-upload-img="handleMdUploadImg"
        />
        <div v-else class="editor-preview-inline">
          <MarkdownRenderer v-if="form.content.trim()" :content="form.content" />
          <p v-else class="empty-note">正文会在这里渲染成文章预览。</p>
        </div>
      </div>

      <div class="upload-row">
        <button type="button" class="ghost-button" @click="triggerUpload"><ImagePlus :size="18" />{{ uploading ? '上传中...' : '上传图片' }}</button>
        <button type="button" class="ghost-button" @click="addMockImage"><ImagePlus :size="18" />模拟添加图片</button>
        <input ref="uploadInputRef" class="file-input-hidden" type="file" accept="image/png,image/jpeg,image/gif,image/webp" @change="handleFileUpload" />
        <span>{{ form.images.length }} 张图片</span>
      </div>

      <div class="editor-metrics">
        <span>{{ wordCount }} 字</span>
        <span>{{ paragraphCount }} 段落</span>
        <span>约 {{ readingMinutes }} 分钟阅读</span>
        <span>{{ writingStatus }}</span>
        <span v-if="contentWarnings.length" class="warning-text">需注意：{{ contentWarnings.join('、') }}</span>
        <span v-else>内容检查通过</span>
      </div>

      <div class="publish-checks">
        <span v-for="item in publishChecks" :key="item.label" :class="{ done: item.ok }"><CheckCircle2 :size="15" />{{ item.label }}</span>
      </div>

      <div class="editor-actions">
        <button type="button" class="ghost-button" @click="save"><Save :size="18" />保存草稿</button>
        <button type="submit" class="primary-button"><Send :size="18" />{{ editingPost ? '保存修改' : '发布文章' }}</button>
        <span>{{ savedMessage }}</span>
      </div>
      <section v-if="!editingPost" class="draft-history-panel">
        <div class="draft-history-head">
          <span class="section-kicker"><History :size="16" /> 草稿版本</span>
          <small>最近 {{ draftSnapshotCount }}/5 个自动快照</small>
        </div>
        <div v-if="blog.draftSnapshots.length" class="draft-history-list">
          <button v-for="snapshot in blog.draftSnapshots" :key="snapshot.id" type="button" @click="restoreSnapshot(snapshot.id)">
            <span>
              <strong>{{ snapshot.title || '未命名草稿' }}</strong>
              <small>{{ snapshotExcerpt(snapshot.content) }}</small>
            </span>
            <em>{{ formatSnapshotTime(snapshot.createdAt) }}</em>
            <RotateCcw :size="15" />
          </button>
        </div>
        <p v-else class="empty-note">保存草稿后会保留最近 5 个版本，可随时恢复。</p>
      </section>
    </form>

    <aside v-if="editorMode === 'split'" class="preview-panel editor-preview-rail">
      <span class="section-kicker">实时预览</span>
      <h2>{{ form.title || '未命名笔记' }}</h2>
      <div class="tag-row">
        <span v-for="tag in tags" :key="tag">#{{ tag }}</span>
      </div>
      <div v-if="coverImage" class="preview-cover">
        <img :src="imageUrl(coverImage)" :alt="imageAlt(coverImage, form.title || '预览封面')" />
      </div>
      <div class="editor-outline">
        <div class="editor-outline-head">
          <strong>文章大纲</strong>
          <small>{{ outlineSummary }}</small>
        </div>
        <button
          v-for="item in outline"
          :key="item.id"
          type="button"
          :class="['editor-outline-item', `level-${item.depth}`, { active: activeOutlineId === item.id }]"
          @click="focusEditorLine(item)"
        >
          <span>{{ item.text }}</span>
          <small>第 {{ item.line }} 行</small>
        </button>
        <p v-if="!outline.length" class="empty-note">用 #、## 或 ### 写下标题后，这里会生成可跳转的大纲。</p>
      </div>
      <div v-if="form.images.length" class="editor-asset-strip">
        <strong>图片资产</strong>
        <div v-for="image in form.images" :key="image.url" class="editor-asset-chip">
          <img :src="imageUrl(image)" :alt="imageAlt(image, form.title || '文章图片')" />
          <div class="editor-asset-copy">
            <span>{{ imageLabel(image) }}</span>
            <input
              :value="image.alt"
              maxlength="80"
              placeholder="图片替代文本，可用于无障碍和 SEO"
              @input="updateImageAlt(image.url, ($event.target as HTMLInputElement).value)"
            />
          </div>
          <button type="button" title="移除图片" @click="removeImage(image)">移除</button>
        </div>
      </div>
      <MarkdownRenderer v-if="form.content.trim()" :content="form.content" />
      <p v-else class="empty-note">正文会在这里变成一张轻博客预览卡片。</p>
    </aside>
  </section>
</template>
