# macOS安装Node.js和npm

## 方法1: 使用Homebrew安装（推荐）

### 步骤1: 安装Homebrew（如果还没有）

打开终端，运行：

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 步骤2: 安装Node.js

```bash
brew install node
```

### 步骤3: 验证安装

```bash
node -v
npm -v
```

应该显示版本号，例如：
- node: v18.x.x
- npm: 9.x.x

## 方法2: 使用Node.js官方安装包

### 步骤1: 访问官网

打开浏览器访问：https://nodejs.org/

### 步骤2: 下载安装包

- 下载 **LTS版本**（推荐）
- 点击 "Install" 按钮下载
- 打开下载的安装包

### 步骤3: 安装

1. 双击下载的安装包
2. 点击 "继续"
3. 点击 "同意"
4. 点击 "安装"
5. 输入Mac密码
6. 等待安装完成
7. 点击 "关闭"

### 步骤4: 验证安装

打开终端，运行：

```bash
node -v
npm -v
```

## 方法3: 使用NVM安装（高级）

如果你需要管理多个Node.js版本：

```bash
# 安装NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 重新加载配置
source ~/.zshrc

# 安装Node.js
nvm install --lts

# 使用LTS版本
nvm use --lts
```

## 安装完成后

回到rental-system目录，运行：

```bash
cd ~/Documents/rental-management-system

# 安装依赖
npm install

# 启动服务器
npm start

# 访问系统
# http://localhost:3000
```

## 常见问题

### 问题1: Homebrew安装失败

确保：
1. 已安装Xcode Command Line Tools
2. 有足够的磁盘空间
3. 网络连接正常

### 问题2: npm install很慢

使用国内镜像：

```bash
npm config set registry https://registry.npmmirror.com
```

### 问题3: 权限问题

如果遇到权限问题，运行：

```bash
sudo chown -R $USER /usr/local/lib/node_modules
```

## 检查安装是否成功

运行以下命令检查：

```bash
# 检查Node.js
node -v
# 应该显示: v18.x.x 或更高

# 检查npm
npm -v
# 应该显示: 9.x.x 或更高

# 检查npm全局目录
npm config get prefix
```

---

**推荐使用方法1（Homebrew）或方法2（官方安装包），最简单！**
