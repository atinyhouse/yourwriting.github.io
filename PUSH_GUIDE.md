# 推送到 GitHub 指南

项目已经初始化并创建了首次提交，现在需要推送到 GitHub。

## 📍 当前状态

- ✅ Git 仓库已初始化
- ✅ 文件已提交到本地
- ✅ 远程仓库已配置：`https://github.com/atinyhouse/yourwriting.github.io.git`
- ⏳ 等待推送到远程

## 🚀 推送方法

### 方法一：使用推送脚本（最简单）

1. **获取 GitHub Personal Access Token**
   - 访问：https://github.com/settings/tokens
   - 点击 "Generate new token (classic)"
   - 勾选 `repo` 权限
   - 点击生成并复制令牌（只会显示一次！）

2. **运行推送脚本**
   ```bash
   cd /Users/didi/Desktop/writing-style-ai
   ./push-to-github.sh
   ```

3. **输入信息**
   - 输入 GitHub 用户名：`atinyhouse`
   - 输入刚才复制的 Personal Access Token

### 方法二：使用 SSH（如果已配置）

如果你已经配置了 SSH 密钥：

```bash
cd /Users/didi/Desktop/writing-style-ai

# 修改远程仓库为 SSH
git remote set-url origin git@github.com:atinyhouse/yourwriting.github.io.git

# 推送
git push -u origin main
```

### 方法三：手动输入凭据

```bash
cd /Users/didi/Desktop/writing-style-ai
git push -u origin main
```

然后按提示输入用户名和密码（密码使用 Personal Access Token）

### 方法四：使用 GitHub Desktop

1. 下载 GitHub Desktop：https://desktop.github.com/
2. 打开 GitHub Desktop
3. File → Add Local Repository
4. 选择项目文件夹：`/Users/didi/Desktop/writing-style-ai`
5. 点击 "Publish repository"

## 📝 推送后的操作

推送成功后：

1. **启用 GitHub Pages**
   - 访问：https://github.com/atinyhouse/yourwriting.github.io/settings/pages
   - Source 选择 "GitHub Actions"
   - 保存设置

2. **查看部署状态**
   - 访问：https://github.com/atinyhouse/yourwriting.github.io/actions
   - 等待 "Deploy to GitHub Pages" 工作流完成
   - 通常需要 2-3 分钟

3. **访问你的网站**
   - 网址：https://atinyhouse.github.io/yourwriting/
   - 或：https://yourwriting.github.io/（如果这是主 Pages 仓库）

## 🔧 常见问题

### 1. 推送失败：Authentication failed

**原因**：密码认证已被 GitHub 禁用

**解决**：必须使用 Personal Access Token 替代密码

### 2. 推送失败：Permission denied

**原因**：没有仓库写权限

**解决**：
- 确认你是仓库所有者
- 或联系仓库所有者添加你为协作者

### 3. SSL 错误

**解决**：
```bash
git config --global http.sslVerify true
```

### 4. 网络问题

如果在国内网络环境下推送缓慢：

```bash
# 使用 GitHub 镜像（如果有）
git remote set-url origin https://hub.fastgit.xyz/atinyhouse/yourwriting.github.io.git
git push -u origin main
```

## 🎉 成功标志

推送成功后，你应该能看到：

```
Enumerating objects: 25, done.
Counting objects: 100% (25/25), done.
Delta compression using up to 8 threads
Compressing objects: 100% (23/23), done.
Writing objects: 100% (25/25), 3.98 KiB | 2.03 MiB/s, done.
Total 25 (delta 0), reused 0 (delta 0), pack-reused 0
To https://github.com/atinyhouse/yourwriting.github.io.git
 * [new branch]      main -> main
Branch 'main' set up to track remote branch 'main' from 'origin'.
```

## 📞 需要帮助？

如果遇到其他问题，可以：
1. 查看 GitHub 文档：https://docs.github.com/cn/authentication
2. 检查 Actions 日志找出部署错误
3. 在项目 Issues 中提问

---

**准备好了吗？运行 `./push-to-github.sh` 开始推送！**
