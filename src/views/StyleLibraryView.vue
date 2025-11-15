<template>
  <div class="style-library-view">
    <div class="container">
      <h1>文风库管理</h1>
      <p class="subtitle">构建您的个人文风数据库</p>

      <!-- 添加内容 -->
      <div class="section accent-red">
        <h2>添加内容</h2>

        <!-- 文档上传 -->
        <div class="upload-section">
          <h3>上传文档</h3>
          <p>支持 .txt 和 .md 格式</p>
          <input
            type="file"
            ref="fileInput"
            @change="handleFileUpload"
            accept=".txt,.md"
            multiple
            style="display: none"
          />
          <button @click="$refs.fileInput.click()">选择文件</button>
        </div>

        <!-- URL 导入 -->
        <div class="url-input">
          <h3>从链接导入</h3>
          <p>✨ 自动提取微信公众号文章、博客等网页内容</p>
          <input
            v-model="urlInput"
            type="url"
            placeholder="粘贴文章链接，例如：https://mp.weixin.qq.com/s/..."
            class="mt-sm"
          />
          <button @click="handleUrlImport" class="mt-sm" :disabled="!urlInput.trim() || isLoadingUrl">
            {{ isLoadingUrl ? '正在提取...' : '自动提取并导入' }}
          </button>
        </div>

        <!-- 手动输入 -->
        <div class="manual-input">
          <h3>或直接粘贴内容</h3>
          <textarea
            v-model="manualContent"
            placeholder="粘贴您的文章内容..."
            rows="8"
          ></textarea>
          <input
            v-model="manualTitle"
            type="text"
            placeholder="标题（可选）"
            class="mt-sm"
          />
          <button @click="handleManualAdd" class="mt-sm" :disabled="!manualContent.trim()">
            添加到文风库
          </button>
        </div>
      </div>

      <!-- 已导入内容 -->
      <div class="section">
        <div class="section-header">
          <h2>已导入内容</h2>
          <button @click="reanalyze" class="secondary" :disabled="library.sources.length === 0">
            重新分析
          </button>
        </div>

        <div v-if="library.sources.length === 0" class="empty-state">
          <p>还没有内容，请先添加您的文章来构建文风库</p>
        </div>

        <div v-else class="sources-list">
          <div v-for="source in library.sources" :key="source.id" class="source-item card">
            <div class="source-header">
              <h3>{{ source.title || '未命名' }}</h3>
              <button @click="removeSource(source.id)" class="delete-btn">删除</button>
            </div>
            <div class="source-meta">
              <span class="badge">{{ source.type }}</span>
              <span>{{ source.content.length }} 字</span>
              <span>{{ formatDate(source.timestamp) }}</span>
            </div>
            <div class="source-preview">
              {{ source.content.slice(0, 150) }}...
            </div>
          </div>
        </div>
      </div>

      <!-- 文风分析结果 -->
      <div v-if="library.analysis" class="section accent-blue">
        <h2>文风分析结果</h2>

        <div class="analysis-grid">
          <div class="analysis-item">
            <h4>总字数</h4>
            <p class="number">{{ library.analysis.totalWords.toLocaleString() }}</p>
          </div>

          <div class="analysis-item">
            <h4>语气风格</h4>
            <p>{{ getToneLabel(library.analysis.tone) }}</p>
          </div>

          <div class="analysis-item">
            <h4>平均句长</h4>
            <p>{{ library.analysis.avgSentenceLength }} 字</p>
          </div>
        </div>

        <div class="keywords-section mt-md">
          <h4>核心关键词</h4>
          <div class="keywords">
            <span
              v-for="kw in library.analysis.keywords.slice(0, 20)"
              :key="kw.word"
              class="keyword-tag"
            >
              {{ kw.word }} ({{ kw.count }})
            </span>
          </div>
        </div>

        <div class="phrases-section mt-md">
          <h4>常用短语</h4>
          <div class="phrases">
            <span
              v-for="phrase in library.analysis.commonPhrases"
              :key="phrase.phrase"
              class="phrase-tag"
            >
              {{ phrase.phrase }}
            </span>
          </div>
        </div>

        <button @click="clearLibrary" class="mt-md secondary">清空文风库</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import {
  getStyleLibrary,
  addToStyleLibrary,
  removeFromStyleLibrary,
  clearStyleLibrary,
  saveStyleLibrary
} from '../utils/storage'
import { analyzeWritingStyle, cleanContent } from '../utils/styleAnalysis'
import { detectUrlType, extractWechatArticle, extractWebContent } from '../utils/urlExtractor'

