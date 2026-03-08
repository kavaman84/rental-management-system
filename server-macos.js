const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const app = express();
const PORT = 4000;

// 数据库连接
const db = new sqlite3.Database('./rental_system.db');

// 初始化数据库
db.serialize(() => {
    // 创建表
    db.run(`CREATE TABLE IF NOT EXISTS rooms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_number TEXT NOT NULL UNIQUE,
        monthly_rent REAL NOT NULL,
        tax_rate REAL DEFAULT 0,
        electricity_rate REAL DEFAULT 0,
        water_rate REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS meter_readings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_id INTEGER NOT NULL,
        reading_date TEXT NOT NULL,
        electricity_before REAL DEFAULT 0,
        electricity_after REAL DEFAULT 0,
        water_before REAL DEFAULT 0,
        water_after REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS receipts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_id INTEGER NOT NULL,
        receipt_month TEXT NOT NULL,
        monthly_rent REAL NOT NULL,
        tax_amount REAL NOT NULL,
        electricity_amount REAL NOT NULL,
        water_amount REAL NOT NULL,
        total_amount REAL NOT NULL,
        electricity_consumption REAL,
        water_consumption REAL,
        status TEXT DEFAULT 'pending',
        receipt_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
        UNIQUE(room_id, receipt_month)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // 插入示例管理员
    db.run(`INSERT OR IGNORE INTO admins (username, password) VALUES (?, ?)`, ['admin', 'admin123']);

    // 初始化时不插入示例房间数据，用户可以自己添加
    // db.run(`INSERT OR IGNORE INTO rooms (room_number, monthly_rent, tax_rate, electricity_rate, water_rate) VALUES (?, ?, ?, ?, ?)`,
    //     ['101', 1500.00, 0.05, 0.80, 5.00]);
    // db.run(`INSERT OR IGNORE INTO rooms (room_number, monthly_rent, tax_rate, electricity_rate, water_rate) VALUES (?, ?, ?, ?, ?)`,
    //     ['102', 1800.00, 0.05, 0.80, 5.00]);
    // db.run(`INSERT OR IGNORE INTO rooms (room_number, monthly_rent, tax_rate, electricity_rate, water_rate) VALUES (?, ?, ?, ?, ?)`,
    //     ['201', 1200.00, 0.05, 0.80, 5.00]);
    // db.run(`INSERT OR IGNORE INTO rooms (room_number, monthly_rent, tax_rate, electricity_rate, water_rate) VALUES (?, ?, ?, ?, ?)`,
    //     ['202', 2000.00, 0.05, 0.80, 5.00]);

    // 初始化时不插入示例读数数据
    // db.run(`INSERT OR IGNORE INTO meter_readings (room_id, reading_date, electricity_before, electricity_after, water_before, water_after)
    //     VALUES (?, ?, ?, ?, ?, ?)`, [1, '2024-12-01', 0.00, 150.00, 0.00, 20.00]);
    // db.run(`INSERT OR IGNORE INTO meter_readings (room_id, reading_date, electricity_before, electricity_after, water_before, water_after)
    //     VALUES (?, ?, ?, ?, ?, ?)`, [2, '2024-12-01', 0.00, 200.00, 0.00, 25.00]);
    // db.run(`INSERT OR IGNORE INTO meter_readings (room_id, reading_date, electricity_before, electricity_after, water_before, water_after)
    //     VALUES (?, ?, ?, ?, ?, ?)`, [3, '2024-12-01', 0.00, 120.00, 0.00, 15.00]);
    // db.run(`INSERT OR IGNORE INTO meter_readings (room_id, reading_date, electricity_before, electricity_after, water_before, water_after)
    //     VALUES (?, ?, ?, ?, ?, ?)`, [4, '2024-12-01', 0.00, 180.00, 0.00, 22.00]);
});

// 中间件
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', 'public');
app.use(session({
    secret: 'rental-system-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 3600000 } // 1小时
}));

// 首页
app.get('/', (req, res) => {
    res.redirect('/dashboard');
});

// 登录页面
app.get('/login', (req, res) => {
    res.render('login', { error: null });
});

// 登录处理
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.get('SELECT * FROM admins WHERE username = ?', [username], (err, admin) => {
        if (err) {
            console.error('登录错误:', err);
            return res.status(500).send('服务器错误');
        }

        if (!admin) {
            return res.render('login', { error: '用户名或密码错误' });
        }

        if (admin.password === password) {
            req.session.adminId = admin.id;
            req.session.username = admin.username;
            res.redirect('/dashboard');
        } else {
            res.render('login', { error: '用户名或密码错误' });
        }
    });
});

