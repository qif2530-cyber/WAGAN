#!/bin/bash
set -e

echo "==================================="
echo "   🚀 WAGAN 一键更新/Docker部署脚本 🚀   "
echo "==================================="

# 确保进入到脚本所在的目录（即项目根目录）
cd "$(dirname "$0")"

echo "1. 正在拉取最新代码..."
git reset --hard
git pull

echo "2. 检查旧版 docker-compose 兼容性并重新构建..."
# 针对部分老版本 docker-compose 报 KeyError: 'ContainerConfig' 的情况
# 优先使用新版 `docker compose`，如果不存在则使用 `docker-compose` 并且关闭 BuildKit
if docker compose version > /dev/null 2>&1; then
    echo "检测到新版 Docker Compose V2，开始构建并重启服务..."
    sudo docker compose down
    sudo docker compose up -d --build
else
    echo "使用老版 docker-compose，为了避免内核兼容问题，关闭 DOCKER_BUILDKIT 进行构建..."
    sudo docker-compose down
    sudo DOCKER_BUILDKIT=0 docker-compose up -d --build
fi

echo "==================================="
echo " ✅ 更新并部署完成！后台服务已重启。"
echo " 如果还有问题，可以通过 \`sudo docker logs -f wagan_gateway_1\` 查看日志。"
echo "==================================="
