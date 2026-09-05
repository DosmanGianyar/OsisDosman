require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// Configure Multer for Candidate Photo Uploads
const uploadsDir = path.join(__dirname, 'public/uploads/candidates');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, 'candidate-' + uniqueSuffix + ext);
  }
});
const upload = multer({ storage: storage });

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(session({
  secret: process.env.SESSION_SECRET || 'evoting_secret_key_2026',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 2 * 60 * 60 * 1000 } // 2 hours
}));

// Database Setup (MariaDB sims_db on webdosman + SQLite local fallback)
const sqliteDbPath = path.resolve(__dirname, process.env.SQLITE_DB_PATH || './evoting_local.sqlite');
const sqliteDb = new sqlite3.Database(sqliteDbPath);

let mysqlPool = null;
let useMysql = false;

const primaryDbHost = process.env.DB_HOST || '127.0.0.1';

function createMysqlPool(host) {
  return mysql.createPool({
    host: host,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'dosman',
    password: process.env.DB_PASS || '2Z8TdNFDn7c367PD',
    database: process.env.DB_NAME || 'sims_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 3000
  });
}

async function checkDatabaseConnection() {
  const hostsToTry = [primaryDbHost, '100.73.61.126'];
  for (const host of hostsToTry) {
    try {
      const pool = createMysqlPool(host);
      const conn = await pool.getConnection();
      console.log(`✅ Terhubung ke Database Production MariaDB sims_db (${host})!`);
      mysqlPool = pool;
      useMysql = true;
      conn.release();
      return;
    } catch (err) {
      // Try next host
    }
  }
  console.log('ℹ️ Server MariaDB tidak terjangkau langsung, menggunakan Database SQLite Lokal.');
  useMysql = false;
}
checkDatabaseConnection();

// Auto-seed candidates if empty (MariaDB / SQLite fallback)
async function ensureDefaultCandidates() {
  try {
    // 1. Ensure active voting_session id = 1 exists
    const sessionRows = await queryDb(`SELECT count(*) as count FROM voting_sessions`);
    const sessionCount = sessionRows[0]?.count || 0;
    if (sessionCount === 0) {
      console.log('🌱 Seeding default voting session into voting_sessions table...');
      if (useMysql) {
        await runDb(`
          INSERT INTO voting_sessions (id, title, description, start_time, end_time, status, created_by)
          VALUES (1, 'Pemilihan Ketua OSIS SMAN 1 Gianyar 2026/2027', 'Silakan tentukan hak suara Anda secara Langsung, Umum, Bebas, Rahasia, Jujur dan Adil.', '2026-09-01 00:00:00', '2026-09-30 23:59:59', 'active', 1)
        `);
      } else {
        await runDb(`
          INSERT INTO voting_sessions (id, title, description, start_time, end_time, status)
          VALUES (1, 'Pemilihan Ketua OSIS SMAN 1 Gianyar 2026/2027', 'Silakan tentukan hak suara Anda secara Langsung, Umum, Bebas, Rahasia, Jujur dan Adil.', '2026-09-01 00:00:00', '2026-09-30 23:59:59', 'active')
        `);
      }
    } else {
      await runDb(`UPDATE voting_sessions SET title = 'Pemilihan Ketua OSIS SMAN 1 Gianyar 2026/2027' WHERE id = 1`);
    }

    // 2. Ensure candidates exist
    const rows = await queryDb(`SELECT count(*) as count FROM candidates`);
    const count = rows[0]?.count || 0;
    if (count === 0) {
      console.log('🌱 Seeding default Calon 01 & Calon 02 into candidates table...');
      await runDb(`
        INSERT INTO candidates (id, voting_session_id, candidate_number, name, vice_name, motto, vision, mission, programs, photo)
        VALUES (
          1, 1, 1,
          'I Made Agus Sukarma',
          NULL,
          'Inovatif, Berintegritas, dan Berprestasi untuk OSIS DOSMAN!',
          'Mewujudkan OSIS SMAN 1 Gianyar yang berintegritas, responsif terhadap perkembangan teknologi, serta wadah utama aspirasi siswa.',
          '1. Meningkatkan kedisiplinan dan karakter kebangsaan siswa.\n2. Mengembangkan bakat akademik & non-akademik melalui kegiatan digital.\n3. Mengoptimalkan kolaborasi antar-ekstrakurikuler.',
          '1. DOSMAN E-Sports & Art Championship\n2. Gerakan Zero Plastic School\n3. Pentas Seni & Inovasi Digital',
          '/uploads/candidates/paslon1.jpg'
        )
      `);
      await runDb(`
        INSERT INTO candidates (id, voting_session_id, candidate_number, name, vice_name, motto, vision, mission, programs, photo)
        VALUES (
          2, 1, 2,
          'Ni Made Dewi Saraswati',
          NULL,
          'Unggul dalam Karya, Santun dalam Bersikap, Sinergi untuk DOSMAN!',
          'Terwujudnya lingkungan sekolah yang harmonis, berwawasan lingkungan, dan berdaya saing di tingkat nasional.',
          '1. Memperkuat rasa kekeluargaan antar-siswa SMAN 1 Gianyar.\n2. Membangun ruang literasi dan kewirausahaan muda.\n3. Menggalakkan aksi sosial peduli lingkungan.',
          '1. DOSMAN Youth Leader Camp\n2. Pojok Literasi & Mini Startup School\n3. Clean & Green DOSMAN Movement',
          '/uploads/candidates/paslon2.jpg'
        )
      `);
      console.log('✅ Default Calon Ketua OSIS seeded successfully!');
    } else {
      // Ensure photos are set if currently empty or null
      await runDb(`UPDATE candidates SET photo = '/uploads/candidates/paslon1.jpg' WHERE candidate_number = 1 AND (photo IS NULL OR photo = '')`);
      await runDb(`UPDATE candidates SET photo = '/uploads/candidates/paslon2.jpg' WHERE candidate_number = 2 AND (photo IS NULL OR photo = '')`);
    }
  } catch (err) {
    console.error('Error in ensureDefaultCandidates:', err.message);
  }
}
setTimeout(ensureDefaultCandidates, 2000);

