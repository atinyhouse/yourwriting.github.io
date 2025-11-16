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
          <p>✨ 支持单篇文章或整个博客/网站批量导入</p>
          <input
            v-model="urlInput"
            type="url"
            placeholder="粘贴链接：文章链接 或 博客首页"
            class="mt-sm"
          />
          <div class="button-group mt-sm">
            <button @click="handleUrlImport" :disabled="!urlInput.trim() || isLoadingUrl">
              {{ isLoadingUrl ? '正在提取...' : '导入单篇文章' }}
            </button>
            <button @click="handleBatchImport" class="secondary" :disabled="!urlInput.trim() || isLoadingUrl">
              {{ isLoadingUrl ? '批量提取中...' : '批量爬取网站' }}
            </button>
          </div>

          <!-- 微信公众号批量导入 -->
          <div class="wechat-html-import mt-md">
            <details open>
              <summary style="cursor: pointer; font-weight: 600; margin-bottom: var(--spacing-sm);">
                🔧 微信公众号批量导入
              </summary>
              <div class="wechat-import-content">
                <!-- 方法选择 -->
                <div style="display: flex; gap: var(--spacing-sm); margin-bottom: var(--spacing-md);">
                  <button
                    @click="wechatImportMethod = 'cookie'"
                    :class="['method-toggle-btn', { active: wechatImportMethod === 'cookie' }]"
                    style="flex: 1; padding: 10px; font-size: 13px; font-weight: 600; border: 2px solid var(--color-gray); background: white; cursor: pointer;"
                  >
                    🔑 方法1：biz + Cookie（推荐）
                  </button>
                  <button
                    @click="wechatImportMethod = 'html'"
                    :class="['method-toggle-btn', { active: wechatImportMethod === 'html' }]"
                    style="flex: 1; padding: 10px; font-size: 13px; font-weight: 600; border: 2px solid var(--color-gray); background: white; cursor: pointer;"
                  >
                    📄 方法2：粘贴 HTML
                  </button>
                </div>

                <!-- 方法1：biz + Cookie -->
                <div v-if="wechatImportMethod === 'cookie'" class="import-method">
                  <p style="margin-bottom: var(--spacing-sm); font-size: 14px; color: var(--color-gray-dark); font-weight: 600;">
                    📋 操作步骤（6步）
                  </p>
                  <ol style="margin-left: 20px; font-size: 13px; line-height: 1.8; color: var(--color-gray-dark); margin-bottom: var(--spacing-md);">
                    <li><strong>在微信中</strong>打开任一公众号文章</li>
                    <li>按 <strong>F12</strong> 打开开发者工具 → 切换到 <strong>Network</strong>（网络）标签</li>
                    <li><strong>刷新页面</strong>，找到任意一个请求（如 appmsgreport）</li>
                    <li>在请求详情中，复制 <code>__biz</code> 参数的值（例如：Mzg3MzE1MjIyNQ==）</li>
                    <li>复制请求头中的 <code>cookie</code> 字段的完整内容</li>
                    <li>粘贴到下方输入框</li>
                  </ol>

                  <div style="background: #fff8e1; border: 2px solid #ffc107; padding: var(--spacing-sm); margin-bottom: var(--spacing-md); font-size: 13px; line-height: 1.6;">
                    <strong>⚠️ 隐私提示</strong><br>
                    Cookie 包含你的登录信息，仅在本地浏览器使用，不会上传到任何服务器。但请注意不要泄露给他人。
                  </div>

                  <label style="display: block; margin-bottom: var(--spacing-xs); font-size: 13px; font-weight: 600; color: var(--color-gray-dark);">
                    biz 参数：
                  </label>
                  <input
                    v-model="wechatBizInput"
                    type="text"
                    placeholder="例如：Mzg3MzE1MjIyNQ=="
                    class="mt-xs"
                    style="width: 100%; margin-bottom: var(--spacing-sm);"
                  />

                  <label style="display: block; margin-bottom: var(--spacing-xs); font-size: 13px; font-weight: 600; color: var(--color-gray-dark);">
                    Cookie：
                  </label>
                  <textarea
                    v-model="wechatCookieInput"
                    placeholder="粘贴完整的 cookie 字符串...&#10;&#10;例如：rewardsn=; wxtokenkey=777; ua_id=xxx; wxuin=xxx; ..."
                    rows="4"
                    class="mt-xs"
                    style="width: 100%; font-family: monospace; font-size: 12px; margin-bottom: var(--spacing-sm);"
                  ></textarea>

                  <button
                    @click="handleWechatCookieImport"
                    class="mt-sm"
                    :disabled="!wechatBizInput.trim() || !wechatCookieInput.trim() || isLoadingUrl"
                    style="width: 100%; padding: 12px; font-size: 14px; font-weight: 600;"
                  >
                    {{ isLoadingUrl ? '正在获取并批量导入...' : '🚀 批量导入整个公众号' }}
                  </button>
                </div>

                <!-- 方法2：HTML 源代码 -->
                <div v-if="wechatImportMethod === 'html'" class="import-method">
                  <p style="margin-bottom: var(--spacing-sm); font-size: 14px; color: var(--color-gray-dark); font-weight: 600;">
                    📋 操作步骤（5步）
                  </p>
                  <ol style="margin-left: 20px; font-size: 13px; line-height: 1.8; color: var(--color-gray-dark); margin-bottom: var(--spacing-md);">
                    <li><strong>在微信中</strong>打开任一公众号文章</li>
                    <li>点击右上角 <strong>"..."</strong> → 选择 <strong>"查看历史消息"</strong></li>
                    <li>在历史消息页面，<strong>右键</strong> → 选择 <strong>"查看网页源代码"</strong>（或按 Ctrl+U / Cmd+U）</li>
                    <li><strong>全选</strong>（Ctrl+A / Cmd+A）并<strong>复制</strong>整个 HTML 代码</li>
                    <li><strong>粘贴</strong>到下方文本框，点击"批量导入"按钮</li>
                  </ol>

                  <textarea
                    v-model="wechatHtmlInput"
                    placeholder="粘贴公众号历史页面的完整 HTML 源代码...&#10;&#10;提示：HTML 通常以 <!DOCTYPE html> 或 <html> 开头"
                    rows="8"
                    class="mt-sm"
                    style="width: 100%; font-family: monospace; font-size: 12px; line-height: 1.4;"
                  ></textarea>
                  <button
                    @click="handleWechatHtmlImport"
                    class="mt-sm"
                    :disabled="!wechatHtmlInput.trim() || isLoadingUrl"
                    style="width: 100%; padding: 12px; font-size: 14px; font-weight: 600;"
                  >
                    {{ isLoadingUrl ? '正在解析并批量导入...' : '🚀 批量导入整个公众号' }}
                  </button>
                </div>
              </div>
            </details>
          </div>

          <!-- 批量导入进度 -->
          <div v-if="batchProgress.show" class="batch-progress mt-md">
            <h4>批量导入进度: {{ batchProgress.current }} / {{ batchProgress.total }}</h4>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: batchProgressPercent + '%' }"></div>
            </div>
            <p class="current-url">{{ batchProgress.currentUrl }}</p>
            <p class="stats">
              成功: {{ batchProgress.success }} | 失败: {{ batchProgress.failed }}
            </p>
          </div>
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
          <div class="button-group">
            <button
              @click="() => reanalyze(false)"
              class="secondary"
              :disabled="library.sources.length === 0 || isAnalyzing"
            >
              {{ isAnalyzing ? '分析中...' : '快速分析（正则）' }}
            </button>
            <button
              @click="() => reanalyze(true)"
              class="accent"
              :disabled="library.sources.length === 0 || isAnalyzing || !settings?.deepseekApiKey"
              :title="!settings?.deepseekApiKey ? '请先在设置中配置 DeepSeek API Key' : ''"
            >
              {{ isAnalyzing ? '分析中...' : '🤖 AI 深度分析' }}
            </button>
          </div>
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
        <div class="section-header">
          <h2>文风分析结果</h2>
          <div style="display: flex; gap: var(--spacing-sm); align-items: center;">
            <span
              class="data-badge"
              :style="{
                backgroundColor: library.analysis.analysisMethod === 'AI' ? '#e5f2ff' : '#f5f5f5',
                borderColor: library.analysis.analysisMethod === 'AI' ? '#0066ff' : '#ccc'
              }"
            >
              {{ library.analysis.analysisMethod === 'AI' ? '🤖 AI 深度分析' : '📊 正则分析' }}
            </span>
            <span class="data-badge">基于 {{ library.analysis.totalWords.toLocaleString() }} 字分析</span>
          </div>
        </div>

        <!-- 1. 语言风格 -->
        <div class="analysis-category">
          <h3>1️⃣ 语言风格</h3>
          <div class="style-grid">
            <div class="style-card">
              <div class="label">整体语气</div>
              <div class="value-large">{{ getToneLabel(library.analysis.tone) }}</div>
            </div>
            <div class="style-card">
              <div class="label">平均句长</div>
              <div class="value-large">{{ library.analysis.avgSentenceLength }} 字</div>
              <div class="hint">{{ getSentenceLengthHint(library.analysis.avgSentenceLength) }}</div>
            </div>
          </div>

          <!-- 句式复杂度 -->
          <div v-if="library.analysis.complexity" class="complexity-section mt-sm">
            <div class="label">句式复杂度：{{ getComplexityLabel(library.analysis.complexity.diversity) }}</div>
            <div class="complexity-bars">
              <div class="complexity-bar">
                <div class="bar-label">简单句</div>
                <div class="bar-container">
                  <div class="bar-fill" :style="{ width: library.analysis.complexity.simple + '%' }"></div>
                  <span class="bar-value">{{ library.analysis.complexity.simple }}%</span>
                </div>
              </div>
              <div class="complexity-bar">
                <div class="bar-label">复合句</div>
                <div class="bar-container">
                  <div class="bar-fill" :style="{ width: library.analysis.complexity.compound + '%' }"></div>
                  <span class="bar-value">{{ library.analysis.complexity.compound }}%</span>
                </div>
              </div>
              <div class="complexity-bar">
                <div class="bar-label">复杂句</div>
                <div class="bar-container">
                  <div class="bar-fill" :style="{ width: library.analysis.complexity.complex + '%' }"></div>
                  <span class="bar-value">{{ library.analysis.complexity.complex }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. 叙述视角 -->
        <div v-if="library.analysis.perspective" class="analysis-category mt-md">
          <h3>2️⃣ 叙述视角</h3>
          <div class="perspective-section">
            <div class="perspective-main">
              {{ getPerspectiveLabel(library.analysis.perspective.dominant) }}
            </div>
            <div class="perspective-distribution">
              <div class="person-item">
                <span class="person-label">第一人称（我）</span>
                <span class="person-value">{{ library.analysis.perspective.firstPerson }}%</span>
              </div>
              <div class="person-item">
                <span class="person-label">第二人称（你）</span>
                <span class="person-value">{{ library.analysis.perspective.secondPerson }}%</span>
              </div>
              <div class="person-item">
                <span class="person-label">第三人称（他）</span>
                <span class="person-value">{{ library.analysis.perspective.thirdPerson }}%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. 行文习惯 -->
        <div v-if="library.analysis.openingPatterns || library.analysis.transitions" class="analysis-category mt-md">
          <h3>3️⃣ 行文习惯</h3>

          <!-- 开头方式 -->
          <div v-if="library.analysis.openingPatterns" class="opening-section">
            <div class="label">开头方式</div>
            <div class="opening-stats">
              <div class="opening-item">
                <span class="opening-type">问句开头</span>
                <span class="opening-count">{{ library.analysis.openingPatterns.patterns.question }} 次</span>
              </div>
              <div class="opening-item">
                <span class="opening-type">故事开头</span>
                <span class="opening-count">{{ library.analysis.openingPatterns.patterns.story }} 次</span>
              </div>
              <div class="opening-item">
                <span class="opening-type">观点开头</span>
                <span class="opening-count">{{ library.analysis.openingPatterns.patterns.statement }} 次</span>
              </div>
            </div>
            <!-- 示例 -->
            <div v-if="library.analysis.openingPatterns.examples.question.length > 0 ||
                       library.analysis.openingPatterns.examples.story.length > 0 ||
                       library.analysis.openingPatterns.examples.statement.length > 0"
                 class="opening-examples mt-sm">
              <div class="example-label">开头示例：</div>
              <div v-if="library.analysis.openingPatterns.examples.question[0]" class="example-text">
                "{{ library.analysis.openingPatterns.examples.question[0] }}..."
              </div>
              <div v-else-if="library.analysis.openingPatterns.examples.story[0]" class="example-text">
                "{{ library.analysis.openingPatterns.examples.story[0] }}..."
              </div>
              <div v-else-if="library.analysis.openingPatterns.examples.statement[0]" class="example-text">
                "{{ library.analysis.openingPatterns.examples.statement[0] }}..."
              </div>
            </div>
          </div>

          <!-- 常用转折词 -->
          <div v-if="library.analysis.transitions && library.analysis.transitions.length > 0" class="transitions-section mt-sm">
            <div class="label">常用转折词</div>
            <div class="transitions">
              <span v-for="[word, count] in library.analysis.transitions.slice(0, 5)"
                    :key="word"
                    class="transition-tag">
                {{ word }} <span class="count">({{ count }})</span>
              </span>
            </div>
          </div>

          <!-- 主题关键词 -->
          <div class="keywords-section mt-sm">
            <div class="label">主题关键词</div>
            <div class="keywords">
              <span v-for="kw in library.analysis.keywords.slice(0, 10)"
                    :key="kw.word"
                    class="keyword-tag">
                {{ kw.word }}
              </span>
            </div>
          </div>
        </div>

        <!-- 4. 表达特征 -->
        <div class="analysis-category mt-md">
          <h3>4️⃣ 表达特征</h3>
          <div class="phrases-section">
            <div class="label">常用表达方式</div>
            <div class="phrases">
              <span v-for="phrase in library.analysis.commonPhrases.slice(0, 12)"
                    :key="phrase.phrase"
                    class="phrase-tag">
                "{{ phrase.phrase }}"
              </span>
            </div>
          </div>
        </div>

        <button @click="clearLibrary" class="mt-md secondary">清空文风库</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import {
  getStyleLibrary,
  addToStyleLibrary,
  removeFromStyleLibrary,
  clearStyleLibrary,
  saveStyleLibrary,
  getSettings
} from '../utils/storage'
import { analyzeWritingStyle, analyzeStyleWithAI, cleanContent } from '../utils/styleAnalysis'
import {
  detectUrlType,
  extractWechatArticle,
  extractWebContent,
  extractArticleLinks,
  batchExtractArticles,
  fetchAllArticlesFromSingleUrl
} from '../utils/urlExtractor'

const library = ref({ sources: [], analysis: null, totalWords: 0 })
const settings = ref(null)
const manualContent = ref('')
const manualTitle = ref('')
const urlInput = ref('')
const wechatImportMethod = ref('cookie') // 'cookie' 或 'html'
const wechatBizInput = ref('') // 微信公众号 biz 参数
const wechatCookieInput = ref('') // 微信 cookie
const wechatHtmlInput = ref('') // 微信HTML源码输入
const isLoadingUrl = ref(false)
const isAnalyzing = ref(false) // 分析中状态
const fileInput = ref(null)

// 批量导入进度
const batchProgress = ref({
  show: false,
  current: 0,
  total: 0,
  currentUrl: '',
  success: 0,
  failed: 0
})

const batchProgressPercent = computed(() => {
  if (batchProgress.value.total === 0) return 0
  return Math.round((batchProgress.value.current / batchProgress.value.total) * 100)
})

onMounted(async () => {
  library.value = await getStyleLibrary()
  settings.value = await getSettings()
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

// 批量导入处理函数
const handleBatchImport = async () => {
  if (!urlInput.value.trim()) return

  const url = urlInput.value.trim()

  // 检测是否是微信公众号文章链接
  const isWechatArticle = url.includes('mp.weixin.qq.com') && (url.includes('/s?__biz=') || url.includes('/s/'))

  if (isWechatArticle) {
    // 微信公众号文章：通过单篇文章获取整个公众号历史
    if (!confirm('检测到微信公众号文章链接！\n\n将自动获取该公众号的所有历史文章。\n这可能需要较长时间。\n\n确定继续吗？')) {
      return
    }
  } else {
    // 普通网页：批量爬取
    if (!confirm('批量爬取会从该页面提取所有文章链接并逐个提取内容，\n这可能需要较长时间。\n\n确定继续吗？')) {
      return
    }
  }

  isLoadingUrl.value = true
  batchProgress.value = {
    show: true,
    current: 0,
    total: 0,
    currentUrl: '',
    success: 0,
    failed: 0
  }

  try {
    console.log('开始批量导入:', url)

    let links = []

    if (isWechatArticle) {
      // 微信公众号：从单篇文章获取所有历史
      console.log('🔍 检测到微信公众号文章，正在获取整个公众号历史...')
      const result = await fetchAllArticlesFromSingleUrl(url)
      links = result.links
      console.log(`✅ 成功获取 ${links.length} 篇历史文章`)
    } else {
      // 普通网页：提取所有文章链接
      links = await extractArticleLinks(url)
    }

    if (links.length === 0) {
      alert('未找到任何文章链接。\n\n可能原因：\n1. 这不是博客首页或公众号\n2. 链接结构不符合常见模式\n3. 公众号需要先关注才能查看\n\n请尝试导入单篇文章')
      return
    }

    const proceed = confirm(`找到 ${links.length} 篇文章。\n\n确定要全部导入吗？\n\n注意：这可能需要 ${Math.ceil(links.length / 60)} 到 ${Math.ceil(links.length / 30)} 分钟。`)
    if (!proceed) {
      return
    }

    batchProgress.value.total = links.length

    // 批量提取文章内容
    await batchExtractArticles(links, (progress) => {
      batchProgress.value.current = progress.current
      batchProgress.value.currentUrl = progress.url

      if (progress.status === 'success') {
        batchProgress.value.success++

        // 立即添加到文风库
        const cleanedContent = cleanContent(progress.article.content)
        if (cleanedContent && cleanedContent.length >= 200) {
          addToStyleLibrary({
            type: 'url',
            title: progress.article.title,
            content: cleanedContent,
            url: progress.url
          })
        }
      } else if (progress.status === 'failed') {
        batchProgress.value.failed++
      }
    })

    // 刷新文风库并重新分析
    library.value = await getStyleLibrary()
    await reanalyze()

    urlInput.value = ''
    alert(`✅ 批量导入完成！\n\n总计: ${links.length} 篇\n成功: ${batchProgress.value.success} 篇\n失败: ${batchProgress.value.failed} 篇`)

    batchProgress.value.show = false
  } catch (error) {
    console.error('批量导入失败:', error)
    alert(`批量导入失败: ${error.message}`)
  } finally {
    isLoadingUrl.value = false
  }
}

// 微信 biz + Cookie 导入处理函数
const handleWechatCookieImport = async () => {
  if (!wechatBizInput.value.trim() || !wechatCookieInput.value.trim()) return

  isLoadingUrl.value = true
  batchProgress.value = {
    show: true,
    current: 0,
    total: 0,
    currentUrl: '',
    success: 0,
    failed: 0
  }

  try {
    const biz = wechatBizInput.value.trim()
    const cookie = wechatCookieInput.value.trim()

    console.log('🚀 使用 biz + cookie 获取公众号历史:', biz)

    // 构建 profile URL
    const profileUrl = `https://mp.weixin.qq.com/mp/profile_ext?action=home&__biz=${encodeURIComponent(biz)}`
    console.log('📄 公众号历史消息页URL:', profileUrl)

    // 通过 CORS 代理 + Cookie 获取历史页面
    console.log('正在获取公众号历史消息页面（带cookie）...')
    const { fetchWithCORS } = await import('../utils/urlExtractor')
    const html = await fetchWithCORS(profileUrl, { 'Cookie': cookie })

    console.log('✅ 成功获取历史消息页面，HTML长度:', html.length)

    // 使用 extractArticleLinks 解析 HTML 中的文章链接
    const links = await extractArticleLinks(html)

    if (links.length === 0) {
      alert('未能从公众号历史页面提取到文章链接。\n\n可能原因：\n1. Cookie 已过期，请重新获取\n2. 该公众号需要关注后才能查看历史消息\n3. biz 参数不正确\n\n💡 建议：尝试使用「方法2：粘贴 HTML」')
      return
    }

    const proceed = confirm(`成功找到 ${links.length} 篇文章！\n\n确定要全部导入吗？\n\n注意：这可能需要 ${Math.ceil(links.length / 60)} 到 ${Math.ceil(links.length / 30)} 分钟。`)
    if (!proceed) {
      return
    }

    batchProgress.value.total = links.length

    // 批量提取文章内容
    await batchExtractArticles(links, (progress) => {
      batchProgress.value.current = progress.current
      batchProgress.value.currentUrl = progress.url

      if (progress.status === 'success') {
        batchProgress.value.success++

        // 立即添加到文风库
        const cleanedContent = cleanContent(progress.article.content)
        if (cleanedContent && cleanedContent.length >= 200) {
          addToStyleLibrary({
            type: 'url',
            title: progress.article.title,
            content: cleanedContent,
            url: progress.url
          })
        }
      } else if (progress.status === 'failed') {
        batchProgress.value.failed++
      }
    })

    // 刷新文风库并重新分析
    library.value = await getStyleLibrary()
    await reanalyze()

    wechatBizInput.value = ''
    wechatCookieInput.value = ''
    alert(`✅ 批量导入完成！\n\n总计: ${links.length} 篇\n成功: ${batchProgress.value.success} 篇\n失败: ${batchProgress.value.failed} 篇`)

    batchProgress.value.show = false
  } catch (error) {
    console.error('Cookie导入失败:', error)
    alert(`导入失败: ${error.message}\n\n💡 可能原因：\n1. Cookie 格式不正确或已过期\n2. CORS 代理无法传递 Cookie\n3. 网络问题\n\n建议：尝试使用「方法2：粘贴 HTML」`)
  } finally {
    isLoadingUrl.value = false
  }
}

// 微信HTML源码导入处理函数
const handleWechatHtmlImport = async () => {
  if (!wechatHtmlInput.value.trim()) return

  isLoadingUrl.value = true
  batchProgress.value = {
    show: true,
    current: 0,
    total: 0,
    currentUrl: '',
    success: 0,
    failed: 0
  }

  try {
    console.log('开始解析微信公众号HTML源码...')
    const html = wechatHtmlInput.value.trim()

    // 直接调用 extractArticleLinks，传入 HTML 源码
    const links = await extractArticleLinks(html)

    if (links.length === 0) {
      alert('未能从HTML中提取到文章链接。\n\n请确保：\n1. 粘贴的是公众号"历史消息"页面的完整HTML源代码\n2. HTML包含 msgList 数据\n\n💡 提示：打开控制台（F12）查看详细日志')
      return
    }

    const proceed = confirm(`成功找到 ${links.length} 篇文章！\n\n确定要全部导入吗？\n\n注意：这可能需要 ${Math.ceil(links.length / 60)} 到 ${Math.ceil(links.length / 30)} 分钟。`)
    if (!proceed) {
      return
    }

    batchProgress.value.total = links.length

    // 批量提取文章内容
    await batchExtractArticles(links, (progress) => {
      batchProgress.value.current = progress.current
      batchProgress.value.currentUrl = progress.url

      if (progress.status === 'success') {
        batchProgress.value.success++

        // 立即添加到文风库
        const cleanedContent = cleanContent(progress.article.content)
        if (cleanedContent && cleanedContent.length >= 200) {
          addToStyleLibrary({
            type: 'url',
            title: progress.article.title,
            content: cleanedContent,
            url: progress.url
          })
        }
      } else if (progress.status === 'failed') {
        batchProgress.value.failed++
      }
    })

    // 刷新文风库并重新分析
    library.value = await getStyleLibrary()
    await reanalyze()

    wechatHtmlInput.value = ''
    alert(`✅ 批量导入完成！\n\n总计: ${links.length} 篇\n成功: ${batchProgress.value.success} 篇\n失败: ${batchProgress.value.failed} 篇`)

    batchProgress.value.show = false
  } catch (error) {
    console.error('HTML解析失败:', error)
    alert(`解析失败: ${error.message}\n\n💡 打开浏览器控制台（F12）查看详细错误信息`)
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

const reanalyze = async (useAI = false) => {
  if (library.value.sources.length === 0) {
    library.value.analysis = null
    await saveStyleLibrary(library.value)
    return
  }

  isAnalyzing.value = true

  try {
    if (useAI) {
      // 使用 AI 分析
      if (!settings.value?.deepseekApiKey) {
        alert('请先在设置中配置 DeepSeek API Key')
        return
      }

      library.value.analysis = await analyzeStyleWithAI(library.value.sources, settings.value.deepseekApiKey)
      alert('✅ AI 深度分析完成！\n\n分析结果已保存到文风库。')
    } else {
      // 使用正则表达式分析
      library.value.analysis = analyzeWritingStyle(library.value.sources)
    }

    library.value.totalWords = library.value.analysis.totalWords
    await saveStyleLibrary(library.value)
  } catch (error) {
    console.error('分析失败:', error)
    alert(`分析失败: ${error.message}`)
  } finally {
    isAnalyzing.value = false
  }
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

const getSentenceLengthHint = (length) => {
  if (length < 15) return '偏短，节奏明快'
  if (length < 25) return '适中，平衡流畅'
  return '偏长，表达细腻'
}

const getComplexityLabel = (diversity) => {
  const map = {
    simple: '偏爱短句，简洁直接',
    varied: '句式富有变化，长短结合',
    complex: '善用复杂句式，表达层次丰富'
  }
  return map[diversity] || diversity
}

const getPerspectiveLabel = (dominant) => {
  const map = {
    first: '第一人称为主（我/我们），强调个人体验和主观感受',
    second: '第二人称为主（你/您），直接与读者对话',
    third: '第三人称为主，客观叙述'
  }
  return map[dominant] || dominant
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

.button-group {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.button-group button {
  flex: 1;
  min-width: 140px;
}

.button-group button.accent {
  background-color: var(--color-blue);
  color: var(--color-white);
  border-color: var(--color-blue);
  font-weight: 700;
}

.button-group button.accent:hover {
  background-color: var(--color-black);
  border-color: var(--color-black);
}

.batch-progress {
  padding: var(--spacing-md);
  background-color: var(--color-gray-light);
  border: 1px solid var(--color-gray);
}

.batch-progress h4 {
  margin-bottom: var(--spacing-sm);
}

.progress-bar {
  width: 100%;
  height: 24px;
  background-color: var(--color-white);
  border: 2px solid var(--color-black);
  margin-bottom: var(--spacing-sm);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: var(--color-blue);
  transition: width 0.3s ease;
}

.current-url {
  font-size: 12px;
  color: var(--color-gray-dark);
  margin-bottom: var(--spacing-xs);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stats {
  font-size: 14px;
  font-weight: 700;
  margin: 0;
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

/* 新增：深度分析样式 */
.data-badge {
  font-size: 12px;
  color: var(--color-gray-dark);
  background-color: var(--color-gray-light);
  padding: 4px 12px;
  border: 1px solid var(--color-gray);
}

.analysis-category {
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-lg);
  border-bottom: 2px solid var(--color-gray);
}

.analysis-category:last-child {
  border-bottom: none;
}

.analysis-category h3 {
  margin-bottom: var(--spacing-md);
  font-size: 18px;
  font-weight: 700;
}

.label {
  font-size: 12px;
  text-transform: uppercase;
  color: var(--color-gray-dark);
  font-weight: 700;
  margin-bottom: var(--spacing-xs);
}

.style-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.style-card {
  padding: var(--spacing-md);
  background-color: var(--color-gray-light);
  border: 2px solid var(--color-black);
}

.value-large {
  font-size: 24px;
  font-weight: 700;
  margin: var(--spacing-xs) 0;
}

.hint {
  font-size: 12px;
  color: var(--color-gray-dark);
  font-style: italic;
}

.complexity-section {
  padding: var(--spacing-md);
  background-color: var(--color-gray-light);
  border: 1px solid var(--color-gray);
}

.complexity-bars {
  display: grid;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-sm);
}

.complexity-bar {
  display: grid;
  grid-template-columns: 80px 1fr;
  gap: var(--spacing-sm);
  align-items: center;
}

.bar-label {
  font-size: 14px;
  font-weight: 600;
}

.bar-container {
  position: relative;
  height: 24px;
  background-color: var(--color-white);
  border: 2px solid var(--color-black);
}

.bar-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background-color: var(--color-blue);
  transition: width 0.5s ease;
}

.bar-value {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  font-weight: 700;
}

.perspective-section {
  padding: var(--spacing-md);
  background-color: var(--color-gray-light);
  border: 1px solid var(--color-gray);
}

.perspective-main {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: var(--spacing-md);
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--color-gray);
}

.perspective-distribution {
  display: grid;
  gap: var(--spacing-xs);
}

.person-item {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.person-label {
  color: var(--color-gray-dark);
}

.person-value {
  font-weight: 700;
}

.opening-section,
.transitions-section {
  padding: var(--spacing-md);
  background-color: var(--color-white);
  border: 1px solid var(--color-gray);
}

.opening-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-md);
  margin-top: var(--spacing-sm);
}

.opening-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm);
  background-color: var(--color-gray-light);
  border: 1px solid var(--color-gray);
  text-align: center;
}

.opening-type {
  font-size: 12px;
  color: var(--color-gray-dark);
  text-transform: uppercase;
  font-weight: 700;
}

.opening-count {
  font-size: 18px;
  font-weight: 700;
}

.opening-examples {
  margin-top: var(--spacing-sm);
  padding: var(--spacing-sm);
  background-color: var(--color-gray-light);
  border-left: 4px solid var(--color-blue);
}

.example-label {
  font-size: 12px;
  color: var(--color-gray-dark);
  margin-bottom: var(--spacing-xs);
  font-weight: 700;
}

.example-text {
  font-size: 14px;
  font-style: italic;
  line-height: 1.6;
}

.transitions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  margin-top: var(--spacing-sm);
}

.transition-tag {
  padding: 6px 12px;
  background-color: var(--color-white);
  border: 2px solid var(--color-black);
  font-size: 14px;
  font-weight: 600;
}

.transition-tag .count {
  font-size: 12px;
  color: var(--color-gray-dark);
  font-weight: 400;
}

.wechat-tip {
  padding: var(--spacing-md);
  background-color: #fff8e1;
  border: 2px solid #ffc107;
  border-radius: 4px;
  font-size: 14px;
  line-height: 1.6;
}

.wechat-tip p {
  margin: 0 0 var(--spacing-xs) 0;
}

.wechat-tip .tip-content {
  margin-top: var(--spacing-sm);
}

.wechat-tip .method-section {
  margin-bottom: var(--spacing-md);
  padding: var(--spacing-sm);
  background-color: rgba(255, 255, 255, 0.5);
  border-left: 3px solid #ff9800;
  border-radius: 2px;
}

.wechat-tip .method-section:last-of-type {
  margin-bottom: var(--spacing-sm);
}

.wechat-tip ol,
.wechat-tip ul {
  margin: var(--spacing-xs) 0 0 0;
  padding-left: 24px;
}

.wechat-tip li {
  margin: var(--spacing-xs) 0;
}

.wechat-tip .code-block {
  background-color: #2d2d2d;
  color: #f8f8f2;
  padding: var(--spacing-sm);
  margin: var(--spacing-xs) 0;
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.5;
  overflow-x: auto;
  border-radius: 4px;
}

.wechat-tip .note-success {
  color: #2e7d32;
  background-color: #e8f5e9;
  padding: var(--spacing-xs);
  border-radius: 4px;
  margin-top: var(--spacing-xs);
  font-size: 13px;
}

.wechat-tip .note-info {
  color: #1565c0;
  background-color: #e3f2fd;
  padding: var(--spacing-xs);
  border-radius: 4px;
  margin-top: var(--spacing-xs);
  font-size: 13px;
}

.wechat-tip .note-warning {
  color: #e65100;
  background-color: #fff3e0;
  padding: var(--spacing-xs);
  border-radius: 4px;
  margin-top: var(--spacing-xs);
  font-size: 13px;
}

.wechat-tip .final-note {
  margin-top: var(--spacing-md);
  padding-top: var(--spacing-sm);
  border-top: 2px solid #ffc107;
  font-weight: 600;
}

.wechat-tip .final-note ul {
  margin-top: var(--spacing-xs);
}

.wechat-tip .final-note li {
  font-weight: 400;
}

/* 方法切换按钮样式 */
.method-toggle-btn {
  transition: all 0.2s ease;
}

.method-toggle-btn:hover {
  background: var(--color-gray-light) !important;
  border-color: var(--color-black) !important;
}

.method-toggle-btn.active {
  background: var(--color-black) !important;
  color: var(--color-white) !important;
  border-color: var(--color-black) !important;
}

@media (max-width: 768px) {
  .analysis-grid {
    grid-template-columns: 1fr;
  }

  .source-header {
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .style-grid {
    grid-template-columns: 1fr;
  }

  .opening-stats {
    grid-template-columns: 1fr;
  }
}
</style>
