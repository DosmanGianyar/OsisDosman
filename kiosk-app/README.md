# Aplikasi Kiosk Bilik Suara E-Voting OSIS DOSMAN (Windows)

Aplikasi desktop berbasis Electron untuk bilik suara digital SMAN 1 Gianyar yang menyembunyikan seluruh URL, address bar, tombol navigasi, dan mengunci fungsi shortcut keyboard (F12, Inspect Element) agar pemungutan suara aman dan rahasia.

---

## 🚀 Cara Menjalankan Aplikasi

### Opsi 1: Menjalankan Langsung (1-Klik)
1. Cukup klik ganda (double-click) file:
   ```text
   run-kiosk.bat
   ```
2. Aplikasi bilik suara akan langsung terbuka secara fullscreen (Layar Penuh).

### Opsi 2: Lewat Terminal / Command Prompt
```bash
cd kiosk-app
npm start
```

---

## 🔑 Tombol Darurat Keluar (Emergency Exit)
Karena aplikasi berjalan dalam mode Kiosk / Fullscreen tanpa tombol close biasa:
- **Tekan tombol kombinasi:**
  ```text
  Ctrl + Shift + Q
  ```
  *(Atau tombol `Alt + F4`)* untuk menutup aplikasi bilik suara.

---

## ⚙️ Pengaturan URL Server (`config.json`)
Buka file `config.json` untuk mengubah pengaturan:
```json
{
  "serverUrl": "http://36.93.15.146:8080/login",
  "kioskMode": true,
  "fullscreen": true,
  "allowExitShortcut": true,
  "exitShortcut": "CommandOrControl+Shift+Q"
}
```
- Jika nanti menggunakan IP lokal LAN (misal: `http://192.168.1.100:8080/login`), cukup ubah nilai `serverUrl` di file `config.json` ini tanpa perlu mengubah kode.

---

## 📦 Membuat File `.exe` Portable (Untuk Flashdisk)
Jika ingin membuat file satu berkas `.exe` yang bisa langsung disalin ke flashdisk dan dijalankan di komputer bilik suara mana saja tanpa instal Node.js:
```bash
cd kiosk-app
npm run build:portable
```
File `.exe` hasil kompilasi akan berada di dalam folder:
`kiosk-app/dist/Bilik Suara DOSMAN.exe`
