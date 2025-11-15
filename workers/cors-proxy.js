/**
 * Cloudflare Workers CORS Proxy
 * 用于绕过浏览器CORS限制，获取微信公众号文章内容
 */

export default {
  async fetch(request, env, ctx) {
    // 只允许GET请求
    if (request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405 })
    }

    // 从查询参数获取目标URL
    const url = new URL(request.url)
    const targetUrl = url.searchParams.get('url')

    if (!targetUrl) {
      return new Response('Missing url parameter', { status: 400 })
    }

    // 验证URL格式
    let target
    try {
      target = new URL(targetUrl)
    } catch (e) {
      return new Response('Invalid url parameter', { status: 400 })
    }

    // 只允许访问微信公众号和常见博客网站
    const allowedHosts = [
      'mp.weixin.qq.com',
      'github.io',
      'medium.com',
      'substack.com',
      'notion.site'
    ]

    const isAllowed = allowedHosts.some(host =>
      target.hostname.includes(host) || target.hostname.endsWith(host)
    )

    if (!isAllowed) {
      return new Response('URL not allowed', { status: 403 })
    }

    try {
      // 发起请求获取内容
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
          'Referer': target.origin
        }
      })

      if (!response.ok) {
        return new Response(`Failed to fetch: HTTP ${response.status}`, {
          status: response.status
        })
      }

      // 获取HTML内容
      const html = await response.text()

      // 返回带CORS头的响应
      return new Response(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Cache-Control': 'public, max-age=3600' // 缓存1小时
        }
      })

    } catch (error) {
      return new Response(`Error: ${error.message}`, { status: 500 })
    }
  }
}
