// URL 内容提取工具
import { Readability } from '@mozilla/readability'

// 使用自建 Cloudflare Workers 代理
const CORS_PROXIES = [
  // 自建代理（最稳定可靠）
  {
    url: 'https://wechat-proxy.lucca-caolu.workers.dev/?url=',
    transform: (url) => 'https://wechat-proxy.lucca-caolu.workers.dev/?url=' + encodeURIComponent(url),
    parseResponse: (res) => res.text()
  }
]

// 使用多个代理尝试获取网页内容
const fetchWithCORS = async (url) => {
  let lastError = null

  // 尝试所有代理
  for (let i = 0; i < CORS_PROXIES.length; i++) {
    const proxy = CORS_PROXIES[i]
    const proxyUrl = proxy.transform(url)

    try {
      console.log(`尝试代理 ${i + 1}/${CORS_PROXIES.length}:`, proxy.url)

      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(20000) // 20秒超时
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const html = await proxy.parseResponse(response)

      if (html && html.length > 1000 && !html.includes('<!DOCTYPE html><!--[if lt IE 7]>')) {
        console.log(`✅ 成功获取内容（代理 ${i + 1}），长度:`, html.length)
        return html
      } else {
        console.warn(`代理 ${i + 1} 返回内容异常，尝试下一个`)
        continue
      }
    } catch (error) {
      console.error(`代理 ${i + 1} 失败:`, error.message)
      lastError = error
      continue
    }
  }

  // 所有代理都失败
  throw new Error(`所有代理服务都无法访问该链接。\n最后错误：${lastError?.message || '网络错误'}\n\n💡 建议：\n1. 检查网络连接\n2. 使用"直接粘贴内容"功能\n3. 稍后重试`)
}

// 提取微信公众号文章内容（使用 Mozilla Readability 算法）
export const extractWechatArticle = async (url) => {
  try {
    console.log('开始提取微信文章:', url)

    // 使用 CORS 代理获取 HTML
    const html = await fetchWithCORS(url)

    if (!html || html.length < 100) {
      throw new Error('获取到的内容为空或过短')
    }

    console.log('成功获取 HTML，长度:', html.length)

    // 使用 Readability 提取主要内容
    const doc = new DOMParser().parseFromString(html, 'text/html')

    // 使用 Mozilla Readability 算法
    const reader = new Readability(doc, {
      keepClasses: false,
      charThreshold: 500 // 至少500字符才算是文章
    })

    const article = reader.parse()

    if (!article) {
      console.error('Readability 无法解析文章，尝试备用方法')
      // 如果 Readability 失败，尝试手动提取
      return await fallbackExtraction(doc, url)
    }

    console.log('Readability 提取成功:')
    console.log('- 标题:', article.title)
    console.log('- HTML 内容长度:', article.content?.length || 0)
    console.log('- 纯文本长度:', article.textContent?.length || 0)

    // 将 HTML 内容转换为纯文本
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = article.content

    // 移除脚本和样式
    tempDiv.querySelectorAll('script, style, iframe').forEach(el => el.remove())

    const content = tempDiv.textContent || tempDiv.innerText || ''
    const cleanedContent = content.replace(/\s+/g, ' ').trim()

    console.log('清理后的内容长度:', cleanedContent.length)

    // 如果 Readability 提取的内容太少，尝试备用方法
    if (cleanedContent.length < 500) {
      console.warn('Readability 提取的内容太少（' + cleanedContent.length + ' 字），尝试备用方法')
      return await fallbackExtraction(doc, url)
    }

    return {
      title: article.title || '未命名文章',
      content: cleanedContent,
      excerpt: article.excerpt,
      source: 'wechat',
      url
    }
  } catch (error) {
    console.error('提取微信文章失败:', error)
    throw error
  }
}

// 备用提取方法（当 Readability 失败时）
const fallbackExtraction = async (doc, url) => {
  console.log('使用备用提取方法...')

  const pageTitle = doc.querySelector('title')?.textContent || ''

  // 提取标题
  let title = doc.querySelector('#activity-name')?.textContent?.trim() ||
              doc.querySelector('.rich_media_title')?.textContent?.trim() ||
              doc.querySelector('h1.rich_media_title')?.textContent?.trim() ||
              doc.querySelector('h2#activity-name')?.textContent?.trim() ||
              doc.querySelector('h1')?.textContent?.trim() ||
              pageTitle

  title = title?.replace(/\s+/g, ' ').trim() || '未命名文章'

  // 尝试找到内容区域
  const contentSelectors = [
    '#js_content',
    '.rich_media_content',
    '#img-content',
    '.rich_media_area_primary',
    'div[id="js_content"]',
    'div.rich_media_content'
  ]

  let contentDiv = null
  for (const selector of contentSelectors) {
    contentDiv = doc.querySelector(selector)
    if (contentDiv) {
      console.log('备用方法找到内容区域:', selector)
      break
    }
  }

  // 如果还是找不到，找文本最长的 div
  if (!contentDiv) {
    const allDivs = doc.querySelectorAll('div')
    let maxLength = 0

    allDivs.forEach(div => {
      const text = div.textContent || ''
      if (text.length > maxLength && text.length > 500) {
        maxLength = text.length
        contentDiv = div
      }
    })
  }

  if (!contentDiv) {
    throw new Error('无法提取文章内容。\n\n💡 可能原因：\n1. 文章需要关注公众号才能查看\n2. 文章已被删除\n3. CORS代理无法访问该页面\n\n建议：使用"直接粘贴内容"功能')
  }

  // 移除脚本和样式
  contentDiv.querySelectorAll('script, style, iframe').forEach(el => el.remove())

  const content = contentDiv.textContent || contentDiv.innerText || ''
  const cleanedContent = content.replace(/\s+/g, ' ').trim()

  return {
    title,
    content: cleanedContent,
    source: 'wechat',
    url
  }
}

