// 文风分析工具

// 清洗内容 - 移除无用的系统文字和噪音
export const cleanContent = (text) => {
  if (!text) return ''

  let cleaned = text

  // 移除常见的公众号系统提示
  const noisePatterns = [
    /点击上方.*?关注/g,
    /点击.*?蓝字.*?关注/g,
    /关注.*?公众号/g,
    /长按.*?二维码.*?关注/g,
    /扫描.*?二维码.*?关注/g,
    /推荐阅读/g,
    /往期.*?回顾/g,
    /点击.*?阅读原文/g,
    /阅读原文/g,
    /原文链接/g,
    /转载请注明出处/g,
    /版权声明/g,
    /免责声明/g,
    /商务合作/g,
    /投稿邮箱/g,
    /联系.*?微信/g,
    /添加.*?微信/g,
    /文章.*?来源/g,
    /.*?整理.*?编辑/g,
    /点赞.*?在看/g,
    /分享.*?点赞/g,
    /喜欢.*?点.*?在看/g,
    /预览时标签不可点/g,
    /微信扫一扫/g,
    /使用小程序/g,
    /取消/g,
    /允许/g,
    /即将打开.*?小程序/g,
  ]

  noisePatterns.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '')
  })

  // 移除多余的空行（保留段落结构）
  cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n')

  // 移除首尾空白
  cleaned = cleaned.trim()

  // 移除过短的行（可能是系统文字，少于5个字）
  cleaned = cleaned.split('\n')
    .filter(line => {
      const trimmed = line.trim()
      // 保留空行（段落分隔）或长度>=5的行
      return trimmed.length === 0 || trimmed.length >= 5
    })
    .join('\n')

  return cleaned
}

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

  // 扩展的停用词列表
  const stopWords = new Set([
    // 基础停用词
    '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这',
    '个', '们', '为', '能', '他', '她', '它', '多', '来', '年', '对', '与', '及', '以', '等', '但', '或', '而', '中', '里', '下', '大', '小', '么', '给', '从', '把', '被', '让',
    '出', '可', '用', '成', '因', '作', '更', '过', '还', '之', '所', '如', '其', '只', '两', '三', '些', '最', '已', '于', '时', '后', '前', '间', '天', '月', '日', '想', '得',
    '种', '点', '方', '面', '次', '现', '关', '因为', '所以', '但是', '然后', '已经', '还是', '可以', '这个', '那个', '什么', '怎么', '为什么', '的话', '如果', '虽然',
    // 公众号常见词
    '文章', '内容', '阅读', '关注', '分享', '点击', '扫码', '二维码', '微信', '公众号', '推荐', '精彩', '原创', '转载', '来源', '编辑', '整理', '排版', '图片', '视频',
    // 数字
    '一', '二', '三', '四', '五', '六', '七', '八', '九', '十',
    // 英文停用词
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'it', 'its', 'they', 'them', 'their'
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
