#!/bin/bash
# 进入项目目录
cd "$(dirname "$0")" || exit 1

echo "🔄 [1/4] 拉取最新代码..."
git fetch --all
git reset --hard origin/main

echo "📦 [2/4] 安装依赖..."
npm install

echo "🔨 [3/4] 重新打包前端..."
npm run build

echo "🚀 [4/4] 重启服务..."
pm2 restart wagan

echo "✅ 更新完成！"
