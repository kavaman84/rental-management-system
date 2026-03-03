#!/bin/bash

# 出租屋租赁管理系统 - 停止脚本

echo "================================"
echo "出租屋租赁管理系统 - 停止脚本"
echo "================================"
echo ""

# 检查容器是否存在
if ! docker ps -a --format '{{.Names}}' | grep -q "^rental-system$"; then
    echo "容器不存在"
    exit 0
fi

# 停止并删除容器
echo "正在停止容器..."
docker-compose down

echo ""
echo "================================"
echo "服务已停止"
echo "================================"
