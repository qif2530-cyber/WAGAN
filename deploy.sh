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
# 针对 TypeScript + ESM 最稳妥的 PM2 启动方式
NODE_ENV=production pm2 start "npx tsx server.ts" --name ai-gateway

# 5. 验证状态
echo "⏳ 等待启动..."
sleep 3
pm2 status ai-gateway

echo "📋 日志快照："
pm2 logs ai-gateway --lines 15 --no-colors --inline

echo "✅ 部署指令执行完成！"
echo "🌐 服务地址: http://localhost:3000"
