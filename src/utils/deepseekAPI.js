// DeepSeek API 集成

const API_ENDPOINT = 'https://api.deepseek.com/v1/chat/completions'

// 调用 DeepSeek API
export const callDeepSeekAPI = async (messages, apiKey, params = {}) => {
  if (!apiKey) {
    throw new Error('请先配置 DeepSeek API Key')
  }

  const {
    temperature = 0.7,
    maxTokens = 2000,
    stream = false
  } = params

  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      temperature,
      max_tokens: maxTokens,
      stream
    })
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || `API 调用失败: ${response.status}`)
  }

  return response
}

// 流式调用（逐字输出）
export const streamDeepSeekAPI = async (messages, apiKey, params, onChunk) => {
  const response = await callDeepSeekAPI(messages, apiKey, { ...params, stream: true })

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() // 保留最后一行（可能不完整）

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim()
          if (data === '[DONE]') {
            return
          }

          try {
            const json = JSON.parse(data)
            const content = json.choices?.[0]?.delta?.content
            if (content) {
              onChunk(content)
            }
          } catch (e) {
            console.error('解析响应失败:', e)
          }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

// 非流式调用（一次性返回）
export const chatWithDeepSeek = async (messages, apiKey, params) => {
  const response = await callDeepSeekAPI(messages, apiKey, { ...params, stream: false })
  const data = await response.json()
  return data.choices[0].message.content
}

// 构建带文风的 prompt
export const buildStyledPrompt = (userMessage, styleDescription, enableStyleTransfer) => {
  const messages = []

  if (enableStyleTransfer && styleDescription) {
    // 系统提示词：包含文风要求
    messages.push({
      role: 'system',
      content: `你是一个写作助手。用户已经提供了他们的写作风格样本。请根据以下文风特征来生成内容：

${styleDescription}

请模仿这种风格回复用户，保持相似的语气、用词习惯和表达方式。`
    })
  } else {
    // 默认系统提示词
    messages.push({
      role: 'system',
      content: '你是一个专业的写作助手，帮助用户创作和编辑文章。'
    })
  }

  messages.push({
    role: 'user',
    content: userMessage
  })

  return messages
}

// 验证 API Key 格式
export const validateApiKey = (apiKey) => {
  if (!apiKey) {
    return false
  }

  // DeepSeek API Key 格式：sk-开头
  return apiKey.startsWith('sk-') && apiKey.length > 20
}

// 脱敏显示 API Key
export const maskApiKey = (apiKey) => {
  if (!apiKey || apiKey.length < 10) {
    return apiKey
  }
  const start = apiKey.slice(0, 7)
  const end = apiKey.slice(-4)
  return `${start}...${end}`
}
