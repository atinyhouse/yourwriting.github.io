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

// 🆕 分析人格特质底色（基于大五人格理论）
export const analyzePersonalityTraits = (texts) => {
  const allText = texts.join(' ')

  // 外向性 (Extraversion)
  const extraversionKeywords = /社交|朋友|聚会|分享|交流|活跃|热情|开朗|外向|人群|派对/g
  const introversionKeywords = /独处|安静|思考|内向|独自|静谧|宁静|一个人|独立|私密/g

  // 开放性 (Openness)
  const opennessKeywords = /创新|创意|想象|艺术|尝试|探索|新|实验|好奇|不同|独特|另类/g
  const conservativeKeywords = /传统|稳定|经典|常规|保守|惯例|固定|习惯|规矩/g

  // 责任心 (Conscientiousness)
  const conscientiousnessKeywords = /计划|目标|组织|规划|效率|准时|完成|任务|责任|认真|严谨|细致/g
  const spontaneousKeywords = /随性|即兴|灵活|自由|随意|临时|不拘/g

  // 宜人性 (Agreeableness)
  const agreeablenessKeywords = /理解|包容|善良|温暖|关心|体贴|帮助|同情|友善|和善/g
  const assertivenessKeywords = /坚持|主张|立场|批评|反对|不同意|辩论|争论/g

  // 情绪稳定性 (Emotional Stability)
  const stabilityKeywords = /平静|冷静|淡定|稳定|放松|从容|理性|客观/g
  const neuroticismKeywords = /焦虑|担心|紧张|压力|不安|恐惧|忧虑|敏感|情绪|波动/g

  const extCount = (allText.match(extraversionKeywords) || []).length
  const intCount = (allText.match(introversionKeywords) || []).length
  const openCount = (allText.match(opennessKeywords) || []).length
  const consCount = (allText.match(conservativeKeywords) || []).length
  const consciCount = (allText.match(conscientiousnessKeywords) || []).length
  const spontCount = (allText.match(spontaneousKeywords) || []).length
  const agreeCount = (allText.match(agreeablenessKeywords) || []).length
  const assertCount = (allText.match(assertivenessKeywords) || []).length
  const stabCount = (allText.match(stabilityKeywords) || []).length
  const neuroCount = (allText.match(neuroticismKeywords) || []).length

  return {
    extraversion: extCount > intCount ? 'extraverted' : 'introverted',
    extraversionScore: extCount - intCount,
    openness: openCount > consCount ? 'open' : 'conservative',
    opennessScore: openCount - consCount,
    conscientiousness: consciCount > spontCount ? 'conscientious' : 'spontaneous',
    conscientiousnessScore: consciCount - spontCount,
    agreeableness: agreeCount > assertCount ? 'agreeable' : 'assertive',
    agreeablenessScore: agreeCount - assertCount,
    stability: stabCount > neuroCount ? 'stable' : 'sensitive',
    stabilityScore: stabCount - neuroCount
  }
}

// 🆕 分析价值观和世界观
export const analyzeWorldview = (texts) => {
  const allText = texts.join(' ')

  // 人生态度
  const optimismKeywords = /希望|美好|积极|乐观|阳光|光明|幸福|快乐|满足|感恩/g
  const pessimismKeywords = /悲观|消极|灰暗|绝望|无奈|痛苦|失望|迷茫|困惑/g

  // 价值取向
  const materialismKeywords = /金钱|财富|成功|地位|名利|物质|赚钱|收入|价格|贵|便宜/g
  const idealismKeywords = /理想|意义|价值|精神|灵魂|信念|追求|梦想|情怀|使命/g

  // 关系观
  const collectivismKeywords = /我们|团队|集体|社会|群体|大家|共同|合作|一起/g
  const individualismKeywords = /自我|个人|独立|自由|自主|个性|不同|独特/g

  // 时间观
  const presentKeywords = /现在|当下|此刻|今天|眼前|及时|享受|活在/g
  const futureKeywords = /未来|将来|明天|长远|规划|投资|准备|积累|储备/g
  const pastKeywords = /过去|曾经|回忆|怀念|历史|传统|经验|教训/g

  const optimism = (allText.match(optimismKeywords) || []).length
  const pessimism = (allText.match(pessimismKeywords) || []).length
  const materialism = (allText.match(materialismKeywords) || []).length
  const idealism = (allText.match(idealismKeywords) || []).length
  const collectivism = (allText.match(collectivismKeywords) || []).length
  const individualism = (allText.match(individualismKeywords) || []).length
  const present = (allText.match(presentKeywords) || []).length
  const future = (allText.match(futureKeywords) || []).length
  const past = (allText.match(pastKeywords) || []).length

  // 确定主导时间观
  const timeOrientation = present > future && present > past ? 'present' :
                         future > present && future > past ? 'future' : 'past'

  return {
    lifeAttitude: optimism > pessimism * 1.5 ? 'optimistic' :
                  pessimism > optimism * 1.5 ? 'pessimistic' : 'realistic',
    attitudeScore: optimism - pessimism,
    valueOrientation: idealism > materialism * 1.2 ? 'idealistic' :
                     materialism > idealism * 1.2 ? 'materialistic' : 'balanced',
    valueScore: idealism - materialism,
    relationshipView: collectivism > individualism ? 'collectivist' : 'individualist',
    relationshipScore: collectivism - individualism,
    timeOrientation,
    timeScores: { present, future, past }
  }
}