// 仪表板
app.get('/dashboard', (req, res) => {
    if (!req.session.adminId) {
        return res.redirect('/login');
    }

    db.all('SELECT * FROM rooms ORDER BY room_number', (err, rooms) => {
        if (err) {
            console.error('获取房间列表错误:', err);
            return res.status(500).send('服务器错误');
        }

        db.get('SELECT COUNT(*) as total FROM receipts', (err, result) => {
            const receiptStats = result;

            db.get('SELECT COUNT(*) as unpaid FROM receipts WHERE status = "pending"', (err, result) => {
                const unpaidCount = result.unpaid;

                db.all('SELECT r.*, room_number FROM receipts r JOIN rooms ON r.room_id = rooms.id ORDER BY r.receipt_month DESC, r.room_id ASC LIMIT 5', (err, receipts) => {
                    if (err) {
                        console.error('获取收据列表错误:', err);
                        return res.status(500).send('服务器错误');
                    }

                    res.render('dashboard', {
                        rooms,
                        receipts,
                        receiptStats,
                        unpaidCount,
                        username: req.session.username
                    });
                });
            });
        });
    });
});

// 房间管理
app.get('/rooms', (req, res) => {
    if (!req.session.adminId) {
        return res.redirect('/dashboard');
    }

    db.all('SELECT * FROM rooms ORDER BY room_number', (err, rooms) => {
        if (err) {
            console.error('获取房间列表错误:', err);
            return res.status(500).send('服务器错误');
        }

        res.render('rooms', { rooms, username: req.session.username });
    });
});

// 添加房间
app.post('/rooms/add', (req, res) => {
    if (!req.session.adminId) {
        return res.redirect('/dashboard');
    }

    const { room_number, monthly_rent, electricity_rate, water_rate } = req.body;

    db.run(
        'INSERT INTO rooms (room_number, monthly_rent, electricity_rate, water_rate, housekeeping_fee, internet_fee) VALUES (?, ?, ?, ?, ?, ?)',
        [room_number, monthly_rent, electricity_rate, water_rate, housekeeping_fee, internet_fee],
        (err) => {
            if (err) {
                console.error('添加房间错误:', err);
                // 可能的失败原因：
                // 1. 房间号重复 - 返回 "SQLITE_CONSTRAINT: UNIQUE constraint failed: rooms.room_number"
                // 2. 数据格式错误（如租金为负数）
                // 3. 数据库连接问题
                // 4. 其他数据库约束错误
                // 返回详细的错误信息，包括错误代码和错误消息
                return res.status(500).json({
                    success: false,
                    message: err.message || '添加失败',
                    errorCode: err.code,
                    errno: err.errno
                });
            }

            res.json({ success: true, message: '添加成功' });
        }
    );
});

// 删除房间
app.post('/rooms/:id/delete', (req, res) => {
    if (!req.session.adminId) {
        return res.redirect('/dashboard');
    }

    const roomId = req.params.id;

    db.run('DELETE FROM rooms WHERE id = ?', [roomId], (err) => {
        if (err) {
            console.error('删除房间错误:', err);
            return res.status(500).json({ success: false, message: '删除失败' });
        }

        res.json({ success: true, message: '删除成功' });
    });
});

