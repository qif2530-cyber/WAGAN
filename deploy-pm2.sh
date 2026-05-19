#!/bin/bash
# ==============================================================================
# 🚀 阿里云/ECS 一键部署脚本 (基于 PM2)
# 请在使用前确保服务器已安装 Git、Node.js (>=18) 和 PM2
# ==============================================================================

# 配置区域
# ==========================================
GIT_REPO_URL="https://gitee.com/jepow/WAGAN.git" # TODO: 在这里填入你的 Gitee 仓库地址，例如：https://gitee.com/your-name/your-repo.git
BRANCH_NAME="main" # 分支名，如果在 Gitee 默认是 master 或者 main，请自行确认
APP_DIR="/opt/unified-gateway-app" # 应用存放和打包的目录
APP_NAME="ai-unified-gateway" # PM2 中的服务名字
# ==========================================

echo "==========================================="
echo "🌟 开始一键部署：$APP_NAME"
echo "==========================================="

if [ -z "$GIT_REPO_URL" ]; then
    echo "❌ 错误: 未配置 GIT_REPO_URL（Gitee地址），请修改脚本并填入您的地址!"
    exit 1
fi

# 1. 检查节点环境
if ! command -v npm &> /dev/null; then
    echo "❌ 你的服务器似乎没有安装 Node.js 和 npm。"
    echo "提示：请先安装 Node.js 18+ (推荐使用 nvm)。"
    exit 1
fi

# 2. 检查并安装 PM2
if ! command -v pm2 &> /dev/null; then
    echo "📦 正在全局安装 PM2 进程守护工具..."
    npm install -g pm2
fi

# 3. 拉取/更新代码
if [ ! -d "$APP_DIR" ]; then
    echo "📂 目标目录 $APP_DIR 不存在，首次克隆代码..."
    git clone $GIT_REPO_URL $APP_DIR
else
    echo "⬇️ 缓存目录已存在，拉取最新代码..."
fi

cd $APP_DIR || exit 1

# 放弃所有本地修改，强制拉取最新代码
git fetch --all
git reset --hard origin/$BRANCH_NAME
git pull origin $BRANCH_NAME

# 4. 处理环境变量
if [ ! -f ".env" ] && [ -f ".env.example" ]; then
    echo "⚠️ 首次部署：尝试从 .env.example 生成 .env 文件"
    echo "⚠️ 请部署后手动编辑 $APP_DIR/.env 填入你的各种密钥和 BaseUrl"
    cp .env.example .env
fi

# 5. 安装依赖及打包
echo "🔨 开始安装依赖..."
npm install

echo "📦 开始打包前端与后端服务..."
npm run build

# 6. PM2 守护启动并设为开机自启
echo "🚀 尝试启动或重启 PM2 进程..."

pm2 describe $APP_NAME > /dev/null
if [ $? -eq 0 ]; then
    # 已存在，平滑重启并更新环境变量
    pm2 reload $APP_NAME --update-env
else
    # 首次启动
    pm2 start dist/server.cjs --name $APP_NAME --env production
    # 设置 pm2 开机自启
    pm2 startup
    pm2 save
fi

echo "==========================================="
echo "✅ 部署已完成！$APP_NAME 正在后台稳步运行中。"
echo ""
echo "常用 PM2 命令提示："
echo "➡️ 查看日志：pm2 logs $APP_NAME"
echo "➡️ 监测面板：pm2 monit"
echo "➡️ 重启服务：pm2 restart $APP_NAME"
echo ""
echo "注意：默认监听 3000 端口，请确保在阿里云控制台 -> 实例 -> 安全组 中放行 3000 端口（或者 Nginx 反向代理端口）。"
echo "==========================================="
