<template>
  <div class="chat-view">
    <!-- 侧边栏：对话列表 -->
    <aside class="sidebar" :class="{ 'is-open': sidebarOpen }">
      <div class="sidebar-header">
        <h2>CONVERSATIONS</h2>
        <button @click="toggleSidebar" class="icon-btn close-btn" aria-label="Close">
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
        NEW CHAT
      </button>

      <!-- 搜索 -->
      <div class="search-wrapper">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search..."
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
            aria-label="Delete"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" stroke-width="1.5"/>
            </svg>
          </button>
        </div>

        <div v-if="filteredConversations.length === 0" class="empty-state">
          <p>{{ searchQuery ? 'No results' : 'No conversations yet' }}</p>
        </div>
      </div>

      <!-- 底部操作 -->
      <div class="sidebar-footer">
        <button @click="exportConversations" class="footer-btn">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 11V3M8 11L5 8M8 11L11 8M3 13H13" stroke="currentColor" stroke-width="1.5"/>
          </svg>
          Export
        </button>
        <button @click="triggerImport" class="footer-btn">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3V11M8 3L5 6M8 3L11 6M3 13H13" stroke="currentColor" stroke-width="1.5"/>
          </svg>
          Import
        </button>
        <input
          ref="importInput"
          type="file"
          accept=".json"
          @change="importConversations"
          style="display: none"
        />
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
        <h1 class="chat-title">{{ currentConversation?.title || 'New Chat' }}</h1>
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
        <!-- 空状态 -->
        <div v-if="!currentConversation || currentConversation.messages.length === 0" class="welcome">
          <div class="welcome-icon">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
              <rect x="8" y="8" width="48" height="48" stroke="currentColor" stroke-width="3"/>
              <path d="M20 28H44M20 36H36" stroke="currentColor" stroke-width="3"/>
            </svg>
          </div>
          <h2>Start a Conversation</h2>
          <p>Type your writing request below</p>
          <div v-if="!hasStyleLibrary" class="warning-box">
            <p>⚠ No style library yet</p>
            <router-link to="/style-library" class="link">Build your style →</router-link>
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
          <textarea
            v-model="userInput"
            @keydown.enter.prevent="handleSend"
            placeholder="Type your message..."
            :disabled="isLoading"
            rows="1"
            class="input-field"
          ></textarea>
          <button
            @click="handleSend"
            :disabled="!userInput.trim() || isLoading"
            class="send-btn"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M18 2L9 11M18 2L12 18L9 11M18 2L2 8L9 11" stroke="currentColor" stroke-width="2" stroke-linejoin="bevel"/>
            </svg>
          </button>
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
const messagesContainer = ref(null)
const styleLibrary = ref(null)
const settings = ref(null)
const sidebarOpen = ref(window.innerWidth > 1024)
const searchQuery = ref('')
const importInput = ref(null)

const hasStyleLibrary = computed(() => {
  return styleLibrary.value && styleLibrary.value.sources.length > 0
})

onMounted(async () => {
  styleLibrary.value = await getStyleLibrary()
  settings.value = await getSettings()
  conversations.value = await getConversations()
  filteredConversations.value = conversations.value

  const savedConversationId = await getCurrentConversationId()

  if (savedConversationId) {
    currentConversationId.value = savedConversationId
    currentConversation.value = await getConversation(savedConversationId)
  } else if (conversations.value.length > 0) {
    currentConversationId.value = conversations.value[0].id
    currentConversation.value = conversations.value[0]
    await setCurrentConversationId(currentConversationId.value)
  } else {
    await createNewConversation()
  }

  scrollToBottom()
})

watch(() => currentConversation.value?.messages.length, () => {
  scrollToBottom()
})

const createNewConversation = async () => {
  const newConv = await createConversation('New Chat')
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

  scrollToBottom()
}

