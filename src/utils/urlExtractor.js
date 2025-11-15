// URL 内容提取工具

// 使用 AllOrigins CORS 代理获取网页内容
const fetchWithCORS = async (url) => {
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`

  const response = await fetch(proxyUrl)
  if (!response.ok) {
    throw new Error('无法访问该链接，请检查链接是否有效')
  }

  const data = await response.json()
  return data.contents
}

// 提取微信公众号文章内容
export const extractWechatArticle = async (url) => {
  try {
    // 使用 CORS 代理获取 HTML
    const html = await fetchWithCORS(url)

    // 解析 HTML
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')

    // 提取标题
    const title = doc.querySelector('#activity-name')?.textContent?.trim() ||
                  doc.querySelector('h1')?.textContent?.trim() ||
                  doc.querySelector('title')?.textContent?.trim() ||
                  '未命名文章'

    // 提取正文内容
    // 微信公众号文章的正文通常在 id="js_content" 的 div 中
    const contentDiv = doc.querySelector('#js_content') ||
                       doc.querySelector('.rich_media_content')

    if (!contentDiv) {
      throw new Error('无法提取文章内容，请确认这是有效的微信公众号文章链接')
    }

    // 移除脚本和样式
    contentDiv.querySelectorAll('script, style').forEach(el => el.remove())

    // 获取纯文本
    let content = contentDiv.textContent || contentDiv.innerText || ''

    // 清理空白字符
    content = content.replace(/\s+/g, ' ').trim()

    return {
      title,
      content,
      source: 'wechat',
      url
    }
  } catch (error) {
    console.error('提取微信文章失败:', error)
    throw new Error(`提取失败: ${error.message}`)
  }
}

// 通用网页内容提取
export const extractWebContent = async (url) => {
  try {
    // 使用 CORS 代理获取 HTML
    const html = await fetchWithCORS(url)

    // 解析 HTML
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')

    // 提取标题
    const title = doc.querySelector('h1')?.textContent?.trim() ||
                  doc.querySelector('title')?.textContent?.trim() ||
                  '未命名文章'

    // 尝试找到主要内容区域
    const contentSelectors = [
      'article',
      '.article-content',
      '.post-content',
      '.entry-content',
      'main',
      '#content'
    ]

    let contentElement = null
    for (const selector of contentSelectors) {
      contentElement = doc.querySelector(selector)
      if (contentElement) break
    }

    // 如果找不到特定区域，使用 body
    if (!contentElement) {
      contentElement = doc.querySelector('body')
    }

    if (!contentElement) {
      throw new Error('无法提取文章内容')
    }

    // 移除脚本、样式、导航等
    contentElement.querySelectorAll('script, style, nav, header, footer, aside, .ad, .advertisement').forEach(el => el.remove())

    // 获取纯文本
    let content = contentElement.textContent || contentElement.innerText || ''

    // 清理空白字符
    content = content.replace(/\s+/g, ' ').trim()

    return {
      title,
      content,
      source: 'web',
      url
    }
  } catch (error) {
    console.error('提取网页内容失败:', error)
    throw new Error(`提取失败: ${error.message}`)
  }
}

// 检测 URL 类型
export const detectUrlType = (url) => {
  if (url.includes('mp.weixin.qq.com')) {
    return 'wechat'
  } else {
    return 'web'
  }
}

// 从公众号文章链接中提取 biz 参数（用于批量获取）
export const extractBizFromUrl = (url) => {
  const match = url.match(/[?&]__biz=([^&]+)/)
  return match ? match[1] : null
}
