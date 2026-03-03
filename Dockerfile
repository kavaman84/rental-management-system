# 构建阶段
FROM node:18-alpine AS builder

WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制应用代码
COPY . .

# 构建前端静态文件
RUN npm run build

# 运行阶段
FROM node:18-alpine

WORKDIR /app

# 安装sqlite3
RUN apk add --no-cache sqlite

# 从构建阶段复制依赖
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/server-sqlite.js ./

# 暴露端口
EXPOSE 4000

# 启动应用
CMD ["node", "server-sqlite.js"]