const library = ref({ sources: [], analysis: null, totalWords: 0 })
const manualContent = ref('')
const manualTitle = ref('')
const urlInput = ref('')
const isLoadingUrl = ref(false)
const fileInput = ref(null)

onMounted(async () => {
  library.value = await getStyleLibrary()
})

const handleFileUpload = async (event) => {
  const files = event.target.files
  if (!files || files.length === 0) return

  for (const file of files) {
    try {
      const content = await readFile(file)
      // 清洗内容，移除公众号系统文字
      const cleanedContent = cleanContent(content)

      if (!cleanedContent || cleanedContent.length < 50) {
        alert(`文件 ${file.name} 内容太少或清洗后为空，已跳过`)
        continue
      }

      await addToStyleLibrary({
        type: 'document',
        title: file.name,
        content: cleanedContent,
        url: null
      })
    } catch (error) {
      alert(`读取文件 ${file.name} 失败: ${error.message}`)
    }
  }

  library.value = await getStyleLibrary()
  await reanalyze()

  // 重置输入
  event.target.value = ''
}

const readFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = (e) => reject(new Error('文件读取失败'))
    reader.readAsText(file)
  })
}

const handleManualAdd = async () => {
  if (!manualContent.value.trim()) return

  // 清洗内容，移除公众号系统文字
  const cleanedContent = cleanContent(manualContent.value.trim())

  if (!cleanedContent || cleanedContent.length < 50) {
    alert('内容太少或清洗后为空，请检查内容是否包含有效文字')
    return
  }

  await addToStyleLibrary({
    type: 'manual',
    title: manualTitle.value || '手动添加',
    content: cleanedContent,
    url: null
  })

  library.value = await getStyleLibrary()
  await reanalyze()

  // 重置输入
  manualContent.value = ''
  manualTitle.value = ''
}

const handleUrlImport = async () => {
  if (!urlInput.value.trim()) return

  isLoadingUrl.value = true

  try {
    const url = urlInput.value.trim()

    // 验证 URL 格式
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      alert('请输入完整的链接（以 http:// 或 https:// 开头）')
      isLoadingUrl.value = false
      return
    }

    const urlType = detectUrlType(url)

    console.log('开始导入:', { url, urlType })

    let article

    if (urlType === 'wechat') {
      // 使用 CORS 代理提取微信公众号文章
      article = await extractWechatArticle(url)
    } else {
      // 提取其他网页内容
      article = await extractWebContent(url)
    }

    console.log('提取成功:', article)

    // 清洗内容
    const cleanedContent = cleanContent(article.content)

    if (!cleanedContent || cleanedContent.length < 50) {
      alert('提取的内容太少或清洗后为空，请检查链接是否正确\n\n提取到的内容长度: ' + (cleanedContent?.length || 0) + ' 字')
      return
    }

    // 添加到文风库
    await addToStyleLibrary({
      type: 'url',
      title: article.title,
      content: cleanedContent,
      url: url
    })

    library.value = await getStyleLibrary()
    await reanalyze()

    urlInput.value = ''
    alert(`✅ 导入成功！\n\n标题: ${article.title}\n内容: ${cleanedContent.length} 字`)
  } catch (error) {
    console.error('导入失败详情:', error)

    // 显示详细错误信息
    let errorMsg = `导入失败: ${error.message}`

    // 如果是网络错误，提供额外帮助
    if (error.message.includes('Failed to fetch') || error.message.includes('网络')) {
      errorMsg += '\n\n💡 解决方案：\n'
      errorMsg += '1. 检查网络连接是否正常\n'
      errorMsg += '2. 尝试使用"直接粘贴内容"功能\n'
      errorMsg += '3. 打开浏览器控制台查看详细日志'
    }

    alert(errorMsg)
  } finally {
    isLoadingUrl.value = false
  }
}

