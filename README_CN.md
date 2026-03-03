# 出租屋租赁管理系统

一个基于Web的出租屋租赁管理系统，帮助管理员管理房间信息、电表水表读数和月收据。

## 🎉 群晖部署支持

系统已完全支持在群晖NAS上部署！

**快速部署**:
```bash
cd /docker/rental-system
./一键部署.sh
```

访问地址: http://192.168.1.5:4000

详细部署说明请查看: [群晖部署指南.md](群晖部署指南.md)

## ✨ 功能特性

### 房间管理
- ✅ 自定义每个房间的月租金
- ✅ 设置税费单价
- ✅ 设置电费单价
- ✅ 设置水费单价
- ✅ 查看房间详情和读数记录

### 收据管理
- ✅ 自动读取上个月的电表水表读数
- ✅ 自动计算用电量、用水量
- ✅ 根据设置的费率自动计算费用
- ✅ 生成月收据
- ✅ 标记收据为已支付

### Web界面
- ✅ 响应式设计，支持电脑和手机
- ✅ 直观的用户界面
- ✅ 实时数据更新

### 部署方式
- ✅ Docker容器化部署
- ✅ 群晖Container Manager支持
- ✅ SQLite数据库（无需MySQL）
- ✅ 数据持久化

## 🚀 快速开始

### 本地开发环境

```bash
# 安装依赖
npm install

# 启动服务器
npm start

# 访问
http://localhost:4000
```

登录凭据:
- 用户名: `admin`
- 密码: `admin123`

### 群晖NAS部署

#### 方法1: 一键部署（推荐）
```bash
cd /docker/rental-system
./一键部署.sh
```

#### 方法2: Docker Compose
```bash
cd /docker/rental-system
docker-compose up -d
```

#### 方法3: Container Manager
1. 打开Container Manager
2. 容器 → 创建
3. 选择"从docker-compose文件创建"
4. 选择 `docker-compose.yml`
5. 点击"创建"

## 📖 文档

| 文档 | 说明 |
|------|------|
| [群晖部署指南.md](群晖部署指南.md) | 群晖部署详细步骤 |
| [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md) | Docker技术文档 |
| [快速参考.md](快速参考.md) | 常用命令和配置 |
| [使用说明.md](使用说明.md) | 功能使用指南 |
| [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) | 项目结构说明 |

## 🛠️ 技术栈

- **后端**: Node.js + Express
- **数据库**: SQLite（无需安装MySQL）
- **前端**: EJS + CSS + JavaScript
- **部署**: Docker + Docker Compose
- **会话管理**: express-session

## 📊 数据库

### 表结构

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

## 📁 项目结构

```
rental-system/
├── node_modules/           # Node.js依赖包
├── public/                 # 前端文件
│   ├── css/
│   │   └── style.css      # 样式
│   ├── js/
│   │   └── app.js         # JavaScript
│   ├── login.ejs          # 登录页面
│   ├── dashboard.ejs      # 仪表板
│   ├── rooms.ejs          # 房间列表
│   ├── room-detail.ejs    # 房间详情
│   ├── receipts.ejs       # 收据管理
│   └── 404.ejs            # 404页面
├── data/                   # 数据目录
├── Dockerfile              # Docker镜像构建
├── docker-compose.yml      # Docker Compose配置
├── server-sqlite.js        # 服务器代码
├── package.json            # 项目配置
├── 一键部署.sh            # 一键部署脚本
├── deploy.sh              # 部署脚本
├── start.sh               # 启动脚本
├── stop.sh                # 停止脚本
└── README_CN.md           # 本文件
```

## 🎯 使用流程

### 1. 添加房间
- 登录系统
- 点击"管理房间"
- 点击"详情"修改房间信息

### 2. 生成收据
- 点击"收据管理"
- 选择房间和月份
- 点击"生成收据"
- 系统自动计算费用

### 3. 标记已支付
- 在收据列表中点击"支付"按钮

## 🔧 常用命令

```bash
# Docker相关
docker-compose ps              # 查看状态
docker-compose logs -f         # 查看日志
docker-compose restart         # 重启
docker-compose down            # 停止
docker-compose up -d           # 启动

# 本地开发
npm start                      # 启动服务器
npm install                    # 安装依赖
```

## ⚙️ 配置

### 修改端口

编辑 `docker-compose.yml`:
```yaml
ports:
  - "8080:4000"
```

### 修改内存限制

编辑 `docker-compose.yml`:
```yaml
deploy:
  resources:
    limits:
      memory: 1024M
```

## 📝 示例数据

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

## 🔄 更新系统

```bash
# 停止容器
docker-compose down

# 上传新文件

# 重新构建
docker-compose build

# 启动容器
docker-compose up -d
```

## 🆘 故障排查

### 容器无法启动
```bash
# 查看日志
docker-compose logs

# 检查端口是否被占用
netstat -tuln | grep 4000
```

### 无法访问系统
1. 检查容器是否运行: `docker ps`
2. 检查端口映射: `docker-compose ps`
3. 检查群晖防火墙
4. 重启容器: `docker-compose restart`

### 数据库问题
```bash
# 删除容器和数据库
docker-compose down
rm -rf data/rental_system.db

# 重新创建
docker-compose up -d
```

## 💡 扩展建议

- [ ] 添加电表水表读数管理功能
- [ ] 添加数据统计报表
- [ ] 添加邮件通知功能
- [ ] 添加数据导出（Excel/PDF）
- [ ] 添加用户权限管理
- [ ] 添加多语言支持
- [ ] 添加主题切换功能

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📮 联系方式

如有问题或建议，请提交Issue。

---

**开始使用吧！** 🎉
