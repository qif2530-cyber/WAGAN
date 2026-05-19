FROM node:20-alpine AS builder

# 1. 设定工作目录
WORKDIR /app

# 2. 安装依赖 (使用 ci 或者 install 视情况而定)
COPY package*.json ./
RUN npm ci || npm install

# 3. 传入所有源码
COPY . .

# 4. 构建前端 (Vite) 和 后端 (esbuild -> server.cjs)
RUN npm run build

# 第 2 阶段：精简运行环境
FROM node:20-alpine AS runner
WORKDIR /app

# 从 builder 拷贝产物
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
# 如果后端独立 bundle 完全外部化依赖了，运行时也需要基础的 node_modules；由于我们 bundle 时用了 --packages=external，需要依赖
COPY --from=builder /app/node_modules ./node_modules

# 设置正式环境变量（可被覆盖）
ENV NODE_ENV=production
ENV PORT=3000

# 暴露端口
EXPOSE 3000

# 启动服务
CMD ["node", "dist/server.cjs"]
