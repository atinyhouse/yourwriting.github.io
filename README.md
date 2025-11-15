# AI 文风助手

一个基于个人文风库的智能写作工具，帮助你使用 AI 创作时保持独特的写作风格。

## 特性

- ✨ **个性化文风库** - 上传你的文章，构建独特的写作风格数据库
- 🤖 **AI 智能对话** - 接入 DeepSeek 开源模型，免费使用
- 🎨 **文风润色** - 自动将 AI 生成内容转换为你的风格
- 🎯 **包豪斯设计** - 简约、功能优先的用户界面
- 💾 **本地存储** - 所有数据保存在本地浏览器，隐私安全
- 🚀 **GitHub Pages** - 零成本部署和托管

## 在线体验

访问 [https://atinyhouse.github.io/yourwriting.github.io/](https://atinyhouse.github.io/yourwriting.github.io/) 直接使用

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/atinyhouse/yourwriting.github.io.git
cd yourwriting.github.io
```

### 2. 安装依赖

```bash
npm install
```

### 3. 开发模式

```bash
npm run dev
```

访问 `http://localhost:5173` 查看应用

### 4. 构建生产版本

```bash
npm run build
```

### 5. 部署到 GitHub Pages

1. 在 GitHub 创建仓库
2. 推送代码到 main 分支
3. 在仓库设置中启用 GitHub Pages（Source: GitHub Actions）
4. 等待 Actions 自动部署完成

## 使用指南

### 第一步：配置 API Key

1. 访问 [DeepSeek Platform](https://platform.deepseek.com) 注册并获取 API Key
2. 进入"设置"页面，输入你的 API Key
3. API Key 仅保存在浏览器本地，不会上传到任何服务器

### 第二步：构建文风库

1. 进入"文风库"页面
2. 三种添加方式：
   - **上传文件**：支持 .txt, .md 格式
   - **从链接导入**：粘贴文章 URL，自动提取内容（✨ 支持微信公众号文章！）
   - **直接粘贴**：复制文章内容直接添加
3. 系统会自动清洗内容（移除公众号系统文字等噪音）
4. 自动分析你的写作风格

**导入公众号文章：**
- 复制任意公众号文章链接（例如：https://mp.weixin.qq.com/s/xxxxx）
- 粘贴到"从链接导入"输入框
- 点击"自动提取并导入"
- 系统会自动提取文章标题和正文内容

### 第三步：开始对话

1. 进入"对话"页面
2. 输入你的写作需求
3. AI 会根据你的文风库生成符合你风格的内容

## 技术栈

- **前端框架**: Vue.js 3 (Composition API)
- **构建工具**: Vite
- **样式**: Tailwind CSS v4 + 自定义包豪斯风格
- **路由**: Vue Router
- **存储**: LocalForage (IndexedDB)
- **Markdown**: Marked.js
- **AI 模型**: DeepSeek Chat API

## 项目结构

```
writing-style-ai/
├── public/              # 静态资源
├── src/
│   ├── assets/          # 资源文件
│   ├── components/      # Vue 组件
│   │   └── NavigationBar.vue
│   ├── views/           # 页面组件
│   │   ├── ChatView.vue
│   │   ├── StyleLibraryView.vue
│   │   └── SettingsView.vue
│   ├── utils/           # 工具函数
│   │   ├── storage.js          # 数据存储
│   │   ├── styleAnalysis.js    # 文风分析
│   │   └── deepseekAPI.js      # API 集成
│   ├── router/          # 路由配置
│   │   └── index.js
│   ├── App.vue          # 根组件
│   ├── main.js          # 入口文件
│   └── style.css        # 全局样式
├── .github/
│   └── workflows/
│       └── deploy.yml   # GitHub Actions 配置
├── index.html
├── package.json
└── vite.config.js
```

## 配置说明

### Vite 配置

如果你要部署到 GitHub Pages 的子路径（如 `https://username.github.io/writing-style-ai/`），需要在 `vite.config.js` 中设置 `base`:

```js
export default defineConfig({
  base: '/writing-style-ai/',
  // ...
})
```

### 环境变量

项目不需要环境变量，所有配置通过 UI 完成。

## 数据管理

### 导出数据

在"设置"页面可以导出所有数据为 JSON 文件（不包含 API Key）。

### 导入数据

在"设置"页面可以导入之前导出的 JSON 文件。

### 清除数据

在"设置"页面可以清除所有本地数据。

## 开发计划

### Phase 1: MVP ✅

- [x] 基础 UI 框架（包豪斯风格）
- [x] 文档上传功能（TXT, MD）
- [x] 简单的文风分析（关键词提取）
- [x] DeepSeek API 集成
- [x] 基础对话功能
- [x] LocalStorage 数据存储
- [x] GitHub Pages 部署

### Phase 2: 增强功能

- [ ] 支持更多文档格式（DOCX, PDF）
- [ ] 网站链接导入（手动粘贴）
- [ ] 改进文风分析算法
- [ ] 对话历史管理优化
- [ ] 响应式设计优化

### Phase 3: 高级功能

- [ ] 公众号/即刻/小红书内容抓取（RSSHub 集成）
- [ ] 文风库多版本管理
- [ ] AI 模型参数调优界面
- [ ] 批量导入内容
- [ ] GitHub Gist 云端同步

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

## 致谢

- [DeepSeek](https://www.deepseek.com/) - 提供免费 AI 模型 API
- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
- [Vite](https://vitejs.dev/) - 下一代前端构建工具
- [Tailwind CSS](https://tailwindcss.com/) - 实用优先的 CSS 框架
