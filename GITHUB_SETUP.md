# GitHub CLI 设置指南

## ✅ GitHub CLI已安装！

版本: gh 2.45.0 (2025-07-18 Ubuntu)

## 📝 下一步：登录GitHub

### 方法1: 浏览器登录（推荐）

```bash
gh auth login
```

然后按照提示操作：
1. 选择 **GitHub.com**
2. 选择 **HTTPS**
3. 选择 **Login with a web browser** (推荐)
4. 复制显示的代码并粘贴到浏览器

### 方法2: 使用设备代码

```bash
gh auth login
```

按照提示操作：
1. 选择 **GitHub.com**
2. 选择 **HTTPS**
3. 选择 **Paste an authentication code** (如果浏览器无法打开)
4. 复制显示的代码并粘贴到终端

## 📝 创建GitHub仓库

登录成功后，运行：

```bash
gh repo create rental-management-system --public --source=. --remote=origin
```

这将：
- 创建名为 `rental-management-system` 的仓库
- 设置为Public（公开）
- 添加远程仓库为 `origin`
- 自动推送代码

## 📝 推送代码

如果自动推送失败，手动推送：

```bash
git push -u origin master
```

## ✅ 完成！

访问 https://github.com/kavaman/rental-management-system 查看你的仓库

## 🚀 在macOS上使用

```bash
# 克隆仓库
cd ~/Documents
git clone https://github.com/kavaman/rental-management-system.git
cd rental-management-system

# 安装依赖
npm install

# 启动服务器
npm start

# 访问 http://localhost:3000
```
