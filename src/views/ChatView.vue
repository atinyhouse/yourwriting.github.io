<template>
  <div class="chat-view" :class="{ 'initialized': !isInitializing }">
    <!-- 侧边栏：对话列表 -->
    <aside class="sidebar" :class="{ 'is-open': sidebarOpen, 'ready': !isInitializing }">
      <div class="sidebar-header">
        <h2>对话列表</h2>
        <button @click="toggleSidebar" class="icon-btn close-btn" aria-label="关闭">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" stroke-width="2"/>
          </svg>
        </button>
      </div>

      <!-- 新建对话 -->
      <button @click="createNewConversation" class="new-chat-btn">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 3V13M3 8H13" stroke="currentColor" stroke-width="2"/>
        </svg>
        新对话
      </button>

      <!-- 搜索 -->
      <div class="search-wrapper">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索..."
          @input="filterConversations"
          class="search-input"
        />
      </div>

      <!-- 对话列表 -->
      <div class="conversations-list">
        <div
          v-for="conv in filteredConversations"
          :key="conv.id"
          :class="['conversation-item', { 'is-active': conv.id === currentConversationId }]"
          @click="switchConversation(conv.id)"
        >
          <div class="conv-content">
            <div class="conv-title">{{ conv.title }}</div>
            <div class="conv-meta">{{ formatDate(conv.updatedAt) }}</div>
          </div>
          <button
            @click.stop="deleteConversation(conv.id)"
            class="icon-btn delete-btn"
            aria-label="删除"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" stroke-width="1.5"/>
            </svg>
          </button>
        </div>

        <div v-if="filteredConversations.length === 0" class="empty-state">
          <p>{{ searchQuery ? '无搜索结果' : '还没有对话' }}</p>
        </div>
      </div>

    </aside>

    <!-- 主内容区 -->
    <main class="main-content">
      <!-- 顶部栏 -->
      <header class="chat-header">
        <button @click="toggleSidebar" class="icon-btn menu-btn">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 5H17M3 10H17M3 15H17" stroke="currentColor" stroke-width="2"/>
          </svg>
        </button>
        <h1 class="chat-title">{{ currentConversation?.title || '新对话' }}</h1>
        <button
          @click="clearCurrentChat"
          class="icon-btn clear-btn"
          :disabled="!currentConversation || currentConversation.messages.length === 0"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M4 4L14 14M14 4L4 14" stroke="currentColor" stroke-width="2"/>
          </svg>
        </button>
      </header>

      <!-- 消息区域 -->
      <div class="messages-container" ref="messagesContainer">
        <!-- 加载中骨架屏 -->
        <div v-if="isInitializing" class="loading-skeleton">
          <div class="skeleton-message">
            <div class="skeleton-avatar"></div>
            <div class="skeleton-content">
              <div class="skeleton-line"></div>
              <div class="skeleton-line short"></div>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-else-if="!currentConversation || currentConversation.messages.length === 0" class="welcome">
          <div class="welcome-icon">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
              <rect x="8" y="8" width="48" height="48" stroke="currentColor" stroke-width="3"/>
              <path d="M20 28H44M20 36H36" stroke="currentColor" stroke-width="3"/>
            </svg>
          </div>
          <h2>开始对话</h2>
          <p>在下方输入您的写作需求</p>
          <div v-if="!hasStyleLibrary" class="warning-box">
            <p>⚠ 还未建立文风库</p>
            <router-link to="/style-library" class="link">建立文风库 →</router-link>
          </div>
        </div>

        <!-- 消息列表 -->
        <div v-else class="messages-list">
          <div
            v-for="msg in currentConversation.messages"
            :key="msg.id"
            :class="['message', `message--${msg.role}`]"
          >
            <div class="message-avatar">
              <span>{{ msg.role === 'user' ? 'U' : 'AI' }}</span>
            </div>
            <div class="message-body">
              <div class="message-header">
                <span class="message-role">{{ msg.role === 'user' ? 'YOU' : 'ASSISTANT' }}</span>
                <span class="message-time">{{ formatTime(msg.timestamp) }}</span>
              </div>
              <div class="message-text" v-html="renderMarkdown(msg.content)"></div>
            </div>
          </div>

          <!-- 加载中 -->
          <div v-if="isLoading" class="message message--assistant">
            <div class="message-avatar">
              <span>AI</span>
            </div>
            <div class="message-body">
              <div class="message-header">
                <span class="message-role">ASSISTANT</span>
              </div>
              <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="input-section">
        <div class="input-wrapper">
          <div class="input-container">
            <textarea
              ref="inputField"
              v-model="userInput"
              @keydown="handleKeydown"
              @input="adjustTextareaHeight"
              placeholder="输入您的消息... (Shift + Enter 换行)"
              :disabled="isLoading"
              rows="1"
              class="input-field"
            ></textarea>
            <div class="input-actions">
              <button
                @click="handleSend"
                :disabled="!userInput.trim() || isLoading"
                class="send-btn"
                title="发送 (Enter)"
              >
                ▶
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed, watch } from 'vue'
import { marked } from 'marked'
import {
  getStyleLibrary,
  getSettings,
  getConversations,
  getCurrentConversationId,
  setCurrentConversationId,
  createConversation,
  getConversation,
  updateConversation,
  deleteConversation as deleteConversationFromStorage,
  addMessageToConversation
} from '../utils/storage'
import { analyzeWritingStyle, generateStyleDescription } from '../utils/styleAnalysis'
import { streamDeepSeekAPI, buildStyledPrompt } from '../utils/deepseekAPI'

