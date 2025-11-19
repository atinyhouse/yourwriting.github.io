// DeepSeek API 集成（直接调用官方 API）

// DeepSeek API 官方地址（国内可直接访问）
const API_ENDPOINT = 'https://api.deepseek.com/chat/completions'

// 调用 DeepSeek API（直接调用）
export const callDeepSeekAPI = async (messages, apiKey, params = {}) => {
  // 检查 API Key
  if (!apiKey) {
    throw new Error('请先在设置中配置 DeepSeek API Key')
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

// 构建带文风的 prompt（支持多轮对话）
export const buildStyledPrompt = (messages, styleDescription, enableStyleTransfer, styleSamples = []) => {
  const apiMessages = []

  // 系统提示词
  if (enableStyleTransfer && styleDescription) {
    // 构建few-shot examples（如果有原文样本）
    let fewShotExamples = ''
    if (styleSamples && styleSamples.length > 0) {
      const samples = styleSamples.slice(0, 3) // 最多3个样本
      fewShotExamples = `\n\n【文风参考样本】\n以下是用户的真实写作片段，请深入体会其语言特点：\n\n` +
        samples.map((sample, index) => `样本${index + 1}:\n${sample.slice(0, 500)}...\n`).join('\n')
    }

    apiMessages.push({
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

${styleDescription}${fewShotExamples}

【🚨 严格禁止事项】
以下是AI写作常见的"露馅"特征，你必须完全避免：

❌ **禁用AI腔调词汇**：
   - 不要用："您"、"诚然"、"综上所述"、"不难发现"、"众所周知"、"毋庸置疑"
   - 不要用："值得一提的是"、"需要指出的是"、"可以看出"、"从某种意义上说"
   - 不要用："与此同时"、"由此可见"、"换言之"、"总而言之"

❌ **禁止模板化结构**：
   - 不要用："首先...其次...最后..."
   - 不要用："一方面...另一方面..."
   - 不要用："不仅...而且..."的八股文句式
   - 不要每段都用"那么"、"所以"、"因此"开头

❌ **禁止过度修饰**：
   - 不要堆砌形容词
   - 不要使用过于书面化的表达
   - 避免使用用户从未用过的高级词汇
   - 避免过度理性和逻辑性的论证方式

❌ **禁止AI式客套**：
   - 不要说："希望这能帮到你"、"以下是为您准备的..."
   - 不要说："根据您的要求"、"为您提供以下建议"
   - 直接输出内容，不要任何开场白或结束语

【✅ 模仿要点 - 必须遵守】

1. **句子节奏**：
   - 严格控制句子长度在用户习惯的范围内
   - 注意用户的断句习惯和语气停顿
   - 模仿用户的句子密度（疏密程度）

2. **用词选择**：
   - 只使用用户文风库中出现过的常用词汇
   - 如果用户口语化，你也必须口语化
   - 如果用户书面化，保持用户的书面化程度（不要更高）

3. **标点使用**：
   - 严格遵循用户的标点习惯
   - 感叹号、问号、省略号的使用频率要匹配
   - 逗号和句号的使用比例要一致

4. **情感表达**：
   - 匹配用户的情感浓度（不要过分或过于克制）
   - 保持用户的情绪表达方式（直接/间接/隐晦）
   - 如果用户克制，你也必须克制

5. **开头和结尾**：
   - 模仿用户习惯的开头方式（直接/铺垫/提问等）
   - 不要添加AI式的总结或升华
   - 结尾要自然，不要画蛇添足

【🎯 写作前自我检查清单】
在输出任何内容前，问自己：
□ 这段话的句子长度符合用户习惯吗？
□ 有没有使用AI腔调词汇？
□ 语气是用户本人会用的吗？
□ 标点使用频率对吗？
□ 读起来像是用户写的，还是AI代写的？
□ 有没有过度逻辑化或理性化？
□ 情感浓度合适吗？

【⚡ 核心原则】
记住：你的目标不是"写得好"，而是"写得像用户"。
宁可稍显粗糙，也不要暴露AI痕迹。
模仿的是用户的"缺点"和"特点"，而不是追求完美文章。`
    })
  } else {
    apiMessages.push({
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

  // 添加历史对话消息（最多保留最近10轮对话）
  const recentMessages = messages.slice(-20) // 最多20条消息（10轮对话）
  apiMessages.push(...recentMessages)

  return apiMessages
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
