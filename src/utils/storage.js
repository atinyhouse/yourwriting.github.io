import localforage from 'localforage'

// 配置 localforage
localforage.config({
  name: 'writing-style-ai',
  version: 1.0,
  storeName: 'app_data'
})

// 数据存储键
const KEYS = {
  STYLE_LIBRARY: 'styleLibrary',
  CONVERSATIONS: 'conversations', // 现在存储多个对话
  CURRENT_CONVERSATION_ID: 'currentConversationId', // 当前选中的对话ID
  SETTINGS: 'settings'
}

// 获取文风库
export const getStyleLibrary = async () => {
  const data = await localforage.getItem(KEYS.STYLE_LIBRARY)
  return data || {
    sources: [],
    analysis: null,
    totalWords: 0
  }
}

// 保存文风库
export const saveStyleLibrary = async (library) => {
  // 将 library 转换为纯对象，避免 Proxy 对象导致的克隆错误
  const plainLibrary = JSON.parse(JSON.stringify(library))
  await localforage.setItem(KEYS.STYLE_LIBRARY, plainLibrary)
}

// 添加内容到文风库
export const addToStyleLibrary = async (source) => {
  const library = await getStyleLibrary()
  library.sources.push({
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    ...source
  })
  await saveStyleLibrary(library)
  return library
}

// 删除文风库中的内容
export const removeFromStyleLibrary = async (id) => {
  const library = await getStyleLibrary()
  library.sources = library.sources.filter(s => s.id !== id)
  await saveStyleLibrary(library)
  return library
}

// 清空文风库
export const clearStyleLibrary = async () => {
  await localforage.setItem(KEYS.STYLE_LIBRARY, {
    sources: [],
    analysis: null,
    totalWords: 0
  })
}

// ========== 对话管理 ==========

// 获取所有对话列表
export const getConversations = async () => {
  const data = await localforage.getItem(KEYS.CONVERSATIONS)
  return data || []
}

// 获取当前选中的对话ID
export const getCurrentConversationId = async () => {
  return await localforage.getItem(KEYS.CURRENT_CONVERSATION_ID)
}

// 设置当前选中的对话ID
export const setCurrentConversationId = async (id) => {
  await localforage.setItem(KEYS.CURRENT_CONVERSATION_ID, id)
}

// 创建新对话
export const createConversation = async (title = '新对话') => {
  const conversations = await getConversations()
  const newConversation = {
    id: Date.now().toString(),
    title,
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  conversations.unshift(newConversation) // 添加到开头
  await localforage.setItem(KEYS.CONVERSATIONS, conversations)
  await setCurrentConversationId(newConversation.id)

  return newConversation
}

// 获取单个对话
export const getConversation = async (id) => {
  const conversations = await getConversations()
  return conversations.find(c => c.id === id) || null
}

// 更新对话
export const updateConversation = async (id, updates) => {
  const conversations = await getConversations()
  const index = conversations.findIndex(c => c.id === id)

  if (index !== -1) {
    conversations[index] = {
      ...conversations[index],
      ...updates,
      updatedAt: new Date().toISOString()
    }
    await localforage.setItem(KEYS.CONVERSATIONS, conversations)
    return conversations[index]
  }

  return null
}

// 删除对话
export const deleteConversation = async (id) => {
  const conversations = await getConversations()
  const filtered = conversations.filter(c => c.id !== id)
  await localforage.setItem(KEYS.CONVERSATIONS, filtered)

  // 如果删除的是当前对话，切换到第一个对话
  const currentId = await getCurrentConversationId()
  if (currentId === id) {
    const nextId = filtered.length > 0 ? filtered[0].id : null
    await setCurrentConversationId(nextId)
  }

  return filtered
}

// 添加消息到对话
export const addMessageToConversation = async (conversationId, message) => {
  const conversation = await getConversation(conversationId)
  if (!conversation) return null

  conversation.messages.push({
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    ...message
  })

  // 自动更新对话标题（使用第一条用户消息）
  if (conversation.messages.length === 1 && message.role === 'user') {
    conversation.title = message.content.slice(0, 30) + (message.content.length > 30 ? '...' : '')
  }

  return await updateConversation(conversationId, conversation)
}

// 清空所有对话
export const clearConversations = async () => {
  await localforage.setItem(KEYS.CONVERSATIONS, [])
  await localforage.setItem(KEYS.CURRENT_CONVERSATION_ID, null)
}

// 保存所有对话（用于导入）
export const saveConversations = async (conversations) => {
  const plainConversations = JSON.parse(JSON.stringify(conversations))
  await localforage.setItem(KEYS.CONVERSATIONS, plainConversations)
}

// 获取设置
export const getSettings = async () => {
  const data = await localforage.getItem(KEYS.SETTINGS)
  return data || {
    deepseekApiKey: '',
    modelParams: {
      temperature: 0.7,
      maxTokens: 2000
    },
    enableStyleTransfer: true
  }
}

// 保存设置
export const saveSettings = async (settings) => {
  // 将 settings 转换为纯对象，避免 Proxy 对象导致的克隆错误
  const plainSettings = JSON.parse(JSON.stringify(settings))
  await localforage.setItem(KEYS.SETTINGS, plainSettings)
}

// 导出所有数据
export const exportAllData = async () => {
  const styleLibrary = await getStyleLibrary()
  const conversations = await getConversations()
  const settings = await getSettings()

  return {
    version: '1.0',
    exportDate: new Date().toISOString(),
    data: {
      styleLibrary,
      conversations,
      settings: {
        ...settings,
        deepseekApiKey: '' // 不导出 API Key
      }
    }
  }
}

// 导入数据
export const importAllData = async (data) => {
  if (data.version !== '1.0') {
    throw new Error('不支持的数据版本')
  }

  await saveStyleLibrary(data.data.styleLibrary)
  await saveConversations(data.data.conversations)
  await saveSettings(data.data.settings)
}

// 清除所有数据
export const clearAllData = async () => {
  await localforage.clear()
}
