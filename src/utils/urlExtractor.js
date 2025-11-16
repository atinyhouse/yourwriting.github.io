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
export const fetchWithCORS = async (url) => {
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

// 从公众号文章链接中提取 biz 参数
export const extractBizFromUrl = (url) => {
  const match = url.match(/[?&]__biz=([^&]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

// 从HTML源代码中提取 biz 参数
export const extractBizFromHTML = async (url) => {
  try {
    console.log('🔍 正在从HTML源代码中提取 biz 参数...')
    console.log('URL:', url)

    const html = await fetchWithCORS(url)

    console.log('✅ HTML 获取成功，长度:', html.length)
    console.log('HTML 前500字符:', html.slice(0, 500))

    // 方法1: 从 URL 参数中提取
    console.log('尝试方法1：从__biz参数提取...')
    const bizMatch1 = html.match(/__biz=([^&"'\s]+)/i)
    if (bizMatch1) {
      const biz = decodeURIComponent(bizMatch1[1])
      console.log('✅ 方法1成功，从__biz参数提取到:', biz)
      return biz
    } else {
      console.log('❌ 方法1失败：未找到__biz参数')
    }

    // 方法2: 从 var biz = 变量中提取
    console.log('尝试方法2：从var biz变量提取...')
    const bizMatch2 = html.match(/var\s+biz\s*=\s*["']([^"']+)["']/i)
    if (bizMatch2) {
      const biz = bizMatch2[1]
      console.log('✅ 方法2成功，从var biz变量提取到:', biz)
      return biz
    } else {
      console.log('❌ 方法2失败：未找到var biz变量')
    }

    // 方法3: 从 window.biz 中提取
    console.log('尝试方法3：从window.biz提取...')
    const bizMatch3 = html.match(/window\.biz\s*=\s*["']([^"']+)["']/i)
    if (bizMatch3) {
      const biz = bizMatch3[1]
      console.log('✅ 方法3成功，从window.biz提取到:', biz)
      return biz
    } else {
      console.log('❌ 方法3失败：未找到window.biz')
    }

    // 方法4: 更宽松的匹配（查找任何看起来像biz的长字符串）
    console.log('尝试方法4：宽松匹配任何biz格式...')
    const bizMatch4 = html.match(/biz["\s:=]+([A-Za-z0-9+/=]{20,})/i)
    if (bizMatch4) {
      const biz = bizMatch4[1]
      console.log('✅ 方法4成功，宽松匹配到:', biz)
      return biz
    } else {
      console.log('❌ 方法4失败：未找到任何biz格式')
    }

    console.error('❌ 所有方法都失败，无法从HTML中找到biz参数')
    console.log('HTML 包含 "__biz" 关键词:', html.includes('__biz'))
    console.log('HTML 包含 "var biz" 关键词:', html.includes('var biz'))

    throw new Error('无法从HTML源代码中提取 biz 参数。请检查链接是否正确，或尝试使用包含完整 __biz 参数的链接。')
  } catch (error) {
    console.error('❌ 提取 biz 失败，详细错误:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    })
    throw error
  }
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

// 通过单篇文章链接获取整个公众号的历史文章列表
export const fetchAllArticlesFromSingleUrl = async (articleUrl) => {
  try {
    console.log('🚀 开始从单篇文章获取整个公众号历史...')
    console.log('文章链接:', articleUrl)

    // 步骤1: 提取 biz 参数
    let biz = extractBizFromUrl(articleUrl)

    if (!biz) {
      console.log('URL中没有biz参数，尝试从HTML源代码提取...')
      biz = await extractBizFromHTML(articleUrl)
    }

    if (!biz) {
      throw new Error('无法从文章链接中提取公众号标识（biz参数）')
    }

    console.log('✅ 成功提取 biz:', biz)

    // 步骤2: 构建公众号历史消息页面URL
    const profileUrl = `https://mp.weixin.qq.com/mp/profile_ext?action=home&__biz=${encodeURIComponent(biz)}`

    console.log('📄 公众号历史消息页URL:', profileUrl)

    // 步骤3: 获取历史消息页面HTML
    console.log('正在获取公众号历史消息页面...')
    const html = await fetchWithCORS(profileUrl)

    console.log('✅ 成功获取历史消息页面，HTML长度:', html.length)

    // 调试：保存 HTML 片段用于检查
    console.log('HTML 前500字符:', html.slice(0, 500))
    console.log('搜索 msgList 关键词...')

    // 步骤4: 从历史消息页面提取所有文章链接
    const doc = new DOMParser().parseFromString(html, 'text/html')
    const articleLinks = new Set()

    // 方法1: 从 msgList 数据中提取（最可靠）
    // 尝试多种匹配模式
    const msgListMatch = html.match(/var\s+msgList\s*=\s*'([^']+)'/i) ||
                        html.match(/var\s+msgList\s*=\s*"([^"]+)"/i) ||
                        html.match(/msgList\s*:\s*'([^']+)'/i) ||
                        html.match(/msgList\s*:\s*"([^"]+)"/i)

    console.log('msgList 正则匹配结果:', msgListMatch ? '找到' : '未找到')

    if (msgListMatch) {
      try {
        console.log('原始 msgListStr 长度:', msgListMatch[1].length)

        const msgListStr = msgListMatch[1]
          .replace(/&#39;/g, "'")
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')

        console.log('解码后 msgListStr 前200字符:', msgListStr.slice(0, 200))

        const msgList = JSON.parse(msgListStr)

        console.log('msgList 解析成功，结构:', {
          hasListProperty: !!msgList.list,
          listLength: msgList.list?.length || 0,
          keys: Object.keys(msgList)
        })

        if (msgList && msgList.list) {
          console.log('✅ 成功解析 msgList，找到', msgList.list.length, '条消息')

          msgList.list.forEach((item, index) => {
            console.log(`处理消息 ${index + 1}/${msgList.list.length}`)

            // 主文章
            if (item.app_msg_ext_info && item.app_msg_ext_info.content_url) {
              const link = 'https://mp.weixin.qq.com' + item.app_msg_ext_info.content_url.replace(/&amp;/g, '&')
              articleLinks.add(link)
              console.log(`  ✅ 主文章: ${item.app_msg_ext_info.title || '无标题'}`)
            }

            // 多图文消息（一次推送多篇文章）
            if (item.app_msg_ext_info && item.app_msg_ext_info.multi_app_msg_item_list) {
              console.log(`  📑 多图文消息，包含 ${item.app_msg_ext_info.multi_app_msg_item_list.length} 篇文章`)
              item.app_msg_ext_info.multi_app_msg_item_list.forEach((subItem, subIndex) => {
                if (subItem.content_url) {
                  const link = 'https://mp.weixin.qq.com' + subItem.content_url.replace(/&amp;/g, '&')
                  articleLinks.add(link)
                  console.log(`    ✅ 子文章 ${subIndex + 1}: ${subItem.title || '无标题'}`)
                }
              })
            }
          })
        } else {
          console.warn('⚠️ msgList 解析成功但没有 list 属性')
        }
      } catch (e) {
        console.error('❌ 解析 msgList 失败，详细错误:', {
          name: e.name,
          message: e.message,
          stack: e.stack
        })
        console.log('msgListStr 内容（前500字符）:', msgListMatch[1].slice(0, 500))
      }
    } else {
      console.warn('⚠️ 未找到 msgList 变量，尝试其他方法...')

      // 额外调试：检查 HTML 中是否有其他可能的数据源
      if (html.includes('appmsg')) {
        console.log('✅ HTML 中包含 appmsg 关键词')
      }
      if (html.includes('content_url')) {
        console.log('✅ HTML 中包含 content_url 关键词')
      }
      if (html.includes('__biz')) {
        console.log('✅ HTML 中包含 __biz 关键词')
      }
    }

    // 方法2: 从 <a> 标签中提取（备用方法）
    const allLinks = doc.querySelectorAll('a[href]')
    allLinks.forEach(link => {
      let href = link.getAttribute('href')
      if (!href) return

      // 微信文章链接特征
      if (href.includes('/s?__biz=') || href.includes('/s/')) {
        // 处理相对路径
        if (href.startsWith('/')) {
          href = 'https://mp.weixin.qq.com' + href
        }

        // 确保是完整URL
        if (href.startsWith('http')) {
          articleLinks.add(href.replace(/&amp;/g, '&'))
        }
      }
    })

    const links = Array.from(articleLinks)
    console.log(`🎉 提取完成，共找到 ${links.length} 篇文章链接`)

    if (links.length === 0) {
      // 提供更详细的诊断信息
      const diagnosticInfo = []

      if (!msgListMatch) {
        diagnosticInfo.push('❌ 未找到 msgList 数据结构')
      }

      const linkCount = doc.querySelectorAll('a[href]').length
      diagnosticInfo.push(`🔗 页面包含 ${linkCount} 个链接`)

      if (html.length < 10000) {
        diagnosticInfo.push(`⚠️ HTML 内容异常短（${html.length} 字符）`)
      }

      const diagString = diagnosticInfo.join('\n')

      throw new Error(`❌ 未能从公众号历史页面提取到文章链接

【诊断信息】
${diagString}

【可能原因】
1. 该公众号需要关注后才能查看历史消息
2. 该公众号尚未发布任何文章
3. 微信服务器返回了登录页面或验证页面
4. CORS 代理访问受限

【解决方案】
1. 在微信中关注该公众号，然后重试
2. 确认该公众号确实有已发布的文章
3. 稍后再试（可能是临时限制）
4. 使用"手动粘贴内容"方式添加单篇文章

【调试建议】
打开浏览器控制台（F12）查看详细日志`)
    }

    return {
      biz,
      profileUrl,
      links,
      count: links.length
    }
  } catch (error) {
    console.error('❌ 从单篇文章获取公众号历史失败:', error)
    throw error
  }
}

// 从页面中提取所有文章链接（支持微信公众号历史消息页面）
// 支持两种输入：URL 或 HTML 源代码
export const extractArticleLinks = async (urlOrHtml) => {
  try {
    console.log('开始提取页面中的所有文章链接')

    let html
    let isWechatPage = false

    // 检测输入是 URL 还是 HTML 源代码
    if (urlOrHtml.trim().startsWith('http://') || urlOrHtml.trim().startsWith('https://')) {
      // 输入是 URL
      const url = urlOrHtml.trim()
      console.log('输入类型：URL -', url)
      isWechatPage = url.includes('mp.weixin.qq.com')
      html = await fetchWithCORS(url)
    } else if (urlOrHtml.trim().startsWith('<')) {
      // 输入是 HTML 源代码
      console.log('输入类型：HTML 源代码，长度:', urlOrHtml.length)
      html = urlOrHtml
      isWechatPage = html.includes('mp.weixin.qq.com') || html.includes('var msgList')
    } else {
      throw new Error('无效的输入格式。请输入 URL 或粘贴 HTML 源代码')
    }

    const doc = new DOMParser().parseFromString(html, 'text/html')

    // 查找所有链接
    const allLinks = doc.querySelectorAll('a[href]')
    const articleLinks = new Set()

    console.log('总共找到链接数:', allLinks.length)

    // 如果是微信公众号页面，特殊处理
    if (isWechatPage) {
      console.log('检测到微信公众号页面，使用特殊提取逻辑')

      // 从 HTML 中提取文章链接（微信公众号特有的格式）
      // 方法1: 从 msgList 数据中提取
      const msgListMatch = html.match(/var\s+msgList\s*=\s*'([^']+)'/i) ||
                          html.match(/var\s+msgList\s*=\s*"([^"]+)"/i)

      if (msgListMatch) {
        try {
          const msgListStr = msgListMatch[1]
            .replace(/&#39;/g, "'")
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')

          const msgList = JSON.parse(msgListStr)

          if (msgList && msgList.list) {
            msgList.list.forEach(item => {
              if (item.app_msg_ext_info && item.app_msg_ext_info.content_url) {
                const link = 'https://mp.weixin.qq.com' + item.app_msg_ext_info.content_url.replace(/&amp;/g, '&')
                articleLinks.add(link)
                console.log('✅ 从msgList提取到文章链接:', link)
              }

              // 多图文消息
              if (item.app_msg_ext_info && item.app_msg_ext_info.multi_app_msg_item_list) {
                item.app_msg_ext_info.multi_app_msg_item_list.forEach(subItem => {
                  if (subItem.content_url) {
                    const link = 'https://mp.weixin.qq.com' + subItem.content_url.replace(/&amp;/g, '&')
                    articleLinks.add(link)
                    console.log('✅ 从msgList多图文提取到文章链接:', link)
                  }
                })
              }
            })
          }
        } catch (e) {
          console.error('解析 msgList 失败:', e)
        }
      }

      // 方法2: 从 <a> 标签中提取
      allLinks.forEach(link => {
        let href = link.getAttribute('href')
        if (!href) return

        // 微信文章链接特征
        if (href.includes('/s?__biz=') || href.includes('/s/')) {
          // 处理相对路径
          if (href.startsWith('/')) {
            href = 'https://mp.weixin.qq.com' + href
          }

          // 确保是完整URL
          if (href.startsWith('http')) {
            articleLinks.add(href.replace(/&amp;/g, '&'))
            console.log('✅ 从<a>标签提取到文章链接:', href)
          }
        }
      })
    } else {
      // 普通网页的提取逻辑（保持原有逻辑）
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
          href.match(/\/\d{4}\//) || // 包含年份的路径
          hasDatePattern || // 包含完整日期的路径
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
    }

    const links = Array.from(articleLinks)
    console.log(`找到 ${links.length} 个文章链接`)

    if (links.length === 0 && isWechatPage) {
      console.warn('提示：如果是微信公众号，请确保：')
      console.warn('1. 使用公众号的"全部消息"页面链接')
      console.warn('2. 或者复制文章列表页面的完整HTML')
    }

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
