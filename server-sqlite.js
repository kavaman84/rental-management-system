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

    // 插入示例管理员
    db.run(`INSERT OR IGNORE INTO admins (username, password) VALUES (?, ?)`, ['admin', 'admin123']);

    // 检查并添加电表水表读数字段到 receipts 表
    db.all("PRAGMA table_info(receipts)", (err, columns) => {
        if (err) {
            console.error('检查 receipts 表结构错误:', err);
            return;
        }

        const fieldNames = columns.map(c => c.name);

        // 添加电表水表读数字段
        if (!fieldNames.includes('electricity_before')) {
            console.log('添加 electricity_before 字段到 receipts 表...');
            db.run('ALTER TABLE receipts ADD COLUMN electricity_before REAL DEFAULT 0');
        }

        if (!fieldNames.includes('electricity_after')) {
            console.log('添加 electricity_after 字段到 receipts 表...');
            db.run('ALTER TABLE receipts ADD COLUMN electricity_after REAL DEFAULT 0');
        }

        if (!fieldNames.includes('water_before')) {
            console.log('添加 water_before 字段到 receipts 表...');
            db.run('ALTER TABLE receipts ADD COLUMN water_before REAL DEFAULT 0');
        }

        if (!fieldNames.includes('water_after')) {
            console.log('添加 water_after 字段到 receipts 表...');
            db.run('ALTER TABLE receipts ADD COLUMN water_after REAL DEFAULT 0');
        }
    });
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

        // 获取该房间的读数记录
        db.all('SELECT * FROM meter_readings WHERE room_id = ? ORDER BY reading_date DESC', [roomId], (err, readings) => {
            if (err) {
                console.error('获取读数记录错误:', err);
                readings = [];
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
    const { room_number, monthly_rent, tax_rate, electricity_rate, water_rate, housekeeping_fee, internet_fee } = req.body;

    db.run(
        'UPDATE rooms SET room_number = ?, monthly_rent = ?, tax_rate = ?, electricity_rate = ?, water_rate = ?, housekeeping_fee = ?, internet_fee = ? WHERE id = ?',
        [room_number, monthly_rent, tax_rate, electricity_rate, water_rate, housekeeping_fee, internet_fee, roomId],
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

// 电表水表读数管理
app.get('/rooms/:id/meter-readings', (req, res) => {
    if (!req.session.adminId) {
        return res.redirect('/login');
    }

    const roomId = req.params.id;

    db.all('SELECT * FROM meter_readings WHERE room_id = ? ORDER BY reading_date DESC', [roomId], (err, readings) => {
        if (err) {
            console.error('获取读数记录错误:', err);
            return res.status(500).json({ success: false, message: '服务器错误' });
        }

        res.json({
            success: true,
            readings: readings
        });
    });
});

// 添加/更新电表水表读数记录
app.post('/rooms/:id/meter-readings', (req, res) => {
    if (!req.session.adminId) {
        return res.redirect('/login');
    }

    const roomId = req.params.id;
    const { reading_date, electricity_before, electricity_after, water_before, water_after } = req.body;

    // 检查房间是否存在
    db.get('SELECT * FROM rooms WHERE id = ?', [roomId], (err, room) => {
        if (err) {
            console.error('检查房间错误:', err);
            return res.status(500).json({ success: false, message: '服务器错误' });
        }

        if (!room) {
            return res.status(404).json({ success: false, message: '房间不存在' });
        }

        // 检查是否已存在该日期的读数
        db.get('SELECT * FROM meter_readings WHERE room_id = ? AND reading_date = ?', [roomId, reading_date], (err, existing) => {
            if (err) {
                console.error('检查读数错误:', err);
                return res.status(500).json({ success: false, message: '服务器错误' });
            }

            if (existing) {
                // 更新现有读数
                db.run(
                    'UPDATE meter_readings SET electricity_before = ?, electricity_after = ?, water_before = ?, water_after = ? WHERE id = ?',
                    [electricity_before, electricity_after, water_before, water_after, existing.id],
                    (err) => {
                        if (err) {
                            console.error('更新读数错误:', err);
                            return res.status(500).json({ success: false, message: '更新失败' });
                        }

                        res.json({ success: true, message: '更新成功' });
                    }
                );
            } else {
                // 添加新读数
                db.run(
                    'INSERT INTO meter_readings (room_id, reading_date, electricity_before, electricity_after, water_before, water_after) VALUES (?, ?, ?, ?, ?, ?)',
                    [roomId, reading_date, electricity_before, electricity_after, water_before, water_after],
                    (err) => {
                        if (err) {
                            console.error('添加读数错误:', err);
                            return res.status(500).json({ success: false, message: '添加失败' });
                        }

                        res.json({ success: true, message: '添加成功' });
                    }
                );
            }
        });
    });
});

// 删除电表水表读数记录
app.delete('/rooms/:id/meter-readings/:readingId', (req, res) => {
    if (!req.session.adminId) {
        return res.redirect('/login');
    }

    const { id, readingId } = req.params;

    db.run('DELETE FROM meter_readings WHERE id = ?', [readingId], (err) => {
        if (err) {
            console.error('删除读数错误:', err);
            return res.status(500).json({ success: false, message: '删除失败' });
        }

        res.json({ success: true, message: '删除成功' });
    });
});

// 获取单个电表水表读数记录
app.get('/rooms/meter-readings/:readingId', (req, res) => {
    if (!req.session.adminId) {
        return res.redirect('/login');
    }

    const readingId = req.params.readingId;

    db.get('SELECT * FROM meter_readings WHERE id = ?', [readingId], (err, reading) => {
        if (err) {
            console.error('获取读数错误:', err);
            return res.status(500).json({ success: false, message: '服务器错误' });
        }

        if (!reading) {
            return res.status(404).json({ success: false, message: '读数不存在' });
        }

        res.json({
            success: true,
            reading: {
                id: reading.id,
                reading_date: reading.reading_date,
                electricity_before: reading.electricity_before,
                electricity_after: reading.electricity_after,
                water_before: reading.water_before,
                water_after: reading.water_after
            }
        });
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

    db.all('SELECT * FROM rooms ORDER BY room_number', (err, rooms) => {
        if (err) {
            console.error('获取房间列表错误:', err);
            return res.status(500).send('服务器错误');
        }

        db.all(
            'SELECT r.*, room_number FROM receipts r JOIN rooms ON r.room_id = rooms.id ORDER BY r.receipt_month DESC, r.room_id ASC LIMIT ? OFFSET ?',
            [limit, offset],
            (err, receipts) => {
                if (err) {
                    console.error('获取收据列表错误:', err);
                    return res.status(500).send('服务器错误');
                }

                // 获取总记录数
                db.get('SELECT COUNT(*) as total FROM receipts', (err, result) => {
                    if (err) {
                        console.error('获取总记录数错误:', err);
                        return res.status(500).send('服务器错误');
                    }

                    const total = result.total;
                    const totalPages = Math.ceil(total / limit);

                    // 为每条收据添加房间电表和水表读数信息
                    const promises = receipts.map(receipt => {
                        return new Promise((resolve) => {
                            // 查找该房间在收据月份之前的最近一次读数
                            db.get('SELECT * FROM meter_readings WHERE room_id = ? AND reading_date < ? ORDER BY reading_date DESC LIMIT 1', [receipt.room_id, receipt.receipt_month], (err, previousReadings) => {
                                // 查找该月份的读数（如果有）
                                db.get('SELECT * FROM meter_readings WHERE room_id = ? AND reading_date = ? ORDER BY id DESC LIMIT 1', [receipt.room_id, receipt.receipt_month], (err, currentReadings) => {
                                    if (err) {
                                        console.error('获取读数错误:', err);
                                    }

                                    if (currentReadings) {
                                        // 如果有当月的读数，使用当月的读数
                                        receipt.electricity_before = previousReadings ? previousReadings.electricity_after : currentReadings.electricity_before;
                                        receipt.electricity_after = currentReadings.electricity_after;
                                        receipt.water_before = previousReadings ? previousReadings.water_after : currentReadings.water_before;
                                        receipt.water_after = currentReadings.water_after;
                                    } else if (previousReadings) {
                                        // 如果没有当月读数，但有过往读数，使用上次读数
                                        receipt.electricity_before = previousReadings.electricity_after;
                                        receipt.electricity_after = previousReadings.electricity_after;
                                        receipt.water_before = previousReadings.water_after;
                                        receipt.water_after = previousReadings.water_after;
                                    } else {
                                        // 没有任何读数
                                        receipt.electricity_before = 0;
                                        receipt.electricity_after = 0;
                                        receipt.water_before = 0;
                                        receipt.water_after = 0;
                                    }
                                    resolve();
                                });
                            });
                        });
                    });

                    Promise.all(promises).then(() => {
                        res.render('receipts', {
                            receipts,
                            currentPage: page,
                            totalPages,
                            username: req.session.username,
                            rooms
                        });
                    });
                });
            }
        );
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

                // 如果有当月的读数，使用当月读数
                if (currentReadings) {
                    electricityAfter = currentReadings.electricity_after;
                    waterAfter = currentReadings.water_after;
                } else if (readings) {
                    // 如果没有当月读数，使用之前的读数作为参考
                    electricityAfter = readings.electricity_after;
                    waterAfter = readings.water_after;
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

                    db.run(
                        'INSERT INTO receipts (room_id, receipt_month, monthly_rent, electricity_amount, water_amount, housekeeping_fee, internet_fee, total_amount, electricity_consumption, water_consumption, electricity_before, electricity_after, water_before, water_after, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                        [
                            roomId,
                            receiptMonth,
                            monthlyRent,
                            electricityAmount,
                            waterAmount,
                            housekeepingFee,
                            internetFee,
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

                            console.log('收据创建成功，插入的值:', {
                                electricityBefore,
                                electricityAfter,
                                waterBefore,
                                waterAfter
                            });

                            res.json({
                                success: true,
                                message: '收据生成成功',
                                receipt: {
                                    room_number: room.room_number,
                                    receipt_month: receiptMonth,
                                    monthly_rent: monthlyRent,
                                    electricity_amount: electricityAmount,
                                    water_amount: waterAmount,
                                    housekeeping_fee: housekeepingFee,
                                    internet_fee: internetFee,
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

// 获取上月读数（用于修改收据时自动填充）
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
                // 返回默认值0，允许用户手动填写
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

// 更新收据
app.post('/receipts/:id/update', (req, res) => {
    if (!req.session.adminId) {
        return res.redirect('/login');
    }

    const receiptId = req.params.id;
    const { receipt_month, electricity_before, electricity_after, water_before, water_after } = req.body;

    db.run(
        `UPDATE receipts SET
            receipt_month = ?,
            electricity_before = ?,
            electricity_after = ?,
            water_before = ?,
            water_after = ?
         WHERE id = ?`,
        [receipt_month, electricity_before, electricity_after, water_before, water_after, receiptId],
        (err) => {
            if (err) {
                console.error('更新收据错误:', err);
                return res.status(500).json({ success: false, message: '更新失败' });
            }

            res.json({ success: true, message: '更新成功' });
        }
    );
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
                username: req.session.username,
                room: receipt
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
