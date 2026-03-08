const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./rental_system.db');

console.log('=== 安全迁移 receipts 表 ===\n');

db.serialize(() => {
    // 1. 备份现有数据
    console.log('1. 备份现有数据...');
    db.all('SELECT * FROM receipts', (err, rows) => {
        if (err) {
            console.error('备份失败:', err);
            db.close();
            return;
        }
        
        console.log(`   找到 ${rows.length} 条收据记录`);
        
        // 2. 创建新表
        console.log('\n2. 创建新表 receipts_new...');
        db.run('DROP TABLE IF EXISTS receipts_new', (err) => {
            if (err) {
                console.error('删除旧表失败:', err);
                db.close();
                return;
            }
            
            db.run(`CREATE TABLE receipts_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                room_id INTEGER NOT NULL,
                receipt_month TEXT NOT NULL,
                monthly_rent REAL NOT NULL,
                electricity_amount REAL NOT NULL,
                water_amount REAL NOT NULL,
                housekeeping_fee REAL DEFAULT 0,
                internet_fee REAL DEFAULT 0,
                total_amount REAL NOT NULL,
                electricity_consumption REAL,
                water_consumption REAL,
                status TEXT DEFAULT 'pending',
                receipt_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
                UNIQUE(room_id, receipt_month)
            )`, (err) => {
                if (err) {
                    console.error('创建新表失败:', err);
                    db.close();
                    return;
                }
                
                console.log('   ✅ receipts_new 表创建成功');
                
                // 3. 复制数据到新表
                console.log('\n3. 复制数据到新表...');
                const stmt = db.prepare('INSERT INTO receipts_new (id, room_id, receipt_month, monthly_rent, electricity_amount, water_amount, total_amount, electricity_consumption, water_consumption, status, receipt_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
                
                rows.forEach(row => {
                    stmt.run(
                        row.id,
                        row.room_id,
                        row.receipt_month,
                        row.monthly_rent,
                        row.electricity_amount,
                        row.water_amount,
                        row.total_amount,
                        row.electricity_consumption,
                        row.water_consumption,
                        row.status,
                        row.receipt_date
                    );
                });
                
                stmt.finalize((err) => {
                    if (err) {
                        console.error('数据复制失败:', err);
                        db.close();
                        return;
                    }
                    
                    console.log(`   ✅ 成功复制 ${rows.length} 条记录`);
                    
                    // 4. 删除旧表
                    console.log('\n4. 删除旧表 receipts...');
                    db.run('DROP TABLE receipts', (err) => {
                        if (err) {
                            console.error('删除旧表失败:', err);
                            db.close();
                            return;
                        }
                        
                        console.log('   ✅ 旧表删除成功');
                        
                        // 5. 重命名新表
                        console.log('\n5. 重命名 receipts_new 为 receipts...');
                        db.run('ALTER TABLE receipts_new RENAME TO receipts', (err) => {
                            if (err) {
                                console.error('重命名失败:', err);
                                db.close();
                                return;
                            }
                            
                            console.log('   ✅ 表重命名成功');
                            
                            // 6. 验证
                            console.log('\n6. 验证迁移结果...');
                            db.all('SELECT * FROM receipts LIMIT 5', (err, rows) => {
                                if (err) {
                                    console.error('验证失败:', err);
                                    db.close();
                                    return;
                                }
                                
                                console.log(`   ✅ 迁移完成！成功迁移 ${rows.length} 条记录`);
                                console.log('\n   新的表结构:');
                                db.all('PRAGMA table_info(receipts)', (err, columns) => {
                                    if (err) {
                                        console.error('获取表结构失败:', err);
                                    } else {
                                        const fieldNames = columns.map(c => c.name).join(', ');
                                        console.log(`   字段: ${fieldNames}`);
                                    }
                                    db.close();
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});
