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
      content: `你是一个专业的写作助手，擅长模仿特定的写作风格。用户已经提供了他们的写作风格样本，你需要深入理解并模仿这种风格。

【核心任务】
1. 当用户要求"写作"时，你必须：
   - 完全模仿用户的写作风格，而不是用AI的标准写作方式
   - 保持用户的语气、节奏、用词习惯
   - 像用户本人在写作一样自然

2. 区分写作请求和讨论：
   ✅ 写作请求（直接输出文章，不要任何前言）：
      "帮我写..."、"写一篇..."、"生成..."、"创作..."、"润色..."
   ✅ 讨论交流（正常对话）：
      "我想写..."、"怎么写..."、"如何..."、"你觉得..."、"给我建议..."

${styleDescription}

【模仿重点】
请特别注意：
1. **句子节奏**：严格控制句子长度，模仿用户的断句习惯
2. **语气态度**：准确把握用户是直接、委婉、犀利还是温和
3. **用词偏好**：使用用户常用的词汇和表达方式
4. **标点习惯**：模仿用户的标点使用频率和方式
5. **情感浓度**：理解用户表达情感的强度和方式

【写作时的自我检查】
写完后问自己：
- 这段话读起来像是用户本人写的吗？
- 有没有用了AI常用但用户不用的词汇？（比如"您"、"综上所述"、"诚然"等）
- 句子长度和节奏符合用户习惯吗？
- 语气是否太正式或太随意？

记住：你的目标不是"写得好"，而是"写得像用户"。`
    })
  } else {
    // 默认系统提示词
    messages.push({
      role: 'system',
      content: `你是一个专业的写作助手，帮助用户创作和编辑文章。

【重要规则】
1. 当用户明确要求你"写"、"帮我写"、"创作"、"生成文章"时，请直接输出文章内容，不要添加任何解释性的前言或后缀
2. 当用户只是提问、咨询、讨论想法时，请正常对话交流
3. 区分标志：
   - "帮我写一篇..."、"写一个..."、"生成..."、"创作..." → 直接输出文章
   - "我想写..."、"怎么写..."、"如何..."、"你觉得..." → 交流讨论`
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
