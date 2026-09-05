const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, '../evoting_local.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('⚡ Initializing E-Voting OSIS Local Database...');

db.serialize(() => {
  // Users Table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      nisn TEXT UNIQUE,
      nis TEXT UNIQUE,
      role TEXT NOT NULL DEFAULT 'siswa',
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Voting Sessions Table
  db.run(`
    CREATE TABLE IF NOT EXISTS voting_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      start_time DATETIME NOT NULL,
      end_time DATETIME NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Candidates Table
  db.run(`
    CREATE TABLE IF NOT EXISTS candidates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      voting_session_id INTEGER NOT NULL,
      candidate_number INTEGER NOT NULL,
      name TEXT NOT NULL,
      vice_name TEXT,
      vision TEXT,
      mission TEXT,
      programs TEXT,
      motto TEXT,
      photo TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Votes Table
  db.run(`
    CREATE TABLE IF NOT EXISTS votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      voting_session_id INTEGER NOT NULL,
      voter_id INTEGER NOT NULL,
      candidate_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(voting_session_id, voter_id)
    )
  `);

  const defaultPasswordHash = bcrypt.hashSync('Dosman123', 10);

  // Seed Admin Account
  db.run(`
    INSERT OR IGNORE INTO users (id, name, email, role, password)
    VALUES (1, 'Administrator OSIS', 'admin@sims.sch.id', 'admin', ?)
  `, [defaultPasswordHash]);

  // Seed Siswa Account
  db.run(`
    INSERT OR IGNORE INTO users (id, name, email, nisn, nis, role, password)
    VALUES (2, 'I Made Siswa Utama', 'siswa@sims.sch.id', '0071234568', '2025001', 'siswa', ?)
  `, [defaultPasswordHash]);

  // Seed 5 Student Test Accounts with 10-digit NISN & password = NISN
  const sampleStudents = [
    { id: 3, name: 'Ni Wayan Cantika Putri', nisn: '0081234561', nis: '2025002', email: '0081234561@sims.sch.id' },
    { id: 4, name: 'I Gede Budi Pratama', nisn: '0082345672', nis: '2025003', email: '0082345672@sims.sch.id' },
    { id: 5, name: 'I Nyoman Aditya Kusuma', nisn: '0083456783', nis: '2025004', email: '0083456783@sims.sch.id' },
    { id: 6, name: 'Ni Made Ananya Devi', nisn: '0084567894', nis: '2025005', email: '0084567894@sims.sch.id' },
    { id: 7, name: 'I Ketut Rehan Mahardika', nisn: '0085678905', nis: '2025006', email: '0085678905@sims.sch.id' }
  ];

  sampleStudents.forEach(st => {
    const hash = bcrypt.hashSync(st.nisn, 10);
    db.run(`
      INSERT OR IGNORE INTO users (id, name, email, nisn, nis, role, password)
      VALUES (?, ?, ?, ?, ?, 'siswa', ?)
    `, [st.id, st.name, st.email, st.nisn, st.nis, hash]);
  });

  // Seed Active Session
  db.run(`
    INSERT OR IGNORE INTO voting_sessions (id, title, description, start_time, end_time, status)
    VALUES (1, 'Pemilihan Ketua & Wakil Ketua OSIS SMAN 1 Gianyar 2026/2027', 'Silakan tentukan hak suara Anda secara Langsung, Umum, Bebas, Rahasia, Jujur dan Adil.', datetime('now', '-1 hour'), datetime('now', '+12 hours'), 'active')
  `);

  // Seed Paslon 01
  db.run(`
    INSERT OR IGNORE INTO candidates (id, voting_session_id, candidate_number, name, vice_name, motto, vision, mission, programs)
    VALUES (
      1, 1, 1,
      'I Made Agus Sukarma',
      'Ni Putu Ayu Lestari',
      'Bersama Mewujudkan OSIS DOSMAN yang Inovatif, Kreatif, dan Berprestasi!',
      'Mewujudkan OSIS SMAN 1 Gianyar yang berintegritas, responsif terhadap perkembangan teknologi, serta wadah utama aspirasi siswa.',
      '1. Meningkatkan kedisiplinan dan karakter kebangsaan siswa.\n2. Mengembangkan bakat akademik & non-akademik melalui kegiatan digital.\n3. Mengoptimalkan kolaborasi antar-ekstrakurikuler.',
      '1. DOSMAN E-Sports & Art Championship\n2. Gerakan Zero Plastic School\n3. Pentas Seni & Inovasi Digital'
    )
  `);

  // Seed Paslon 02
  db.run(`
    INSERT OR IGNORE INTO candidates (id, voting_session_id, candidate_number, name, vice_name, motto, vision, mission, programs)
    VALUES (
      2, 1, 2,
      'I Kadek Yoga Pratama',
      'Ni Made Dewi Saraswati',
      'Unggul dalam Karya, Santun dalam Bersikap, Sinergi untuk DOSMAN!',
      'Terwujudnya lingkungan sekolah yang harmonis, berwawasan lingkungan, dan berdaya saing di tingkat nasional.',
      '1. Memperkuat rasa kekeluargaan antar-angkatan siswa SMAN 1 Gianyar.\n2. Membangun ruang literasi dan kewirausahaan muda.\n3. Menggalakkan aksi sosial peduli lingkungan.',
      '1. DOSMAN Youth Leader Camp\n2. Pojok Literasi & Mini Startup School\n3. Clean & Green DOSMAN Movement'
    )
  `);

  console.log('✅ Local Database successfully initialized with Paslon 01 & Paslon 02 data!');
});

db.close();
