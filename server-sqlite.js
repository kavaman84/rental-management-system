const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const app = express();
const PORT = 4000;

// 数据库连接
const dbPath = './rental_system.db';
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('数据库连接错误:', err);
    } else {
        console.log('数据库连接成功:', dbPath);
    }
});

// 邮件配置（需要根据实际情况修改）
// const transporter = nodemailer.createTransport({
// host: 'smtp.gmail.com', // 或其他SMTP服务器
// port: 587,
// secure: false,
// auth: {
// user: process.env.EMAIL_USER || 'your-email@gmail.com',
// pass: process.env.EMAIL_PASS || 'your-email-password'
// }
// });

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
        housekeeping_fee REAL DEFAULT 0,
        internet_fee REAL DEFAULT 0,
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
        electricity_amount REAL NOT NULL,
        water_amount REAL NOT NULL,
        total_amount REAL NOT NULL,
        electricity_consumption REAL,
        water_consumption REAL,
        electricity_before REAL DEFAULT 0,
        electricity_after REAL DEFAULT 0,
        water_before REAL DEFAULT 0,
        water_after REAL DEFAULT 0,
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

    // 插入示例管理员（可选，如需要可以取消注释）
    // db.run(`INSERT OR IGNORE INTO admins (username, password) VALUES (?, ?)`, ['admin', 'admin123']);
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

        db.get('SELECT COUNT(*) as total FROM receipts', (err, result) => {
            const receiptStats = result;

            db.get('SELECT COUNT(*) as unpaid FROM receipts WHERE status = "pending"', (err, result) => {
                const unpaidCount = result.unpaid;

                db.all('SELECT r.*, room_number FROM receipts r JOIN rooms ON r.room_id = rooms.id ORDER BY r.receipt_month DESC, r.room_id ASC LIMIT 5', (err, receipts) => {
                    if (err) {
                        console.error('获取收据列表错误:', err);
                        receipts = [];
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

// 获取房间数据（JSON格式，用于编辑）
app.get('/rooms/:id/json', (req, res) => {
    if (!req.session.adminId) {
        return res.redirect('/login');
    }

    const roomId = req.params.id;

    db.get('SELECT * FROM rooms WHERE id = ?', [roomId], (err, room) => {
        if (err) {
            console.error('获取房间信息错误:', err);
            return res.status(500).json({ success: false, message: '服务器错误' });
        }

        if (!room) {
            return res.status(404).json({ success: false, message: '房间不存在' });
        }

        res.json({
            success: true,
            room: {
                id: room.id,
                room_number: room.room_number,
                monthly_rent: room.monthly_rent,
                tax_rate: room.tax_rate,
                electricity_rate: room.electricity_rate,
                water_rate: room.water_rate,
                housekeeping_fee: room.housekeeping_fee,
                internet_fee: room.internet_fee
            }
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

// 删除房间
app.post('/rooms/:id/delete', (req, res) => {
    if (!req.session.adminId) {
        return res.redirect('/login');
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

                db.all('SELECT * FROM rooms ORDER BY room_number', (err, rooms) => {
                    if (err) {
                        console.error('获取房间列表错误:', err);
                        rooms = [];
                    }

                    res.render('receipts', {
                        receipts,
                        currentPage: page,
                        totalPages,
                        rooms,
                        username: req.session.username
                    });
                });
            });
        }
    );
});

// 生成月收据
app.post('/receipts/generate', (req, res) => {
    if (!req.session.adminId) {
        return res.redirect('/login');
    }

    const roomId = req.body.room_id;
    const receiptMonth = req.body.receipt_month;
    const electricityBefore = parseFloat(req.body.electricity_before) || 0;
    const electricityAfter = parseFloat(req.body.electricity_after) || 0;
    const waterBefore = parseFloat(req.body.water_before) || 0;
    const waterAfter = parseFloat(req.body.water_after) || 0;

    db.get('SELECT * FROM rooms WHERE id = ?', [roomId], (err, room) => {
        if (err) {
            console.error('获取房间信息错误:', err);
            return res.status(500).json({ success: false, message: '获取房间信息失败' });
        }

        if (!room) {
            return res.status(404).json({ success: false, message: '房间不存在' });
        }

        const monthlyRent = parseFloat(room.monthly_rent);
        const electricityConsumption = Math.max(0, electricityAfter - electricityBefore);
        const waterConsumption = Math.max(0, waterAfter - waterBefore);
        const electricityAmount = electricityConsumption * parseFloat(room.electricity_rate);
        const waterAmount = waterConsumption * parseFloat(room.water_rate);
        const housekeepingFee = parseFloat(room.housekeeping_fee) || 0;
        const internetFee = parseFloat(room.internet_fee) || 0;
        const totalAmount = monthlyRent + electricityAmount + waterAmount + housekeepingFee + internetFee;

        db.get('SELECT * FROM receipts WHERE room_id = ? AND receipt_month = ?', [roomId, receiptMonth], (err, existingReceipts) => {
            if (err) {
                console.error('检查收据错误:', err);
                return res.status(500).json({ success: false, message: '检查收据失败' });
            }

            if (existingReceipts) {
                return res.status(400).json({ success: false, message: '该月份的收据已存在' });
            }

            console.log('准备插入收据数据:', {
                roomId,
                receiptMonth,
                electricityBefore,
                electricityAfter,
                waterBefore,
                waterAfter
            });

            // 保存电表水表读数到 meter_readings 表
            db.run(
                'INSERT INTO meter_readings (room_id, reading_date, electricity_before, electricity_after, water_before, water_after) VALUES (?, ?, ?, ?, ?, ?)',
                [roomId, receiptMonth, electricityBefore, electricityAfter, waterBefore, waterAfter],
                (err) => {
                    if (err) {
                        console.error('保存读数错误:', err);
                    }
                }
            );

            // 插入收据
            db.run(
                'INSERT INTO receipts (room_id, receipt_month, monthly_rent, electricity_amount, water_amount, total_amount, electricity_consumption, water_consumption, electricity_before, electricity_after, water_before, water_after, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    roomId,
                    receiptMonth,
                    monthlyRent,
                    electricityAmount,
                    waterAmount,
                    totalAmount,
                    electricityConsumption,
                    waterConsumption,
                    electricityBefore,
                    electricityAfter,
                    waterBefore,
                    waterAfter,
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

// 获取收据详情（用于修改）
app.get('/receipts/:id', (req, res) => {
    if (!req.session.adminId) {
        return res.redirect('/login');
    }

    const receiptId = req.params.id;

    db.get(
        `SELECT r.*, room_number,
                (SELECT electricity_after FROM meter_readings
                 WHERE room_id = r.room_id AND reading_date < r.receipt_month
                 ORDER BY reading_date DESC LIMIT 1) AS electricity_before,
                (SELECT water_after FROM meter_readings
                 WHERE room_id = r.room_id AND reading_date < r.receipt_month
                 ORDER BY reading_date DESC LIMIT 1) AS water_before,
                (SELECT electricity_after FROM meter_readings
                 WHERE room_id = r.room_id AND reading_date = r.receipt_month) AS electricity_after,
                (SELECT water_after FROM meter_readings
                 WHERE room_id = r.room_id AND reading_date = r.receipt_month) AS water_after
         FROM receipts r
         JOIN rooms ON r.room_id = rooms.id
         WHERE r.id = ?`,
        [receiptId],
        (err, receipt) => {
            if (err) {
                console.error('获取收据详情错误:', err);
                return res.status(500).send('服务器错误');
            }

            if (!receipt) {
                return res.status(404).send('收据不存在');
            }

            res.json(receipt);
        }
    );
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

// 获取收据详情页面
app.get('/receipts/:id/detail', (req, res) => {
    if (!req.session.adminId) {
        return res.redirect('/login');
    }

    const receiptId = req.params.id;

    db.get(
        `SELECT r.*, room_number,
                (SELECT electricity_after FROM meter_readings
                 WHERE room_id = r.room_id AND reading_date < r.receipt_month
                 ORDER BY reading_date DESC LIMIT 1) AS electricity_before,
                (SELECT water_after FROM meter_readings
                 WHERE room_id = r.room_id AND reading_date < r.receipt_month
                 ORDER BY reading_date DESC LIMIT 1) AS water_before,
                (SELECT electricity_after FROM meter_readings
                 WHERE room_id = r.room_id AND reading_date = r.receipt_month) AS electricity_after,
                (SELECT water_after FROM meter_readings
                 WHERE room_id = r.room_id AND reading_date = r.receipt_month) AS water_after
         FROM receipts r
         JOIN rooms ON r.room_id = rooms.id
         WHERE r.id = ?`,
        [receiptId],
        (err, receipt) => {
            if (err) {
                console.error('获取收据详情错误:', err);
                return res.status(500).send('服务器错误');
            }

            if (!receipt) {
                return res.status(404).send('收据不存在');
            }

            res.render('receipt-detail', {
                receipt,
                username: req.session.username
            });
        }
    );
});

// 删除收据
app.post('/receipts/:id/delete', (req, res) => {
    if (!req.session.adminId) {
        return res.redirect('/login');
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

// 获取上月读数（用于生成收据时自动填充）
app.get('/receipts/meter-readings/:roomId/:receiptMonth', (req, res) => {
    if (!req.session.adminId) {
        return res.redirect('/login');
    }

    const { roomId, receiptMonth } = req.params;

    db.get(
        `SELECT room_number,
                (SELECT electricity_after FROM meter_readings
                 WHERE room_id = ? AND reading_date < ?
                 ORDER BY reading_date DESC LIMIT 1) AS electricity_before,
                (SELECT water_after FROM meter_readings
                 WHERE room_id = ? AND reading_date < ?
                 ORDER BY reading_date DESC LIMIT 1) AS water_before
         FROM rooms
         WHERE id = ?`,
        [roomId, receiptMonth, roomId, receiptMonth, roomId],
        (err, data) => {
            if (err) {
                console.error('获取上月读数错误:', err);
                return res.json({
                    success: true,
                    electricity_before: 0,
                    water_before: 0,
                    message: '未找到上月读数，使用默认值0'
                });
            }

            if (!data) {
                return res.json({
                    success: true,
                    electricity_before: 0,
                    water_before: 0,
                    message: '未找到房间信息，使用默认值0'
                });
            }

            res.json({
                success: true,
                electricity_before: data.electricity_before || 0,
                water_before: data.water_before || 0,
                room_number: data.room_number
            });
        }
    );
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
    console.log(`================================`);
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log(`================================`);
    console.log(`管理员账号: admin / admin123`);
    console.log(`================================`);
});