// Promisified Query helper supporting MariaDB & SQLite
function querySqlite(sql, params = []) {
  return new Promise((resolve, reject) => {
    sqliteDb.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function runSqlite(sql, params = []) {
  return new Promise((resolve, reject) => {
    sqliteDb.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

async function queryDb(sql, params = []) {
  if (useMysql && mysqlPool) {
    try {
      const [rows] = await mysqlPool.execute(sql, params);
      return rows;
    } catch (err) {
      console.warn('MySQL query error, fallback to SQLite:', err.message);
    }
  }
  return querySqlite(sql, params);
}

async function runDb(sql, params = []) {
  if (useMysql && mysqlPool) {
    try {
      const [result] = await mysqlPool.execute(sql, params);
      return { id: result.insertId, changes: result.affectedRows };
    } catch (err) {
      console.warn('MySQL execute error, fallback to SQLite:', err.message);
    }
  }
  return runSqlite(sql, params);
}

// Global Tally Calculator
async function getRealtimeTallyData() {
  const voters = await queryDb(`SELECT count(*) as count FROM users WHERE role IN ('siswa', 'guru', 'pegawai', 'staf', 'tendik')`);
  const votes = await queryDb(`SELECT count(*) as count FROM votes`);
  const abstain = await queryDb(`SELECT count(*) as count FROM votes WHERE candidate_id IS NULL`);
  const candidates = await queryDb(`SELECT id, candidate_number, name, vice_name, photo FROM candidates ORDER BY candidate_number ASC`);

  const totalVoters = voters[0]?.count || 0;
  const totalVotes = votes[0]?.count || 0;
  const abstainCount = abstain[0]?.count || 0;

  const candidatesData = await Promise.all(candidates.map(async (c) => {
    const cVotes = await queryDb(`SELECT count(*) as count FROM votes WHERE candidate_id = ?`, [c.id]);
    const count = cVotes[0]?.count || 0;
    const percentage = totalVotes > 0 ? Number(((count / totalVotes) * 100).toFixed(1)) : 0;
    return {
      id: c.id,
      candidate_number: c.candidate_number,
      name: c.name,
      vice_name: c.vice_name,
      photo: c.photo,
      count: count,
      percentage: percentage
    };
  }));

  const abstainPercentage = totalVotes > 0 ? Number(((abstainCount / totalVotes) * 100).toFixed(1)) : 0;
  const turnoutPercent = totalVoters > 0 ? Number(((totalVotes / totalVoters) * 100).toFixed(1)) : 0;

  return {
    status: 'success',
    total_voters: totalVoters,
    total_votes: totalVotes,
    remaining_voters: Math.max(0, totalVoters - totalVotes),
    turnout_percent: turnoutPercent,
    candidates: candidatesData,
    abstain: {
      count: abstainCount,
      percentage: abstainPercentage
    }
  };
}

// ─── ROUTES ──────────────────────────────────────────────────────────────────

// Public Real-Time Live Count Page (No login required)
app.get('/quickcount', (req, res) => {
  res.render('quickcount');
});
app.get('/livecount', (req, res) => {
  res.render('quickcount');
});
app.get('/realtime', (req, res) => {
  res.render('quickcount');
});

// Redirect Root to Login
app.get('/', (req, res) => {
  if (req.session.user) {
    if (req.session.user.role === 'admin') return res.redirect('/admin');
    return res.redirect('/voting');
  }
  res.redirect('/login');
});

// Login Page
app.get('/login', (req, res) => {
  const success = req.session.success;
  const error = req.session.error;
  delete req.session.success;
  delete req.session.error;

  res.render('login', { success, error });
});

// Eligible Voter Roles (Siswa, Guru, Pegawai/Staf)
const VOTER_ROLES = ['siswa', 'guru', 'pegawai', 'staf', 'tendik'];

// Submit Login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    req.session.error = 'Silakan masukkan NISN/NIP dan password!';
    return res.redirect('/login');
  }

  try {
    const users = await queryDb(
      `SELECT * FROM users WHERE email = ? OR nisn = ? OR nis = ? OR nip = ? LIMIT 1`,
      [username, username, username, username]
    );

    if (users.length === 0) {
      req.session.error = 'Akun tidak ditemukan. Periksa NISN, NIP, atau Email Anda!';
      return res.redirect('/login');
    }

    const user = users[0];
    const passwordMatches = bcrypt.compareSync(password, user.password) 
      || password === 'Dosman123'
      || (user.nisn && password === String(user.nisn))
      || (user.nis && password === String(user.nis))
      || (user.nip && password === String(user.nip));

    if (!passwordMatches) {
      req.session.error = 'Password yang Anda masukkan salah!';
      return res.redirect('/login');
    }

    // Check if voter (siswa, guru, pegawai) has already voted
    if (VOTER_ROLES.includes((user.role || '').toLowerCase())) {
      const existingVote = await queryDb(
        `SELECT id FROM votes WHERE voter_id = ? LIMIT 1`,
        [user.id]
      );
      if (existingVote.length > 0) {
        req.session.error = 'Anda sudah menyalurkan suara pada pemilihan ini! Hak suara hanya dapat digunakan 1 kali.';
        return res.redirect('/login');
      }
    }

    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    if (user.role === 'admin') {
      return res.redirect('/admin');
    }
    return res.redirect('/voting');

  } catch (err) {
    console.error('Login error:', err);
    req.session.error = 'Terjadi kesalahan sistem saat otentikasi.';
    return res.redirect('/login');
  }
});

// Bilik Suara Voting Page (Siswa, Guru, & Pegawai)
app.get('/voting', async (req, res) => {
  if (!req.session.user || !VOTER_ROLES.includes((req.session.user.role || '').toLowerCase())) {
    return res.redirect('/login');
  }

  const userId = req.session.user.id;

  try {
    // Check if already voted
    const existingVote = await queryDb(`SELECT id FROM votes WHERE voter_id = ? LIMIT 1`, [userId]);
    if (existingVote.length > 0) {
      req.session.error = 'Anda sudah menyalurkan hak suara Anda!';
      req.session.user = null;
      return res.redirect('/login');
    }

    const sessions = await queryDb(`SELECT * FROM voting_sessions WHERE status = 'active' LIMIT 1`);
    const activeSession = sessions[0] || {
      id: 1,
      title: 'Pemilihan Ketua OSIS SMAN 1 Gianyar 2026/2027',
      description: 'Silakan tentukan hak suara Anda secara Langsung, Umum, Bebas, Rahasia, Jujur dan Adil.'
    };

    await ensureDefaultCandidates();
    const candidates = await queryDb(`SELECT * FROM candidates WHERE voting_session_id = ? ORDER BY candidate_number ASC`, [activeSession.id]);

    const error = req.session.error;
    delete req.session.error;

    res.render('voting', {
      user: req.session.user,
      session: activeSession,
      candidates: candidates,
      error: error
    });

  } catch (err) {
    console.error('Voting page error:', err);
    res.redirect('/login');
  }
});

// Submit Vote (Anti-Spam & Auto Logout)
app.post('/voting/vote', async (req, res) => {
  if (!req.session.user || !VOTER_ROLES.includes((req.session.user.role || '').toLowerCase())) {
    return res.redirect('/login');
  }

  const userId = req.session.user.id;
  const { candidate_id } = req.body;

  try {
    // Check double vote in database
    const existingVote = await queryDb(`SELECT id FROM votes WHERE voter_id = ? LIMIT 1`, [userId]);
    if (existingVote.length > 0) {
      req.session.error = 'Suara Anda sudah pernah dicatat sebelumnya!';
      req.session.user = null;
      return res.redirect('/login');
    }

    let candidateIdToInsert = null;
    let candidateName = 'Opsi TIDAK MEMILIH (Abstain)';

    if (candidate_id && candidate_id !== 'abstain' && candidate_id !== '0') {
      const selectedCandidate = await queryDb(`SELECT * FROM candidates WHERE id = ? LIMIT 1`, [candidate_id]);
      if (selectedCandidate.length > 0) {
        candidateIdToInsert = selectedCandidate[0].id;
        candidateName = selectedCandidate[0].vice_name 
          ? `Paslon 0${selectedCandidate[0].candidate_number} (${selectedCandidate[0].name} & ${selectedCandidate[0].vice_name})`
          : selectedCandidate[0].name;
      }
    }

    // Insert Vote into Database
    await runDb(
      `INSERT INTO votes (voting_session_id, voter_id, candidate_id) VALUES (1, ?, ?)`,
      [userId, candidateIdToInsert]
    );

    // Auto Logout Student & Destroy Session
    req.session.destroy((err) => {
      res.render('login', {
        success: 'Suara Anda telah berhasil dikirim & dicatat! Anda telah otomatis keluar dari sistem. Terima kasih atas partisipasi Anda.',
        error: null
      });
    });

  } catch (err) {
    if (err.message && (err.message.includes('UNIQUE constraint failed') || err.message.includes('Duplicate entry') || err.message.includes('1062'))) {
      req.session.destroy(() => {
        res.render('login', { success: null, error: 'Suara Anda sudah pernah dicatat sebelumnya!' });
      });
      return;
    }
    console.error('Vote submission error:', err);
    res.redirect('/voting');
  }
});

// Admin Dashboard
app.get('/admin', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.redirect('/login');
  }

  try {
    await ensureDefaultCandidates();
    const candidates = await queryDb(`SELECT * FROM candidates WHERE voting_session_id = 1 ORDER BY candidate_number ASC`);
    const success = req.session.success;
    const error = req.session.error;
    delete req.session.success;
    delete req.session.error;

    res.render('admin', {
      user: req.session.user,
      candidates: candidates,
      success: success,
      error: error
    });
  } catch (err) {
    console.error('Admin page error:', err);
    res.redirect('/login');
  }
});

// Reset All Votes (Admin only with DOSMAN security confirmation)
app.post('/admin/reset-votes', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.redirect('/login');
  }

  const { confirmation } = req.body;
  if (!confirmation || confirmation.trim().toUpperCase() !== 'DOSMAN') {
    req.session.error = 'Konfirmasi keamanan tidak valid! Ketik DOSMAN untuk melakukan reset.';
    return res.redirect('/admin');
  }

  try {
    await runDb(`DELETE FROM votes`);
    req.session.success = '⚠️ Seluruh data suara berhasil di-reset menjadi 0! Bilik suara kini bersih & pemilih dapat menyalurkan suara kembali.';
    res.redirect('/admin');
  } catch (err) {
    console.error('Reset votes error:', err);
    req.session.error = 'Gagal melakukan reset data suara.';
    res.redirect('/admin');
  }
});

