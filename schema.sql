-- 创建数据库
CREATE DATABASE IF NOT EXISTS rental_system DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE rental_system;

-- 房间表
CREATE TABLE IF NOT EXISTS rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_number VARCHAR(20) NOT NULL UNIQUE COMMENT '房号',
    monthly_rent DECIMAL(10, 2) NOT NULL COMMENT '月租金',
    tax_rate DECIMAL(5, 4) DEFAULT 0 COMMENT '税费单价（每元租金的税费）',
    electricity_rate DECIMAL(5, 4) DEFAULT 0 COMMENT '电费单价（元/度）',
    water_rate DECIMAL(5, 4) DEFAULT 0 COMMENT '水费单价（元/吨）',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 电表水表读数记录表
CREATE TABLE IF NOT EXISTS meter_readings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_id INT NOT NULL,
    reading_date DATE NOT NULL COMMENT '读数日期',
    electricity_before DECIMAL(8, 2) DEFAULT 0 COMMENT '上月电表读数',
    electricity_after DECIMAL(8, 2) DEFAULT 0 COMMENT '本月电表读数',
    water_before DECIMAL(8, 2) DEFAULT 0 COMMENT '上月水表读数',
    water_after DECIMAL(8, 2) DEFAULT 0 COMMENT '本月水表读数',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 月收据表
CREATE TABLE IF NOT EXISTS receipts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_id INT NOT NULL,
    receipt_month VARCHAR(7) NOT NULL COMMENT '收据月份（YYYY-MM）',
    monthly_rent DECIMAL(10, 2) NOT NULL COMMENT '月租金',
    tax_amount DECIMAL(10, 2) NOT NULL COMMENT '税费金额',
    electricity_amount DECIMAL(10, 2) NOT NULL COMMENT '电费金额',
    water_amount DECIMAL(10, 2) NOT NULL COMMENT '水费金额',
    total_amount DECIMAL(10, 2) NOT NULL COMMENT '应收总金额',
    electricity_consumption DECIMAL(8, 2) COMMENT '用电量（度）',
    water_consumption DECIMAL(8, 2) COMMENT '用水量（吨）',
    status ENUM('pending', 'paid', 'overdue') DEFAULT 'pending' COMMENT '状态',
    receipt_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    UNIQUE KEY unique_room_month (room_id, receipt_month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 管理员账户表（简单示例）
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入示例管理员（密码：admin123，实际使用时需要加密）
INSERT INTO admins (username, password) VALUES
('admin', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy');

-- 初始化时不再插入示例房间数据，用户可以自己添加
-- INSERT INTO rooms (room_number, monthly_rent, tax_rate, electricity_rate, water_rate) VALUES
-- ('101', 1500.00, 0.05, 0.80, 5.00),
-- ('102', 1800.00, 0.05, 0.80, 5.00),
-- ('201', 1200.00, 0.05, 0.80, 5.00),
-- ('202', 2000.00, 0.05, 0.80, 5.00);
