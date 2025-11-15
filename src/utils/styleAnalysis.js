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

// 分析段落开头方式
export const analyzeOpeningPatterns = (texts) => {
  const patterns = {
    question: 0,      // 问句开头
    story: 0,         // 故事/场景开头
    statement: 0,     // 观点/陈述开头
    quote: 0,         // 引用开头
    data: 0           // 数据/事实开头
  }

  const examples = {
    question: [],
    story: [],
    statement: []
  }

  texts.forEach(text => {
    const paragraphs = text.split(/\n+/).filter(p => p.trim().length > 20)

    paragraphs.slice(0, 3).forEach(para => {
      const firstSentence = para.trim().split(/[。！？.!?]/)[0]
      if (!firstSentence) return

      if (firstSentence.includes('？') || firstSentence.includes('?')) {
        patterns.question++
        if (examples.question.length < 3) examples.question.push(firstSentence.slice(0, 30))
      } else if (/^(那天|有一次|记得|曾经|最近|去年|昨天|前几天)/.test(firstSentence)) {
        patterns.story++
        if (examples.story.length < 3) examples.story.push(firstSentence.slice(0, 30))
      } else if (/^(我|我们|我觉得|我认为|我想|其实|说实话)/.test(firstSentence)) {
        patterns.statement++
        if (examples.statement.length < 3) examples.statement.push(firstSentence.slice(0, 30))
      }
    })
  })

  return { patterns, examples }
}

// 分析转折和连接方式
export const analyzeTransitions = (texts) => {
  const transitions = {
    '但是': 0, '但': 0, '然而': 0, '不过': 0, '可是': 0,
    '所以': 0, '因此': 0, '于是': 0,
    '而且': 0, '并且': 0, '同时': 0,
    '其实': 0, '事实上': 0, '实际上': 0,
    '换句话说': 0, '也就是说': 0, '比如': 0, '例如': 0
  }

  const allText = texts.join(' ')
  Object.keys(transitions).forEach(word => {
    const regex = new RegExp(word, 'g')
    const matches = allText.match(regex)
    if (matches) transitions[word] = matches.length
  })

  // 排序找出最常用的转折词
  const topTransitions = Object.entries(transitions)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  return topTransitions
}

// 分析人称视角
export const analyzePerspective = (texts) => {
  const allText = texts.join(' ')
  const firstPerson = (allText.match(/我|我们|咱们/g) || []).length
  const secondPerson = (allText.match(/你|您|你们/g) || []).length
  const thirdPerson = (allText.match(/他|她|它|他们|她们/g) || []).length

  const total = firstPerson + secondPerson + thirdPerson

  return {
    firstPerson: ((firstPerson / total) * 100).toFixed(1),
    secondPerson: ((secondPerson / total) * 100).toFixed(1),
    thirdPerson: ((thirdPerson / total) * 100).toFixed(1),
    dominant: firstPerson > secondPerson && firstPerson > thirdPerson ? 'first' :
              secondPerson > firstPerson && secondPerson > thirdPerson ? 'second' : 'third'
  }
}

// 分析句式复杂度和多样性
export const analyzeSentenceComplexity = (texts) => {
  const allText = texts.join(' ')
  const sentences = allText.split(/[。！？.!?]/).filter(s => s.trim().length > 5)

  let simpleCount = 0    // 简单句（少于15字，无逗号）
  let compoundCount = 0  // 复合句（有逗号/分号）
  let complexCount = 0   // 复杂句（多个从句）

  sentences.forEach(sentence => {
    const length = sentence.length
    const commas = (sentence.match(/，|,|；|;/g) || []).length

    if (length < 15 && commas === 0) {
      simpleCount++
    } else if (commas >= 3) {
      complexCount++
    } else {
      compoundCount++
    }
  })

  const total = sentences.length
  return {
    simple: ((simpleCount / total) * 100).toFixed(1),
    compound: ((compoundCount / total) * 100).toFixed(1),
    complex: ((complexCount / total) * 100).toFixed(1),
    diversity: compoundCount > simpleCount && compoundCount > complexCount ? 'varied' :
               complexCount > simpleCount ? 'complex' : 'simple'
  }
}

