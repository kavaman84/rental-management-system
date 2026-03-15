const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./rental_system.db');

console.log('正在连接数据库...');

db.serialize(() => {
  db.all('SELECT * FROM meter_readings ORDER BY reading_date ASC', (err, readings) => {
    if (err) {
      console.error('获取读数失败:', err.message);
      process.exit(1);
    }

    console.log(`找到 ${readings.length} 条电表水表读数记录\n`);

    let processed = 0;

    readings.forEach(reading => {
      db.get('SELECT * FROM rooms WHERE id = ?', [reading.room_id], (err, room) => {
        if (err) {
          console.error(`获取房间信息失败:`, err.message);
          return;
        }

        if (!room) {
          console.error(`房间不存在: room_id=${reading.room_id}`);
          return;
        }

        const electricityConsumption = Math.max(0, reading.electricity_after - reading.electricity_before);
        const waterConsumption = Math.max(0, reading.water_after - reading.water_before);
        const electricityAmount = electricityConsumption * parseFloat(room.electricity_rate || 0);
        const waterAmount = waterConsumption * parseFloat(room.water_rate || 0);
        const monthlyRent = parseFloat(room.monthly_rent);
        const taxAmount = monthlyRent * parseFloat(room.tax_rate || 0);
        const housekeepingFee = parseFloat(room.housekeeping_fee) || 0;
        const internetFee = parseFloat(room.internet_fee) || 0;
        const totalAmount = monthlyRent + taxAmount + electricityAmount + waterAmount + housekeepingFee + internetFee;

        db.get('SELECT * FROM receipts WHERE room_id = ? AND receipt_month = ?', [reading.room_id, reading.reading_date], (err, existing) => {
          if (err) {
            console.error(`检查收据失败:`, err.message);
            return;
          }

          if (existing) {
            console.log(`收据已存在: 房间 ${room.room_number} ${reading.reading_date}，跳过`);
          } else {
            db.run(
              'INSERT INTO receipts (room_id, receipt_month, monthly_rent, tax_amount, electricity_amount, water_amount, housekeeping_fee, internet_fee, total_amount, electricity_consumption, water_consumption, electricity_before, electricity_after, water_before, water_after, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [
                reading.room_id,
                reading.reading_date,
                monthlyRent,
                taxAmount,
                electricityAmount,
                waterAmount,
                housekeepingFee,
                internetFee,
                totalAmount,
                electricityConsumption,
                waterConsumption,
                reading.electricity_before,
                reading.electricity_after,
                reading.water_before,
                reading.water_after,
                'pending'
              ],
              function(err) {
                if (err) {
                  console.error(`创建收据失败:`, err.message);
                } else {
                  console.log(`✓ 已创建收据: 房间 ${room.room_number} ${reading.reading_date}`);
                }
              }
            );
          }
        });
      });
    });
  });
});

db.on('error', (err) => {
  console.error('数据库错误:', err.message);
  process.exit(1);
});
