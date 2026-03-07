#!/bin/bash

# 删除数据库文件并重启服务器

echo "正在停止服务器..."
pkill -f "node server-macos.js"
sleep 2

echo "正在删除旧的数据库文件..."
rm -f rental_system.db
echo "数据库文件已删除"

echo "正在启动服务器..."
node server-macos.js > server-test.log 2>&1 &

echo "服务器已启动"
echo "查看日志: tail -f server-test.log"
