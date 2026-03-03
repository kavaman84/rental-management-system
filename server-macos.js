const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const os = require('os');
const app = express();
const PORT = 3000;

// 获取用户的主目录
const homeDir = os.homedir();
const appDir = path.join(homeDir, 'Documents', 'rental-system');
const dbPath = path.join(appDir, 'rental_system.db');

// 确保应用目录存在
const fs = require('fs');
if (!fs.existsSync(appDir)) {
    fs.mkdirSync(appDir, { recursive: true });
    console.log('创建应用目录:', appDir);
}

// 数据库连接
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('数据库连接错误:', err);
    } else {
        console.log('数据库连接成功:', dbPath);
    }
});

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

    // 插入示例房间
    db.run(`INSERT OR IGNORE INTO rooms (room_number, monthly_rent, tax_rate, electricity_rate, water_rate) VALUES (?, ?, ?, ?, ?)`,
        ['101', 1500.00, 0.05, 0.80, 5.00]);
    db.run(`INSERT OR IGNORE INTO rooms (room_number, monthly_rent, tax_rate, electricity_rate, water_rate) VALUES (?, ?, ?, ?, ?)`,
        ['102', 1800.00, 0.05, 0.80, 5.00]);
    db.run(`INSERT OR IGNORE INTO rooms (room_number, monthly_rent, tax_rate, electricity_rate, water_rate) VALUES (?, ?, ?, ?, ?)`,
        ['201', 1200.00, 0.05, 0.80, 5.00]);
    db.run(`INSERT OR IGNORE INTO rooms (room_number, monthly_rent, tax_rate, electricity_rate, water_rate) VALUES (?, ?, ?, ?, ?)`,
        ['202', 2000.00, 0.05, 0.80, 5.00]);

    // 插入示例读数
    db.run(`INSERT OR IGNORE INTO meter_readings (room_id, reading_date, electricity_before, electricity_after, water_before, water_after)
        VALUES (?, ?, ?, ?, ?, ?)`, [1, '2024-12-01', 0.00, 150.00, 0.00, 20.00]);
    db.run(`INSERT OR IGNORE INTO meter_readings (room_id, reading_date, electricity_before, electricity_after, water_before, water_after)
        VALUES (?, ?, ?, ?, ?, ?)`, [2, '2024-12-01', 0.00, 200.00, 0.00, 25.00]);
    db.run(`INSERT OR IGNORE INTO meter_readings (room_id, reading_date, electricity_before, electricity_after, water_before, water_after)
        VALUES (?, ?, ?, ?, ?, ?)`, [3, '2024-12-01', 0.00, 120.00, 0.00, 15.00]);
    db.run(`INSERT OR IGNORE INTO meter_readings (room_id, reading_date, electricity_before, electricity_after, water_before, water_after)
        VALUES (?, ?, ?, ?, ?, ?)`, [4, '2024-12-01', 0.00, 180.00, 0.00, 22.00]);
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
    res.redirect('/login');
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

        // 获取最近的收据
        db.all('SELECT r.*, room_number FROM receipts r JOIN rooms ON r.room_id = rooms.id ORDER BY r.receipt_month DESC, r.room_id ASC LIMIT 5', (err, receipts) => {
            if (err) {
                console.error('获取收据列表错误:', err);
                return res.status(500).send('服务器错误');
            }

            db.get('SELECT COUNT(*) as total FROM receipts', (err, result) => {
                const receiptStats = result;

                db.get('SELECT COUNT(*) as unpaid FROM receipts WHERE status = "pending"', (err, result) => {
                    const unpaidCount = result.unpaid;

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
        return res.redirect('/login');
    }

    db.all('SELECT * FROM rooms ORDER BY room_number', (err, rooms) => {
        if (err) {
            console.error('获取房间列表错误:', err);
            return res.status(500).send('服务器错误');
        }

        res.render('rooms', { rooms, username: req.session.username });
    });
});

// 获取房间详情
app.get('/rooms/:id', (req, res) => {
    if (!req.session.adminId) {
        return res.redirect('/login');
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

        db.all('SELECT * FROM meter_readings WHERE room_id = ? ORDER BY reading_date DESC', [roomId], (err, readings) => {
            if (err) {
                console.error('获取读数历史错误:', err);
                return res.status(500).send('服务器错误');
            }

            res.render('room-detail', { room, readings, username: req.session.username });
        });
    });
});

// 更新房间信息
app.post('/rooms/:id/update', (req, res) => {
    if (!req.session.adminId) {
        return res.redirect('/login');
    }

    const roomId = req.params.id;
    const { monthly_rent, tax_rate, electricity_rate, water_rate } = req.body;

    db.run(
        'UPDATE rooms SET monthly_rent = ?, tax_rate = ?, electricity_rate = ?, water_rate = ? WHERE id = ?',
        [monthly_rent, tax_rate, electricity_rate, water_rate, roomId],
        (err) => {
            if (err) {
                console.error('更新房间信息错误:', err);
                return res.status(500).json({ success: false, message: '更新失败' });
            }

            res.json({ success: true, message: '更新成功' });
        }
    );
});

// 收据管理
app.get('/receipts', (req, res) => {
    if (!req.session.adminId) {
        return res.redirect('/login');
    }

    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    db.all(
        'SELECT r.*, room_number FROM receipts r JOIN rooms ON r.room_id = rooms.id ORDER BY r.receipt_month DESC, r.room_id ASC LIMIT ? OFFSET ?',
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
                    username: req.session.username
                });
            });
        }
    });
});

