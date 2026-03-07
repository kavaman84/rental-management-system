# 解决Homebrew安装Node.js错误

## 错误信息
```
Error: An exception occurred within a child process:
  FormulaUnavailableError: No available formula with the name "formula.jws.json"
```

## 解决方案

### 方法1: 修复Homebrew（推荐）

```bash
# 1. 运行Homebrew诊断
brew doctor

# 2. 如果有错误，修复Homebrew
brew update
brew upgrade

# 3. 重新尝试安装Node.js
brew install node
```

### 方法2: 使用官方安装包（最简单）

如果Homebrew有问题，直接使用官方安装包：

1. **访问官网**: https://nodejs.org/
2. **下载LTS版本**
3. **双击安装包**
4. **完成安装**

### 方法3: 清理Homebrew缓存

```bash
# 清理Homebrew缓存
brew cleanup

# 刷新Homebrew
brew update

# 重新安装Node.js
brew install node
```

### 方法4: 使用NVM安装（备用方案）

```bash
# 安装NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 重新加载配置
source ~/.zshrc

# 安装Node.js LTS版本
nvm install --lts

# 使用LTS版本
nvm use --lts

# 验证安装
node -v
npm -v
```

## 推荐顺序

1. **先试方法1** - 修复Homebrew
2. **如果失败，用方法2** - 官方安装包（最可靠）
3. **如果都不行，用方法4** - NVM安装

## 验证安装

安装完成后，运行：

```bash
node -v
npm -v
```

应该显示版本号。

## 如果还是不行

1. 检查网络连接
2. 尝试使用VPN
3. 考虑使用官方安装包（方法2）
