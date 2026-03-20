const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const PORT = 4000;

// 数据库连接
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '', // 修改为你的MySQL密码
    database: 'rental_system',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// 中间件
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

// 首页
app.get('/', (req, res) => {
    res.redirect('/login');
});

// 登录页面
app.get('/login', (req, res) => {
    res.render('login');
});

// 登录处理
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.query(
        'SELECT * FROM admins WHERE username = ?',
        [username],
        (err, results) => {
            if (err) {
                console.error('登录错误:', err);
                return res.status(500).send('服务器错误');
            }

            if (results.length === 0) {
                return res.render('login', { error: '用户名或密码错误' });
            }

            const admin = results[0];

            // 验证密码（简单示例，实际应该使用bcrypt）
            if (admin.password === password) {
                req.session.adminId = admin.id;
                req.session.username = admin.username;
                res.redirect('/dashboard');
            } else {
                res.render('login', { error: '用户名或密码错误' });
            }
        }
    );
});

// 仪表板
app.get('/dashboard', (req, res) => {
    if (!req.session.adminId) {
        return res.redirect('/login');
    }

    // 获取所有房间
    db.query('SELECT * FROM rooms ORDER BY room_number', (err, rooms) => {
        if (err) {
            console.error('获取房间列表错误:', err);
            return res.status(500).send('服务器错误');
        }

        // 获取收据统计
        db.query(
            'SELECT COUNT(*) as total FROM receipts',
            (err, result) => {
                const receiptStats = result[0];

                // 获取未付收据数量
                db.query(
                    'SELECT COUNT(*) as unpaid FROM receipts WHERE status = "pending"',
                    (err, result) => {
                        const unpaidCount = result[0].unpaid;

                        res.render('dashboard', {
                            rooms,
                            receiptStats,
                            unpaidCount,
                            username: req.session.username
                        });
                    }
                );
            }
        );
    });
});

// 房间管理
app.get('/rooms', (req, res) => {
    if (!req.session.adminId) {
        return res.redirect('/login');
    }

    db.query('SELECT * FROM rooms ORDER BY room_number', (err, rooms) => {
        if (err) {
            console.error('获取房间列表错误:', err);
            return res.status(500).send('服务器错误');
        }

        res.render('rooms', { rooms });
    });
});

// 获取房间详情
app.get('/rooms/:id', (req, res) => {
    if (!req.session.adminId) {
        return res.redirect('/login');
    }

    const roomId = req.params.id;

    db.query('SELECT * FROM rooms WHERE id = ?', [roomId], (err, rooms) => {
        if (err) {
            console.error('获取房间详情错误:', err);
            return res.status(500).send('服务器错误');
        }

        if (rooms.length === 0) {
            return res.status(404).send('房间不存在');
        }

        const room = rooms[0];

        // 获取该房间的电表水表读数历史
        db.query(
            'SELECT * FROM meter_readings WHERE room_id = ? ORDER BY reading_date DESC',
            [roomId],
            (err, readings) => {
                if (err) {
                    console.error('获取读数历史错误:', err);
                    return res.status(500).send('服务器错误');
                }

                res.render('room-detail', { room, readings });
            }
        );
    });
});

