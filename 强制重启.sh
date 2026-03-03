#!/bin/bash

echo "================================"
echo "强制停止并重启服务器"
echo "================================"
echo ""

cd ~/Documents/rental-management-system

# 1. 强制停止所有node进程
echo "步骤1: 停止所有node进程..."
pkill -9 node
sleep 2
echo "✓ 已停止所有node进程"
echo ""

# 2. 验证进程是否已停止
echo "步骤2: 验证进程是否已停止..."
if pgrep -f "node server-macos.js" > /dev/null; then
    echo "⚠ 仍有进程在运行，尝试再次停止..."
    pkill -9 -f "node server-macos.js"
    sleep 2
fi
echo "✓ 所有进程已停止"
echo ""

# 3. 重新安装依赖
echo "步骤3: 重新安装依赖..."
npm install
echo "✓ 依赖已安装"
echo ""

# 4. 启动新服务器
echo "步骤4: 启动新服务器..."
echo "================================"
echo "访问地址: http://localhost:3000"
echo "管理员账号: admin / admin123"
echo "================================"
echo ""

npm start
