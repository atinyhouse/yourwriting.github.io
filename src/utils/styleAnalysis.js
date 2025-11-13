// 文风分析工具

// 分词 - 简单实现（中文按字符，英文按单词）
export const tokenize = (text) => {
  // 移除多余空白
  text = text.replace(/\s+/g, ' ').trim()

  // 分离中文和英文
  const tokens = []
  const chineseRegex = /[\u4e00-\u9fa5]/
  const words = text.split(/\s+/)

  words.forEach(word => {
    if (chineseRegex.test(word)) {
      // 中文：按字符分词
      tokens.push(...word.split('').filter(c => chineseRegex.test(c)))
    } else {
      // 英文：保持单词
      tokens.push(word.toLowerCase())
    }
  })

  return tokens
}

// 提取关键词 - 基于词频
export const extractKeywords = (texts, topN = 20) => {
  const allText = texts.join(' ')
  const tokens = tokenize(allText)

  // 停用词（简化版）
  const stopWords = new Set([
    '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这',
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can'
  ])

  // 统计词频
  const freq = {}
  tokens.forEach(token => {
    if (!stopWords.has(token) && token.length > 1) {
      freq[token] = (freq[token] || 0) + 1
    }
  })

  // 排序并返回前 N 个
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([word, count]) => ({ word, count }))
}

// 提取常用短语（2-3 字/词）
export const extractCommonPhrases = (texts, topN = 10) => {
  const allText = texts.join(' ')
  const sentences = allText.split(/[。！？\n.!?]/).filter(s => s.trim())

  const phrases = {}
  const chineseRegex = /[\u4e00-\u9fa5]/

  sentences.forEach(sentence => {
    if (chineseRegex.test(sentence)) {
      // 中文：提取 2-3 字词组
      for (let i = 0; i < sentence.length - 1; i++) {
        for (let len = 2; len <= 3 && i + len <= sentence.length; len++) {
          const phrase = sentence.slice(i, i + len)
          if (phrase.trim().length === len) {
            phrases[phrase] = (phrases[phrase] || 0) + 1
          }
        }
      }
    } else {
      // 英文：提取 2-3 词组
      const words = sentence.split(/\s+/).filter(w => w.length > 0)
      for (let i = 0; i < words.length - 1; i++) {
        for (let len = 2; len <= 3 && i + len <= words.length; len++) {
          const phrase = words.slice(i, i + len).join(' ')
          phrases[phrase] = (phrases[phrase] || 0) + 1
        }
      }
    }
  })

  return Object.entries(phrases)
    .filter(([_, count]) => count >= 2) // 至少出现 2 次
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([phrase, count]) => ({ phrase, count }))
}

// 计算平均句子长度
export const calculateAvgSentenceLength = (texts) => {
  const allText = texts.join(' ')
  const sentences = allText.split(/[。！？\n.!?]/).filter(s => s.trim())

  if (sentences.length === 0) return 0

  const totalLength = sentences.reduce((sum, s) => sum + s.trim().length, 0)
  return Math.round(totalLength / sentences.length)
}

// 分析标点符号使用习惯
export const analyzePunctuation = (texts) => {
  const allText = texts.join(' ')
  const punctuations = {
    '。': 0, '！': 0, '？': 0, '，': 0, '；': 0, '：': 0,
    '.': 0, '!': 0, '?': 0, ',': 0, ';': 0, ':': 0,
    '、': 0, '…': 0, '—': 0, '"': 0, '"': 0, '\u2018': 0, '\u2019': 0
  }

  for (const char of allText) {
    if (char in punctuations) {
      punctuations[char]++
    }
  }

  return punctuations
}

// 检测语气/风格
export const detectTone = (texts) => {
  const allText = texts.join(' ')

  // 简单的规则检测
  const casual = /哈哈|嘿|喂|哎|啊|呀|嘛|吧|呢|哦|emmm|hhh/gi
  const formal = /因此|所以|综上|总之|从而|鉴于|基于/gi
  const humorous = /笑|哭|尴尬|搞笑|有趣|哈哈/gi

  const casualCount = (allText.match(casual) || []).length
  const formalCount = (allText.match(formal) || []).length
  const humorousCount = (allText.match(humorous) || []).length

  if (casualCount > formalCount && casualCount > humorousCount) {
    return 'casual'
  } else if (formalCount > casualCount && formalCount > humorousCount) {
    return 'formal'
  } else if (humorousCount > 0) {
    return 'humorous'
  } else {
    return 'neutral'
  }
}

// 主分析函数
export const analyzeWritingStyle = (sources) => {
  if (!sources || sources.length === 0) {
    return null
  }

  const texts = sources.map(s => s.content).filter(Boolean)

  if (texts.length === 0) {
    return null
  }

  const keywords = extractKeywords(texts)
  const commonPhrases = extractCommonPhrases(texts)
  const avgSentenceLength = calculateAvgSentenceLength(texts)
  const punctuationStyle = analyzePunctuation(texts)
  const tone = detectTone(texts)
  const totalWords = texts.reduce((sum, text) => sum + text.length, 0)

  return {
    keywords,
    commonPhrases,
    avgSentenceLength,
    punctuationStyle,
    tone,
    totalWords,
    analyzedAt: new Date().toISOString()
  }
}

// 生成文风描述（用于 AI prompt）
export const generateStyleDescription = (analysis) => {
  if (!analysis) {
    return ''
  }

  const toneMap = {
    casual: '轻松随意',
    formal: '正式严谨',
    humorous: '幽默风趣',
    neutral: '中性客观'
  }

  const topKeywords = analysis.keywords.slice(0, 10).map(k => k.word).join('、')
  const topPhrases = analysis.commonPhrases.slice(0, 5).map(p => p.phrase).join('、')

  return `
写作风格特征：
- 语气：${toneMap[analysis.tone] || '中性'}
- 平均句长：${analysis.avgSentenceLength} 字
- 常用词汇：${topKeywords}
- 常用短语：${topPhrases}
- 总字数：${analysis.totalWords} 字
  `.trim()
}