// 获取单个房间详情
app.get('/rooms/:id', (req, res) => {
    if (!req.session.adminId) {
        return res.redirect('/dashboard');
    }

    const roomId = req.params.id;

    db.get('SELECT * FROM rooms WHERE id = ?', [roomId], (err, room) => {
        if (err) {
            console.error('获取房间详情错误:', err);
            return res.status(500).send('服务器错误');
        }

        if (!room) {
            return res.status(404).send('房间不存在');
        }

        res.json(room);
    });
});

// 更新房间信息
app.post('/rooms/:id/update', (req, res) => {
    if (!req.session.adminId) {
        return res.redirect('/dashboard');
    }

    const roomId = req.params.id;
    const { room_number, monthly_rent, electricity_rate, water_rate, housekeeping_fee, internet_fee } = req.body;

    db.run(
        'UPDATE rooms SET room_number = ?, monthly_rent = ?, electricity_rate = ?, water_rate = ?, housekeeping_fee = ?, internet_fee = ? WHERE id = ?',
        [room_number, monthly_rent, electricity_rate, water_rate, housekeeping_fee, internet_fee, roomId],
        (err) => {
            if (err) {
                console.error('更新房间信息错误:', err);
                // 可能的失败原因：
                // 1. 房间号重复 - 返回 "SQLITE_CONSTRAINT: UNIQUE constraint failed: rooms.room_number"
                // 2. 更新的房间ID不存在
                // 3. 数据格式错误（如租金为负数）
                // 4. 数据库连接问题
                // 5. 其他数据库约束错误
                // 返回详细的错误信息，包括错误代码和错误消息
                return res.status(500).json({
                    success: false,
                    message: err.message || '更新失败',
                    errorCode: err.code,
                    errno: err.errno
                });
            }

            res.json({ success: true, message: '更新成功' });
        }
    );
});

// 收据管理
app.get('/receipts', (req, res) => {
    if (!req.session.adminId) {
        return res.redirect('/dashboard');
    }

    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    db.all('SELECT * FROM rooms ORDER BY room_number', (err, rooms) => {
        if (err) {
            console.error('获取房间列表错误:', err);
            return res.status(500).send('服务器错误');
        }

        db.all(
            `SELECT
                r.*,
                room_number,
                (SELECT electricity_after FROM meter_readings
                 WHERE room_id = r.room_id
                 AND reading_date < r.receipt_month
                 ORDER BY reading_date DESC LIMIT 1) AS electricity_before,
                (SELECT water_after FROM meter_readings
                 WHERE room_id = r.room_id
                 AND reading_date < r.receipt_month
                 ORDER BY reading_date DESC LIMIT 1) AS water_before,
                (SELECT electricity_after FROM meter_readings
                 WHERE room_id = r.room_id
                 AND reading_date = r.receipt_month) AS electricity_after,
                (SELECT water_after FROM meter_readings
                 WHERE room_id = r.room_id
                 AND reading_date = r.receipt_month) AS water_after
            FROM receipts r
            JOIN rooms ON r.room_id = rooms.id
            ORDER BY r.receipt_month DESC, r.room_id ASC
            LIMIT ? OFFSET ?`,
            [limit, offset],
            (err, receipts) => {
                if (err) {
                    console.error('获取收据列表错误:', err);
                    return res.status(500).send('服务器错误');
                }

                db.get('SELECT COUNT(*) as total FROM receipts', (err, result) => {
                    const total = result.total;
                    const totalPages = Math.ceil(total / limit);

                    res.render('receipts', {
                        receipts,
                        currentPage: page,
                        totalPages,
                        username: req.session.username,
                        rooms
                    });
                });
            }
        );
    });
});

