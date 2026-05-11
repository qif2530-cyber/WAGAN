#!/bin/bash
set -e

# Universal AI Gateway - 阿里云从零一键部署脚本 (Ubuntu/Debian适用)
echo "🚀 开始从零初始化阿里云服务器及部署 AI-Gateway..."

# 1. 更新系统包 & 安装必要的系统依赖
echo "🔄 1/5 更新系统包并安装基础工具 (git, curl, net-tools, psmisc)..."
apt-get update -y
apt-get install -y curl git net-tools psmisc

# 2. 安装 Node.js (推荐 20.x 或 22.x 版本)
echo "🟢 2/5 安装 Node.js 环境..."
if ! command -v node > /dev/null; then
    echo "未检测到 Node.js，正在通过 NodeSource 安装 Node.js 22.x..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y nodejs
else
    echo "✔️ 已经安装过 Node.js: $(node -v)"
fi

# 3. 安装全局管理工具 PM2 和 tsx
echo "🛠️ 3/5 安装 PM2 进程管理器..."
if ! command -v pm2 > /dev/null; then
    npm install -g pm2
else
    echo "✔️ 已经安装过 PM2"
fi

# 4. 项目依赖安装与构建
echo "📦 4/5 安装项目专属依赖并打包前端..."
# 如果是从 0 开始，请确认当前处于项目目录中 (包含 package.json)
if [ ! -f "package.json" ]; then
    echo "❌ 找不到 package.json！请确保你在代码仓库的根目录下运行此脚本。"
    exit 1
fi

npm install
npm run build

# 5. 启动服务与设置自启
echo "⚙️ 5/5 配置 PM2 并启动服务..."
# 清理可能存在的旧实例
pm2 delete ai-gateway 2>/dev/null || true
fuser -k 3000/tcp 2>/dev/null || true

# 重新启动应用
NODE_ENV=production pm2 start npm --name ai-gateway -- run start

# 保存 PM2 状态以使其随系统重启而恢复进程
pm2 save
# 设置开机自启（仅在新装的情况下，PM2 会配置好开机自启服务）
pm2 startup | grep "sudo env" | bash 2>/dev/null || true

echo "✅ ================================================"
echo "✅ 恭喜！服务器初始化及服务部署已成功完成！"
echo "🌐 服务监听在 http://localhost:3000"
echo "💡 请记得在【阿里云控制台 -> 安全组规则】中放行端口：3000 和 80!"
echo "🔄 未来更新代码，只需要在项目目录下执行：bash deploy.sh"
echo "✅ ================================================"
