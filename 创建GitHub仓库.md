# 创建GitHub仓库 - 详细步骤

由于当前环境限制，请按照以下步骤在GitHub网页上创建仓库：

## 📝 步骤1: 访问GitHub

打开浏览器访问: https://github.com/new

## 📝 步骤2: 填写仓库信息

填写以下信息：

### 基本信息
- **Repository name** (仓库名称): `rental-management-system`
- **Description** (描述): `出租屋租赁管理系统 - Rental Management System`
- **Public** (可见性): 选择Public（公开）

### 可选设置
- **勾选** "Add a README file" - 添加README
- **勾选** "Add .gitignore" - 添加.gitignore
- **选择** "Python" (或其他) 作为模板（可选）

## 📝 步骤3: 创建仓库

点击 **"Create repository"** 按钮

## 📝 步骤4: 复制仓库URL

创建成功后，你会看到：
- 仓库URL: `https://github.com/kavaman/rental-management-system.git`

复制这个URL

## 📝 步骤5: 添加远程仓库并推送

在终端中运行：

```bash
cd /config/.openclaw/workspace/rental-system

# 添加远程仓库（替换为你的实际URL）
git remote add origin https://github.com/kavaman/rental-management-system.git

# 推送代码
git push -u origin master
```

## ✅ 完成！

推送成功后，你可以在浏览器中访问：
```
https://github.com/kavaman/rental-management-system
```

## 🚀 在macOS上使用

推送后，在macOS上：

```bash
# 1. 克隆仓库
cd ~/Documents
git clone https://github.com/kavaman/rental-management-system.git
cd rental-management-system

# 2. 安装依赖
npm install

# 3. 启动服务器
npm start

# 4. 访问系统
# http://localhost:3000
# 用户名: admin
# 密码: admin123
```

## 📖 需要帮助？

如果遇到问题：
1. 检查GitHub仓库是否创建成功
2. 确认URL是否正确
3. 检查git push命令是否有权限
4. 查看git push的错误信息

---

**提示**: 如果仓库创建失败，请确保你的GitHub账户可以创建Public仓库。
