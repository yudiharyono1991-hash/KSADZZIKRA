# 05. Panduan Instalasi & Pengembangan Lokal (VS Code)

Berdasarkan permohonan Anda: *"minta bantu rapihkan folder dan file ini agar bisa saya lakukan proses lanjutan di VS Code sampai npm run dev"*, berikut adalah tata cara merintis rill aplikasi ini di komputer lokal Anda:

### 1. Prasyarat Sistem
Pastikan komputer Anda telah terpasang:
*   **Git**: Untuk kloning repositori (opsional).
*   **Node.js**: Direkomendasikan versi **v18** atau yang terbaru (misal v20 / v22-LTS).
*   **Editor VS Code**: Dengan ekstensi rujukan populer seperti *Tailwind CSS IntelliSense*, *ESLint*, dan *TypeScript Nightly*.

### 2. Langkah Demi Langkah Memulai Aplikasi

#### Langkah A: Persiapan Berkas Proyek
Ekstrak berkas ZIP hasil unduhan platform AI Studio ke sebuah folder baru di komputer Anda, lalu buka folder tersebut melalui aplikasi **Visual Studio Code** (`File -> Open Folder...`).

#### Langkah B: Instalasi Paket Dependensi
Buka terminal baru di VS Code (`Ctrl + ~` atau `Terminal -> New Terminal`) dan ketikkan perintah berikut untuk menginstal semua library pendukung:
```bash
npm install
```
*Perintah ini akan membaca daftaran pustaka penting di berkas `package.json` Anda (seperti React, Zustand, Tailwind, Lucide React, Recharts, dan SupabaseSDK).*

#### Langkah C: Konfigurasi Berkas Lingkungan (*Environment Variables*)
Salin berkas template `.env.example` menjadi berkas baru bernama `.env`:
```bash
cp .env.example .env
```
Buka berkas `.env` tersebut di editor VS Code Anda, kemudian isi detail variabel Supabase jika Anda ingin mengaktifkan sinkronisasi database:
```env
# URL Dashboard Supabase Anda (misal: https://vwyxabcdeflmno.supabase.co)
VITE_SUPABASE_URL="https://your-project.supabase.co"

# Kunci Anon Key Supabase Anda
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.YourAnonKeyHere"
```
*(Ingat: Bila dinonaktifkan, aplikasi akan otomatis masuk ke **Mode Offline Terproteksi** menggunakan memori browser lokal tanpa mendatangkan error).*

#### Langkah D: Jalankan Server Pengembangan (Dev Mode)
Jalankan dev server menggunakan naskah utama:
```bash
npm run dev
```
Setelah berjalan, terminal akan memberikan alamat lokal:
```
  VITE v6.2.3  ready in 545 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```
Buka alamat tautan `http://localhost:3000/` di peramban (browser) Chrome atau Edge kesayangan Anda untuk melihat tampilan aplikasi kasir BA Mart yang menawan dan responsif!
