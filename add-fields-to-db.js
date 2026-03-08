const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./rental_system.db');

console.log('=== 添加 housekeeping_fee 和 internet_fee 字段到数据库 ===\n');

db.serialize(() => {
    // 检查字段是否已存在
    db.all("PRAGMA table_info(rooms)", (err, columns) => {
        if (err) {
            console.error('错误:', err);
            db.close();
            return;
        }

        const fieldNames = columns.map(c => c.name);
        console.log('当前字段:', fieldNames.join(', '));
        console.log('');

        if (fieldNames.includes('housekeeping_fee')) {
            console.log('卫生费字段已存在，跳过');
        } else {
            console.log('添加卫生费字段...');
            db.run('ALTER TABLE rooms ADD COLUMN housekeeping_fee REAL DEFAULT 0', (err) => {
                if (err) {
                    console.error('添加卫生费字段失败:', err);
                } else {
                    console.log('✅ 卫生费字段添加成功');
                }
            });
        }

        if (fieldNames.includes('internet_fee')) {
            console.log('网费字段已存在，跳过');
        } else {
            console.log('添加网费字段...');
            db.run('ALTER TABLE rooms ADD COLUMN internet_fee REAL DEFAULT 0', (err) => {
                if (err) {
                    console.error('添加网费字段失败:', err);
                } else {
                    console.log('✅ 网费字段添加成功');
                }
            });
        }
    });

    // 等待添加完成
    setTimeout(() => {
        console.log('\n=== 验证字段 ===');
        db.all("PRAGMA table_info(rooms)", (err, columns) => {
            if (err) {
                console.error('错误:', err);
            } else {
                const fieldNames = columns.map(c => c.name);
                console.log('更新后的字段:', fieldNames.join(', '));
                console.log('');
                console.log('=== 示例数据 ===');
                db.all('SELECT * FROM rooms', (err, rows) => {
                    if (err) {
                        console.error('错误:', err);
                    } else {
                        rows.forEach((r, i) => {
                            console.log(`\n房间 ${i+1}: ${r.room_number}`);
                            console.log(`  月租金: ¥${r.monthly_rent}`);
                            console.log(`  卫生费: ¥${r.housekeeping_fee || 0}`);
                            console.log(`  网费: ¥${r.internet_fee || 0}`);
                        });
                    }
                    db.close();
                });
            }
        });
    }, 1000);
});
