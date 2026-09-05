# OsisDosman — E-Voting OSIS SMAN 1 Gianyar

Aplikasi Web Pemilihan Ketua & Wakil Ketua OSIS SMAN 1 Gianyar berbasis Node.js, Express, EJS, & Vanilla CSS Glassmorphism.

## Fitur Utama
- **Sisi Client (Siswa):**
  - Login mengintegrasikan database NISN & Password Siswa.
  - Kartu Kandidat Paslon 01 & Paslon 02 serta Opsi Tidak Memilih (Abstain).
  - Pop-up Modal Konfirmasi Pilihan.
  - Proteksi Anti-Spam Click Lock & Unique Constraint Database.
  - Auto-Logout & Auto-Dismiss Notifikasi Suara (Kerahasiaan Bilik Suara / Asas Rahasia LUBER).

- **Sisi Admin:**
  - Real-Time Live Count Tally (Server-Sent Events — SSE) Layout Kanan-Kiri & Abstain.
  - Editor Detail Paslon OSIS.
  - Fitur Reset Suara dengan Keamanan Kata Kunci `DOSMAN`.

## Stack & Teknologi
- Backend: Node.js, Express.js
- Template Engine: EJS
- Styling: Custom Vanilla CSS (Outfit Font, Glassmorphism, Responsive Grid)
- Database: Dual Support (MariaDB `sims_db` Production / SQLite Local Fallback)
