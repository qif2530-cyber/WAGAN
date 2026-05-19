#!/bin/bash
# ==============================================================================
# 🐳 阿里云/ECS 一键部署脚本 (基于 Docker Compose)
# 推荐使用这种方式，环境完全隔离！
# 请在使用前确保服务器已安装 Git 以及 Docker
# ==============================================================================

# 配置区域
# ==========================================
GIT_REPO_URL="" # TODO: 在这里填入你的 Gitee 仓库地址
BRANCH_NAME="main"
APP_DIR="/opt/unified-gateway-docker"
# ==========================================

echo "==========================================="
echo "🌟 开始一键 Docker 部署"
echo "==========================================="

if [ -z "$GIT_REPO_URL" ]; then
    echo "❌ 错误: 未配置 GIT_REPO_URL，请修改该脚本文件。"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，请先在阿里云服务器安装 Docker 和 Docker Compose。"
    exit 1
fi

if [ ! -d "$APP_DIR" ]; then
    echo "📂 $APP_DIR 不存在，克隆代码..."
    git clone $GIT_REPO_URL $APP_DIR
fi

cd $APP_DIR || exit 1

echo "⬇️ 覆盖并拉取最新代码..."
git fetch --all
git reset --hard origin/$BRANCH_NAME
git pull origin $BRANCH_NAME

if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo "⚠️  创建了 .env 文件，请随后自行完善"
        cp .env.example .env
    else
        touch .env #兜底创建一个空文件防止加载报错
    fi
fi

echo "📦 开始构建镜像并启动 Docker 容器..."
# 老版本可能叫 docker-compose，新版本为 docker compose
if docker compose version > /dev/null 2>&1; then
    docker compose up -d --build
else
    docker-compose up -d --build
fi

echo "==========================================="
echo "✅ Docker 部署指令下发完成！"
echo "可以使用 'docker ps' 查看运行状态。"
echo "可以使用 'docker logs -f ai-unified-gateway' 查看日志信息。"
echo "由于 docker-compose 映射了宿主机 80 端口到 3000，请确保阿里云安全组开放了 80 端口（如果是测试可以改回映射 3000）。"
echo "==========================================="