const removeSource = async (id) => {
  if (!confirm('确定要删除这条内容吗？')) return

  library.value = await removeFromStyleLibrary(id)
  await reanalyze()
}

const clearLibrary = async () => {
  if (!confirm('确定要清空整个文风库吗？此操作不可恢复！')) return

  await clearStyleLibrary()
  library.value = { sources: [], analysis: null, totalWords: 0 }
}

const reanalyze = async () => {
  if (library.value.sources.length === 0) {
    library.value.analysis = null
    await saveStyleLibrary(library.value)
    return
  }

  library.value.analysis = analyzeWritingStyle(library.value.sources)
  library.value.totalWords = library.value.analysis.totalWords
  await saveStyleLibrary(library.value)
}

const formatDate = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleDateString('zh-CN')
}

const getToneLabel = (tone) => {
  const map = {
    casual: '轻松随意',
    formal: '正式严谨',
    humorous: '幽默风趣',
    neutral: '中性客观'
  }
  return map[tone] || tone
}
</script>

<style scoped>
.style-library-view {
  padding: var(--spacing-lg) 0;
}

.subtitle {
  color: var(--color-gray-dark);
  margin-bottom: var(--spacing-lg);
}

.section {
  margin-bottom: var(--spacing-xl);
  padding: var(--spacing-md);
  background-color: var(--color-white);
  border: 1px solid var(--color-gray);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.upload-section, .manual-input, .url-input {
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-lg);
  border-bottom: 1px solid var(--color-gray);
}

.upload-section:last-child, .manual-input:last-child, .url-input:last-child {
  border-bottom: none;
  padding-bottom: 0;
  margin-bottom: 0;
}

.empty-state {
  text-align: center;
  padding: var(--spacing-xl);
  color: var(--color-gray-dark);
}

.sources-list {
  display: grid;
  gap: var(--spacing-md);
}

.source-item {
  padding: var(--spacing-md);
}

.source-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: var(--spacing-sm);
}

.source-header h3 {
  margin: 0;
  font-size: 18px;
}

.delete-btn {
  padding: 6px 12px;
  font-size: 12px;
  background-color: var(--color-white);
  color: var(--color-red);
  border-color: var(--color-red);
}

.delete-btn:hover {
  background-color: var(--color-red);
  color: var(--color-white);
}

.source-meta {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
  font-size: 12px;
  color: var(--color-gray-dark);
}

.badge {
  background-color: var(--color-black);
  color: var(--color-white);
  padding: 2px 8px;
  text-transform: uppercase;
  font-weight: 700;
}

.source-preview {
  color: var(--color-gray-dark);
  font-size: 14px;
  line-height: 1.6;
}

.analysis-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.analysis-item {
  padding: var(--spacing-md);
  background-color: var(--color-gray-light);
  border: 1px solid var(--color-gray);
  text-align: center;
}

.analysis-item h4 {
  margin: 0 0 var(--spacing-xs) 0;
  font-size: 14px;
  text-transform: uppercase;
  color: var(--color-gray-dark);
}

.analysis-item p {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
}

.analysis-item .number {
  font-size: 32px;
  color: var(--color-red);
}

.keywords, .phrases {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.keyword-tag, .phrase-tag {
  display: inline-block;
  padding: 6px 12px;
  background-color: var(--color-gray-light);
  border: 1px solid var(--color-gray);
  font-size: 14px;
}

@media (max-width: 768px) {
  .analysis-grid {
    grid-template-columns: 1fr;
  }

  .source-header {
    flex-direction: column;
    gap: var(--spacing-sm);
  }
}
</style>