// 通用网页内容提取（使用 Mozilla Readability）
export const extractWebContent = async (url) => {
  try {
    console.log('开始提取网页内容:', url)

    // 使用 CORS 代理获取 HTML
    const html = await fetchWithCORS(url)

    if (!html || html.length < 100) {
      throw new Error('获取到的内容为空或过短')
    }

    console.log('成功获取 HTML，长度:', html.length)

    // 使用 Readability 提取主要内容
    const doc = new DOMParser().parseFromString(html, 'text/html')

    const reader = new Readability(doc, {
      keepClasses: false,
      charThreshold: 200  // 降低阈值，因为有些页面内容确实较少
    })

    const article = reader.parse()

    if (!article) {
      throw new Error('无法自动提取网页内容\n\n可能原因：\n- 这是一个列表页面，不是单篇文章\n- 页面需要JavaScript渲染\n- 页面结构特殊\n\n请尝试：\n1. 打开具体的文章页面（而不是首页或列表页）\n2. 或使用"直接粘贴内容"功能')
    }

    console.log('Readability 提取成功:')
    console.log('- 标题:', article.title)
    console.log('- HTML 内容长度:', article.content?.length || 0)
    console.log('- 纯文本长度:', article.textContent?.length || 0)

    // 将 HTML 内容转换为纯文本
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = article.content
    tempDiv.querySelectorAll('script, style, iframe, nav, header, footer, aside').forEach(el => el.remove())

    const content = tempDiv.textContent || tempDiv.innerText || ''
    const cleanedContent = content.replace(/\s+/g, ' ').trim()

    console.log('清理后的内容长度:', cleanedContent.length)

    if (!cleanedContent || cleanedContent.length < 200) {
      throw new Error(`提取到的内容太少（${cleanedContent.length} 字）\n\n💡 提示：\n- 这个链接可能是博客首页或列表页\n- 请打开具体的某一篇文章的链接\n- 例如：https://atinyhouse.github.io/posts/article-title/\n\n或者使用"直接粘贴内容"功能手动添加`)
    }

    return {
      title: article.title || '未命名文章',
      content: cleanedContent,
      excerpt: article.excerpt,
      source: 'web',
      url
    }
  } catch (error) {
    console.error('提取网页内容失败:', error)
    throw error
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

// 获取微信文章的完整URL（处理短链接重定向）
const getFullWechatUrl = async (url) => {
  // 如果已经是完整链接，直接返回
  if (url.includes('__biz=')) {
    return url
  }

  try {
    // 短链接需要通过代理获取重定向后的完整URL
    console.log('检测到短链接，正在获取完整URL...')

    const html = await fetchWithCORS(url)

    // 尝试从HTML中提取完整链接
    // 微信会在页面中嵌入完整URL
    const bizMatch = html.match(/__biz=([^&"']+)/)
    if (bizMatch) {
      const fullBiz = bizMatch[1]
      console.log('从HTML中提取到biz参数:', fullBiz)
      return url + '?__biz=' + fullBiz
    }

    // 尝试从window.location或其他地方提取
    const urlMatch = html.match(/var\s+msg_link\s*=\s*["']([^"']+)["']/)
    if (urlMatch) {
      const fullUrl = urlMatch[1].replace(/&amp;/g, '&')
      console.log('从msg_link提取到完整URL:', fullUrl)
      return fullUrl
    }

    throw new Error('无法从短链接中提取完整URL')
  } catch (error) {
    console.error('获取完整URL失败:', error)
    throw error
  }
}

// 通过RSSHub获取公众号所有文章链接
export const fetchWechatAccountArticles = async (articleUrl) => {
  try {
    // 1. 先获取完整URL（如果是短链接）
    const fullUrl = await getFullWechatUrl(articleUrl)
    console.log('完整URL:', fullUrl)

    // 2. 从完整URL中提取biz参数
    const biz = extractBizFromUrl(fullUrl)
    if (!biz) {
      throw new Error('无法从链接中提取公众号ID（__biz参数）\n\n💡 提示：请确保链接是微信公众号文章链接')
    }

    console.log('提取到公众号ID:', biz)

    // 3. 使用RSSHub API获取公众号文章列表
    // RSSHub提供了微信公众号订阅：https://docs.rsshub.app/routes/social-media#wei-xin
    const rsshubUrl = `https://rsshub.app/wechat/mp/msgalbum/${biz}`

    console.log('请求RSSHub:', rsshubUrl)

    const response = await fetch(rsshubUrl, {
      headers: {
        'Accept': 'application/xml, application/rss+xml, text/xml'
      }
    })

    if (!response.ok) {
      throw new Error(`RSSHub请求失败: HTTP ${response.status}`)
    }

    const xmlText = await response.text()
    const parser = new DOMParser()
    const doc = parser.parseFromString(xmlText, 'text/xml')

    // 3. 解析RSS中的文章链接
    const items = doc.querySelectorAll('item')
    const articles = []

    items.forEach(item => {
      const link = item.querySelector('link')?.textContent
      const title = item.querySelector('title')?.textContent
      const pubDate = item.querySelector('pubDate')?.textContent

      if (link && link.includes('mp.weixin.qq.com')) {
        articles.push({
          url: link.trim(),
          title: title?.trim() || '未命名',
          pubDate: pubDate ? new Date(pubDate) : null
        })
      }
    })

    console.log(`从RSSHub获取到 ${articles.length} 篇文章`)

    if (articles.length === 0) {
      throw new Error('该公众号暂无文章，或RSSHub暂时无法获取。\\n\\n💡 建议：手动复制多个文章链接，使用"批量爬取"功能')
    }

    return articles

  } catch (error) {
    console.error('获取公众号文章列表失败:', error)
    throw new Error(`获取公众号文章失败: ${error.message}`)
  }
}

// 从页面中提取所有文章链接
export const extractArticleLinks = async (url) => {
  try {
    console.log('开始提取页面中的所有文章链接:', url)

    const html = await fetchWithCORS(url)
    const doc = new DOMParser().parseFromString(html, 'text/html')

    // 查找所有链接
    const allLinks = doc.querySelectorAll('a[href]')
    const articleLinks = new Set()

    console.log('总共找到链接数:', allLinks.length)

    allLinks.forEach(link => {
      let href = link.getAttribute('href')
      if (!href) return

      const originalHref = href

      // 处理相对路径
      if (href.startsWith('/')) {
        const baseUrl = new URL(url)
        href = baseUrl.origin + href
      } else if (!href.startsWith('http')) {
        return // 跳过非http链接
      }

      // 检查是否符合日期格式
      const hasDatePattern = href.match(/\/\d{4}-\d{2}-\d{2}\//)

      // 过滤掉非文章链接
      if (
        href.includes('/posts/') ||
        href.includes('/post/') ||
        href.includes('/article/') ||
        href.includes('/blog/') ||
        href.includes('/p/') ||
        href.match(/\/\d{4}\//) || // 包含年份的路径 (如 /2022/article)
        hasDatePattern || // 包含完整日期的路径 (如 /2025-07-01/article)
        href.match(/\.html?$/) // HTML文件
      ) {
        // 排除标签、分类、归档、thoughts等页面
        const isExcluded =
          href.includes('/tags/') ||
          href.includes('/categories/') ||
          href.includes('/archive') ||
          href.includes('/page/') ||
          href.includes('/thoughts') ||
          href.includes('/about')

        if (!isExcluded) {
          console.log('✅ 找到文章链接:', originalHref, '→', href)
          articleLinks.add(href)
        } else {
          console.log('⏭️  排除链接:', originalHref, '(excluded)')
        }
      }
    })

    const links = Array.from(articleLinks)
    console.log(`找到 ${links.length} 个可能的文章链接`)
    return links
  } catch (error) {
    console.error('提取文章链接失败:', error)
    throw error
  }
}

// 批量提取文章内容
export const batchExtractArticles = async (links, onProgress) => {
  const results = []
  const total = links.length

  for (let i = 0; i < links.length; i++) {
    try {
      const url = links[i]
      console.log(`[${i + 1}/${total}] 正在提取: ${url}`)

      // 调用进度回调
      if (onProgress) {
        onProgress({
          current: i + 1,
          total,
          url,
          status: 'processing'
        })
      }

      // 判断是微信还是普通网页
      const article = url.includes('mp.weixin.qq.com')
        ? await extractWechatArticle(url)
        : await extractWebContent(url)

      results.push({
        success: true,
        url,
        article
      })

      // 调用进度回调
      if (onProgress) {
        onProgress({
          current: i + 1,
          total,
          url,
          status: 'success',
          article
        })
      }

      // 避免请求过快，添加延迟
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error) {
      console.error(`提取失败: ${links[i]}`, error)
      results.push({
        success: false,
        url: links[i],
        error: error.message
      })

      // 调用进度回调
      if (onProgress) {
        onProgress({
          current: i + 1,
          total,
          url: links[i],
          status: 'failed',
          error: error.message
        })
      }
    }
  }

  return results
}
