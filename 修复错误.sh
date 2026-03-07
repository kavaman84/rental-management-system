#!/bin/bash

echo "================================"
echo "修复并重启服务器"
echo "================================"
echo ""

# 进入项目目录
cd ~/Documents/rental-management-system

# 停止旧的服务器（如果有）
echo "停止旧服务器..."
pkill -f "node server-macos.js" 2>/dev/null || echo "没有运行中的服务器"

# 重新安装依赖
echo ""
echo "重新安装依赖..."
npm install

# 启动新服务器
echo ""
echo "启动新服务器..."
echo "================================"
echo "访问地址: http://localhost:3000"
echo "管理员账号: admin / admin123"
echo "================================"
echo ""

npm start