// 🆕 分析兴趣偏好和文化品味
export const analyzeCulturalTaste = (texts) => {
  const allText = texts.join(' ')

  // 文化类型偏好
  const literatureKeywords = /书|阅读|小说|诗|文学|作家|作品|故事|文字|写作/g
  const filmKeywords = /电影|影片|导演|演员|剧情|镜头|画面|影院|观影/g
  const musicKeywords = /音乐|歌曲|旋律|歌手|乐队|演唱会|专辑|听歌|节奏/g
  const artKeywords = /艺术|绘画|美术|展览|画作|艺术家|设计|审美|美学/g
  const techKeywords = /科技|技术|数字|互联网|AI|程序|代码|产品|创新/g

  // 话题偏好
  const philosophyKeywords = /哲学|思考|思想|存在|本质|意义|真理|认知|智慧|道理/g
  const psychologyKeywords = /心理|情绪|感受|内心|潜意识|性格|行为|动机/g
  const socialKeywords = /社会|时代|现象|问题|观察|分析|视角|角度|看法/g
  const personalKeywords = /生活|日常|感悟|体验|经历|故事|瞬间|细节|回忆/g
  const creativeKeywords = /创作|想象|灵感|构思|创意|表达|呈现|作品/g

  const lit = (allText.match(literatureKeywords) || []).length
  const film = (allText.match(filmKeywords) || []).length
  const music = (allText.match(musicKeywords) || []).length
  const art = (allText.match(artKeywords) || []).length
  const tech = (allText.match(techKeywords) || []).length

  const philosophy = (allText.match(philosophyKeywords) || []).length
  const psychology = (allText.match(psychologyKeywords) || []).length
  const social = (allText.match(socialKeywords) || []).length
  const personal = (allText.match(personalKeywords) || []).length
  const creative = (allText.match(creativeKeywords) || []).length

  // 找出最突出的文化类型
  const culturalInterests = [
    { type: 'literature', score: lit, name: '文学' },
    { type: 'film', score: film, name: '影视' },
    { type: 'music', score: music, name: '音乐' },
    { type: 'art', score: art, name: '艺术' },
    { type: 'tech', score: tech, name: '科技' }
  ].sort((a, b) => b.score - a.score)

  // 找出最突出的话题类型
  const topicPreferences = [
    { type: 'philosophy', score: philosophy, name: '哲学思辨' },
    { type: 'psychology', score: psychology, name: '心理洞察' },
    { type: 'social', score: social, name: '社会观察' },
    { type: 'personal', score: personal, name: '个人生活' },
    { type: 'creative', score: creative, name: '创作表达' }
  ].sort((a, b) => b.score - a.score)

  return {
    primaryCulturalInterest: culturalInterests[0].type,
    culturalInterests: culturalInterests.filter(c => c.score > 0),
    primaryTopic: topicPreferences[0].type,
    topicPreferences: topicPreferences.filter(t => t.score > 0)
  }
}