// 主分析函数（增强版）
export const analyzeWritingStyle = (sources) => {
  if (!sources || sources.length === 0) {
    return null
  }

  const texts = sources.map(s => s.content).filter(Boolean)

  if (texts.length === 0) {
    return null
  }

  // 基础分析（保留）
  const keywords = extractKeywords(texts)
  const commonPhrases = extractCommonPhrases(texts)
  const avgSentenceLength = calculateAvgSentenceLength(texts)
  const punctuationStyle = analyzePunctuation(texts)
  const tone = detectTone(texts)
  const totalWords = texts.reduce((sum, text) => sum + text.length, 0)

  // 深度分析（新增）
  const openingPatterns = analyzeOpeningPatterns(texts)
  const transitions = analyzeTransitions(texts)
  const perspective = analyzePerspective(texts)
  const complexity = analyzeSentenceComplexity(texts)

  return {
    // 基础数据
    keywords,
    commonPhrases,
    avgSentenceLength,
    punctuationStyle,
    tone,
    totalWords,

    // 深度分析
    openingPatterns,
    transitions,
    perspective,
    complexity,

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

  const perspectiveMap = {
    first: '第一人称为主（我/我们），强调个人体验和主观感受',
    second: '第二人称为主（你/您），直接与读者对话',
    third: '第三人称为主，客观叙述'
  }

  const complexityMap = {
    simple: '偏爱短句，简洁直接',
    varied: '句式富有变化，长短结合',
    complex: '善用复杂句式，表达层次丰富'
  }

  // 分析句子长度偏好
  const sentenceLengthStyle = analysis.avgSentenceLength < 15
    ? '偏好使用短句，节奏明快，适合表达清晰的观点'
    : analysis.avgSentenceLength < 25
    ? '句子长度适中，兼顾表达深度和阅读流畅性'
    : '倾向使用长句，善于铺陈和细节描写，表达更有层次感'

  // 分析标点使用习惯
  const punc = analysis.punctuationStyle
  const totalPunc = Object.values(punc).reduce((sum, count) => sum + count, 0)
  const exclamationRatio = ((punc['！'] + punc['!']) / totalPunc * 100).toFixed(1)
  const questionRatio = ((punc['？'] + punc['?']) / totalPunc * 100).toFixed(1)
  const ellipsisRatio = ((punc['…'] || 0) / totalPunc * 100).toFixed(1)

  let punctuationStyle = ''
  if (parseFloat(exclamationRatio) > 5) {
    punctuationStyle += '经常使用感叹号，表达情感丰富、态度鲜明；'
  }
  if (parseFloat(questionRatio) > 3) {
    punctuationStyle += '善用问句与读者互动，引发思考；'
  }
  if (parseFloat(ellipsisRatio) > 2) {
    punctuationStyle += '使用省略号营造留白和思考空间；'
  }
  if (!punctuationStyle) {
    punctuationStyle = '标点使用克制，以陈述为主，语气平稳。'
  }

  // 提取关键主题词
  const topKeywords = analysis.keywords.slice(0, 10).map(k => k.word)
  const themeWords = topKeywords.slice(0, 5).join('、')

  // 提取常用表达
  const topPhrases = analysis.commonPhrases.slice(0, 8).map(p => p.phrase)
  const expressionExamples = topPhrases.length > 0
    ? `\n\n【常用表达方式】\n${topPhrases.map((p, i) => `${i + 1}. "${p}"`).join('\n')}`
    : ''

  // 分析开头方式
  const opening = analysis.openingPatterns
  const openingTotal = opening.patterns.question + opening.patterns.story + opening.patterns.statement
  let openingStyle = ''
  if (opening.patterns.question > openingTotal * 0.3) {
    openingStyle = '常用问句开头，引发读者思考'
    if (opening.examples.question.length > 0) {
      openingStyle += `\n   例如："${opening.examples.question[0]}..."`
    }
  } else if (opening.patterns.story > openingTotal * 0.3) {
    openingStyle = '喜欢用故事或场景开头，营造代入感'
    if (opening.examples.story.length > 0) {
      openingStyle += `\n   例如："${opening.examples.story[0]}..."`
    }
  } else {
    openingStyle = '习惯开门见山，直接陈述观点'
    if (opening.examples.statement.length > 0) {
      openingStyle += `\n   例如："${opening.examples.statement[0]}..."`
    }
  }

  // 分析转折词使用
  const topTransitions = analysis.transitions.slice(0, 3).map(([word, count]) => word).join('、')

  return `
【写作风格档案】

1️⃣ 语言风格
- 整体语气：${toneMap[analysis.tone] || '中性客观'}
- 句式特点：${sentenceLengthStyle}（平均 ${analysis.avgSentenceLength} 字/句）
- 句式复杂度：${complexityMap[analysis.complexity.diversity]}
  · 简单句：${analysis.complexity.simple}%
  · 复合句：${analysis.complexity.compound}%
  · 复杂句：${analysis.complexity.complex}%
- 标点风格：${punctuationStyle}

2️⃣ 叙述视角
- ${perspectiveMap[analysis.perspective.dominant]}
- 人称分布：我(${analysis.perspective.firstPerson}%) / 你(${analysis.perspective.secondPerson}%) / 他(${analysis.perspective.thirdPerson}%)

3️⃣ 行文习惯
- 开头方式：${openingStyle}
- 常用转折词：${topTransitions}
- 主题偏好：${themeWords}

4️⃣ 表达特征
${punctuationStyle.includes('感叹号') ? '- 情感表达直接，不回避主观感受' : ''}
${punctuationStyle.includes('问句') ? '- 喜欢通过提问引导思考，与读者建立对话感' : ''}
${analysis.perspective.dominant === 'first' ? '- 强调个人经历和主观感受，真实感强' : ''}
${analysis.perspective.dominant === 'second' ? '- 直接对话读者，互动性强' : ''}
${analysis.complexity.diversity === 'complex' ? '- 善于使用复杂句式，层层递进表达观点' : '- 句子简洁有力，一针见血'}
${topPhrases.length > 3 ? `- 有标志性的表达习惯，形成个人语言风格` : ''}
${expressionExamples}

5️⃣ 模仿指南
当你用这种文风写作时：

**思维方式**
${opening.patterns.question > openingTotal * 0.2 ? '- 可以用问题引入话题，引发思考' : ''}
${analysis.perspective.dominant === 'first' ? '- 以第一人称视角，分享个人经历和感受' : ''}
${analysis.perspective.dominant === 'second' ? '- 用第二人称直接对话，增强参与感' : ''}

**语言习惯**
- 保持 ${toneMap[analysis.tone]} 的语气，不要过于正式或随意
- 句子长度控制在 ${Math.max(10, analysis.avgSentenceLength - 5)}-${analysis.avgSentenceLength + 5} 字之间
- ${punctuationStyle.includes('感叹号') ? '适当使用感叹号表达态度' : '标点保持克制，少用感叹号'}
- ${punctuationStyle.includes('问句') ? '可以用反问和设问增强互动感' : '以陈述句为主'}
- 常用这些转折词：${topTransitions}

**表达细节**
- 关注 "${themeWords}" 这些核心主题
${topPhrases.length > 0 ? `- 尝试使用这些特色表达：${topPhrases.slice(0, 3).join('、')}` : ''}
${opening.examples.question.length > 0 || opening.examples.story.length > 0 || opening.examples.statement.length > 0 ? `- 开头方式要像：${opening.examples.question[0] || opening.examples.story[0] || opening.examples.statement[0]}...` : ''}

📊 数据基础：基于 ${analysis.totalWords.toLocaleString()} 字的文本分析
  `.trim()
}
