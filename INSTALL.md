# 安装指南

## 系统要求

- Node.js >= 14.x
- MySQL >= 5.7

## 安装步骤

### 1. 安装MySQL

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo mysql_secure_installation
```

**macOS (使用Homebrew):**
```bash
brew install mysql
brew services start mysql
```

**Windows:**
从 [MySQL官网](https://dev.mysql.com/downloads/mysql/) 下载安装包

### 2. 安装Node.js依赖

```bash
cd rental-system
npm install
```

### 3. 创建数据库

```bash
mysql -u root -p < schema.sql
```

输入MySQL密码后，数据库会自动创建，包括：
- rental_system 数据库
- rooms 表（房间信息）
- meter_readings 表（电表水表读数）
- receipts 表（月收据）
- admins 表（管理员账户）

默认管理员账户：
- 用户名: admin
- 密码: admin123

### 4. 配置数据库连接

编辑 `server.js` 文件，修改数据库连接信息：

```javascript
const db = mysql.createPool({
    host: 'localhost',      // MySQL主机地址
    user: 'root',           // MySQL用户名
    password: '你的密码',   // MySQL密码
    database: 'rental_system',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});
```

### 5. 启动服务器

**方法1: 使用启动脚本（推荐）**
```bash
chmod +x start.sh
./start.sh
```

**方法2: 手动启动**
```bash
npm start
```

服务器将在 `http://localhost:3000` 启动。

## 访问系统

打开浏览器访问: http://localhost:3000

登录后可以：
- 管理房间信息
- 生成月收据
- 查看收据列表
- 标记收据为已支付

## 常见问题

### 1. MySQL连接失败

检查：
- MySQL服务是否启动：`sudo systemctl status mysql`
- 用户名密码是否正确
- 端口是否被占用（默认3306）

### 2. 端口3000已被占用

修改 `server.js` 中的端口号：
```javascript
const PORT = 3001; // 改为其他端口
```

### 3. npm install 失败

尝试：
```bash
npm cache clean --force
npm install
```

## 卸载

```bash
# 停止服务器
Ctrl + C

# 删除数据库
mysql -u root -p
DROP DATABASE rental_system;

# 删除项目目录
rm -rf rental-system
```
