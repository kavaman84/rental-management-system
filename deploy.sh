#!/bin/bash

# 出租屋租赁管理系统 - 群晖快速部署脚本

set -e

echo "================================"
echo "出租屋租赁管理系统 - 部署脚本"
echo "================================"
echo ""

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "错误: 未检测到Docker，请先安装Docker"
    echo "请在Container Manager中安装Docker"
    exit 1
fi

# 检查Docker Compose是否安装
if ! command -v docker-compose &> /dev/null; then
    echo "错误: 未检测到Docker Compose"
    echo "请在Container Manager中安装Docker Compose"
    exit 1
fi

# 创建数据目录
echo "创建数据目录..."
mkdir -p data

# 构建并启动容器
echo ""
echo "正在构建Docker镜像..."
docker-compose build

echo ""
echo "正在启动容器..."
docker-compose up -d

echo ""
echo "================================"
echo "部署完成！"
echo "================================"
echo ""
echo "访问地址: http://192.168.1.5:4000"
echo "管理员账号: admin"
echo "管理员密码: admin123"
echo ""
echo "常用命令:"
echo "  查看日志: docker-compose logs -f"
echo "  停止服务: docker-compose down"
echo "  重启服务: docker-compose restart"
echo "  查看状态: docker-compose ps"
echo "================================"
