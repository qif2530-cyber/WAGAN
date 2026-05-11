#!/bin/bash

# ==============================================================================
# Universal AI Gateway - 一键部署/更新脚本 (One-Click Deployment Script)
# ==============================================================================

echo "🚀 开始执行自动化部署更新..."

# 1. 强制同步远程代码
echo "📥 正在强制从 Gitee 同步最新代码..."
git fetch --all
git reset --hard origin/main

# 2. 安装依赖 (使用 npm 或 pnpm)
echo "📦 正在安装依赖..."
npm install --production=false

# 3. 构建前端资源
echo "🏗️ 正在构建前端资源 (Vite Build)..."
rm -rf dist
npm run build
chmod +x ./node_modules/.bin/tsx

# 4. 重启 PM2 进程
echo "🔄 正在重启后端服务 (PM2)..."
# 强制停止并删除旧进程
pm2 delete ai-gateway 2>/dev/null || true

# 检查并释放 3000 端口 (额外保障)
fuser -k 3000/tcp 2>/dev/null || true

# 启动服务
# 直接使用项目本地的 tsx 以确保路径和环境一致
# 显式指定 interpreter 为 node，避免 sh 权限问题
NODE_ENV=production pm2 start ./node_modules/.bin/tsx --name ai-gateway -- server.ts

# 延迟 2 秒显示日志快照，方便诊断是否启动成功
sleep 2
echo "📋 最新启动日志快照："
pm2 logs ai-gateway --lines 20 --no-colors --inline

echo "✅ 部署完成！"
echo "🌐 服务已在 http://localhost:3000 上线"
echo "💡 如果网页没更新，请尝试【强制刷新浏览器缓存 (Ctrl+F5)】"