// State
const conversations = ref([])
const filteredConversations = ref([])
const currentConversationId = ref(null)
const currentConversation = ref(null)
const userInput = ref('')
const isLoading = ref(false)
const isInitializing = ref(true)  // 添加初始化状态
const messagesContainer = ref(null)
const inputField = ref(null)
const styleLibrary = ref(null)
const settings = ref(null)
const sidebarOpen = ref(window.innerWidth > 1024)
const searchQuery = ref('')
const importInput = ref(null)

const hasStyleLibrary = computed(() => {
  return styleLibrary.value && styleLibrary.value.sources.length > 0
})

onMounted(async () => {
  isInitializing.value = true

  // 并行加载所有数据，提升性能
  const [styleLib, settingsData, conversationsData, savedConvId] = await Promise.all([
    getStyleLibrary(),
    getSettings(),
    getConversations(),
    getCurrentConversationId()
  ])

  styleLibrary.value = styleLib
  settings.value = settingsData
  conversations.value = conversationsData
  filteredConversations.value = conversationsData

  if (savedConvId) {
    currentConversationId.value = savedConvId
    currentConversation.value = await getConversation(savedConvId)
  } else if (conversationsData.length > 0) {
    currentConversationId.value = conversationsData[0].id
    currentConversation.value = conversationsData[0]
    await setCurrentConversationId(currentConversationId.value)
  } else {
    await createNewConversation()
  }

  // 数据加载完成后再显示内容，避免跳变
  isInitializing.value = false

  // Initialize textarea height
  await nextTick()
  adjustTextareaHeight()
})

watch(() => currentConversation.value?.messages.length, () => {
  scrollToBottom()
})

const createNewConversation = async () => {
  const newConv = await createConversation('新对话')
  conversations.value = await getConversations()
  filteredConversations.value = conversations.value
  currentConversationId.value = newConv.id
  currentConversation.value = newConv

  if (window.innerWidth <= 1024) {
    sidebarOpen.value = false
  }
}

const switchConversation = async (conversationId) => {
  currentConversationId.value = conversationId
  currentConversation.value = await getConversation(conversationId)
  await setCurrentConversationId(conversationId)

  if (window.innerWidth <= 1024) {
    sidebarOpen.value = false
  }

  // 切换对话时滚动到底部
  scrollToBottom(true)
}

const deleteConversation = async (conversationId) => {
  if (!confirm('确定要删除这个对话吗？')) return

  await deleteConversationFromStorage(conversationId)
  conversations.value = await getConversations()
  filteredConversations.value = conversations.value

  if (conversationId === currentConversationId.value) {
    if (conversations.value.length > 0) {
      await switchConversation(conversations.value[0].id)
    } else {
      await createNewConversation()
    }
  }
}

