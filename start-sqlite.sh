#!/bin/bash

echo "================================"
echo "出租屋租赁管理系统 - SQLite版本"
echo "================================"

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "错误: 未检测到Node.js，请先安装Node.js"
    exit 1
fi

# 检查依赖是否安装
if [ ! -d "node_modules" ]; then
    echo "正在安装依赖..."
    npm install
fi

# 启动服务器
echo "================================"
echo "服务器启动中..."
echo "访问地址: http://localhost:3000"
echo "管理员账号: admin / admin123"
echo "数据库: rental_system.db (SQLite文件)"
echo "================================"
echo ""

npm start
