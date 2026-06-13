# 🌐 Panduan Lengkap Deploy SmartPOS Shariah ke Netlify & GitHub

Panduan ini mendetailkan langkah-langkah mudah bagi Anda untuk menghubungkan kodingan di VS Code lokal Anda ke GitHub dan langsung men-deploy-nya secara gratis ke Netlify, lengkap dengan konfigurasi Supabase otomatis.

---

## 📌 Langkah 1: Hubungkan ke Repository GitHub Anda

Jalankan perintah ini di VS Code Terminal Anda untuk menginisialisasi Git dan mengunggah (push) seluruh kodingan dari komputer Anda ke GitHub:

```bash
# 1. Inisialisasi Git di folder lokal jika belum ada
git init

# 2. Tambahkan seluruh berkas proyek ke Git tracker
git add .

# 3. Buat commit pertama Anda
git commit -m "feat: Integrasi POS Syariah & Supabase - Berkah Amanah Mart"

# 4. Hubungkan ke link repository GitHub Anda
git remote add origin https://github.com/Yharyono123/Yudi-Hariyono---Shariah-Accounting-Dashboard..git

# 5. Ganti branch utama menjadi 'main' (atau 'master')
git branch -M main

# 6. Unggah kodingan ke GitHub (gunakan force `-u` untuk inisiasi awal)
git push -u origin main
```

---

## ☁️ Langkah 2: Deploy Otomatis Menggunakan Netlify (Direkomendasikan)

Dengan cara ini, setiap kali Anda mengubah kode di VS Code dan mengirimkannya ke GitHub (`git push`), Netlify akan mengupdate aplikasi web Anda secara otomatis!

### Melalui Layanan Web Netlify (Bebas Ribet):
1. Masuk ke akun Anda di [Netlify](https://www.netlify.com/).
2. Di Dashboard Netlify, klik tombol **"Add New Site"** -> pilih **"Import from Git"**.
3. Pilih penyedia Git Anda (**GitHub**) dan lakukan otorisasi.
4. Cari dan pilih repository Anda: `Yudi-Hariyono---Shariah-Accounting-Dashboard.`.
5. Konfigurasikan pengaturan Build berikut:
   - **Branch to deploy**: `main`
   - **Build Command**: `npm run build`
   - **Publish directory**: `dist`
6. *(SANGAT PENTING!)* Klik bagian **"Environment Variables"** lalu tambahkan dua kunci berikut agar koneksi Supabase Anda tetap aktif:
   - `VITE_SUPABASE_URL` dengan nilai: `https://wzfwiuolqzxbovpcpbli.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` dengan nilai: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6ZndpdW9scXp4Ym92cGNwYmxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5NjA3NjgsImV4cCI6MjA3NzUzNjc2OH0.gpe9qIamqwXIUUqe8ui5pVBbq14xS0CXOfxyJDyWqMw`
7. Klik **"Deploy Site"**. Tunggu sekitar 1 menit, dan aplikasi kasir modern Anda akan aktif secara langsung dengan domain unik dari Netlify!

---

## ⚡ Langkah 3: Deploy Manual Melalui Netlify Drag & Drop (Instan)

Jika Anda tidak ingin mengunggah ke GitHub terlebih dahulu, Anda bisa langsung melakukan drag-and-drop folder hasil build komputer Anda ke Netlify:

1. Jalankan **Setup Otomatis** (`setup.bat` untuk Windows atau `setup.sh` untuk Mac/Linux).
2. Tunggu proses instalasi dan build selesai. Folder bernama **`dist`** akan terbuat otomatis di dalam folder proyek Anda.
3. Buka halaman [Netlify Drop](https://app.netlify.com/drop).
4. Tarik *(drag)* dan jatuhkan *(drop)* folder **`dist`** Anda ke area kotak unggah di halaman web tersebut.
5. Selesai! Aplikasi Anda seketika mengudara secara online.
6. Agar Supabase fungsional, buka menu **Site Configuration** -> **Environment variables** di Netlify, lalu tambahkan variabel di atas agar berjalan sempurna.

---

### 🛡️ Mengapa Konfigurasi Netlify Kami Sangat Kuat?
Kami telah menyertakan berkas konfigurasi **`netlify.toml`** di dalam folder root. Berkas ini berfungsi khusus untuk:
* **Mengatur Redirects (`/*` -> `/index.html`)**: Mencegah halaman Anda mendapatkan error **404 Not Found** ketika pengunjung melakukan refresh halaman pada menu kasir, laporan keuangan, atau inventory (mengamankan sistem React Router SPA).
* **Setting Build Otomatis**: Memastikan Netlify menggunakan direktori output `dist` dan komando build `npm run build` yang tepat secara otomatis tanpa perlu dikonfigurasi manual berkali-kali.

Selamat mengudara! Jika ada pertanyaan atau butuh penyusunan kode lebih lanjut untuk aplikasi kustom Anda, silakan hubungi asisten Anda kembali. Kampanye transaksi bebas Riba untuk UMKM Indonesia berkah selamanya! 🕌✨
