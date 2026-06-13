@echo off
:: Setup Script untuk Windows CMD/PowerShell - SmartPOS Shariah
:: Berkah Amanah Mart Syariah - Dibuat oleh AI Coding Agent

title Setup Otomatis SmartPOS Shariah - Berkah Amanah Mart
cls
echo ========================================================================
echo               🚀 SELAMAT DATANG DI SETUP OTOMATIS SMARTPOS 🚀
echo                         BERKAH AMANAH MART SYARIAH
echo ========================================================================
echo.

:: 1. Verifikasi Instalasi Node.js & NPM
echo [1/5] Verifikasi Lingkungan Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo ❌ ERROR: Node.js tidak terdeteksi di sistem Windows Anda!
    echo Silakan unduh dan instal Node.js terlebih dahulu di: https://nodejs.org/
    echo.
    pause
    exit /b 1
) else (
    echo    ✅ Node.js Terdeteksi!
)

:: 2. Sinkronisasi File Environment (.env)
echo [2/5] Mengatur File Konfigurasi (.env)...
if exist .env.example (
    copy .env.example .env >nul
    echo    ✅ File .env berhasil disalin dari .env.example secara otomatis.
) else (
    echo    ⚠️ File .env.example tidak ditemukan. Membuat file .env baru...
    echo VITE_SUPABASE_URL="https://wzfwiuolqzxbovpcpbli.supabase.co" > .env
    echo VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6ZndpdW9scXp4Ym92cGNwYmxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5NjA3NjgsImV4cCI6MjA3NzUzNjc2OH0.gpe9qIamqwXIUUqe8ui5pVBbq14xS0CXOfxyJDyWqMw" >> .env
    echo    ✅ File .env berhasil dibuat otomatis.
)

:: 3. Instalasi Dependensi Otomatis
echo [3/5] Mengunduh ^& Menginstal File Dependensi (npm install)...
echo       (Proses ini memakan waktu beberapa detik, mohon bersabar...)
call npm install
if %errorlevel% neq 0 (
    echo ❌ Gagal menginstal dependencies. Periksa koneksi internet Anda atau jalankan 'npm install' secara manual.
    pause
    exit /b 1
) else (
    echo    ✅ Seluruh package dependencies berhasil diinstal!
)

:: 4. Melakukan Uji Build
echo [4/5] Menguji Build Produksi Lokal (npm run build)...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ ERROR: Build gagal. Pastikan tidak ada kodingan yang error di VS Code Anda.
    pause
    exit /b 1
) else (
    echo    ✅ Uji Build BERHASIL! Folder 'dist' siap dipublish.
)

:: 5. Panduan Selesai & Ready to Run!
echo.
echo ========================================================================
echo              🎉 PROSES SETUP OTOMATIS SELESAI DENGAN SUKSES! 🎉
echo ========================================================================
echo.
echo Cara Menjalankan Server POS Syariah Lokal (Development Mode):
echo 👉 Jalankan perintah berikut di VS Code terminal Anda:
echo    npm run dev
echo.
echo Cara Deploy ke Netlify dalam 1 Menit:
echo 👉 Silakan ikuti instruksi lengkap di panduan NETLIFY_DEPLOY_GUIDE.md.
echo.
echo Hubungkan juga dengan repository GitHub Anda:
echo 👉 git remote add origin https://github.com/Yharyono123/Yudi-Hariyono---Shariah-Accounting-Dashboard..git
echo ========================================================================
echo.
pause
