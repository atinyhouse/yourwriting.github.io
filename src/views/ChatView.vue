<template>
  <div class="chat-view">
    <!-- 侧边栏：对话列表 -->
    <div class="sidebar" :class="{ 'sidebar-open': sidebarOpen }">
      <div class="sidebar-header">
        <h2>对话</h2>
        <button @click="toggleSidebar" class="close-btn">×</button>
      </div>

      <!-- 新建对话按钮 -->
      <button @click="createNewConversation" class="new-chat-btn">
        + 新对话
      </button>

      <!-- 搜索框 -->
      <div class="search-box">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索对话..."
          @input="filterConversations"
        />
      </div>

      <!-- 对话列表 -->
      <div class="conversations-list">
        <div
          v-for="conv in filteredConversations"
          :key="conv.id"
          :class="['conversation-item', { active: conv.id === currentConversationId }]"
          @click="switchConversation(conv.id)"
        >
          <div class="conversation-info">
            <div class="conversation-title">{{ conv.title }}</div>
            <div class="conversation-time">{{ formatDate(conv.updatedAt) }}</div>
          </div>
          <button
            @click.stop="deleteConversation(conv.id)"
            class="delete-conversation-btn"
            title="删除对话"
          >
            ×
          </button>
        </div>

        <div v-if="filteredConversations.length === 0" class="empty-conversations">
          <p v-if="searchQuery">未找到匹配的对话</p>
          <p v-else>还没有对话记录</p>
        </div>
      </div>

      <!-- 导出/导入 -->
      <div class="sidebar-footer">
        <button @click="exportConversations" class="secondary small">导出对话</button>
        <button @click="triggerImport" class="secondary small">导入对话</button>
        <input
          ref="importInput"
          type="file"
          accept=".json"
          @change="importConversations"
          style="display: none"
        />
      </div>
    </div>

    <!-- 主聊天区域 -->
    <div class="chat-main">
      <!-- 顶部栏 -->
      <div class="chat-header">
        <button @click="toggleSidebar" class="sidebar-toggle">☰</button>
        <h3>{{ currentConversation?.title || '新对话' }}</h3>
        <div class="header-actions">
          <button @click="clearCurrentChat" class="secondary small" :disabled="!currentConversation || currentConversation.messages.length === 0">
            清空当前对话
          </button>
        </div>
      </div>

      <!-- 聊天容器 -->
      <div class="chat-container">
        <!-- 对话历史 -->
        <div class="messages" ref="messagesContainer">
          <div v-if="!currentConversation || currentConversation.messages.length === 0" class="empty-state">
            <h2>开始对话</h2>
            <p>输入您的写作需求，AI 将根据您的文风库生成内容</p>
            <div v-if="!hasStyleLibrary" class="warning accent-yellow">
              <p>⚠️ 您还没有构建文风库，AI 将使用默认风格回复</p>
              <router-link to="/style-library">前往构建文风库 →</router-link>
            </div>
          </div>

          <div v-for="msg in currentConversation?.messages || []" :key="msg.id" :class="['message', msg.role]">
            <div class="message-content">
              <div class="message-header">
                <span class="role">{{ msg.role === 'user' ? '你' : 'AI' }}</span>
                <span class="time">{{ formatTime(msg.timestamp) }}</span>
              </div>
              <div class="message-text" v-html="renderMarkdown(msg.content)"></div>
            </div>
          </div>

          <div v-if="isLoading" class="message assistant">
            <div class="message-content">
              <div class="message-header">
                <span class="role">AI</span>
              </div>
              <div class="message-text">
                <div class="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 输入区域 -->
        <div class="input-area">
          <div class="input-wrapper">
            <textarea
              v-model="userInput"
              @keydown.enter.prevent="handleSend"
              placeholder="输入您的写作需求..."
              :disabled="isLoading"
              rows="3"
            ></textarea>
            <div class="input-actions">
              <button @click="handleSend" :disabled="!userInput.trim() || isLoading" class="send-btn">
                {{ isLoading ? '发送中...' : '发送' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
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
const messagesContainer = ref(null)
const styleLibrary = ref(null)
const settings = ref(null)
const sidebarOpen = ref(window.innerWidth > 768) // 桌面默认打开，移动默认关闭
const searchQuery = ref('')
const importInput = ref(null)

const hasStyleLibrary = computed(() => {
  return styleLibrary.value && styleLibrary.value.sources.length > 0
})

// 加载数据
onMounted(async () => {
  styleLibrary.value = await getStyleLibrary()
  settings.value = await getSettings()
  conversations.value = await getConversations()
  filteredConversations.value = conversations.value

  // 加载当前对话
  const savedConversationId = await getCurrentConversationId()

  if (savedConversationId) {
    currentConversationId.value = savedConversationId
    currentConversation.value = await getConversation(savedConversationId)
  } else if (conversations.value.length > 0) {
    // 如果没有保存的对话ID，使用第一个对话
    currentConversationId.value = conversations.value[0].id
    currentConversation.value = conversations.value[0]
    await setCurrentConversationId(currentConversationId.value)
  } else {
    // 如果没有任何对话，创建一个新对话
    await createNewConversation()
  }

  scrollToBottom()
})

// 监听当前对话变化，自动滚动到底部
watch(() => currentConversation.value?.messages.length, () => {
  scrollToBottom()
})

// 创建新对话
const createNewConversation = async () => {
  const newConv = await createConversation('新对话')
  conversations.value = await getConversations()
  filteredConversations.value = conversations.value
  currentConversationId.value = newConv.id
  currentConversation.value = newConv

  // 移动端创建后自动关闭侧边栏
  if (window.innerWidth <= 768) {
    sidebarOpen.value = false
  }
}

// 切换对话
const switchConversation = async (conversationId) => {
  currentConversationId.value = conversationId
  currentConversation.value = await getConversation(conversationId)
  await setCurrentConversationId(conversationId)

  // 移动端切换后自动关闭侧边栏
  if (window.innerWidth <= 768) {
    sidebarOpen.value = false
  }

  scrollToBottom()
}

// 删除对话
const deleteConversation = async (conversationId) => {
  if (!confirm('确定要删除这个对话吗？')) return

  await deleteConversationFromStorage(conversationId)
  conversations.value = await getConversations()
  filteredConversations.value = conversations.value

  // 如果删除的是当前对话
  if (conversationId === currentConversationId.value) {
    if (conversations.value.length > 0) {
      await switchConversation(conversations.value[0].id)
    } else {
      // 如果没有对话了，创建新对话
      await createNewConversation()
    }
  }
}

// 清空当前对话
const clearCurrentChat = async () => {
  if (!currentConversation.value) return
  if (!confirm('确定要清空当前对话的所有消息吗？')) return

  currentConversation.value.messages = []
  await updateConversation(currentConversationId.value, { messages: [], title: '新对话' })
  conversations.value = await getConversations()
  filteredConversations.value = conversations.value
}

// 搜索对话
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

// 发送消息
const handleSend = async () => {
  if (!userInput.value.trim() || isLoading.value) return

  // 检查 API Key
  if (!settings.value?.deepseekApiKey) {
    alert('请先在设置页面配置 DeepSeek API Key')
    return
  }

  // 如果没有当前对话，创建一个
  if (!currentConversation.value) {
    await createNewConversation()
  }

  const userMessage = {
    role: 'user',
    content: userInput.value.trim()
  }

  // 添加用户消息到对话
  await addMessageToConversation(currentConversationId.value, userMessage)
  currentConversation.value = await getConversation(currentConversationId.value)

  // 刷新对话列表（因为标题可能被自动更新）
  conversations.value = await getConversations()
  filteredConversations.value = conversations.value

  userInput.value = ''
  isLoading.value = true

  await nextTick()
  scrollToBottom()

  try {
    // 构建 prompt（使用完整对话历史）
    let styleDescription = ''
    if (settings.value.enableStyleTransfer && styleLibrary.value.analysis) {
      styleDescription = generateStyleDescription(styleLibrary.value.analysis)
    }

    // 传递完整的消息历史数组
    const promptMessages = buildStyledPrompt(
      currentConversation.value.messages,
      styleDescription,
      settings.value.enableStyleTransfer
    )

    // 创建临时 AI 消息用于流式显示
    const tempAiMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString()
    }
    currentConversation.value.messages.push(tempAiMessage)

    // 流式接收
    await streamDeepSeekAPI(
      promptMessages,
      settings.value.deepseekApiKey,
      settings.value.modelParams,
      (chunk) => {
        tempAiMessage.content += chunk
        scrollToBottom()
      }
    )

    // 保存完整的 AI 响应
    await updateConversation(currentConversationId.value, {
      messages: currentConversation.value.messages
    })

    // 刷新对话列表
    conversations.value = await getConversations()
    filteredConversations.value = conversations.value
  } catch (error) {
    console.error('API 调用失败:', error)

    // 添加错误消息
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

// 导出对话
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

    alert('对话导出成功！')
  } catch (error) {
    console.error('导出失败:', error)
    alert('导出失败: ' + error.message)
  }
}

// 触发文件选择
const triggerImport = () => {
  importInput.value.click()
}

// 导入对话
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
      throw new Error('文件格式错误')
    }

    const confirmMsg = `确定要导入 ${data.conversations.length} 个对话吗？\n\n这将覆盖当前的所有对话记录。`
    if (!confirm(confirmMsg)) return

    // 导入对话（简化版：直接覆盖）
    const { saveConversations } = await import('../utils/storage')
    await saveConversations(data.conversations)

    // 重新加载
    conversations.value = await getConversations()
    filteredConversations.value = conversations.value

    if (conversations.value.length > 0) {
      await switchConversation(conversations.value[0].id)
    }

    alert('导入成功！')
  } catch (error) {
    console.error('导入失败:', error)
    alert('导入失败: ' + error.message)
  } finally {
    event.target.value = '' // 重置文件输入
  }
}

