<template>
  <div class="style-library-view">
    <div class="container">
      <header class="page-header">
        <h1>文风库管理</h1>
        <p class="subtitle">构建您的个人文风数据库</p>
      </header>

      <!-- 添加内容 -->
      <section class="content-section">
        <h2 class="section-title">添加内容</h2>

        <div class="input-cards">
          <!-- 文档上传 -->
          <div class="input-card">
            <div class="card-icon">📄</div>
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
            <button @click="$refs.fileInput.click()" class="card-button">选择文件</button>
          </div>

          <!-- URL 导入 -->
          <div class="input-card">
            <div class="card-icon">🔗</div>
            <h3>从链接导入</h3>
            <p>粘贴文章 URL 自动提取</p>
            <input
              v-model="urlInput"
              type="url"
              placeholder="https://..."
              class="card-input"
            />
            <button
              @click="handleUrlImport"
              :disabled="!urlInput.trim() || isLoadingUrl"
              class="card-button"
            >
              {{ isLoadingUrl ? '提取中...' : '导入文章' }}
            </button>
          </div>

          <!-- 手动输入 -->
          <div class="input-card full-width">
            <div class="card-icon">✍️</div>
            <h3>直接粘贴内容</h3>
            <p>复制粘贴您的文章内容</p>
            <input
              v-model="manualTitle"
              type="text"
              placeholder="标题（可选）"
              class="card-input"
            />
            <textarea
              v-model="manualContent"
              placeholder="粘贴您的文章内容..."
              rows="6"
              class="card-textarea"
            ></textarea>
            <button
              @click="handleManualAdd"
              :disabled="!manualContent.trim()"
              class="card-button"
            >
              添加到文风库
            </button>
          </div>
        </div>
      </section>

      <!-- 已导入内容 -->
      <section class="content-section">
        <div class="section-header">
          <h2 class="section-title">已导入内容</h2>
          <button
            @click="reanalyze"
            class="btn-primary"
            :disabled="library.sources.length === 0 || isAnalyzing || !settings?.deepseekApiKey"
            :title="!settings?.deepseekApiKey ? '请先在设置中配置 DeepSeek API Key' : ''"
          >
            {{ isAnalyzing ? '分析中...' : '🤖 AI 分析文风' }}
          </button>
        </div>

        <div v-if="library.sources.length === 0" class="empty-state">
          <div class="empty-icon">📚</div>
          <p>还没有内容</p>
          <span>请先添加您的文章来构建文风库</span>
        </div>

        <div v-else>
          <div v-if="!library.analysis" class="analysis-reminder">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2Z" stroke="currentColor" stroke-width="1.5"/>
              <path d="M10 6V10M10 14H10.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <span>已添加 {{library.sources.length}} 篇内容，点击右上角「🤖 AI 分析文风」按钮开始分析</span>
          </div>

          <div class="sources-grid">
            <div v-for="source in library.sources" :key="source.id" class="source-card">
              <div class="source-header">
                <h3>{{ source.title || '未命名' }}</h3>
                <button @click="removeSource(source.id)" class="btn-icon" title="删除">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" stroke-width="1.5"/>
                  </svg>
                </button>
              </div>
              <div class="source-meta">
                <span class="badge">{{ source.type }}</span>
                <span>{{ source.content.length }} 字</span>
                <span>{{ formatDate(source.timestamp) }}</span>
              </div>
              <div class="source-preview">{{ source.content.slice(0, 150) }}...</div>
            </div>
          </div>
        </div>
      </section>

      <!-- 文风分析结果 -->
      <section v-if="library.analysis" class="content-section">
        <div class="section-header">
          <h2 class="section-title">文风分析结果</h2>
          <div class="analysis-badges">
            <span class="analysis-badge ai-badge">
              🤖 AI 深度分析
            </span>
            <span class="analysis-badge">{{ library.analysis.totalWords?.toLocaleString() }} 字</span>
            <button @click="clearLibrary" class="btn-secondary" style="margin-left: auto;">清空文风库</button>
          </div>
        </div>

        <div class="analysis-display">
          <!-- 整体概述 -->
          <div v-if="library.analysis.overallSummary" class="analysis-section summary-section">
            <h3 class="analysis-section-title">📝 整体文风概述</h3>
            <p class="summary-text">{{ library.analysis.overallSummary }}</p>
          </div>

          <!-- 语言风格 -->
          <div v-if="library.analysis.languageStyle" class="analysis-section">
            <h3 class="analysis-section-title">💬 语言风格</h3>
            <div class="analysis-grid">
              <div class="analysis-card">
                <div class="card-label">整体语气</div>
                <div class="card-value">{{ getToneLabel(library.analysis.languageStyle.tone) }}</div>
                <div v-if="library.analysis.languageStyle.toneDescription" class="card-description">
                  {{ library.analysis.languageStyle.toneDescription }}
                </div>
              </div>
              <div class="analysis-card">
                <div class="card-label">平均句长</div>
                <div class="card-value">{{ library.analysis.languageStyle.avgSentenceLength }} 字/句</div>
                <div v-if="library.analysis.languageStyle.sentenceLengthStyle" class="card-description">
                  {{ library.analysis.languageStyle.sentenceLengthStyle }}
                </div>
              </div>
              <div class="analysis-card">
                <div class="card-label">句式复杂度</div>
                <div class="card-value">{{ getComplexityLabel(library.analysis.languageStyle.complexity) }}</div>
                <div v-if="library.analysis.languageStyle.complexityDescription" class="card-description">
                  {{ library.analysis.languageStyle.complexityDescription }}
                </div>
              </div>
            </div>
          </div>

          <!-- 叙述视角 -->
          <div v-if="library.analysis.perspective" class="analysis-section">
            <h3 class="analysis-section-title">👁 叙述视角</h3>
            <div class="analysis-card-wide">
              <div class="card-value">{{ getPerspectiveLabel(library.analysis.perspective.dominant) }}</div>
              <div v-if="library.analysis.perspective.description" class="card-description">
                {{ library.analysis.perspective.description }}
              </div>
              <div class="perspective-bars">
                <div class="bar-item">
                  <span class="bar-label">第一人称</span>
                  <div class="bar-track">
                    <div class="bar-fill" :style="{ width: library.analysis.perspective.firstPersonPercent + '%' }"></div>
                  </div>
                  <span class="bar-value">{{ library.analysis.perspective.firstPersonPercent }}%</span>
                </div>
                <div class="bar-item">
                  <span class="bar-label">第二人称</span>
                  <div class="bar-track">
                    <div class="bar-fill" :style="{ width: library.analysis.perspective.secondPersonPercent + '%' }"></div>
                  </div>
                  <span class="bar-value">{{ library.analysis.perspective.secondPersonPercent }}%</span>
                </div>
                <div class="bar-item">
                  <span class="bar-label">第三人称</span>
                  <div class="bar-track">
                    <div class="bar-fill" :style="{ width: library.analysis.perspective.thirdPersonPercent + '%' }"></div>
                  </div>
                  <span class="bar-value">{{ library.analysis.perspective.thirdPersonPercent }}%</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 人格特质 -->
          <div v-if="library.analysis.personality" class="analysis-section">
            <h3 class="analysis-section-title">🧠 人格特质</h3>
            <div class="analysis-grid">
              <div class="analysis-card">
                <div class="card-label">社交倾向</div>
                <div class="card-value">{{ library.analysis.personality.extraversion === 'extraverted' ? '外向型' : '内向型' }}</div>
                <div v-if="library.analysis.personality.extraversionDescription" class="card-description">
                  {{ library.analysis.personality.extraversionDescription }}
                </div>
              </div>
              <div class="analysis-card">
                <div class="card-label">思维方式</div>
                <div class="card-value">{{ library.analysis.personality.openness === 'open' ? '开放创新型' : '传统保守型' }}</div>
                <div v-if="library.analysis.personality.opennessDescription" class="card-description">
                  {{ library.analysis.personality.opennessDescription }}
                </div>
              </div>
              <div class="analysis-card">
                <div class="card-label">行为风格</div>
                <div class="card-value">{{ library.analysis.personality.conscientiousness === 'conscientious' ? '谨慎计划型' : '灵活随性型' }}</div>
                <div v-if="library.analysis.personality.conscientiousnessDescription" class="card-description">
                  {{ library.analysis.personality.conscientiousnessDescription }}
                </div>
              </div>
              <div class="analysis-card">
                <div class="card-label">人际态度</div>
                <div class="card-value">{{ library.analysis.personality.agreeableness === 'agreeable' ? '温和包容型' : '坚定主张型' }}</div>
                <div v-if="library.analysis.personality.agreeablenessDescription" class="card-description">
                  {{ library.analysis.personality.agreeablenessDescription }}
                </div>
              </div>
              <div class="analysis-card">
                <div class="card-label">情绪特征</div>
                <div class="card-value">{{ library.analysis.personality.stability === 'stable' ? '情绪稳定型' : '情感敏锐型' }}</div>
                <div v-if="library.analysis.personality.stabilityDescription" class="card-description">
                  {{ library.analysis.personality.stabilityDescription }}
                </div>
              </div>
            </div>
          </div>

          <!-- 价值观与世界观 -->
          <div v-if="library.analysis.worldview" class="analysis-section">
            <h3 class="analysis-section-title">🌍 价值观与世界观</h3>
            <div class="analysis-grid">
              <div class="analysis-card">
                <div class="card-label">人生态度</div>
                <div class="card-value">{{ getLifeAttitudeLabel(library.analysis.worldview.lifeAttitude) }}</div>
                <div v-if="library.analysis.worldview.lifeAttitudeDescription" class="card-description">
                  {{ library.analysis.worldview.lifeAttitudeDescription }}
                </div>
              </div>
              <div class="analysis-card">
                <div class="card-label">价值取向</div>
                <div class="card-value">{{ getValueOrientationLabel(library.analysis.worldview.valueOrientation) }}</div>
                <div v-if="library.analysis.worldview.valueOrientationDescription" class="card-description">
                  {{ library.analysis.worldview.valueOrientationDescription }}
                </div>
              </div>
              <div class="analysis-card">
                <div class="card-label">关系观念</div>
                <div class="card-value">{{ library.analysis.worldview.relationshipView === 'collectivist' ? '集体主义' : '个人主义' }}</div>
                <div v-if="library.analysis.worldview.relationshipDescription" class="card-description">
                  {{ library.analysis.worldview.relationshipDescription }}
                </div>
              </div>
              <div class="analysis-card">
                <div class="card-label">时间观念</div>
                <div class="card-value">{{ getTimeOrientationLabel(library.analysis.worldview.timeOrientation) }}</div>
                <div v-if="library.analysis.worldview.timeOrientationDescription" class="card-description">
                  {{ library.analysis.worldview.timeOrientationDescription }}
                </div>
              </div>
            </div>
          </div>

          <!-- 兴趣品味 -->
          <div v-if="library.analysis.culturalTaste" class="analysis-section">
            <h3 class="analysis-section-title">🎨 文化品味与兴趣</h3>
            <div class="taste-content">
              <div v-if="library.analysis.culturalTaste.primaryInterests" class="taste-item">
                <div class="taste-label">文化兴趣</div>
                <div class="tags-list">
                  <span v-for="interest in library.analysis.culturalTaste.primaryInterests" :key="interest" class="tag">
                    {{ interest }}
                  </span>
                </div>
                <div v-if="library.analysis.culturalTaste.primaryInterestsDescription" class="taste-description">
                  {{ library.analysis.culturalTaste.primaryInterestsDescription }}
                </div>
              </div>
              <div v-if="library.analysis.culturalTaste.topicPreferences" class="taste-item">
                <div class="taste-label">话题偏好</div>
                <div class="tags-list">
                  <span v-for="topic in library.analysis.culturalTaste.topicPreferences" :key="topic" class="tag">
                    {{ topic }}
                  </span>
                </div>
                <div v-if="library.analysis.culturalTaste.topicPreferencesDescription" class="taste-description">
                  {{ library.analysis.culturalTaste.topicPreferencesDescription }}
                </div>
              </div>
            </div>
          </div>

          <!-- 核心主题 -->
          <div v-if="library.analysis.themes" class="analysis-section">
            <h3 class="analysis-section-title">💡 核心主题</h3>
            <div class="taste-content">
              <div v-if="library.analysis.themes.coreThemes" class="taste-item">
                <div class="tags-list">
                  <span v-for="theme in library.analysis.themes.coreThemes" :key="theme" class="tag tag-primary">
                    {{ theme }}
                  </span>
                </div>
                <div v-if="library.analysis.themes.themesDescription" class="taste-description">
                  {{ library.analysis.themes.themesDescription }}
                </div>
              </div>
            </div>
          </div>

          <!-- 表达习惯 -->
          <div v-if="library.analysis.expressionHabits" class="analysis-section">
            <h3 class="analysis-section-title">✍️ 表达习惯</h3>
            <div class="expression-grid">
              <div v-if="library.analysis.expressionHabits.openingStyle" class="expression-item">
                <div class="expression-label">开头方式</div>
                <div class="expression-value">{{ library.analysis.expressionHabits.openingStyle }}</div>
                <div v-if="library.analysis.expressionHabits.openingStyleDescription" class="expression-description">
                  {{ library.analysis.expressionHabits.openingStyleDescription }}
                </div>
              </div>
              <div v-if="library.analysis.expressionHabits.punctuationStyle" class="expression-item">
                <div class="expression-label">标点风格</div>
                <div class="expression-description">
                  {{ library.analysis.expressionHabits.punctuationStyle }}
                </div>
              </div>
              <div v-if="library.analysis.expressionHabits.commonTransitions?.length" class="expression-item">
                <div class="expression-label">常用转折词</div>
                <div class="tags-list">
                  <span v-for="transition in library.analysis.expressionHabits.commonTransitions" :key="transition" class="tag tag-small">
                    {{ transition }}
                  </span>
                </div>
              </div>
              <div v-if="library.analysis.expressionHabits.commonPhrases?.length" class="expression-item">
                <div class="expression-label">常用表达</div>
                <div class="tags-list">
                  <span v-for="phrase in library.analysis.expressionHabits.commonPhrases" :key="phrase" class="tag tag-small">
                    「{{ phrase }}」
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 写作指南 -->
          <div v-if="library.analysis.writingGuidance" class="analysis-section guidance-section">
            <h3 class="analysis-section-title">📖 写作指南</h3>
            <p class="guidance-text">{{ library.analysis.writingGuidance }}</p>
          </div>
        </div>
      </section>
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
  // 不自动分析，让用户手动点击

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
  // 不自动分析，让用户手动点击

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
    // 不自动分析，让用户手动点击

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
    // 不自动分析，让用户手动点击

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
    // 不自动分析，让用户手动点击

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
    // 不自动分析，让用户手动点击

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
  // 删除后也不自动重新分析，让用户手动控制
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

  // 检查 API Key
  if (!settings.value?.deepseekApiKey) {
    alert('请先在设置中配置 DeepSeek API Key')
    return
  }

  isAnalyzing.value = true

  try {
    // 始终使用 AI 分析
    library.value.analysis = await analyzeStyleWithAI(library.value.sources, settings.value.deepseekApiKey)
    library.value.totalWords = library.value.analysis.totalWords
    await saveStyleLibrary(library.value)

    alert('✅ AI 深度分析完成！\n\n分析结果已保存到文风库。')
  } catch (error) {
    console.error('AI 分析失败:', error)
    alert(`AI 分析失败: ${error.message}`)
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

const getLifeAttitudeLabel = (attitude) => {
  const map = {
    optimistic: '乐观积极',
    pessimistic: '悲观审慎',
    realistic: '现实主义'
  }
  return map[attitude] || attitude
}

const getValueOrientationLabel = (orientation) => {
  const map = {
    idealistic: '理想主义',
    materialistic: '现实主义',
    balanced: '平衡取向'
  }
  return map[orientation] || orientation
}

const getTimeOrientationLabel = (orientation) => {
  const map = {
    present: '活在当下',
    future: '面向未来',
    past: '怀旧取向'
  }
  return map[orientation] || orientation
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

/* 分析提示横幅 */
.analysis-reminder {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-left: 4px solid var(--color-primary);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
}

.analysis-reminder svg {
  flex-shrink: 0;
  color: var(--color-primary);
}

.analysis-reminder span {
  flex: 1;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
}

/* 分析结果展示 */
.analysis-display {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.analysis-section {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-sm);
}

.analysis-section-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin: 0 0 var(--spacing-lg);
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

/* 概述和指南 */
.summary-section,
.guidance-section {
  background: var(--color-bg-secondary);
  border-left: 4px solid var(--color-primary);
}

.summary-text,
.guidance-text {
  font-size: var(--font-size-base);
  line-height: var(--line-height-relaxed);
  color: var(--color-text-secondary);
  margin: 0;
  white-space: pre-wrap;
}

/* 分析网格 */
.analysis-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--spacing-md);
}

