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

# 4. 重启 PM2 进程
echo "🔄 正在重启后端服务 (PM2)..."
# 强制停止并删除旧进程
pm2 delete ai-gateway 2>/dev/null || true
# 使用 npm run dev 启动，这样会自动使用项目本地的 tsx 且路径处理更稳健
NODE_ENV=production pm2 start npm --name ai-gateway -- run dev

echo "✅ 部署完成！"
echo "🌐 服务已在 http://localhost:3000 上线 (具体请查看 Nginx 反向代理配置)"
