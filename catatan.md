# CLAUDE.md — Agent & Development Guide for SIMS

# SIMS - School Management System SMAN 1 Gianyar
- Deployment: Automated SSH git pull via webdosman user (`/www/wwwroot/36.93.15.146`)

Dokumen ini berisi panduan, instruksi otomatisasi Git, serta prosedur deployment untuk AI Agent yang bekerja pada repositori **SIMS (School Integrated Management System)**.

---

## 1. Stack & Arsitektur Proyek

- **Framework Web:** Laravel 12 + Filament PHP v5.6 + Livewire v4 + Tailwind CSS v4.
- **Mobile App:** Flutter (`/mobile`).
- **Database:** MariaDB (Produksi) / SQLite In-Memory (PHPUnit Tests).
- **Default Auth Policy:**
  - Siswa login **hanya menggunakan NISN**.
  - Guru login menggunakan **NIP** atau **Email**.
  - **Password Default Akun Baru:** Password default untuk akun baru Guru & Siswa **selalu diset sama dengan username** (`NIP` untuk Guru, `NISN`/`NIS` untuk Siswa).
  - **WhatsApp Gateway:** Integrasi WhatsApp Baileys telah dihapus secara permanen. Jangan menambahkan kembali service Baileys/WA.

---

## 2. Perintah Testing & Lokal

Sebelum melakukan commit atau push, selalu jalankan pengujian untuk memastikan seluruh suite tes 100% lulus:

```powershell
php artisan test
```

---

## 3. Prosedur Git Commit & Push (Lokal)

- **Branch Utama:** `main`
- **Remote URL:** `git@github.com:DosmanGianyar/DosmanGianyar.git` (atau HTTPS)

### Langkah Commit & Push:
```powershell
git add .
git commit -m "feat/fix/refactor: deskripsi perubahan"
git push origin main
```

---

## 4. Prosedur Deployment & Server Pull (Tailscale SSH)

Setelah perubahan berhasil dipush ke GitHub (`origin/main`), AI Agent dapat langsung mengeksekusi `git pull` dan refresh cache di server target menggunakan perintah `plink.exe` dari lingkungan Windows lokal.

### Informasi Server:
- **Host / IP Tailscale:** `webdosman` (`100.73.61.126`)
- **Direktori Proyek di Server:** `/www/wwwroot/36.93.15.146`
- **SSH Username:** `dosman`
- **SSH Password & Sudo Password:** `Dosman123`
- **Host Key Fingerprint (`plink`):** `SHA256:D9SSqp9hA50fNvSPW5yZZJQ6oEC/ScLc5HSlU`

### Perintah Pull & Deployment Otomatis (PowerShell):
```powershell
plink -batch -hostkey "SHA256:D9SSqp9hA50fNvSPW5yZZJQ6oGEjF3OEC/ScLc5HSlU" -pw Dosman123 dosman@100.73.61.126 "echo Dosman123 | sudo -S sh -c 'cd /www/wwwroot/36.93.15.146 && git pull origin main && php artisan optimize:clear && systemctl restart php-fpm-84'"
```

---

## 5. Ringkasan Alur Otomatis untuk Agent

Jika pengguna meminta: *"push dan pull ke server"* atau *"deploy ke server"*, ikuti langkah berikut:

1. Jalankan `php artisan test` untuk memastikan 100% tes passing.
2. Jalankan `git add .`
3. Jalankan `git commit -m "<pesan_commit>"`
4. Jalankan `git push origin main`
5. Jalankan perintah `plink.exe` di atas untuk melakukan `git pull`, `artisan migrate`, `artisan optimize:clear`, dan `systemctl restart php-fpm-84` di server `webdosman`.

---

## 6. Log & Catatan Proses Push & Commit (OsisDosman)

**Tanggal Eksekusi:** 5 September 2026  
**Proyek:** E-Voting OSIS SMAN 1 Gianyar (`OsisDosman`)  
**Remote Target:** `git@github.com:DosmanGianyar/OsisDosman.git` / `https://github.com/DosmanGianyar/OsisDosman.git`  
**Branch Utama:** `main`

### Urutan Perintah Yang Telah Dieksekusi:
```powershell
echo "# OsisDosman" >> README.md
git init
git branch -M main
git remote add origin git@github.com:DosmanGianyar/OsisDosman.git
git add .
git commit -m "first commit"
git push -u origin main
```

### Catatan Berkas Ter-Commit:
- **Berkas Dikecualikan (`.gitignore`):** `node_modules/`, `*.sqlite`, `.env` (Keamanan data lokal & credential).
- **Berkas Ter-Commit (11 Berkas Utama):** `server.js`, `views/login.ejs`, `views/voting.ejs`, `views/admin.ejs`, `public/css/style.css`, `scripts/init-db.js`, `README.md`, `catatan.md`, `package.json`, `package-lock.json`, `.gitignore`.
- **Status Repository:** Clean & Up to date dengan `origin/main`.

---

## 7. Konfigurasi MikroTik Router (DST-NAT Public Access)

- **IP Publik Router:** `36.93.15.146`
- **User / Password Router:** `admin` / `t3lk0m2024`
- **IP Server Lokal (webdosman):** `192.168.50.253` (Port Internal: `3000`)
- **Aturan DST-NAT:**
  - `dst-port=3000` -> Forward ke `192.168.50.253:3000`
  - `dst-port=8080` -> Forward ke `192.168.50.253:3000`
  - `Hairpin NAT` diaktifkan untuk subnet `192.168.50.0/24`
- **URL Akses Publik:**
  - Public Live Count: `http://36.93.15.146:3000/quickcount` atau `http://36.93.15.146:8080/quickcount`
  - Login E-Voting: `http://36.93.15.146:3000/login` atau `http://36.93.15.146:8080/login`