const deleteConversation = async (conversationId) => {
  if (!confirm('Delete this conversation?')) return

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
  if (!confirm('Clear all messages in this conversation?')) return

  currentConversation.value.messages = []
  // 转换为纯对象避免 IndexedDB 克隆错误
  await updateConversation(currentConversationId.value, {
    messages: [],
    title: 'New Chat'
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
  currentConversation.value = await getConversation(currentConversationId.value)
  conversations.value = await getConversations()
  filteredConversations.value = conversations.value

  userInput.value = ''
  isLoading.value = true

  await nextTick()
  scrollToBottom()

  try {
    let styleDescription = ''
    if (settings.value.enableStyleTransfer && styleLibrary.value.analysis) {
      styleDescription = generateStyleDescription(styleLibrary.value.analysis)
    }

    const promptMessages = buildStyledPrompt(
      currentConversation.value.messages,
      styleDescription,
      settings.value.enableStyleTransfer
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
        scrollToBottom()
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
      content: `Error: ${error.message}`
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
    alert('Export failed: ' + error.message)
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
      throw new Error('Unsupported file version')
    }

    if (!Array.isArray(data.conversations)) {
      throw new Error('Invalid file format')
    }

    if (!confirm(`Import ${data.conversations.length} conversations?\n\nThis will replace all current conversations.`)) return

    const { saveConversations } = await import('../utils/storage')
    await saveConversations(data.conversations)

    conversations.value = await getConversations()
    filteredConversations.value = conversations.value

    if (conversations.value.length > 0) {
      await switchConversation(conversations.value[0].id)
    }

    alert('Import successful!')
  } catch (error) {
    console.error('Import failed:', error)
    alert('Import failed: ' + error.message)
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
      return 'Yesterday'
    }
  }

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const renderMarkdown = (content) => {
  return marked(content)
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}
</script>

<style scoped>
/* ========== RESET & BASE ========== */
* {
  box-sizing: border-box;
}

.chat-view {
  display: flex;
  height: calc(100vh - 80px);
  background: #fafafa;
  color: #000;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  overflow: hidden;
}

/* ========== SIDEBAR ========== */
.sidebar {
  width: 280px;
  background: #fff;
  border-right: 2px solid #000;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 2px solid #000;
}

.sidebar-header h2 {
  margin: 0;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.5px;
  color: #000;
}

.icon-btn {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.icon-btn:hover:not(:disabled) {
  color: #000;
  background: #f0f0f0;
}

.icon-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.close-btn {
  display: none;
}

.new-chat-btn {
  margin: 16px 16px 8px;
  padding: 12px 16px;
  background: #000;
  color: #fff;
  border: none;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  transition: all 0.2s;
}

.new-chat-btn:hover {
  background: #0066ff;
  transform: translateY(-1px);
}

.new-chat-btn:active {
  transform: translateY(0);
}

.search-wrapper {
  padding: 8px 16px 16px;
}

.search-input {
  width: 100%;
  padding: 10px 12px;
  background: #fafafa;
  border: 2px solid #e0e0e0;
  color: #000;
  font-size: 13px;
  outline: none;
  transition: all 0.2s;
}

.search-input::placeholder {
  color: #999;
}

.search-input:focus {
  border-color: #000;
  background: #fff;
}

.conversations-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 8px;
}

.conversations-list::-webkit-scrollbar {
  width: 6px;
}

.conversations-list::-webkit-scrollbar-track {
  background: transparent;
}

.conversations-list::-webkit-scrollbar-thumb {
  background: #ddd;
}

.conversations-list::-webkit-scrollbar-thumb:hover {
  background: #bbb;
}

.conversation-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  margin-bottom: 2px;
  cursor: pointer;
  transition: all 0.15s;
  border-left: 3px solid transparent;
  background: transparent;
}

.conversation-item:hover {
  background: #f5f5f5;
  border-left-color: #999;
}

.conversation-item.is-active {
  background: #f0f0f0;
  border-left-color: #0066ff;
}

.conv-content {
  flex: 1;
  min-width: 0;
}

.conv-title {
  font-size: 13px;
  font-weight: 500;
  color: #000;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.conv-meta {
  font-size: 11px;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.delete-btn {
  opacity: 0;
  padding: 6px;
}

.conversation-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  color: #ff3333;
  background: #fee;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #999;
  font-size: 13px;
}

.sidebar-footer {
  display: flex;
  gap: 8px;
  padding: 16px;
  border-top: 2px solid #000;
  background: #fff;
}

.footer-btn {
  flex: 1;
  padding: 10px;
  background: #fff;
  border: 2px solid #000;
  color: #000;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s;
  text-transform: uppercase;
}

.footer-btn:hover {
  background: #000;
  color: #fff;
}

/* ========== MAIN CONTENT ========== */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #fafafa;
  overflow: hidden;
}

