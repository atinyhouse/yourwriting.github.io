// URL 内容提取工具

// 使用 RSSHub 提取微信公众号文章
export const extractWechatArticle = async (url) => {
  try {
    // 从微信公众号链接提取文章 ID
    const match = url.match(/[?&]__biz=([^&]+).*?[?&]mid=([^&]+).*?[?&]idx=(\d+).*?[?&]sn=([^&]+)/)

    if (!match) {
      throw new Error('无法解析微信公众号链接格式')
    }

    const [, biz, mid, idx, sn] = match

    // 使用公开的 RSSHub 服务
    const rsshubUrl = `https://rsshub.app/wechat/mp/article/${biz}/${mid}/${idx}/${sn}`

    const response = await fetch(rsshubUrl)
    if (!response.ok) {
      throw new Error('RSSHub 服务暂时不可用')
    }

    const data = await response.text()

    // 解析 RSS XML
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(data, 'text/xml')

    const title = xmlDoc.querySelector('item title')?.textContent || '未命名文章'
    const description = xmlDoc.querySelector('item description')?.textContent || ''

    // 清理 HTML 标签
    const content = stripHtml(description)

    return {
      title,
      content,
      source: 'wechat'
    }
  } catch (error) {
    console.error('提取微信文章失败:', error)
    throw error
  }
}

// 通用网页内容提取（使用简化方案）
export const extractWebContent = async (url) => {
  try {
    // 由于 CORS 限制，纯前端无法直接抓取，这里提供一个提示
    // 实际应用中需要后端代理或使用第三方服务
    throw new Error('暂不支持直接从网页提取。建议：\n1. 复制文章内容后使用"直接粘贴内容"功能\n2. 或使用浏览器插件提取正文后粘贴')
  } catch (error) {
    throw error
  }
}

// 检测 URL 类型
export const detectUrlType = (url) => {
  if (url.includes('mp.weixin.qq.com')) {
    return 'wechat'
  } else if (url.includes('rsshub.app')) {
    return 'rsshub'
  } else {
    return 'web'
  }
}

// 清理 HTML 标签
const stripHtml = (html) => {
  const tmp = document.createElement('div')
  tmp.innerHTML = html

  // 移除 script 和 style 标签
  const scripts = tmp.querySelectorAll('script, style')
  scripts.forEach(script => script.remove())

  // 获取纯文本
  let text = tmp.textContent || tmp.innerText || ''

  // 清理多余空白
  text = text.replace(/\s+/g, ' ').trim()

  return text
}

// 从 RSSHub 批量获取公众号文章
export const fetchWechatArticlesViaRSSHub = async (accountId, limit = 10) => {
  try {
    // 使用 RSSHub 的公众号订阅功能
    // 注意：这需要公众号的 biz 参数，用户需要从任一公众号文章链接中提取
    const rsshubUrl = `https://rsshub.app/wechat/mp/account/${accountId}`

    const response = await fetch(rsshubUrl)
    if (!response.ok) {
      throw new Error('无法获取公众号文章列表')
    }

    const data = await response.text()

    // 解析 RSS XML
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(data, 'text/xml')

    const items = xmlDoc.querySelectorAll('item')
    const articles = []

    for (let i = 0; i < Math.min(items.length, limit); i++) {
      const item = items[i]
      const title = item.querySelector('title')?.textContent || '未命名'
      const description = item.querySelector('description')?.textContent || ''
      const content = stripHtml(description)

      articles.push({
        title,
        content,
        source: 'wechat'
      })
    }

    return articles
  } catch (error) {
    console.error('批量获取失败:', error)
    throw error
  }
}