// 获取上个月的水电读数
app.get('/receipts/meter-readings/:roomId/:month', (req, res) => {
    if (!req.session.adminId) {
        return res.redirect('/dashboard');
    }

    const roomId = req.params.roomId;
    const month = req.params.month;

    // 从月份中提取年份和月份（例如："2026-02" -> year: 2026, month: 2）
    const [year, monthNum] = month.split('-').map(Number);

    // 计算上个月的月份
    let lastYear = year;
    let lastMonth = monthNum - 1;

    if (lastMonth === 0) {
        lastMonth = 12;
        lastYear = year - 1;
    }

    // 格式化上个月份为 "YYYY-MM"
    const lastMonthStr = `${String(lastYear).padStart(4, '0')}-${String(lastMonth).padStart(2, '0')}`;

    // 查询上个月的水电读数
    db.get(
        'SELECT electricity_after, water_after FROM meter_readings WHERE room_id = ? AND reading_date = ?',
        [roomId, lastMonthStr],
        (err, reading) => {
            if (err) {
                console.error('获取上个月读数错误:', err);
                return res.status(500).json({ success: false, message: '获取读数失败' });
            }

            if (reading) {
                res.json({
                    success: true,
                    electricity_before: reading.electricity_after,
                    water_before: reading.water_after
                });
            } else {
                res.json({
                    success: false,
                    message: '未找到上个月读数'
                });
            }
        }
    );
});

// 生成月收据
app.post('/receipts/generate', (req, res) => {
    if (!req.session.adminId) {
        return res.redirect('/dashboard');
    }

    const roomId = req.body.room_id;
    const receiptMonth = req.body.receipt_month;
    // 获取用户输入的电表水表读数
    const electricityBefore = parseFloat(req.body.electricity_before);
    const electricityAfter = parseFloat(req.body.electricity_after);
    const waterBefore = parseFloat(req.body.water_before);
    const waterAfter = parseFloat(req.body.water_after);

    // 验证读数
    if (electricityBefore < 0 || electricityAfter < 0 || waterBefore < 0 || waterAfter < 0) {
        return res.status(400).json({ success: false, message: '读数不能为负数' });
    }

    if (electricityAfter < electricityBefore || waterAfter < waterBefore) {
        return res.status(400).json({ success: false, message: '本月读数必须大于或等于上月读数' });
    }

    db.get('SELECT * FROM rooms WHERE id = ?', [roomId], (err, room) => {
        if (err) {
            console.error('获取房间信息错误:', err);
            return res.status(500).json({ success: false, message: '获取房间信息失败' });
        }

        if (!room) {
            return res.status(404).json({ success: false, message: '房间不存在' });
        }

        // 计算消费量
        const electricityConsumption = Math.max(0, electricityAfter - electricityBefore);
        const waterConsumption = Math.max(0, waterAfter - waterBefore);

        // 计算费用
        const monthlyRent = parseFloat(room.monthly_rent);
        const taxAmount = monthlyRent * parseFloat(room.tax_rate);
        const electricityAmount = electricityConsumption * parseFloat(room.electricity_rate);
        const waterAmount = waterConsumption * parseFloat(room.water_rate);
        const totalAmount = monthlyRent + taxAmount + electricityAmount + waterAmount;

        db.get('SELECT * FROM receipts WHERE room_id = ? AND receipt_month = ?', [roomId, receiptMonth], (err, existingReceipts) => {
            if (err) {
                console.error('检查收据错误:', err);
                return res.status(500).json({ success: false, message: '检查收据失败' });
            }

            if (existingReceipts) {
                return res.status(400).json({ success: false, message: '该月份的收据已存在' });
            }

            // 保存读数到 meter_readings 表
            db.run(
                'INSERT INTO meter_readings (room_id, reading_date, electricity_before, electricity_after, water_before, water_after) VALUES (?, ?, ?, ?, ?, ?)',
                [
                    roomId,
                    receiptMonth,
                    electricityBefore,
                    electricityAfter,
                    waterBefore,
                    waterAfter
                ],
                (err) => {
                    if (err) {
                        console.error('保存读数错误:', err);
                        return res.status(500).json({ success: false, message: '保存读数失败' });
                    }
                    console.log('读数已保存:', { roomId, receiptMonth, electricityBefore, electricityAfter, waterBefore, waterAfter });
                }
            );

            // 创建收据
            db.run(
                'INSERT INTO receipts (room_id, receipt_month, monthly_rent, tax_amount, electricity_amount, water_amount, total_amount, electricity_consumption, water_consumption, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    roomId,
                    receiptMonth,
                    monthlyRent,
                    taxAmount,
                    electricityAmount,
                    waterAmount,
                    totalAmount,
                    electricityConsumption,
                    waterConsumption,
                    'pending'
                ],
                (err) => {
                    if (err) {
                        console.error('创建收据错误:', err);
                        return res.status(500).json({ success: false, message: '创建收据失败' });
                    }

                    res.json({
                        success: true,
                        message: '收据生成成功',
                        receipt: {
                            room_number: room.room_number,
                            receipt_month: receiptMonth,
                            monthly_rent: monthlyRent,
                            tax_amount: taxAmount,
                            electricity_amount: electricityAmount,
                            water_amount: waterAmount,
                            total_amount: totalAmount,
                            electricity_consumption: electricityConsumption,
                            water_consumption: waterConsumption
                        }
                    });
                }
            );
        });
    });
});

