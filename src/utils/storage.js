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
  CONVERSATIONS: 'conversations',
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
  await localforage.setItem(KEYS.STYLE_LIBRARY, library)
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

// 获取对话历史
export const getConversations = async () => {
  const data = await localforage.getItem(KEYS.CONVERSATIONS)
  return data || []
}

// 保存对话历史
export const saveConversations = async (conversations) => {
  await localforage.setItem(KEYS.CONVERSATIONS, conversations)
}

// 清空对话历史
export const clearConversations = async () => {
  await localforage.setItem(KEYS.CONVERSATIONS, [])
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
  await localforage.setItem(KEYS.SETTINGS, settings)
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
