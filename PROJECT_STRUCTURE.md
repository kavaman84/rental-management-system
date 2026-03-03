# 项目结构

```
rental-system/
├── node_modules/           # Node.js依赖包（自动生成）
├── public/                 # 前端静态文件
│   ├── css/
│   │   └── style.css      # 样式文件
│   ├── js/
│   │   └── app.js         # 前端JavaScript
│   ├── login.ejs          # 登录页面
│   ├── dashboard.ejs      # 仪表板页面
│   ├── rooms.ejs          # 房间列表页面
│   ├── room-detail.ejs    # 房间详情页面
│   ├── receipts.ejs       # 收据管理页面
│   └── 404.ejs            # 404错误页面
├── schema.sql             # 数据库结构定义
├── server.js              # 后端服务器代码
├── package.json           # 项目配置和依赖
├── start.sh               # 启动脚本
├── README.md              # 项目说明文档
├── INSTALL.md             # 安装指南
├── QUICKSTART.md          # 快速入门
└── PROJECT_STRUCTURE.md   # 项目结构说明（本文件）
```

## 文件说明

### 后端文件

**server.js**
- Express服务器主文件
- 路由定义
- 数据库操作
- 业务逻辑处理

**schema.sql**
- 数据库表结构定义
- 示例数据插入
- 初始化脚本

### 前端文件

**EJS模板文件** (`public/*.ejs`)
- 动态渲染HTML页面
- 包含服务器端变量

**CSS文件** (`public/css/style.css`)
- 页面样式
- 响应式设计
- 交互动画

**JavaScript文件** (`public/js/app.js`)
- 前端交互逻辑
- AJAX请求处理
- 表单验证

### 配置文件

**package.json**
- 项目元数据
- 依赖列表
- 脚本命令

**start.sh**
- 自动化启动脚本
- 数据库初始化
- 依赖安装

## 数据库表

### rooms（房间表）
```sql
CREATE TABLE rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_number VARCHAR(20) NOT NULL UNIQUE,
    monthly_rent DECIMAL(10, 2) NOT NULL,
    tax_rate DECIMAL(5, 4) DEFAULT 0,
    electricity_rate DECIMAL(5, 4) DEFAULT 0,
    water_rate DECIMAL(5, 4) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### meter_readings（读数记录表）
```sql
CREATE TABLE meter_readings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_id INT NOT NULL,
    reading_date DATE NOT NULL,
    electricity_before DECIMAL(8, 2) DEFAULT 0,
    electricity_after DECIMAL(8, 2) DEFAULT 0,
    water_before DECIMAL(8, 2) DEFAULT 0,
    water_after DECIMAL(8, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);
```

### receipts（收据表）
```sql
CREATE TABLE receipts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_id INT NOT NULL,
    receipt_month VARCHAR(7) NOT NULL,
    monthly_rent DECIMAL(10, 2) NOT NULL,
    tax_amount DECIMAL(10, 2) NOT NULL,
    electricity_amount DECIMAL(10, 2) NOT NULL,
    water_amount DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    electricity_consumption DECIMAL(8, 2),
    water_consumption DECIMAL(8, 2),
    status ENUM('pending', 'paid', 'overdue') DEFAULT 'pending',
    receipt_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    UNIQUE KEY unique_room_month (room_id, receipt_month)
);
```

## API端点

### 认证
- `GET /login` - 登录页面
- `POST /login` - 登录处理

### 房间管理
- `GET /rooms` - 房间列表
- `GET /rooms/:id` - 房间详情
- `POST /rooms/:id/update` - 更新房间信息

### 收据管理
- `GET /receipts` - 收据列表（分页）
- `POST /receipts/generate` - 生成月收据
- `POST /receipts/:id/pay` - 支付收据

### 其他
- `GET /dashboard` - 仪表板
- `GET /logout` - 退出登录

## 开发流程

1. 修改代码
2. 重启服务器（Ctrl + C 然后 `npm start`）
3. 刷新浏览器查看效果

## 扩展建议

- 添加单元测试
- 添加API文档
- 添加日志系统
- 添加缓存机制
- 添加消息队列