// 切换侧边栏
const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}

// 格式化时间
const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

// 格式化日期
const formatDate = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date

  // 今天
  if (diff < 24 * 60 * 60 * 1000 && now.getDate() === date.getDate()) {
    return formatTime(timestamp)
  }

  // 昨天
  if (diff < 48 * 60 * 60 * 1000) {
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    if (date.getDate() === yesterday.getDate()) {
      return '昨天'
    }
  }

  // 其他日期
  return date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
}

// 渲染 Markdown
const renderMarkdown = (content) => {
  return marked(content)
}

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

// 需要在 storage.js 中添加 saveConversations 函数
// 这里先定义一个临时的导出逻辑
</script>

<style scoped>
.chat-view {
  display: flex;
  height: calc(100vh - 80px);
  overflow: hidden;
}

/* ========== 侧边栏 ========== */
.sidebar {
  width: 280px;
  background-color: var(--color-white);
  border-right: 2px solid var(--color-black);
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease;
}

.sidebar-header {
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--color-gray);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sidebar-header h2 {
  margin: 0;
  font-size: 18px;
}

.close-btn {
  display: none; /* 桌面端隐藏 */
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
}

.new-chat-btn {
  margin: var(--spacing-md);
  margin-bottom: var(--spacing-sm);
  padding: var(--spacing-sm);
  background-color: var(--color-blue);
  color: var(--color-white);
  border: 2px solid var(--color-black);
  font-weight: 700;
  cursor: pointer;
}