// 支付收据
app.post('/receipts/:id/pay', (req, res) => {
    if (!req.session.adminId) {
        return res.redirect('/dashboard');
    }

    const receiptId = req.params.id;

    db.run('UPDATE receipts SET status = "paid" WHERE id = ?', [receiptId], (err) => {
        if (err) {
            console.error('更新收据状态错误:', err);
            return res.status(500).json({ success: false, message: '更新失败' });
        }

        res.json({ success: true, message: '支付成功' });
    });
});

// 获取收据详情（用于修改）
app.get('/receipts/:id', (req, res) => {
    if (!req.session.adminId) {
        return res.redirect('/dashboard');
    }

    const receiptId = req.params.id;

    db.get('SELECT r.*, room_number FROM receipts r JOIN rooms ON r.room_id = rooms.id WHERE r.id = ?', [receiptId], (err, receipt) => {
        if (err) {
            console.error('获取收据详情错误:', err);
            return res.status(500).send('服务器错误');
        }

        if (!receipt) {
            return res.status(404).send('收据不存在');
        }

        res.json(receipt);
    });
});

// 修改收据
app.post('/receipts/:id/update', (req, res) => {
    if (!req.session.adminId) {
        return res.redirect('/dashboard');
    }

    const receiptId = req.params.id;
    const { receipt_month, monthly_rent, electricity_amount, water_amount, total_amount } = req.body;

    db.run(
        'UPDATE receipts SET receipt_month = ?, monthly_rent = ?, electricity_amount = ?, water_amount = ?, total_amount = ? WHERE id = ?',
        [receipt_month, monthly_rent, electricity_amount, water_amount, total_amount, receiptId],
        (err) => {
            if (err) {
                console.error('修改收据错误:', err);
                return res.status(500).json({ success: false, message: '修改失败' });
            }

            res.json({ success: true, message: '修改成功' });
        }
    );
});

// 删除收据
app.post('/receipts/:id/delete', (req, res) => {
    if (!req.session.adminId) {
        return res.redirect('/dashboard');
    }

    const receiptId = req.params.id;

    db.run('DELETE FROM receipts WHERE id = ?', [receiptId], (err) => {
        if (err) {
            console.error('删除收据错误:', err);
            return res.status(500).json({ success: false, message: '删除失败' });
        }

        res.json({ success: true, message: '删除成功' });
    });
});

// 登出
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/dashboard');
});

// 404
app.use((req, res) => {
    res.status(404).render('404');
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`================================`);
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log(`================================`);
    console.log(`管理员账号: admin / admin123`);
    console.log(`================================`);
});