// 更新房间信息
app.post('/rooms/:id/update', (req, res) => {
    if (!req.session.adminId) {
        return res.redirect('/login');
    }

    const roomId = req.params.id;
    const { monthly_rent, tax_rate, electricity_rate, water_rate } = req.body;

    db.query(
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

    // 获取收据列表
    db.query(
        'SELECT r.*, room_number FROM receipts r JOIN rooms ON r.room_id = rooms.id ORDER BY r.receipt_month DESC, r.room_id ASC LIMIT ? OFFSET ?',
        [limit, offset],
        (err, receipts) => {
            if (err) {
                console.error('获取收据列表错误:', err);
                return res.status(500).send('服务器错误');
            }

            // 获取总数
            db.query('SELECT COUNT(*) as total FROM receipts', (err, result) => {
                const total = result[0].total;
                const totalPages = Math.ceil(total / limit);

                res.render('receipts', {
                    receipts,
                    currentPage: page,
                    totalPages,
                    username: req.session.username
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

    // 获取房间信息
    db.query('SELECT * FROM rooms WHERE id = ?', [roomId], (err, rooms) => {
        if (err) {
            console.error('获取房间信息错误:', err);
            return res.status(500).json({ success: false, message: '获取房间信息失败' });
        }

        if (rooms.length === 0) {
            return res.status(404).json({ success: false, message: '房间不存在' });
        }

        const room = rooms[0];

        // 获取上个月的电表水表读数
        db.query(
            'SELECT * FROM meter_readings WHERE room_id = ? ORDER BY reading_date DESC LIMIT 1',
            [roomId],
            (err, readings) => {
                if (err) {
                    console.error('获取读数错误:', err);
                    return res.status(500).json({ success: false, message: '获取读数失败' });
                }

                let electricityBefore = 0;
                let waterBefore = 0;

                if (readings.length > 0) {
                    electricityBefore = readings[0].electricity_after;
                    waterBefore = readings[0].water_after;
                }

                // 获取当前月份的读数
                db.query(
                    'SELECT * FROM meter_readings WHERE room_id = ? AND reading_date = ?',
                    [roomId, receiptMonth],
                    (err, currentReadings) => {
                        if (err) {
                            console.error('获取当前读数错误:', err);
                            return res.status(500).json({ success: false, message: '获取当前读数失败' });
                        }

                        let electricityAfter = electricityBefore;
                        let waterAfter = waterBefore;

                        if (currentReadings.length > 0) {
                            electricityAfter = currentReadings[0].electricity_after;
                            waterAfter = currentReadings[0].water_after;
                        }

                        // 计算费用
                        const monthlyRent = parseFloat(room.monthly_rent);
                        const taxAmount = monthlyRent * parseFloat(room.tax_rate);
                        const electricityConsumption = Math.max(0, electricityAfter - electricityBefore);
                        const waterConsumption = Math.max(0, waterAfter - waterBefore);
                        const electricityAmount = electricityConsumption * parseFloat(room.electricity_rate);
                        const waterAmount = waterConsumption * parseFloat(room.water_rate);
                        const totalAmount = monthlyRent + taxAmount + electricityAmount + waterAmount;

                        // 检查是否已存在收据
                        db.query(
                            'SELECT * FROM receipts WHERE room_id = ? AND receipt_month = ?',
                            [roomId, receiptMonth],
                            (err, existingReceipts) => {
                                if (err) {
                                    console.error('检查收据错误:', err);
                                    return res.status(500).json({ success: false, message: '检查收据失败' });
                                }

                                if (existingReceipts.length > 0) {
                                    return res.status(400).json({ success: false, message: '该月份的收据已存在' });
                                }

                                // 插入收据
                                db.query(
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
                            }
                        );
                    }
                );
            }
        );
    });
});

// 支付收据
app.post('/receipts/:id/pay', (req, res) => {
    if (!req.session.adminId) {
        return res.redirect('/login');
    }

    const receiptId = req.params.id;

    db.query(
        'UPDATE receipts SET status = "paid" WHERE id = ?',
        [receiptId],
        (err) => {
            if (err) {
                console.error('更新收据状态错误:', err);
                return res.status(500).json({ success: false, message: '更新失败' });
            }

            res.json({ success: true, message: '支付成功' });
        }
    );
});

// 删除收据
app.post('/receipts/:id/delete', (req, res) => {
    if (!req.session.adminId) {
        return res.redirect('/login');
    }

    const receiptId = req.params.id;

    db.query('DELETE FROM receipts WHERE id = ?', [receiptId], (err) => {
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
    res.redirect('/login');
});

// 404
app.use((req, res) => {
    res.status(404).render('404');
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
});
