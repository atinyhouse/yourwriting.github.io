# Cloudflare Workers CORS代理部署指南

## 为什么需要这个？

公共CORS代理服务不稳定，经常被墙或限流。自建Cloudflare Workers代理可以：
- ✅ 完全免费（每天100万次请求额度）
- ✅ 全球CDN加速
- ✅ 稳定可靠
- ✅ 支持缓存

## 部署步骤

### 1. 安装Wrangler CLI

```bash
npm install -g wrangler
```

### 2. 登录Cloudflare

```bash
wrangler login
```

### 3. 部署Worker

```bash
cd workers
wrangler deploy
```

部署成功后会得到一个URL，类似：
```
https://wechat-proxy.你的用户名.workers.dev
```

### 4. 更新前端代码

将URL配置到 `src/utils/urlExtractor.js`：

```javascript
const CORS_PROXIES = [
  {
    name: 'Self-hosted Worker',
    url: 'https://wechat-proxy.你的用户名.workers.dev/?url=',
    transform: (url) => 'https://wechat-proxy.你的用户名.workers.dev/?url=' + encodeURIComponent(url),
    parseResponse: (res) => res.text()
  }
]
```

## 使用方式

部署后，代理URL格式为：
```
https://wechat-proxy.你的用户名.workers.dev/?url=https://mp.weixin.qq.com/s/xxxxx
```

## 安全说明

Worker代码中已限制只能访问：
- mp.weixin.qq.com（微信公众号）
- *.github.io（GitHub Pages）
- medium.com
- substack.com
- notion.site

如需支持其他域名，修改 `allowedHosts` 数组。

## 本地测试

```bash
cd workers
wrangler dev
```

本地测试URL：
```
http://localhost:8787/?url=https://mp.weixin.qq.com/s/xxxxx
```