.new-chat-btn:hover {
  background-color: var(--color-black);
}

.search-box {
  padding: 0 var(--spacing-md) var(--spacing-md);
}

.search-box input {
  width: 100%;
  padding: var(--spacing-xs) var(--spacing-sm);
  border: 1px solid var(--color-gray);
  font-size: 14px;
}

.conversations-list {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-xs) var(--spacing-md);
}

.conversation-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm);
  margin-bottom: var(--spacing-xs);
  border: 1px solid var(--color-gray);
  cursor: pointer;
  transition: all 0.2s;
}

.conversation-item:hover {
  background-color: var(--color-gray-light);
  border-color: var(--color-black);
}

.conversation-item.active {
  background-color: var(--color-blue);
  color: var(--color-white);
  border-color: var(--color-black);
  border-width: 2px;
}

.conversation-info {
  flex: 1;
  min-width: 0;
}

.conversation-title {
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
}

.conversation-time {
  font-size: 11px;
  opacity: 0.7;
}

.delete-conversation-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  opacity: 0.5;
  transition: opacity 0.2s;
}

.delete-conversation-btn:hover {
  opacity: 1;
}

.conversation-item.active .delete-conversation-btn {
  color: var(--color-white);
}

.empty-conversations {
  text-align: center;
  padding: var(--spacing-lg) var(--spacing-md);
  color: var(--color-gray-dark);
  font-size: 14px;
}

