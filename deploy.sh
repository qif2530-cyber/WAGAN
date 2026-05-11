#!/bin/bash

# ==============================================================================
# Universal AI Gateway - 一键部署/更新脚本 (One-Click Deployment Script)
# ==============================================================================

echo "🚀 开始执行自动化部署更新..."

# 1. 拉取最新代码
echo "📥 正在从 Gitee 拉取最新代码..."
git pull origin main

# 2. 安装依赖 (使用 npm 或 pnpm)
echo "📦 正在安装依赖..."
npm install --production=false

# 3. 构建前端资源
echo "🏗️ 正在构建前端资源 (Vite Build)..."
npm run build

# 4. 重启 PM2 进程
# 注意：假设你的 PM2 任务名为 'ai-gateway'
# 如果还没有启动过，请手动运行一次: pm2 start server.ts --name ai-gateway --interpreter npx -- tsx
echo "🔄 正在重启后端服务 (PM2)..."
pm2 restart ai-gateway || pm2 start server.ts --name ai-gateway --interpreter npx -- tsx

echo "✅ 部署完成！"
echo "🌐 服务已在 http://localhost:3000 上线 (具体请查看 Nginx 反向代理配置)"
