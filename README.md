# 出租屋租赁管理系统

一个基于Web的出租屋租赁管理系统，帮助管理员管理房间信息、电表水表读数和月收据。

## 功能特点

1. **房间管理**
   - 自定义每个房间的月租金
   - 设置税费单价
   - 设置电费单价
   - 设置水费单价

2. **收据管理**
   - 自动读取上个月的电表水表读数
   - 根据设置的费率自动计算费用
   - 生成月收据
   - 记录用电量、用水量
   - 支付状态管理

3. **Web界面**
   - 响应式设计，支持电脑和手机
   - 直观的用户界面
   - 实时数据更新

## 技术栈

- **后端**: Node.js + Express
- **数据库**: SQLite（无需安装MySQL）
- **前端**: EJS + CSS + JavaScript
- **会话管理**: express-session

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动服务器

```bash
npm start
```

服务器将在 `http://localhost:4000` 启动。

### 3. 登录系统

- 用户名: `admin`
- 密码: `admin123`

## 使用说明

### 房间管理

1. 登录系统
2. 点击"管理房间"
3. 点击"详情"查看或修改房间信息
4. 修改月租金、税费单价、电费单价、水费单价
5. 点击"保存修改"

### 收据管理

1. 点击"收据管理"
2. 选择房间
3. 选择收据月份（默认为当前月份）
4. 点击"生成收据"
5. 系统会自动：
   - 读取上个月的电表水表读数
   - 计算用电量、用水量
   - 根据费率计算各项费用
   - 生成收据

### 标记收据为已支付

1. 在收据列表中找到未支付的收据
2. 点击"支付"按钮
3. 确认后状态变为"已支付"

## 数据库

系统使用SQLite数据库，数据存储在 `rental_system.db` 文件中。

### 数据库表

#### rooms（房间表）
- id: 主键
- room_number: 房号（唯一）
- monthly_rent: 月租金
- tax_rate: 税费单价
- electricity_rate: 电费单价
- water_rate: 水费单价

#### meter_readings（读数记录表）
- id: 主键
- room_id: 房间ID
- reading_date: 读数日期
- electricity_before: 上月电表读数
- electricity_after: 本月电表读数
- water_before: 上月水表读数
- water_after: 本月水表读数

#### receipts（收据表）
- id: 主键
- room_id: 房间ID
- receipt_month: 收据月份
- monthly_rent: 月租金
- tax_amount: 税费金额
- electricity_amount: 电费金额
- water_amount: 水费金额
- total_amount: 应收总金额
- electricity_consumption: 用电量
- water_consumption: 用水量
- status: 状态（pending/paid/overdue）

#### admins（管理员表）
- id: 主键
- username: 用户名
- password: 密码

## 示例数据

系统已预置以下示例数据：

**管理员账户:**
- 用户名: admin
- 密码: admin123

**示例房间:**
- 101: 月租金 1500元
- 102: 月租金 1800元
- 201: 月租金 1200元
- 202: 月租金 2000元

**示例读数:**
- 2024年12月1日的电表水表读数已预置

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

## 开发说明

### 添加新房间

```javascript
db.run(
    'INSERT INTO rooms (room_number, monthly_rent, tax_rate, electricity_rate, water_rate) VALUES (?, ?, ?, ?, ?)',
    ['303', 1600.00, 0.05, 0.80, 5.00],
    (err) => {
        if (err) throw err;
        console.log('房间添加成功');
    }
);
```

### 添加电表水表读数

```javascript
db.run(
    'INSERT INTO meter_readings (room_id, reading_date, electricity_before, electricity_after, water_before, water_after) VALUES (?, ?, ?, ?, ?, ?)',
    [1, '2025-01-01', 150.00, 200.00, 20.00, 25.00],
    (err) => {
        if (err) throw err;
        console.log('读数添加成功');
    }
);
```

### 查询收据

```javascript
db.all('SELECT * FROM receipts WHERE status = "pending" ORDER BY receipt_month DESC', (err, receipts) => {
    if (err) throw err;
    console.log(receipts);
});
```

## 注意事项

1. **数据安全**: 当前使用简单的密码验证，实际生产环境应使用bcrypt等加密方式
2. **数据备份**: 定期备份数据库文件 `rental_system.db`
3. **会话管理**: 使用express-session，生产环境应配置更安全的会话策略
4. **日志记录**: 建议添加操作日志功能
5. **邮件通知**: 可添加收据生成后发送邮件通知的功能

## 常见问题

### 1. 端口被占用

如果端口4000被占用，修改 `server-sqlite.js` 中的 `PORT` 变量：

```javascript
const PORT = 4001; // 改为其他端口
```

### 2. 数据库文件损坏

删除 `rental_system.db` 文件，重新运行 `npm start`，系统会自动重建数据库。

### 3. npm install 失败

尝试：
```bash
npm cache clean --force
npm install
```

## 文件结构

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
├── rental_system.db       # SQLite数据库文件（自动生成）
├── server-sqlite.js       # SQLite版本服务器代码
├── package.json           # 项目配置和依赖
├── start-sqlite.sh        # 启动脚本
├── README.md              # 项目说明文档
├── INSTALL.md             # 安装指南
├── QUICKSTART.md          # 快速入门
└── PROJECT_STRUCTURE.md   # 项目结构说明
```

## 扩展功能建议

- [ ] 添加单元测试
- [ ] 添加API文档
- [ ] 添加日志系统
- [ ] 添加数据统计报表
- [ ] 添加数据导出功能（Excel/PDF）
- [ ] 添加邮件通知功能
- [ ] 添加数据备份功能
- [ ] 添加用户权限管理
- [ ] 添加多语言支持
- [ ] 添加主题切换功能

## 许可证

MIT License

## 联系方式

如有问题或建议，请提交Issue。