const clearCurrentChat = async () => {
  if (!currentConversation.value) return
  if (!confirm('确定要清空这个对话的所有消息吗？')) return

  currentConversation.value.messages = []
  // 转换为纯对象避免 IndexedDB 克隆错误
  await updateConversation(currentConversationId.value, {
    messages: [],
    title: '新对话'
  })
  conversations.value = await getConversations()
  filteredConversations.value = conversations.value
}

const filterConversations = () => {
  const query = searchQuery.value.toLowerCase().trim()
  if (!query) {
    filteredConversations.value = conversations.value
    return
  }

  filteredConversations.value = conversations.value.filter(conv => {
    const titleMatch = conv.title.toLowerCase().includes(query)
    const messageMatch = conv.messages.some(msg =>
      msg.content.toLowerCase().includes(query)
    )
    return titleMatch || messageMatch
  })
}

const handleKeydown = (event) => {
  // Enter without Shift: send message
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    handleSend()
  }
  // Shift + Enter: allow new line (default behavior)
}

const adjustTextareaHeight = () => {
  if (!inputField.value) return

  // Reset height to auto to get the correct scrollHeight
  inputField.value.style.height = 'auto'

  // Set new height based on scrollHeight, with max-height handled by CSS
  const newHeight = Math.min(inputField.value.scrollHeight, 200) // max 200px
  inputField.value.style.height = `${newHeight}px`
}

const handleSend = async () => {
  if (!userInput.value.trim() || isLoading.value) return

  if (!settings.value?.deepseekApiKey) {
    alert('Please configure DeepSeek API Key in settings')
    return
  }

  if (!currentConversation.value) {
    await createNewConversation()
  }

  const userMessage = {
    role: 'user',
    content: userInput.value.trim()
  }

  await addMessageToConversation(currentConversationId.value, userMessage)
  // 添加用户消息后重新获取对话
  const updatedConv = await getConversation(currentConversationId.value)

  // 手动添加用户消息到本地显示（避免重复获取）
  if (currentConversation.value && !currentConversation.value.messages.find(m => m.content === userMessage.content && m.role === 'user')) {
    currentConversation.value.messages.push({
      ...userMessage,
      id: Date.now().toString(),
      timestamp: new Date().toISOString()
    })
  }

  conversations.value = await getConversations()
  filteredConversations.value = conversations.value

  userInput.value = ''

  // Reset textarea height after sending
  await nextTick()
  if (inputField.value) {
    inputField.value.style.height = 'auto'
  }

  isLoading.value = true

  await nextTick()
  scrollToBottom(true)  // 发送消息后强制滚动到底部

  try {
    // 重新加载文风库，确保使用最新的分析结果
    styleLibrary.value = await getStyleLibrary()

    let styleDescription = ''
    let styleSamples = []
    if (settings.value.enableStyleTransfer && styleLibrary.value.analysis) {
      styleDescription = generateStyleDescription(styleLibrary.value.analysis)

      // 提取文风样本用于 few-shot learning（最多3个样本）
      if (styleLibrary.value.sources && styleLibrary.value.sources.length > 0) {
        styleSamples = styleLibrary.value.sources
          .slice(0, 3)
          .map(source => source.content)
      }
    }

    const promptMessages = buildStyledPrompt(
      currentConversation.value.messages,
      styleDescription,
      settings.value.enableStyleTransfer,
      styleSamples
    )

    const tempAiMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString()
    }
    currentConversation.value.messages.push(tempAiMessage)

    await streamDeepSeekAPI(
      promptMessages,
      settings.value.deepseekApiKey,
      settings.value.modelParams,
      (chunk) => {
        tempAiMessage.content += chunk
        scrollToBottom(true)  // AI回复时强制滚动
      }
    )

    // 将响应式对象转换为纯对象，避免 IndexedDB 克隆错误
    const plainMessages = JSON.parse(JSON.stringify(currentConversation.value.messages))
    await updateConversation(currentConversationId.value, {
      messages: plainMessages
    })

    conversations.value = await getConversations()
    filteredConversations.value = conversations.value
  } catch (error) {
    console.error('API error:', error)
    const errorMessage = {
      role: 'system',
      content: `错误: ${error.message}`
    }
    await addMessageToConversation(currentConversationId.value, errorMessage)
    currentConversation.value = await getConversation(currentConversationId.value)
  } finally {
    isLoading.value = false
  }
}

