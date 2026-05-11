#!/bin/bash
# 注意：此脚本在全新服务器上执行即可，或者在 WAGAN 目录下也可以。

echo "==========================================="
echo "   🚀 WAGAN 网关 - 阿里云一键部署脚本"
echo "==========================================="

echo "➡️ [1/6] 更新系统包..."
sudo apt-get update -y

echo "➡️ [2/6] 安装 Node.js 及必要工具..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git

echo "➡️ [3/6] 安装进程守护工具 PM2..."
sudo npm install -g pm2 --registry=https://registry.npmmirror.com

echo "➡️ [4/6] 克隆代码与依赖安装..."
# 检测是否已经在仓库目录内
if [ ! -d ".git" ]; then
    git clone https://gitee.com/jepow/WAGAN.git
    cd WAGAN
fi

echo ">> 安装依赖 (使用淘宝镜像加速)..."
npm install --registry=https://registry.npmmirror.com

echo "➡️ [5/6] 编译前端产物..."
npm run build

echo "➡️ [6/6] 启动 PM2 守护进程..."
# 使用 pm2 启动并设置环境变量 PROXY_SECRET_KEY
PROXY_SECRET_KEY=liangshan PORT=3000 pm2 start "npm run start" --name wagan

# 写入自启脚本
pm2 save
pm2 startup

echo "==========================================="
echo "✅ 部署完成！"
echo "🌐 网关默认运行端口: 3000"
echo "🔐 您的鉴权密钥: liangshan"
echo "⚠️ 请确保阿里云安全组已经放行 3000 端口！"
echo "==========================================="
