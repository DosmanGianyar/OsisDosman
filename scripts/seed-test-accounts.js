const mysql = require('mysql2/promise');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const accounts = [];
for (let i = 1; i <= 10; i++) {
  const numStr = String(i).padStart(2, '0');
  const nisn = `88000000${numStr}`;
  const nis = `880${numStr}`;
  const name = `Contoh Siswa ${i}`;
  const email = `${nisn}@dosman.sch.id`;
  accounts.push({ name, nisn, nis, email });
}

async function run() {
  const defaultPasswordHash = bcrypt.hashSync('Dosman123', 10);

  // 1. Seed MariaDB if available
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || 'dosman',
      password: process.env.DB_PASS || '2Z8TdNFDn7c367PD',
      database: process.env.DB_NAME || 'sims_db'
    });

    console.log('✅ Connected to MariaDB sims_db, inserting 10 test accounts...');
    for (const acc of accounts) {
      await connection.execute(
        `INSERT INTO users (name, email, nisn, nis, role, password)
         VALUES (?, ?, ?, ?, 'siswa', ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name), email = VALUES(email), nis = VALUES(nis), password = VALUES(password)`,
        [acc.name, acc.email, acc.nisn, acc.nis, defaultPasswordHash]
      );
    }
    console.log('✅ MariaDB seeding completed successfully!');
    await connection.end();
  } catch (err) {
    console.warn('⚠️ MariaDB connection failed or skipped:', err.message);
  }

  // 2. Seed Local SQLite
  const dbPath = path.resolve(__dirname, '../evoting_local.sqlite');
  const sqliteDb = new sqlite3.Database(dbPath);
  console.log('⚡ Seeding SQLite local database...');
  
  sqliteDb.serialize(() => {
    accounts.forEach(acc => {
      sqliteDb.run(
        `INSERT INTO users (name, email, nisn, nis, role, password)
         VALUES (?, ?, ?, ?, 'siswa', ?)
         ON CONFLICT(nisn) DO UPDATE SET name = excluded.name, email = excluded.email, nis = excluded.nis, password = excluded.password`,
        [acc.name, acc.email, acc.nisn, acc.nis, defaultPasswordHash]
      );
    });
    console.log('✅ SQLite seeding completed successfully!');
  });
  sqliteDb.close();
}

run();
