#!/bin/bash

echo "================================"
echo "macOS Node.js 诊断工具"
echo "================================"
echo ""

echo "1. 检查 Node.js 版本："
echo "   command: node -v"
node -v
echo ""

echo "2. 检查 npm 版本："
echo "   command: npm -v"
npm -v
echo ""

echo "3. 检查 Node.js 安装路径："
which node
echo ""

echo "4. 检查 npm 安装路径："
which npm
echo ""

echo "5. 检查 Node.js 是否在 PATH 中："
echo $PATH | tr ':' '\n' | grep -i node
echo ""

echo "6. 检查 Homebrew 安装的 Node.js："
brew list node 2>/dev/null || echo "Homebrew 未安装 Node.js"
echo ""

echo "================================"
echo "诊断完成"
echo "================================"