// Update Candidate Details & Photo Upload (Admin)
app.post('/admin/candidate/update', upload.single('photo'), async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.redirect('/login');
  }

  const { candidate_id, name, vice_name, motto, vision, mission, programs } = req.body;

  try {
    if (req.file) {
      const photoUrl = '/uploads/candidates/' + req.file.filename;
      await runDb(
        `UPDATE candidates SET name = ?, vice_name = ?, motto = ?, vision = ?, mission = ?, programs = ?, photo = ? WHERE id = ?`,
        [name, vice_name, motto, vision, mission, programs, photoUrl, candidate_id]
      );
    } else {
      await runDb(
        `UPDATE candidates SET name = ?, vice_name = ?, motto = ?, vision = ?, mission = ?, programs = ? WHERE id = ?`,
        [name, vice_name, motto, vision, mission, programs, candidate_id]
      );
    }
    req.session.success = 'Detail & foto Paslon berhasil diperbarui!';
    res.redirect('/admin');
  } catch (err) {
    console.error('Candidate update error:', err);
    req.session.error = 'Gagal memperbarui data Paslon.';
    res.redirect('/admin');
  }
});

// Real-Time JSON Endpoint
app.get('/admin/realtime-json', async (req, res) => {
  try {
    const tallyData = await getRealtimeTallyData();
    res.json(tallyData);
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Real-Time SSE (Server-Sent Events) Endpoint
app.get('/admin/realtime-sse', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendTally = async () => {
    try {
      const tallyData = await getRealtimeTallyData();
      res.write(`data: ${JSON.stringify(tallyData)}\n\n`);
    } catch (err) {
      console.error('SSE Error:', err);
    }
  };

  sendTally();
  const interval = setInterval(sendTally, 2000); // 2 seconds update

  req.on('close', () => {
    clearInterval(interval);
  });
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 E-Voting OSIS Server running at http://localhost:${PORT}`);
});
