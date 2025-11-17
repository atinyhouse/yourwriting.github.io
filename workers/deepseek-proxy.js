/**
 * Cloudflare Worker - DeepSeek API 代理
 * 用途：隐藏 API Key，让用户无需配置即可使用
 */

// 在 Cloudflare Workers 环境变量中配置您的 API Key
// 变量名：DEEPSEEK_API_KEY

export default {
  async fetch(request, env) {
    // 处理 CORS 预检请求
    if (request.method === 'OPTIONS') {
      return handleCORS()
    }

    // 只允许 POST 请求
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 })
    }

    try {
      // 读取请求体
      const body = await request.json()

      // 验证请求格式
      if (!body.messages || !Array.isArray(body.messages)) {
        return jsonResponse({ error: 'Invalid request format' }, 400)
      }

      // 限制请求大小（防止滥用）
      const bodyStr = JSON.stringify(body)
      if (bodyStr.length > 100000) { // 100KB
        return jsonResponse({ error: 'Request too large' }, 413)
      }

      // 调用 DeepSeek API
      const deepseekResponse = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: body.model || 'deepseek-chat',
          messages: body.messages,
          temperature: body.temperature || 0.7,
          max_tokens: body.max_tokens || 2000,
          stream: body.stream || false
        })
      })

      // 处理流式响应
      if (body.stream) {
        return new Response(deepseekResponse.body, {
          headers: {
            ...getCORSHeaders(),
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
          }
        })
      }

      // 处理普通响应
      const result = await deepseekResponse.json()
      return jsonResponse(result, deepseekResponse.status)

    } catch (error) {
      console.error('Proxy error:', error)
      return jsonResponse({
        error: 'Internal server error',
        message: error.message
      }, 500)
    }
  }
}

// CORS 响应头
function getCORSHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

// 处理 CORS 预检
function handleCORS() {
  return new Response(null, {
    status: 204,
    headers: getCORSHeaders()
  })
}

// JSON 响应辅助函数
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...getCORSHeaders(),
      'Content-Type': 'application/json'
    }
  })
}
