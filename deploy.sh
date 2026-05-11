#!/bin/bash
set -e

# Universal AI Gateway - 自动化部署脚本
echo "🚀 开始自动化部署程序..."

# 1. 强制同步远程代码 (注意：如果你在服务器上手动修改了此脚本，会被覆盖)
# 如果你想保留本地修改，请注释掉下面两行
echo "📥 正在从远程同步代码..."
git fetch --all
git reset --hard origin/main

# 2. 安装并构建
echo "📦 正在安装依赖并构建前端..."
npm install
npm run build

# 3. 清理环境
echo "🧹 清理旧进程与端口占用..."
pm2 delete ai-gateway 2>/dev/null || true
fuser -k 3000/tcp 2>/dev/null || true

# 4. 启动服务 (PM2)
echo "🔄 启动 PM2 后端服务..."

# 先检查是否有旧进程并彻底杀掉
pm2 stop ai-gateway 2>/dev/null || true
pm2 delete ai-gateway 2>/dev/null || true
fuser -k 3000/tcp 2>/dev/null || true

# 使用 tsx 直接启动，并显式指定环境变量
# 这样 PM2 可以更好地监控进程，而不是监控 npx 包装器
NODE_ENV=production pm2 start ./node_modules/.bin/tsx --name ai-gateway -- server.ts

# 5. 验证与诊断
echo "⏳ 等待 5 秒检测启动状态..."
sleep 5

echo "🔍 正在检查 3000 端口监听状态..."
if netstat -tpln | grep :3000; then
    echo "✅ 3000 端口已正常监听！"
else
    echo "❌ 警告：3000 端口未见监听。可能启动失败了。"
fi

echo "📂 检查构建产物..."
if [ -f "dist/index.html" ]; then
    echo "✅ dist/index.html 已就绪。"
else
    echo "❌ 错误：dist 目录不存在或为空，前端访问将 404。"
fi

echo "📋 PM2 实时日志快照 (最后 20 行)："
pm2 logs ai-gateway --lines 20 --no-colors --inline

echo "📊 当前 PM2 状态："
pm2 status ai-gateway

echo "✅ 部署指令执行完成！"
echo "🌐 服务地址: http://localhost:3000"
echo "💡 如果远程无法访问，请检查阿里云『安全组』是否放行 3000 端口。"