// 🆕 提取作品主题和反映的思想
export const analyzeThemesAndIdeas = (texts) => {
  const allText = texts.join(' ')

  // 核心主题关键词
  const themes = {
    growth: { keywords: /成长|进步|学习|提升|变化|改变|突破|蜕变/, count: 0, name: '个人成长' },
    relationship: { keywords: /关系|相处|理解|沟通|陪伴|连接|孤独|距离/, count: 0, name: '人际关系' },
    identity: { keywords: /自我|身份|定位|认同|寻找|迷失|探索|发现/, count: 0, name: '自我认同' },
    time: { keywords: /时间|岁月|年华|流逝|永恒|瞬间|记忆|消逝/, count: 0, name: '时间流逝' },
    society: { keywords: /社会|时代|环境|压力|规则|束缚|自由|选择/, count: 0, name: '社会环境' },
    meaning: { keywords: /意义|价值|目的|追求|方向|虚无|荒谬|存在/, count: 0, name: '生命意义' },
    love: { keywords: /爱|情感|感情|喜欢|爱情|亲情|友情|温暖/, count: 0, name: '爱与情感' },
    loss: { keywords: /失去|离开|分别|告别|怀念|逝去|错过|遗憾/, count: 0, name: '失去与告别' }
  }

  // 统计每个主题的出现频率
  Object.keys(themes).forEach(key => {
    const matches = allText.match(themes[key].keywords)
    themes[key].count = matches ? matches.length : 0
  })

  // 排序找出核心主题
  const coreThemes = Object.entries(themes)
    .map(([key, data]) => ({ key, ...data }))
    .filter(t => t.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return {
    coreThemes,
    dominantTheme: coreThemes[0]?.key || 'unknown'
  }
}

// 🆕 使用 AI 进行文风分析（代替僵硬的正则表达式）
export const analyzeStyleWithAI = async (sources, apiKey) => {
  if (!sources || sources.length === 0) {
    throw new Error('没有内容可供分析')
  }

  const texts = sources.map(s => s.content).filter(Boolean)
  if (texts.length === 0) {
    throw new Error('内容为空')
  }

  // 动态导入 AI API
  const { chatWithDeepSeek } = await import('./deepseekAPI')

  // 🆕 智能采样策略：优先使用全文，只在必要时采样
  const totalWords = texts.reduce((sum, text) => sum + text.length, 0)

  // DeepSeek-V3 支持 64K tokens，约等于 256K 字符（中文）
  // 为了安全起见，设置上限为 100K 字符，大部分情况下都能全文分析
  const targetLength = 100000

  let sampleText = ''

  if (totalWords <= targetLength) {
    // 如果总字数不超过目标长度，全部使用（推荐！）
    sampleText = texts.map((text, index) => `【文章 ${index + 1}】\n${text}`).join('\n\n=== 文章分隔 ===\n\n')
  } else {
    // 只有在文章非常多/非常长时才智能采样
    const samplesPerArticle = []
    const charsPerArticle = Math.floor(targetLength / texts.length)

    texts.forEach((text, index) => {
      if (text.length <= charsPerArticle) {
        // 文章够短，全文使用
        samplesPerArticle.push(`【文章 ${index + 1}】\n${text}`)
      } else {
        // 文章较长，提取开头、中间、结尾各一部分
        const segmentSize = Math.floor(charsPerArticle / 3)
        const start = text.slice(0, segmentSize)
        const middle = text.slice(Math.floor(text.length / 2) - segmentSize / 2, Math.floor(text.length / 2) + segmentSize / 2)
        const end = text.slice(-segmentSize)

        samplesPerArticle.push(`【文章 ${index + 1}（已采样）】\n${start}\n\n[...中间省略...]\n\n${middle}\n\n[...后续省略...]\n\n${end}`)
      }
    })

    sampleText = samplesPerArticle.join('\n\n=== 文章分隔 ===\n\n')
  }

  const analysisPrompt = `你是一位专业的文风分析专家。请深度分析以下文本的写作风格，并以JSON格式返回分析结果。

**文本样本信息**：
- 总文章数：${texts.length} 篇
- 总字数：${totalWords.toLocaleString()} 字
- 采样字数：${sampleText.length.toLocaleString()} 字
${totalWords > targetLength ? '- 注意：文本已智能采样，每篇文章都提取了开头、中间、结尾的代表性片段\n' : '- 注意：以下是全文内容\n'}
**文本样本**：
${sampleText}

**分析要求**：
请综合分析以上${texts.length}篇文章的整体风格特征。即使文本经过采样，也请基于提供的样本推断作者的整体写作风格。注意寻找跨文章的一致性特征，而非个别文章的特殊性。

请从以下维度进行深入分析，并以JSON格式返回结果：

{
  "languageStyle": {
    "tone": "casual | formal | humorous | neutral",
    "toneDescription": "对语气的详细描述",
    "avgSentenceLength": 数字,
    "sentenceLengthStyle": "对句子长度偏好的描述",
    "complexity": "simple | varied | complex",
    "complexityDescription": "对句式复杂度的描述"
  },
  "perspective": {
    "dominant": "first | second | third",
    "description": "对叙述视角的详细描述",
    "firstPersonPercent": 数字,
    "secondPersonPercent": 数字,
    "thirdPersonPercent": 数字
  },
  "personality": {
    "extraversion": "extraverted | introverted",
    "extraversionDescription": "社交倾向的详细分析",
    "openness": "open | conservative",
    "opennessDescription": "思维开放性的详细分析",
    "conscientiousness": "conscientious | spontaneous",
    "conscientiousnessDescription": "责任心和计划性的详细分析",
    "agreeableness": "agreeable | assertive",
    "agreeablenessDescription": "人际态度的详细分析",
    "stability": "stable | sensitive",
    "stabilityDescription": "情绪特征的详细分析"
  },
  "worldview": {
    "lifeAttitude": "optimistic | pessimistic | realistic",
    "lifeAttitudeDescription": "人生态度的详细分析",
    "valueOrientation": "idealistic | materialistic | balanced",
    "valueOrientationDescription": "价值取向的详细分析",
    "relationshipView": "collectivist | individualist",
    "relationshipDescription": "关系观念的详细分析",
    "timeOrientation": "present | future | past",
    "timeOrientationDescription": "时间观念的详细分析"
  },
  "culturalTaste": {
    "primaryInterests": ["文学", "影视", "音乐", "艺术", "科技"],
    "primaryInterestsDescription": "文化兴趣的详细描述",
    "topicPreferences": ["哲学思辨", "心理洞察", "社会观察", "个人生活", "创作表达"],
    "topicPreferencesDescription": "话题偏好的详细描述"
  },
  "themes": {
    "coreThemes": ["个人成长", "人际关系", "自我认同", "时间流逝", "社会环境", "生命意义", "爱与情感", "失去与告别"],
    "dominantTheme": "最核心的主题",
    "themesDescription": "核心主题的详细分析"
  },
  "expressionHabits": {
    "openingStyle": "问句开头 | 故事开头 | 观点开头",
    "openingStyleDescription": "开头方式的详细描述",
    "commonTransitions": ["但是", "所以", "其实", "而且"],
    "commonPhrases": ["常用表达1", "常用表达2", "常用表达3"],
    "keywordThemes": ["关键词1", "关键词2", "关键词3"],
    "punctuationStyle": "标点使用习惯的描述"
  },
  "imagerySystem": {
    "recurringObjects": ["反复出现的物品1", "物品2", "物品3"],
    "recurringScenes": ["反复出现的场景1", "场景2"],
    "recurringActivities": ["反复出现的活动1", "活动2"],
    "symbolicMeanings": "这些意象的象征意义分析",
    "description": "意象系统的整体描述（例如：村上春树式的井、猫、爵士乐）"
  },
  "metaphorStyle": {
    "type": "abstract | concrete | surreal | poetic",
    "examples": ["典型比喻例子1", "例子2", "例子3"],
    "characteristics": "比喻风格的特点描述（如：喜欢用看似不相关的事物对比）",
    "frequency": "low | medium | high"
  },
  "emotionalTone": {
    "dominant": "melancholic | cheerful | neutral | ironic | tender | restrained",
    "intensity": "subtle | moderate | intense",
    "description": "情感基调的详细描述（如：淡淡的忧伤、克制的情感表达）"
  },
  "narrativeStructure": {
    "dialogueRatio": "low | medium | high",
    "dialogueStyle": "对话风格的描述（简短直接 vs 长篇对谈）",
    "timeHandling": "linear | flashback | interweaved",
    "timeDescription": "时间处理方式的描述（如：经常插入回忆、时间线跳跃）",
    "narrativePace": "slow | moderate | fast",
    "paceDescription": "叙述节奏的描述（如：大量日常细节描写、快速切换场景）"
  },
  "rhythmFeatures": {
    "paragraphLength": "short | medium | long | varied",
    "pacing": "deliberate | flowing | staccato",
    "detailDensity": "sparse | balanced | rich",
    "description": "节奏特征的整体描述"
  },
  "overallSummary": "整体文风的综合描述（200-300字）",
  "writingGuidance": "模仿这种文风时的具体建议（200-300字）"
}

**重要提示**：
1. 请综合分析所有${texts.length}篇文章，寻找作者一致的风格特征
2. 提供深入、细致的分析，而不是简单的分类
3. 所有描述字段都要具体、有洞察力
4. 基于文本证据进行推断，而非臆测
5. 意象系统、比喻风格、情感基调、叙述结构、节奏特征是理解作者独特风格的关键
6. 返回纯JSON格式，不要包含任何其他文字或markdown标记`

  try {
    const response = await chatWithDeepSeek(
      [{ role: 'user', content: analysisPrompt }],
      apiKey,
      {
        temperature: 0.3, // 较低温度保证分析的一致性
        maxTokens: 6000  // 增加token限制，支持更详细的分析
      }
    )

    // 提取JSON（可能被markdown代码块包裹）
    let jsonContent = response.trim()
    const jsonMatch = jsonContent.match(/```json\n([\s\S]*?)\n```/)
    if (jsonMatch) {
      jsonContent = jsonMatch[1]
    } else if (jsonContent.startsWith('```') && jsonContent.endsWith('```')) {
      jsonContent = jsonContent.slice(3, -3).trim()
    }

    const aiAnalysis = JSON.parse(jsonContent)

    // 补充基础统计数据（保留regex分析的部分结果作为备份）
    const keywords = extractKeywords(texts)
    const commonPhrases = extractCommonPhrases(texts)

    return {
      // AI 深度分析结果
      ...aiAnalysis,

      // 补充基础数据
      keywords,
      commonPhrases,
      totalWords,
      analyzedAt: new Date().toISOString(),
      analysisMethod: 'AI' // 标记为AI分析
    }
  } catch (error) {
    console.error('AI 分析失败:', error)
    throw new Error(`AI 分析失败: ${error.message}`)
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

  // 深度分析（原有）
  const openingPatterns = analyzeOpeningPatterns(texts)
  const transitions = analyzeTransitions(texts)
  const perspective = analyzePerspective(texts)
  const complexity = analyzeSentenceComplexity(texts)

  // 🆕 深度人格和价值观分析
  const personality = analyzePersonalityTraits(texts)
  const worldview = analyzeWorldview(texts)
  const culturalTaste = analyzeCulturalTaste(texts)
  const themes = analyzeThemesAndIdeas(texts)

  return {
    // 基础数据
    keywords,
    commonPhrases,
    avgSentenceLength,
    punctuationStyle,
    tone,
    totalWords,

    // 深度分析（原有）
    openingPatterns,
    transitions,
    perspective,
    complexity,

    // 🆕 深度人格和价值观分析
    personality,
    worldview,
    culturalTaste,
    themes,

    analyzedAt: new Date().toISOString(),
    analysisMethod: 'regex' // 标记为正则分析
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
  const avgSentenceLength = analysis.languageStyle?.avgSentenceLength || analysis.avgSentenceLength || 20
  const sentenceLengthStyle = avgSentenceLength < 15
    ? '偏好使用短句，节奏明快，适合表达清晰的观点'
    : avgSentenceLength < 25
    ? '句子长度适中，兼顾表达深度和阅读流畅性'
    : '倾向使用长句，善于铺陈和细节描写，表达更有层次感'

  // 分析标点使用习惯
  let punctuationStyle = ''

  // 检查是AI分析还是正则分析
  if (typeof analysis.punctuationStyle === 'string') {
    // AI分析：直接使用描述字符串
    punctuationStyle = analysis.expressionHabits?.punctuationStyle || analysis.punctuationStyle || '标点使用克制，以陈述为主，语气平稳。'
  } else if (typeof analysis.punctuationStyle === 'object' && analysis.punctuationStyle !== null) {
    // 正则分析：计算标点统计
    const punc = analysis.punctuationStyle
    const totalPunc = Object.values(punc).reduce((sum, count) => sum + count, 0)

    if (totalPunc > 0) {
      const exclamationRatio = ((punc['！'] + punc['!']) / totalPunc * 100).toFixed(1)
      const questionRatio = ((punc['？'] + punc['?']) / totalPunc * 100).toFixed(1)
      const ellipsisRatio = ((punc['…'] || 0) / totalPunc * 100).toFixed(1)

      if (parseFloat(exclamationRatio) > 5) {
        punctuationStyle += '经常使用感叹号，表达情感丰富、态度鲜明；'
      }
      if (parseFloat(questionRatio) > 3) {
        punctuationStyle += '善用问句与读者互动，引发思考；'
      }
      if (parseFloat(ellipsisRatio) > 2) {
        punctuationStyle += '使用省略号营造留白和思考空间；'
      }
    }

    if (!punctuationStyle) {
      punctuationStyle = '标点使用克制，以陈述为主，语气平稳。'
    }
  } else {
    punctuationStyle = '标点使用克制，以陈述为主，语气平稳。'
  }

  // 提取关键主题词
  const topKeywords = analysis.keywords?.slice(0, 10).map(k => k.word) || []
  const themeWords = topKeywords.slice(0, 5).join('、') || '未知主题'

  // 提取常用表达
  const topPhrases = analysis.commonPhrases?.slice(0, 8).map(p => p.phrase) ||
                     analysis.expressionHabits?.commonPhrases?.slice(0, 8) || []
  const expressionExamples = topPhrases.length > 0
    ? `\n\n【常用表达方式】\n${topPhrases.map((p, i) => `${i + 1}. "${p}"`).join('\n')}`
    : ''

  // 分析开头方式
  let openingStyle = ''
  if (analysis.openingPatterns) {
    // 正则分析格式
    const opening = analysis.openingPatterns
    const openingTotal = opening.patterns.question + opening.patterns.story + opening.patterns.statement
    if (opening.patterns.question > openingTotal * 0.3) {
      openingStyle = '常用问句开头，引发读者思考'
      if (opening.examples?.question?.length > 0) {
        openingStyle += `\n   例如："${opening.examples.question[0]}..."`
      }
    } else if (opening.patterns.story > openingTotal * 0.3) {
      openingStyle = '喜欢用故事或场景开头，营造代入感'
      if (opening.examples?.story?.length > 0) {
        openingStyle += `\n   例如："${opening.examples.story[0]}..."`
      }
    } else {
      openingStyle = '习惯开门见山，直接陈述观点'
      if (opening.examples?.statement?.length > 0) {
        openingStyle += `\n   例如："${opening.examples.statement[0]}..."`
      }
    }
  } else if (analysis.expressionHabits?.openingStyle) {
    // AI分析格式
    openingStyle = analysis.expressionHabits.openingStyleDescription || analysis.expressionHabits.openingStyle
  } else {
    openingStyle = '开头方式多样'
  }

  // 分析转折词使用
  const topTransitions = analysis.transitions?.slice(0, 3).map(([word, count]) => word).join('、') ||
                         analysis.expressionHabits?.commonTransitions?.slice(0, 3).join('、') ||
                         '但是、所以、而且'

  // 🆕 人格特质描述
  const personalityMap = {
    extraversion: { extraverted: '外向型', introverted: '内向型' },
    openness: { open: '开放创新型', conservative: '传统保守型' },
    conscientiousness: { conscientious: '谨慎计划型', spontaneous: '灵活随性型' },
    agreeableness: { agreeable: '温和包容型', assertive: '坚定主张型' },
    stability: { stable: '情绪稳定型', sensitive: '情感敏锐型' }
  }

  const personality = analysis.personality || {}
  const personalityDesc = `
- 社交倾向：${personalityMap.extraversion[personality.extraversion] || '未知'}
- 思维方式：${personalityMap.openness[personality.openness] || '未知'}
- 行为风格：${personalityMap.conscientiousness[personality.conscientiousness] || '未知'}
- 人际态度：${personalityMap.agreeableness[personality.agreeableness] || '未知'}
- 情绪特征：${personalityMap.stability[personality.stability] || '未知'}`

  // 🆕 价值观和世界观描述
  const worldview = analysis.worldview || {}
  const worldviewMap = {
    lifeAttitude: { optimistic: '乐观积极', pessimistic: '悲观审慎', realistic: '现实主义' },
    valueOrientation: { idealistic: '理想主义', materialistic: '现实主义', balanced: '平衡取向' },
    relationshipView: { collectivist: '集体主义', individualist: '个人主义' },
    timeOrientation: { present: '活在当下', future: '面向未来', past: '怀旧取向' }
  }

  const worldviewDesc = `
- 人生态度：${worldviewMap.lifeAttitude[worldview.lifeAttitude] || '未知'}
- 价值取向：${worldviewMap.valueOrientation[worldview.valueOrientation] || '未知'}
- 关系观念：${worldviewMap.relationshipView[worldview.relationshipView] || '未知'}
- 时间观念：${worldviewMap.timeOrientation[worldview.timeOrientation] || '未知'}`

  // 🆕 文化品味和兴趣偏好
  const culturalTaste = analysis.culturalTaste || {}
  const culturalInterestsText = culturalTaste.primaryInterests?.slice(0, 3).join('、') ||
                                culturalTaste.culturalInterests?.slice(0, 3).map(c => typeof c === 'string' ? c : c.name).join('、') ||
                                '未明确'
  const topicPreferencesText = culturalTaste.topicPreferences?.slice(0, 3).map(t => typeof t === 'string' ? t : t.name).join('、') || '未明确'

  // 🆕 核心主题和思想
  const themes = analysis.themes || {}
  const coreThemesText = themes.coreThemes?.slice(0, 3).map(t => typeof t === 'string' ? t : t.name).join('、') || '未明确'

  // 🆕 意象系统
  const imagerySystem = analysis.imagerySystem || {}
  const imageryDesc = imagerySystem.recurringObjects?.length > 0 || imagerySystem.recurringScenes?.length > 0 || imagerySystem.recurringActivities?.length > 0
    ? `\n\n9️⃣ 意象系统（标志性元素）\n` +
      (imagerySystem.recurringObjects?.length > 0 ? `- 反复出现的物品：${imagerySystem.recurringObjects.slice(0, 5).join('、')}\n` : '') +
      (imagerySystem.recurringScenes?.length > 0 ? `- 反复出现的场景：${imagerySystem.recurringScenes.slice(0, 5).join('、')}\n` : '') +
      (imagerySystem.recurringActivities?.length > 0 ? `- 反复出现的活动：${imagerySystem.recurringActivities.slice(0, 5).join('、')}\n` : '') +
      (imagerySystem.symbolicMeanings ? `- 象征意义：${imagerySystem.symbolicMeanings}\n` : '')
    : ''

  // 🆕 比喻风格
  const metaphorStyle = analysis.metaphorStyle || {}
  const metaphorDesc = metaphorStyle.type
    ? `\n🔟 比喻风格\n` +
      `- 类型：${metaphorStyle.type === 'abstract' ? '抽象型' : metaphorStyle.type === 'concrete' ? '具象型' : metaphorStyle.type === 'surreal' ? '超现实' : '诗意型'}\n` +
      (metaphorStyle.examples?.length > 0 ? `- 典型例子：\n${metaphorStyle.examples.slice(0, 3).map(e => `  · "${e}"`).join('\n')}\n` : '') +
      (metaphorStyle.characteristics ? `- 特点：${metaphorStyle.characteristics}\n` : '')
    : ''

  // 🆕 情感基调
  const emotionalTone = analysis.emotionalTone || {}
  const emotionalDesc = emotionalTone.dominant
    ? `\n1️⃣1️⃣ 情感基调\n` +
      `- 主导情绪：${emotionalTone.dominant === 'melancholic' ? '忧郁型' : emotionalTone.dominant === 'cheerful' ? '明快型' : emotionalTone.dominant === 'ironic' ? '讽刺型' : emotionalTone.dominant === 'tender' ? '温柔型' : emotionalTone.dominant === 'restrained' ? '克制型' : '中性'}\n` +
      `- 情感强度：${emotionalTone.intensity === 'subtle' ? '细腻微妙' : emotionalTone.intensity === 'intense' ? '强烈浓郁' : '适度表达'}\n` +
      (emotionalTone.description ? `- 描述：${emotionalTone.description}\n` : '')
    : ''

  // 🆕 叙述结构
  const narrativeStructure = analysis.narrativeStructure || {}
  const narrativeDesc = narrativeStructure.dialogueRatio
    ? `\n1️⃣2️⃣ 叙述结构\n` +
      `- 对话占比：${narrativeStructure.dialogueRatio === 'low' ? '较少（偏重叙述）' : narrativeStructure.dialogueRatio === 'high' ? '较多（对话驱动）' : '适中'}\n` +
      (narrativeStructure.dialogueStyle ? `  · 对话风格：${narrativeStructure.dialogueStyle}\n` : '') +
      `- 时间处理：${narrativeStructure.timeHandling === 'linear' ? '线性叙述' : narrativeStructure.timeHandling === 'flashback' ? '闪回插叙' : '交织编织'}\n` +
      `- 叙述节奏：${narrativeStructure.narrativePace === 'slow' ? '缓慢悠长' : narrativeStructure.narrativePace === 'fast' ? '快速紧凑' : '适中平稳'}\n`
    : ''

  // Extract tone - handle both AI and regex formats
  const tone = analysis.languageStyle?.tone || analysis.tone || 'neutral'

  // Extract perspective - handle both AI and regex formats
  const perspective = analysis.perspective || {}
  const perspectiveDominant = perspective.dominant || 'first'
  const firstPersonPercent = perspective.firstPersonPercent || perspective.firstPerson || '0'
  const secondPersonPercent = perspective.secondPersonPercent || perspective.secondPerson || '0'
  const thirdPersonPercent = perspective.thirdPersonPercent || perspective.thirdPerson || '0'

  // Extract complexity - handle both AI and regex formats
  const complexity = analysis.languageStyle?.complexity || analysis.complexity?.diversity || 'varied'
  const complexitySimple = analysis.complexity?.simple || '0'
  const complexityCompound = analysis.complexity?.compound || '0'
  const complexityComplex = analysis.complexity?.complex || '0'

  return `
【写作风格档案】

1️⃣ 语言风格
- 整体语气：${toneMap[tone] || '中性客观'}
- 句式特点：${sentenceLengthStyle}（平均 ${avgSentenceLength} 字/句）
- 句式复杂度：${complexityMap[complexity] || '未知'}
${complexitySimple !== '0' ? `  · 简单句：${complexitySimple}%` : ''}
${complexityCompound !== '0' ? `  · 复合句：${complexityCompound}%` : ''}
${complexityComplex !== '0' ? `  · 复杂句：${complexityComplex}%` : ''}
- 标点风格：${punctuationStyle}

2️⃣ 叙述视角
- ${perspectiveMap[perspectiveDominant] || '第一人称为主'}
- 人称分布：我(${firstPersonPercent}%) / 你(${secondPersonPercent}%) / 他(${thirdPersonPercent}%)

3️⃣ 行文习惯
- 开头方式：${openingStyle}
- 常用转折词：${topTransitions}
- 主题偏好：${themeWords}

4️⃣ 表达特征
${punctuationStyle.includes('感叹号') ? '- 情感表达直接，不回避主观感受' : ''}
${punctuationStyle.includes('问句') ? '- 喜欢通过提问引导思考，与读者建立对话感' : ''}
${perspectiveDominant === 'first' ? '- 强调个人经历和主观感受，真实感强' : ''}
${perspectiveDominant === 'second' ? '- 直接对话读者，互动性强' : ''}
${complexity === 'complex' ? '- 善于使用复杂句式，层层递进表达观点' : '- 句子简洁有力，一针见血'}
${topPhrases.length > 3 ? `- 有标志性的表达习惯，形成个人语言风格` : ''}
${expressionExamples}

5️⃣ 人格底色
${personalityDesc}

6️⃣ 价值观与世界观
${worldviewDesc}

7️⃣ 兴趣偏好与文化品味
- 文化兴趣：${culturalInterestsText}
- 话题偏好：${topicPreferencesText}
- 核心主题：${coreThemesText}

8️⃣ 模仿指南
当你用这种文风写作时：

**人格特质呈现**
${personality.extraversion === 'extraverted' ? '- 展现出对社交和分享的热情，表达外向开朗' : personality.extraversion === 'introverted' ? '- 保持内敛沉思的特质，重视独处和思考' : ''}
${personality.openness === 'open' ? '- 探索新颖独特的角度，不拘泥于传统' : personality.openness === 'conservative' ? '- 尊重经典和传统，强调稳定性' : ''}
${personality.conscientiousness === 'conscientious' ? '- 体现计划性和条理性，注重细节' : personality.conscientiousness === 'spontaneous' ? '- 保持灵活和随性，强调自由' : ''}

**价值观呈现**
${worldview.lifeAttitude === 'optimistic' ? '- 传递积极向上的人生态度，看到美好的一面' : worldview.lifeAttitude === 'pessimistic' ? '- 保持审慎的态度，深入探讨矛盾和困境' : worldview.lifeAttitude === 'realistic' ? '- 保持客观理性，平衡看待问题' : ''}
${worldview.valueOrientation === 'idealistic' ? '- 强调精神追求和理想意义，而非物质' : worldview.valueOrientation === 'materialistic' ? '- 关注现实利益和实际价值' : worldview.valueOrientation === 'balanced' ? '- 平衡理想与现实' : ''}
${worldview.timeOrientation === 'present' ? '- 聚焦当下体验，及时行乐的态度' : worldview.timeOrientation === 'future' ? '- 着眼长远规划，为未来做准备' : worldview.timeOrientation === 'past' ? '- 回望过去经验，从历史中汲取智慧' : ''}

**思维方式**
${perspectiveDominant === 'first' ? '- 以第一人称视角，分享个人经历和感受' : ''}
${perspectiveDominant === 'second' ? '- 用第二人称直接对话，增强参与感' : ''}

**语言习惯**
- 保持 ${toneMap[tone] || '中性客观'} 的语气，不要过于正式或随意
- 句子长度控制在 ${Math.max(10, avgSentenceLength - 5)}-${avgSentenceLength + 5} 字之间
- ${punctuationStyle.includes('感叹号') ? '适当使用感叹号表达态度' : '标点保持克制，少用感叹号'}
- ${punctuationStyle.includes('问句') ? '可以用反问和设问增强互动感' : '以陈述句为主'}
- 常用这些转折词：${topTransitions}

**表达细节**
- 关注 "${themeWords}" 这些核心主题
- 核心思想围绕：${coreThemesText}
${topPhrases.length > 0 ? `- 尝试使用这些特色表达：${topPhrases.slice(0, 3).join('、')}` : ''}
${imageryDesc}${metaphorDesc}${emotionalDesc}${narrativeDesc}
📊 数据基础：基于 ${analysis.totalWords?.toLocaleString() || '未知'} 字的文本分析
  `.trim()
}