const exportConversations = async () => {
  try {
    const data = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      conversations: conversations.value
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `conversations_${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Export failed:', error)
    alert('导出失败: ' + error.message)
  }
}

const triggerImport = () => {
  importInput.value.click()
}

const importConversations = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  try {
    const text = await file.text()
    const data = JSON.parse(text)

    if (data.version !== '1.0') {
      throw new Error('不支持的文件版本')
    }

    if (!Array.isArray(data.conversations)) {
      throw new Error('无效的文件格式')
    }

    if (!confirm(`导入 ${data.conversations.length} 个对话？\n\n这将替换所有当前对话。`)) return

    const { saveConversations } = await import('../utils/storage')
    await saveConversations(data.conversations)

    conversations.value = await getConversations()
    filteredConversations.value = conversations.value

    if (conversations.value.length > 0) {
      await switchConversation(conversations.value[0].id)
    }

    alert('导入成功！')
  } catch (error) {
    console.error('Import failed:', error)
    alert('导入失败: ' + error.message)
  } finally {
    event.target.value = ''
  }
}

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}

const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
}

const formatDate = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date

  if (diff < 24 * 60 * 60 * 1000 && now.getDate() === date.getDate()) {
    return formatTime(timestamp)
  }

  if (diff < 48 * 60 * 60 * 1000) {
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    if (date.getDate() === yesterday.getDate()) {
      return '昨天'
    }
  }

  return date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })
}

const renderMarkdown = (content) => {
  return marked(content)
}

const scrollToBottom = (force = false) => {
  nextTick(() => {
    if (messagesContainer.value) {
      // 只有在用户发送消息或强制滚动时才滚动到底部
      // 避免页面刷新时的跳变
      const container = messagesContainer.value
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100

      if (force || isNearBottom) {
        container.scrollTop = container.scrollHeight
      }
    }
  })
}
</script>

<style scoped>
/* ========== RESET & BASE ========== */
* {
  box-sizing: border-box;
}

/* 页面初始化时禁用所有过渡动画，避免跳变 */
.chat-view:not(.initialized) * {
  transition: none !important;
  animation: none !important;
}

.chat-view {
  display: flex;
  height: calc(100vh - 80px);
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  font-family: var(--font-family);
  overflow: hidden;
}

/* ========== SIDEBAR ========== */
.sidebar {
  width: 280px;
  background: var(--color-bg-primary);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  box-shadow: var(--shadow-sm);
  /* 初始化时禁用动画，避免跳变 */
  transition: none;
}

.sidebar.ready {
  /* 数据加载完成后启用动画 */
  transition: transform var(--transition-base);
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--color-border);
}

.sidebar-header h2 {
  margin: 0;
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text-secondary);
}

.icon-btn {
  background: none;
  border: none;
  color: var(--color-text-tertiary);
  cursor: pointer;
  padding: var(--spacing-sm);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.icon-btn:hover:not(:disabled) {
  color: var(--color-text-primary);
  background: var(--color-bg-hover);
}

.icon-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.close-btn {
  display: none;
}

.new-chat-btn {
  margin: var(--spacing-md) var(--spacing-md) var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  justify-content: center;
  transition: all var(--transition-fast);
  box-shadow: var(--shadow-sm);
}

.new-chat-btn:hover {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.new-chat-btn:active {
  transform: translateY(0);
  box-shadow: var(--shadow-sm);
}

.search-wrapper {
  padding: var(--spacing-sm) var(--spacing-md) var(--spacing-md);
}

.search-input {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  font-family: var(--font-family);
  outline: none;
  transition: all var(--transition-fast);
}

.search-input::placeholder {
  color: var(--color-text-tertiary);
}

.search-input:focus {
  border-color: var(--color-primary);
  background: var(--color-bg-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.conversations-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 var(--spacing-sm);
}

.conversation-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-xs);
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
  background: transparent;
}

.conversation-item:hover {
  background: var(--color-bg-hover);
}

.conversation-item.is-active {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.conv-content {
  flex: 1;
  min-width: 0;
}

.conv-title {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: var(--spacing-xs);
}

.conv-meta {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
}

.delete-btn {
  opacity: 0;
  padding: var(--spacing-xs);
}

.conversation-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  color: var(--color-error);
  background: var(--color-error-light);
}

.empty-state {
  text-align: center;
  padding: var(--spacing-3xl) var(--spacing-lg);
  color: var(--color-text-tertiary);
  font-size: var(--font-size-sm);
}

.sidebar-footer {
  display: flex;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-primary);
}

.footer-btn {
  flex: 1;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  transition: all var(--transition-fast);
}

.footer-btn:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
  border-color: var(--color-border-hover);
}

/* ========== MAIN CONTENT ========== */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-secondary);
  overflow: hidden;
}

.chat-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-lg) var(--spacing-xl);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-primary);
  flex-shrink: 0;
  box-shadow: var(--shadow-sm);
}

.menu-btn {
  display: none;
}

.chat-title {
  flex: 1;
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ========== MESSAGES ========== */
.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-xl);
}

/* 加载骨架屏 */
.loading-skeleton {
  max-width: 900px;
  margin: var(--spacing-3xl) auto;
}

.skeleton-message {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-2xl);
}

.skeleton-avatar {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  background: linear-gradient(
    90deg,
    var(--color-bg-tertiary) 25%,
    var(--color-bg-hover) 50%,
    var(--color-bg-tertiary) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
}

.skeleton-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.skeleton-line {
  height: 16px;
  border-radius: var(--radius-sm);
  background: linear-gradient(
    90deg,
    var(--color-bg-tertiary) 25%,
    var(--color-bg-hover) 50%,
    var(--color-bg-tertiary) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
}

.skeleton-line.short {
  width: 60%;
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.welcome {
  max-width: 600px;
  margin: var(--spacing-3xl) auto;
  text-align: center;
}

.welcome-icon {
  margin-bottom: var(--spacing-xl);
  color: var(--color-border);
}

.welcome h2 {
  margin: 0 0 var(--spacing-md);
  font-size: var(--font-size-3xl);
  font-weight: 600;
  color: var(--color-text-primary);
}

.welcome p {
  margin: 0 0 var(--spacing-2xl);
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
}

.warning-box {
  padding: var(--spacing-lg);
  background: var(--color-warning-light);
  border: 1px solid var(--color-warning);
  border-radius: var(--radius-lg);
  margin-top: var(--spacing-2xl);
}

.warning-box p {
  margin: 0 0 var(--spacing-sm);
  color: var(--color-warning);
  font-size: var(--font-size-sm);
  font-weight: 500;
}

.link {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 600;
  transition: color var(--transition-fast);
}

.link:hover {
  color: var(--color-primary-hover);
  text-decoration: underline;
}

.messages-list {
  max-width: 900px;
  margin: 0 auto;
}

.message {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-2xl);
}

.message-avatar {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-xs);
  font-weight: 600;
  border-radius: var(--radius-md);
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
}

.message--user .message-avatar {
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.message--assistant .message-avatar {
  background: var(--color-primary);
  color: white;
}

.message--system .message-avatar {
  background: var(--color-error);
  color: white;
}

.message-body {
  flex: 1;
  min-width: 0;
}

.message-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-sm);
}

.message-role {
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--color-text-tertiary);
}

.message-time {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
}

.message-text {
  font-size: var(--font-size-base);
  line-height: var(--line-height-relaxed);
  color: var(--color-text-primary);
}

.message-text :deep(p) {
  margin: 0 0 var(--spacing-md);
}

.message-text :deep(p:last-child) {
  margin-bottom: 0;
}

.message-text :deep(code) {
  background: var(--color-bg-tertiary);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  color: var(--color-error);
  border: 1px solid var(--color-border);
}

.message-text :deep(pre) {
  background: var(--color-bg-tertiary);
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
  overflow-x: auto;
  border: 1px solid var(--color-border);
  margin: var(--spacing-md) 0;
}

.message-text :deep(pre code) {
  background: none;
  padding: 0;
  color: var(--color-text-primary);
  border: none;
}

.typing-dots {
  display: flex;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) 0;
}

.typing-dots span {
  width: 6px;
  height: 6px;
  background: var(--color-text-tertiary);
  border-radius: 50%;
  animation: typing-bounce 1.4s infinite ease-in-out;
}

.typing-dots span:nth-child(1) {
  animation-delay: 0s;
}

.typing-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing-bounce {
  0%, 60%, 100% {
    opacity: 0.3;
    transform: scale(0.8);
  }
  30% {
    opacity: 1;
    transform: scale(1);
  }
}

/* ========== INPUT SECTION ========== */
.input-section {
  padding: var(--spacing-lg) var(--spacing-xl);
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-primary);
  flex-shrink: 0;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.04);
}

.input-wrapper {
  max-width: 900px;
  margin: 0 auto;
}

.input-container {
  position: relative;
  display: flex;
  gap: var(--spacing-sm);
  align-items: flex-end;
  background: var(--color-bg-secondary);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-sm);
  transition: all var(--transition-fast);
}

.input-container:focus-within {
  border-color: var(--color-primary);
  background: var(--color-bg-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light), 0 4px 12px rgba(0, 0, 0, 0.08);
}

.input-field {
  flex: 1;
  padding: var(--spacing-sm) var(--spacing-md);
  background: transparent;
  border: none;
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
  line-height: 1.5;
  resize: none;
  outline: none;
  font-family: var(--font-family);
  min-height: 24px;
  max-height: 200px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--color-border) transparent;
}

.input-field::-webkit-scrollbar {
  width: 6px;
}

.input-field::-webkit-scrollbar-track {
  background: transparent;
}

.input-field::-webkit-scrollbar-thumb {
  background-color: var(--color-border);
  border-radius: 3px;
}

.input-field::-webkit-scrollbar-thumb:hover {
  background-color: var(--color-text-tertiary);
}

.input-field::placeholder {
  color: var(--color-text-tertiary);
}

.input-field:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.input-actions {
  display: flex;
  align-items: flex-end;
  gap: var(--spacing-xs);
  padding-bottom: 2px;
}

.send-btn {
  width: 36px;
  height: 36px;
  background: var(--color-primary);
  border: none;
  border-radius: var(--radius-md);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
  flex-shrink: 0;
  overflow: visible;
  font-size: 20px;
  font-weight: bold;
  line-height: 1;
}

.send-btn svg {
  display: block;
  width: 18px;
  height: 18px;
  pointer-events: none;
}

.send-btn:hover:not(:disabled) {
  background: var(--color-primary-hover);
  transform: scale(1.05);
}

.send-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.send-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ========== RESPONSIVE ========== */
@media (max-width: 1024px) {
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    z-index: 1000;
    transform: translateX(-100%);
    box-shadow: 0 0 0 0 rgba(0, 0, 0, 0);
  }

  .sidebar.is-open {
    transform: translateX(0);
    box-shadow: 4px 0 24px rgba(0, 0, 0, 0.2);
  }

  .close-btn {
    display: flex;
  }

  .menu-btn {
    display: flex;
  }

  .chat-header {
    padding: 16px;
  }

  .messages-container {
    padding: 16px;
  }

  .input-section {
    padding: 16px;
  }

  .input-container {
    padding: var(--spacing-xs);
  }

  .input-field {
    font-size: 16px; /* Prevent zoom on iOS */
  }

  .send-btn {
    width: 32px;
    height: 32px;
  }

  .message {
    margin-bottom: 24px;
  }

  .message-avatar {
    width: 32px;
    height: 32px;
    font-size: 10px;
  }
}

@media (max-width: 640px) {
  .chat-title {
    font-size: 14px;
  }

  .message-text {
    font-size: 14px;
  }

  .input-field {
    font-size: 14px;
  }

  .welcome h2 {
    font-size: 24px;
  }
}
</style>