.sidebar-footer {
  padding: var(--spacing-md);
  border-top: 1px solid var(--color-gray);
  display: flex;
  gap: var(--spacing-xs);
}

.sidebar-footer button {
  flex: 1;
  font-size: 12px;
  padding: var(--spacing-xs);
}

/* ========== 主聊天区域 ========== */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-header {
  padding: var(--spacing-md);
  border-bottom: 2px solid var(--color-black);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  background-color: var(--color-white);
}

.sidebar-toggle {
  display: none; /* 桌面端隐藏 */
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
}

.chat-header h3 {
  flex: 1;
  margin: 0;
  font-size: 16px;
}

.header-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.header-actions button.small {
  font-size: 12px;
  padding: 6px 12px;
}

.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: var(--spacing-md);
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-md);
  border: 1px solid var(--color-gray);
  margin-bottom: var(--spacing-md);
  background-color: var(--color-gray-light);
}

.empty-state {
  text-align: center;
  padding: var(--spacing-xl) var(--spacing-md);
  color: var(--color-gray-dark);
}

.empty-state h2 {
  margin-bottom: var(--spacing-sm);
}

.empty-state .warning {
  margin-top: var(--spacing-lg);
  padding: var(--spacing-md);
  background-color: var(--color-white);
  text-align: left;
}

.message {
  margin-bottom: var(--spacing-md);
  display: flex;
}

.message.user {
  justify-content: flex-end;
}

.message.assistant {
  justify-content: flex-start;
}

.message-content {
  max-width: 80%;
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-white);
  border: 1px solid var(--color-gray);
}

.message.user .message-content {
  border-left: 3px solid var(--color-blue);
}

.message.assistant .message-content {
  border-left: 3px solid var(--color-red);
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xs);
  font-size: 12px;
  color: var(--color-gray-dark);
}

.role {
  font-weight: 700;
  text-transform: uppercase;
}

.message-text {
  line-height: 1.6;
  word-wrap: break-word;
}

.typing-indicator {
  display: flex;
  gap: 4px;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background-color: var(--color-gray-dark);
  border-radius: 50%;
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    opacity: 0.3;
    transform: translateY(0);
  }
  30% {
    opacity: 1;
    transform: translateY(-10px);
  }
}

.input-area {
  border-top: 2px solid var(--color-black);
  padding-top: var(--spacing-md);
}

.input-wrapper textarea {
  margin-bottom: var(--spacing-sm);
}

.input-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
}

.send-btn {
  padding: var(--spacing-sm) var(--spacing-lg);
  background-color: var(--color-blue);
  color: var(--color-white);
  border: 2px solid var(--color-black);
  font-weight: 700;
}

.send-btn:hover:not(:disabled) {
  background-color: var(--color-black);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ========== 响应式设计 ========== */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    z-index: 1000;
    transform: translateX(-100%);
  }

  .sidebar.sidebar-open {
    transform: translateX(0);
    box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  }

  .close-btn {
    display: block;
  }

  .sidebar-toggle {
    display: block;
  }

  .chat-header h3 {
    font-size: 14px;
  }

  .header-actions button {
    font-size: 11px;
    padding: 4px 8px;
  }

  .message-content {
    max-width: 90%;
  }

  .input-actions {
    flex-direction: column;
  }

  .input-actions button {
    width: 100%;
  }
}
</style>
