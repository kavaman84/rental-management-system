#!/bin/bash

# 出租屋租赁管理系统 - 一键部署脚本（群晖专用）

set -e

echo "================================"
echo "出租屋租赁管理系统 - 一键部署"
echo "================================"
echo ""

# 检查Docker
if ! command -v docker &> /dev/null; then
    echo "❌ 错误: 未检测到Docker"
    echo "请在Container Manager中安装Docker"
    exit 1
fi

# 检查Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ 错误: 未检测到Docker Compose"
    echo "请在Container Manager中安装Docker Compose"
    exit 1
fi

# 创建数据目录
echo "📁 创建数据目录..."
mkdir -p data

# 构建镜像
echo ""
echo "🔨 构建Docker镜像..."
docker-compose build

# 启动容器
echo ""
echo "🚀 启动容器..."
docker-compose up -d

# 等待容器启动
sleep 3

# 检查容器状态
echo ""
echo "✅ 部署完成！"
echo ""
echo "================================"
echo "系统信息"
echo "================================"
echo "访问地址: http://192.168.1.5:4000"
echo "管理员账号: admin"
echo "管理员密码: admin123"
echo ""
echo "常用命令:"
echo "  查看状态: docker-compose ps"
echo "  查看日志: docker-compose logs -f"
echo "  重启服务: docker-compose restart"
echo "  停止服务: docker-compose down"
echo "================================"
echo ""
echo "💡 提示:"
echo "- 数据会自动保存到 data/ 目录"
echo "- 修改端口请编辑 docker-compose.yml"
echo "- 查看详细文档: 群晖部署指南.md"
echo "================================"
