<template>
  <div class="chat-view">
    <div class="container">
      <div class="chat-container">
        <!-- 对话历史 -->
        <div class="messages" ref="messagesContainer">
          <div v-if="messages.length === 0" class="empty-state">
            <h2>开始对话</h2>
            <p>输入您的写作需求，AI 将根据您的文风库生成内容</p>
            <div v-if="!hasStyleLibrary" class="warning accent-yellow">
              <p>⚠️ 您还没有构建文风库，AI 将使用默认风格回复</p>
              <router-link to="/style-library">前往构建文风库 →</router-link>
            </div>
          </div>

          <div v-for="msg in messages" :key="msg.id" :class="['message', msg.role]">
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
              <button @click="clearChat" class="secondary" :disabled="messages.length === 0">
                清空对话
              </button>
              <button @click="handleSend" :disabled="!userInput.trim() || isLoading">
                发送
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed } from 'vue'
import { marked } from 'marked'
import { getStyleLibrary, getSettings, getConversations, saveConversations } from '../utils/storage'
import { analyzeWritingStyle, generateStyleDescription } from '../utils/styleAnalysis'
import { streamDeepSeekAPI, buildStyledPrompt } from '../utils/deepseekAPI'

const messages = ref([])
const userInput = ref('')
const isLoading = ref(false)
const messagesContainer = ref(null)
const styleLibrary = ref(null)
const settings = ref(null)

const hasStyleLibrary = computed(() => {
  return styleLibrary.value && styleLibrary.value.sources.length > 0
})

onMounted(async () => {
  // 加载数据
  styleLibrary.value = await getStyleLibrary()
  settings.value = await getSettings()
  messages.value = await getConversations()

  scrollToBottom()
})

const handleSend = async () => {
  if (!userInput.value.trim() || isLoading.value) return

  // 检查 API Key
  if (!settings.value?.deepseekApiKey) {
    alert('请先在设置页面配置 DeepSeek API Key')
    return
  }

  const userMessage = {
    id: Date.now(),
    role: 'user',
    content: userInput.value.trim(),
    timestamp: new Date().toISOString()
  }

  messages.value.push(userMessage)
  userInput.value = ''
  isLoading.value = true

  await nextTick()
  scrollToBottom()

  try {
    // 构建 prompt
    let styleDescription = ''
    if (settings.value.enableStyleTransfer && styleLibrary.value.analysis) {
      styleDescription = generateStyleDescription(styleLibrary.value.analysis)
    }

    const promptMessages = buildStyledPrompt(
      userMessage.content,
      styleDescription,
      settings.value.enableStyleTransfer
    )

    // 创建 AI 消息
    const aiMessage = {
      id: Date.now() + 1,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString()
    }
    messages.value.push(aiMessage)

    // 流式接收
    await streamDeepSeekAPI(
      promptMessages,
      settings.value.deepseekApiKey,
      settings.value.modelParams,
      (chunk) => {
        aiMessage.content += chunk
        scrollToBottom()
      }
    )

    // 保存对话
    await saveConversations(messages.value)
  } catch (error) {
    console.error('API 调用失败:', error)
    messages.value.push({
      id: Date.now() + 2,
      role: 'system',
      content: `错误: ${error.message}`,
      timestamp: new Date().toISOString()
    })
  } finally {
    isLoading.value = false
  }
}

const clearChat = async () => {
  if (confirm('确定要清空所有对话记录吗？')) {
    messages.value = []
    await saveConversations([])
  }
}

const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
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
.chat-view {
  min-height: calc(100vh - 80px);
  padding: var(--spacing-md) 0;
}

.chat-container {
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 120px);
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

@media (max-width: 768px) {
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
