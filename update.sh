#!/bin/bash
set -e

echo "==================================="
echo "   🚀 WAGAN 一键更新/部署脚本 🚀   "
echo "==================================="

echo "1. 修复可能存在的权限问题..."
CURRENT_USER=$(whoami)
sudo chown -R $CURRENT_USER:$CURRENT_USER ./ || true
sudo rm -rf dist/ || true

echo "2. 拉取最新代码..."
git pull origin main

echo "3. 安装依赖 (使用淘宝镜像加速)..."
npm install --registry=https://registry.npmmirror.com

echo "4. 构建前端产物..."
npm run build

echo "5. 重启后台服务..."
# 检查 wagan 是否在 pm2 中运行
if pm2 show wagan > /dev/null 2>&1; then
    echo "PM2 进程已存在，重启并重载配置..."
    pm2 restart wagan
else
    echo "正在将服务载入 PM2 进行守护..."
    pm2 start npm --name "wagan" -- run start
    pm2 save
fi

echo "==================================="
echo " ✅ 更新完成！新版本已上线，原有数据未受影响。"
echo "==================================="
