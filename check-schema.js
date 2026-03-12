const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./rental_system.db');

db.all("PRAGMA table_info(rooms)", (err, columns) => {
    if (err) {
        console.error('Error:', err);
    } else {
        console.log('Rooms table columns:', columns);
    }

    db.all("PRAGMA table_info(receipts)", (err, columns) => {
        if (err) {
            console.error('Error:', err);
        } else {
            console.log('Receipts table columns:', columns);
        }

        db.close();
    });
});
