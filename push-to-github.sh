#!/bin/bash

# AI 文风助手 - 推送到 GitHub 脚本
#
# 使用说明：
# 1. 在 GitHub 创建个人访问令牌（Personal Access Token）
#    访问：https://github.com/settings/tokens
#    点击 "Generate new token (classic)"
#    勾选 "repo" 权限
#    生成并复制令牌
#
# 2. 运行此脚本：
#    chmod +x push-to-github.sh
#    ./push-to-github.sh
#
# 3. 输入你的 GitHub 用户名和令牌

echo "🚀 准备推送到 GitHub..."
echo ""
echo "请输入你的 GitHub 用户名:"
read username

echo ""
echo "请输入你的 Personal Access Token:"
echo "(令牌不会显示，输入后按回车)"
read -s token

echo ""
echo "正在推送..."

git push https://${username}:${token}@github.com/atinyhouse/yourwriting.github.io.git main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 推送成功！"
    echo "🌐 你的网站将在几分钟后可用："
    echo "   https://atinyhouse.github.io/yourwriting/"
    echo ""
    echo "📝 下一步："
    echo "   1. 访问 https://github.com/atinyhouse/yourwriting.github.io/settings/pages"
    echo "   2. 确认 Source 设置为 'GitHub Actions'"
    echo "   3. 等待 Actions 完成部署"
else
    echo ""
    echo "❌ 推送失败，请检查："
    echo "   - 用户名和令牌是否正确"
    echo "   - 是否有仓库的写权限"
    echo "   - 网络连接是否正常"
fi
