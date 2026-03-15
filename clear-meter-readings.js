const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./rental_system.db');

console.log('正在连接数据库...');
db.serialize(() => {
  console.log('清空 meter_readings 表中的数据...');

  db.run('DELETE FROM meter_readings', function(err) {
    if (err) {
      console.error('清空数据失败:', err.message);
      process.exit(1);
    }
    console.log(`成功清空 ${this.changes} 条记录`);

    // 查询剩余记录数
    db.get('SELECT COUNT(*) as count FROM meter_readings', (err, row) => {
      if (err) {
        console.error('查询失败:', err.message);
        process.exit(1);
      }
      console.log(`当前 meter_readings 表中共有 ${row.count} 条记录`);

      // 显示最新的几条记录（如果有）
      if (row.count > 0) {
        console.log('\n最新的记录:');
        db.all('SELECT * FROM meter_readings ORDER BY id DESC LIMIT 5', (err, rows) => {
          if (err) {
            console.error('查询记录失败:', err.message);
          } else {
            console.table(rows);
          }
          db.close();
          process.exit(0);
        });
      } else {
        console.log('meter_readings 表已清空');
        db.close();
        process.exit(0);
      }
    });
  });
});

db.on('error', (err) => {
  console.error('数据库错误:', err.message);
  process.exit(1);
});