.analysis-card {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
  transition: all var(--transition-fast);
}

.analysis-card:hover {
  box-shadow: var(--shadow-sm);
  border-color: var(--color-border-hover);
}

.analysis-card-wide {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
}

.card-label {
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  margin-bottom: var(--spacing-sm);
  letter-spacing: 0.5px;
}

.card-value {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-sm);
}

.card-description {
  font-size: var(--font-size-sm);
  line-height: var(--line-height-relaxed);
  color: var(--color-text-secondary);
  margin-top: var(--spacing-sm);
}

/* 视角分析条形图 */
.perspective-bars {
  margin-top: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.bar-item {
  display: grid;
  grid-template-columns: 80px 1fr 60px;
  gap: var(--spacing-md);
  align-items: center;
}

.bar-label {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-text-secondary);
}

.bar-track {
  position: relative;
  height: 24px;
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid var(--color-border);
}

.bar-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: var(--color-primary);
  transition: width 0.5s ease;
  border-radius: var(--radius-sm);
}

.bar-value {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text-primary);
  text-align: right;
}

/* 品味内容 */
.taste-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.taste-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.taste-label {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.taste-description {
  font-size: var(--font-size-sm);
  line-height: var(--line-height-relaxed);
  color: var(--color-text-secondary);
}

/* 标签列表 */
.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.tag {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-text-secondary);
  transition: all var(--transition-fast);
}

.tag:hover {
  background: var(--color-bg-hover);
  border-color: var(--color-border-hover);
  color: var(--color-text-primary);
}

.tag-primary {
  background: var(--color-primary-light);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.tag-small {
  padding: 4px 10px;
  font-size: var(--font-size-xs);
}

/* 表达习惯 */
.expression-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-md);
}

.expression-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.expression-label {
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.expression-value {
  font-size: var(--font-size-base);
  font-weight: 500;
  color: var(--color-text-primary);
}

.expression-description {
  font-size: var(--font-size-sm);
  line-height: var(--line-height-relaxed);
  color: var(--color-text-secondary);
}

/* 响应式 */
@media (max-width: 768px) {
  .analysis-grid {
    grid-template-columns: 1fr;
  }

  .expression-grid {
    grid-template-columns: 1fr;
  }

  .bar-item {
    grid-template-columns: 60px 1fr 50px;
  }
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