// 生成月收据
app.post('/receipts/generate', (req, res) => {
    if (!req.session.adminId) {
        return res.redirect('/login');
    }

    const roomId = req.body.room_id;
    const receiptMonth = req.body.receipt_month;

    db.get('SELECT * FROM rooms WHERE id = ?', [roomId], (err, room) => {
        if (err) {
            console.error('获取房间信息错误:', err);
            return res.status(500).json({ success: false, message: '获取房间信息失败' });
        }

        if (!room) {
            return res.status(404).json({ success: false, message: '房间不存在' });
        }

        db.get('SELECT * FROM meter_readings WHERE room_id = ? ORDER BY reading_date DESC LIMIT 1', [roomId], (err, readings) => {
            if (err) {
                console.error('获取读数错误:', err);
                return res.status(500).json({ success: false, message: '获取读数失败' });
            }

            let electricityBefore = 0;
            let waterBefore = 0;

            if (readings) {
                electricityBefore = readings.electricity_after;
                waterBefore = readings.water_after;
            }

            db.get('SELECT * FROM meter_readings WHERE room_id = ? AND reading_date = ?', [roomId, receiptMonth], (err, currentReadings) => {
                if (err) {
                    console.error('获取当前读数错误:', err);
                    return res.status(500).json({ success: false, message: '获取当前读数失败' });
                }

                let electricityAfter = electricityBefore;
                let waterAfter = waterBefore;

                if (currentReadings) {
                    electricityAfter = currentReadings.electricity_after;
                    waterAfter = currentReadings.water_after;
                }

                const monthlyRent = parseFloat(room.monthly_rent);
                const taxAmount = monthlyRent * parseFloat(room.tax_rate);
                const electricityConsumption = Math.max(0, electricityAfter - electricityBefore);
                const waterConsumption = Math.max(0, waterAfter - waterBefore);
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
    });
});

// 支付收据
app.post('/receipts/:id/pay', (req, res) => {
    if (!req.session.adminId) {
        return res.redirect('/login');
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

// 登出
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// 404
app.use((req, res) => {
    res.status(404).render('404');
});

// 启动服务器
app.listen(PORT, () => {
    console.log('================================');
    console.log('服务器运行在 http://localhost:' + PORT);
    console.log('================================');
    console.log('管理员账号: admin / admin123');
    console.log('================================');
    console.log('应用目录:', appDir);
    console.log('数据库文件:', dbPath);
    console.log('================================');
});
