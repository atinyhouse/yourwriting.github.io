// URL 内容提取工具

// 多个 CORS 代理服务（按优先级排序）
const CORS_PROXIES = [
  'https://api.allorigins.win/get?url=',
  'https://cors-proxy.htmldriven.com/?url=',
  'https://api.codetabs.com/v1/proxy?quest=',
]

// 使用多个代理尝试获取网页内容
const fetchWithCORS = async (url) => {
  let lastError = null

  // 尝试所有代理
  for (let i = 0; i < CORS_PROXIES.length; i++) {
    const proxyUrl = CORS_PROXIES[i] + encodeURIComponent(url)

    try {
      console.log(`尝试代理 ${i + 1}/${CORS_PROXIES.length}:`, proxyUrl)

      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json, text/html, */*',
        },
        signal: AbortSignal.timeout(15000) // 15秒超时
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      // AllOrigins 返回 JSON 格式
      if (CORS_PROXIES[i].includes('allorigins')) {
        const data = await response.json()
        if (data.contents) {
          console.log('成功获取内容（AllOrigins）')
          return data.contents
        }
      }
      // codetabs 返回纯文本
      else if (CORS_PROXIES[i].includes('codetabs')) {
        const html = await response.text()
        if (html && html.length > 100) {
          console.log('成功获取内容（CodeTabs）')
          return html
        }
      }
      // HTMLDriven 返回纯 HTML
      else {
        const html = await response.text()
        if (html && html.length > 100) {
          console.log('成功获取内容（HTMLDriven）')
          return html
        }
      }
    } catch (error) {
      console.error(`代理 ${i + 1} 失败:`, error.message)
      lastError = error
      // 继续尝试下一个代理
      continue
    }
  }

  // 所有代理都失败
  throw new Error(`所有代理服务都无法访问该链接。\n原因：${lastError?.message || '网络错误'}\n\n建议：\n1. 检查网络连接\n2. 使用"直接粘贴内容"功能\n3. 稍后重试`)
}

// 提取微信公众号文章内容
export const extractWechatArticle = async (url) => {
  try {
    console.log('开始提取微信文章:', url)

    // 使用 CORS 代理获取 HTML
    const html = await fetchWithCORS(url)

    if (!html || html.length < 100) {
      throw new Error('获取到的内容为空或过短')
    }

    console.log('成功获取 HTML，长度:', html.length)

    // 解析 HTML
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')

    // 提取标题（多种方式尝试）
    const title = doc.querySelector('#activity-name')?.textContent?.trim() ||
                  doc.querySelector('.rich_media_title')?.textContent?.trim() ||
                  doc.querySelector('h1')?.textContent?.trim() ||
                  doc.querySelector('title')?.textContent?.trim() ||
                  '未命名文章'

    console.log('提取到标题:', title)

    // 提取正文内容（多种选择器）
    const contentSelectors = [
      '#js_content',
      '.rich_media_content',
      '#img-content',
      '.rich_media_area_primary'
    ]

    let contentDiv = null
    for (const selector of contentSelectors) {
      contentDiv = doc.querySelector(selector)
      if (contentDiv) {
        console.log('找到内容区域:', selector)
        break
      }
    }

    if (!contentDiv) {
      console.error('未找到内容区域，HTML 预览:', html.substring(0, 500))
      throw new Error('无法提取文章内容。可能原因：\n1. 文章需要关注公众号后才能查看\n2. 文章已被删除\n3. 链接格式不正确\n\n建议：打开链接手动复制内容后使用"直接粘贴"功能')
    }

    // 移除脚本和样式
    contentDiv.querySelectorAll('script, style, iframe').forEach(el => el.remove())

    // 获取纯文本
    let content = contentDiv.textContent || contentDiv.innerText || ''

    // 清理空白字符
    content = content.replace(/\s+/g, ' ').trim()

    console.log('提取到内容，长度:', content.length)

    if (!content || content.length < 50) {
      throw new Error('提取到的正文内容太少，请检查链接是否正确')
    }

    return {
      title,
      content,
      source: 'wechat',
      url
    }
  } catch (error) {
    console.error('提取微信文章失败:', error)
    throw error
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
