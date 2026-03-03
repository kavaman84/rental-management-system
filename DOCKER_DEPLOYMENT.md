# 群晖NAS Docker部署指南

本指南介绍如何将出租屋租赁管理系统部署到群晖NAS的Container Manager中。

## 方法一：使用Docker Compose（推荐）

### 1. 准备工作

确保群晖上已安装Docker和Docker Compose：
- 登录群晖DSM
- 打开"Container Manager"
- 进入"注册表"，搜索"Docker Compose"并安装（如果未安装）

### 2. 上传文件到群晖

#### 方法A：使用File Station
1. 打开群晖的File Station
2. 创建一个新文件夹，例如：`/docker/rental-system`
3. 将以下文件上传到该文件夹：
   - `Dockerfile`
   - `docker-compose.yml`
   - `package.json`
   - `server-sqlite.js`
   - `public/` 整个文件夹及其所有内容

#### 方法B：使用SSH上传
```bash
# 在群晖上打开终端
ssh root@192.168.1.5

# 然后使用scp或rsync上传文件
```

### 3. 构建并启动容器

#### 方法A：使用Container Manager（图形界面）
1. 打开Container Manager
2. 点击"容器" → "创建"
3. 选择"从docker-compose文件创建"
4. 选择上传的docker-compose.yml文件
5. 点击"创建"

#### 方法B：使用SSH命令行
```bash
# 进入上传文件的目录
cd /docker/rental-system

# 构建并启动容器
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止容器
docker-compose down
```

### 4. 访问系统

容器启动后，可以通过以下方式访问：

- **本地访问**: http://192.168.1.5:4000
- **局域网访问**: http://192.168.1.5:4000

使用以下凭据登录：
- 用户名: `admin`
- 密码: `admin123`

## 方法二：使用Docker镜像

### 1. 构建Docker镜像

在群晖上执行：

```bash
cd /docker/rental-system

# 构建镜像
docker build -t rental-system:latest .
```

### 2. 运行容器

```bash
docker run -d \
  --name rental-system \
  -p 4000:4000 \
  -v /docker/rental-system/data:/app/data \
  --restart unless-stopped \
  rental-system:latest
```

### 3. 访问系统

同方法一

## 数据持久化

系统使用SQLite数据库，数据存储在：
- **本地路径**: `/docker/rental-system/data/rental_system.db`

数据库文件会自动创建，并永久保存在该目录中。

## 常用Docker命令

```bash
# 查看容器状态
docker ps

# 查看容器日志
docker logs rental-system

# 重启容器
docker restart rental-system

# 停止容器
docker stop rental-system

# 启动容器
docker start rental-system

# 进入容器
docker exec -it rental-system sh

# 删除容器
docker rm rental-system

# 删除镜像
docker rmi rental-system:latest
```

## 修改端口

如果4000端口被占用，可以修改端口映射：

### 修改docker-compose.yml
```yaml
ports:
  - "8080:4000"  # 将群晖的8080端口映射到容器的4000端口
```

然后重启容器：
```bash
docker-compose down
docker-compose up -d
```

访问地址变为: http://192.168.1.5:8080

## 备份数据

定期备份数据库文件：

```bash
# 复制数据库文件
cp /docker/rental-system/data/rental_system.db /docker/rental-system/backup/rental_system.db.backup
```

## 群晖特殊配置

### 1. 确保端口开放

在群晖防火墙中，确保以下端口已开放：
- HTTP端口（默认4000，或你修改的端口）

### 2. 网络设置

确保容器使用正确的网络模式：
- 默认使用bridge模式（推荐）
- 或使用host模式（需要手动配置）

### 3. 资源限制

可以在docker-compose.yml中添加资源限制：

```yaml
services:
  rental-system:
    build: .
    container_name: rental-system
    ports:
      - "4000:4000"
    volumes:
      - ./data:/app/data
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    networks:
      - rental-network
    # 添加资源限制
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

## 故障排查

### 问题1: 容器无法启动

查看日志：
```bash
docker logs rental-system
```

常见原因：
- 端口被占用
- 文件权限问题
- 依赖未正确安装

### 问题2: 无法访问系统

检查：
1. 容器是否正在运行：`docker ps`
2. 端口是否正确映射
3. 群晖防火墙是否开放端口
4. 浏览器是否能访问192.168.1.5

### 问题3: 数据丢失

确保使用了volume挂载：
```yaml
volumes:
  - ./data:/app/data
```

### 问题4: 数据库文件损坏

删除容器和数据库文件，重新创建：
```bash
docker-compose down
rm -rf data/rental_system.db
docker-compose up -d
```

## 更新系统

1. 上传新的文件到群晖
2. 停止容器：`docker-compose down`
3. 重新构建：`docker-compose build`
4. 启动容器：`docker-compose up -d`

## 技术支持

- 查看完整文档: `README.md`
- 使用说明: `使用说明.md`
- 项目结构: `PROJECT_STRUCTURE.md`

---

**提示**: 首次部署建议使用方法一（Docker Compose），更简单方便！