.chat-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  border-bottom: 2px solid #000;
  background: #fff;
  flex-shrink: 0;
}

.menu-btn {
  display: none;
}

.chat-title {
  flex: 1;
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #000;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ========== MESSAGES ========== */
.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.messages-container::-webkit-scrollbar {
  width: 8px;
}

.messages-container::-webkit-scrollbar-track {
  background: transparent;
}

.messages-container::-webkit-scrollbar-thumb {
  background: #ddd;
}

.messages-container::-webkit-scrollbar-thumb:hover {
  background: #bbb;
}

.welcome {
  max-width: 600px;
  margin: 80px auto;
  text-align: center;
}

.welcome-icon {
  margin-bottom: 24px;
  color: #ddd;
}

.welcome h2 {
  margin: 0 0 12px;
  font-size: 28px;
  font-weight: 700;
  color: #000;
}

.welcome p {
  margin: 0 0 32px;
  font-size: 15px;
  color: #666;
}

.warning-box {
  padding: 20px;
  background: #fffbea;
  border: 2px solid #ffcc00;
  margin-top: 32px;
}

.warning-box p {
  margin: 0 0 8px;
  color: #996600;
  font-size: 14px;
}

.link {
  color: #0066ff;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s;
}

.link:hover {
  color: #0044cc;
  text-decoration: underline;
}

.messages-list {
  max-width: 900px;
  margin: 0 auto;
}

.message {
  display: flex;
  gap: 16px;
  margin-bottom: 32px;
}

.message-avatar {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
  border: 2px solid #000;
}

.message--user .message-avatar {
  background: #fff;
  color: #000;
}

.message--assistant .message-avatar {
  background: #0066ff;
  color: #fff;
}

.message--system .message-avatar {
  background: #ff3333;
  color: #fff;
}

.message-body {
  flex: 1;
  min-width: 0;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.message-role {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1px;
  color: #999;
}

.message-time {
  font-size: 10px;
  color: #ccc;
  letter-spacing: 0.5px;
}

.message-text {
  font-size: 15px;
  line-height: 1.6;
  color: #000;
}

.message-text :deep(p) {
  margin: 0 0 12px;
}

.message-text :deep(p:last-child) {
  margin-bottom: 0;
}

.message-text :deep(code) {
  background: #f5f5f5;
  padding: 2px 6px;
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  color: #d63384;
  border: 1px solid #e0e0e0;
}

.message-text :deep(pre) {
  background: #f8f8f8;
  padding: 16px;
  overflow-x: auto;
  border-left: 3px solid #0066ff;
  border: 1px solid #e0e0e0;
}

.message-text :deep(pre code) {
  background: none;
  padding: 0;
  color: #000;
  border: none;
}

.typing-dots {
  display: flex;
  gap: 6px;
  padding: 8px 0;
}

.typing-dots span {
  width: 8px;
  height: 8px;
  background: #999;
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
    transform: translateY(0);
  }
  30% {
    opacity: 1;
    transform: translateY(-8px);
  }
}

/* ========== INPUT SECTION ========== */
.input-section {
  padding: 20px 24px;
  border-top: 2px solid #000;
  background: #fff;
  flex-shrink: 0;
}

.input-wrapper {
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.input-field {
  flex: 1;
  padding: 14px 16px;
  background: #fafafa;
  border: 2px solid #e0e0e0;
  color: #000;
  font-size: 15px;
  line-height: 1.5;
  resize: none;
  outline: none;
  transition: all 0.2s;
  font-family: inherit;
  min-height: 52px;
  max-height: 200px;
}

.input-field::placeholder {
  color: #999;
}

.input-field:focus {
  border-color: #000;
  background: #fff;
}

.input-field:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.send-btn {
  width: 52px;
  height: 52px;
  background: #000;
  border: none;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.send-btn:hover:not(:disabled) {
  background: #0066ff;
  transform: translateY(-2px);
}

.send-btn:active:not(:disabled) {
  transform: translateY(0);
}

.send-btn:disabled {
  opacity: 0.3;
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
