# DeepSeek API 代理部署指南

## 概述

使用 Cloudflare Workers 作为 API 代理，让用户无需配置自己的 API Key。

## 优势

- ✅ **安全**：API Key 保存在服务器端，不会泄露
- ✅ **免费**：Cloudflare Workers 免费额度足够使用
- ✅ **快速**：全球 CDN 加速
- ✅ **简单**：用户无需任何配置

## 部署步骤

### 1. 安装 Wrangler CLI

```bash
npm install -g wrangler
```

### 2. 登录 Cloudflare

```bash
wrangler login
```

### 3. 设置 API Key（环境变量）

```bash
cd yourwriting.github.io
wrangler secret put DEEPSEEK_API_KEY
# 输入您的 DeepSeek API Key: sk-2302587a10e6420cb091ca73e56b57ca
```

### 4. 部署 Worker

```bash
wrangler deploy
```

部署成功后，您会获得一个 URL，例如：
```
https://deepseek-proxy.your-subdomain.workers.dev
```

### 5. 更新前端配置

在 `src/utils/deepseekAPI.js` 中，将 API 地址改为您的 Worker URL：

```javascript
const API_BASE_URL = 'https://deepseek-proxy.your-subdomain.workers.dev'
```

## 自定义域名（可选）

如果您有自己的域名，可以配置自定义域名：

1. 在 Cloudflare Dashboard 中添加 Worker Route
2. 设置路由：`api.yourdomain.com/*` → `deepseek-proxy`
3. 更新前端 API_BASE_URL

## 安全建议

### 1. 添加速率限制

```javascript
// 在 worker 中添加
const RATE_LIMIT = 100 // 每小时 100 次请求
```

### 2. 添加请求签名验证

```javascript
// 验证请求来源
const allowedOrigins = [
  'https://atinyhouse.github.io',
  'http://localhost:5173' // 开发环境
]
```

### 3. 添加日志和监控

在 Cloudflare Dashboard 中查看：
- 请求量统计
- 错误日志
- 性能指标

## 成本估算

Cloudflare Workers 免费额度：
- 100,000 请求/天
- 10ms CPU 时间/请求

对于个人博客工具，完全够用！

## 故障排除

### Worker 部署失败
```bash
# 查看详细日志
wrangler tail
```

### API 调用失败
1. 检查 DEEPSEEK_API_KEY 是否正确设置
2. 检查 Cloudflare Dashboard 中的错误日志
3. 测试 API Key 是否有效：
   ```bash
   curl https://api.deepseek.com/v1/models \
     -H "Authorization: Bearer YOUR_API_KEY"
   ```

## 监控和维护

### 查看实时日志
```bash
wrangler tail
```

### 查看使用量
访问 Cloudflare Dashboard：
https://dash.cloudflare.com → Workers & Pages → deepseek-proxy → Metrics

## 下一步

部署完成后，记得：
1. ✅ 更新前端 API 地址
2. ✅ 测试功能是否正常
3. ✅ 删除前端的默认 API Key
4. ✅ 更新设置页面提示信息
