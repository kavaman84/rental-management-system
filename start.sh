#!/bin/bash

# 出租屋租赁管理系统 - 群晖启动脚本

echo "================================"
echo "出租屋租赁管理系统 - 启动脚本"
echo "================================"
echo ""

# 检查容器是否存在
if ! docker ps -a --format '{{.Names}}' | grep -q "^rental-system$"; then
    echo "容器不存在，请先运行部署脚本"
    echo "运行: ./deploy.sh"
    exit 1
fi

# 启动容器
echo "正在启动容器..."
docker-compose up -d

echo ""
echo "================================"
echo "服务已启动"
echo "================================"
echo ""
echo "访问地址: http://192.168.1.5:4000"
echo "管理员账号: admin"
echo "管理员密码: admin123"
echo ""
echo "查看日志: docker-compose logs -f"
echo "停止服务: docker-compose down"
echo "================================"
