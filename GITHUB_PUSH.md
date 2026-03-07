# GitHub推送指南

## ✅ 提交已创建！

Git仓库已初始化并创建提交，包含34个文件。

## 📝 下一步：推送到GitHub

### 方法1: 使用GitHub CLI（推荐）

如果你安装了GitHub CLI (`gh`)：

```bash
# 登录GitHub
gh auth login

# 创建仓库
gh repo create rental-management-system --public --source=. --remote=origin

# 推送代码
git push -u origin master
```

### 方法2: 通过网页创建

1. 访问 https://github.com/new
2. 仓库名称: `rental-management-system`
3. 描述: `出租屋租赁管理系统 - Rental Management System`
4. 选择Public
5. 点击"Create repository"

### 方法3: 使用Git命令手动推送

1. 先在GitHub网页创建仓库
2. 复制仓库URL（格式：`https://github.com/kavaman/rental-management-system.git`）
3. 添加远程仓库：
```bash
git remote add origin https://github.com/kavaman/rental-management-system.git
```
4. 推送代码：
```bash
git push -u origin master
```

## 🚀 推送后在macOS上运行

### 1. 克隆仓库

```bash
cd ~/Documents
git clone https://github.com/kavaman/rental-management-system.git
cd rental-management-system
```

### 2. 安装依赖

```bash
npm install
```

### 3. 启动服务器

```bash
npm start
```

### 4. 访问系统

打开浏览器访问：
```
http://localhost:3000
```

登录凭据:
- 用户名: admin
- 密码: admin123

## 📁 数据存储

数据会自动保存在：
```
~/Documents/rental-system/rental_system.db
```

## 📖 文档

- [README_CN.md](README_CN.md) - 中文说明
- [群晖部署指南.md](群晖部署指南.md) - 群晖部署
- [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md) - Docker文档

## 💡 常用命令

```bash
# 查看状态
git status

# 查看提交历史
git log

# 拉取最新代码
git pull origin master

# 添加新文件
git add .
git commit -m "描述"
git push
```

---

**提交ID**: a586245
**文件数量**: 34个文件
**代码行数**: 7213行
