@echo off
:: Setup Script untuk Windows - KSA Mart Syariah (KSADZZIKRA)

title Setup Otomatis KSA Mart Syariah - KSADZZIKRA
cls
echo ========================================================================
echo              KSA MART SYARIAH - KOPERASI SYARIAH ADZ-ZIKRA
echo              Setup Otomatis - Sistem POS & Akuntansi Syariah
echo ========================================================================
echo.

:: 1. Verifikasi Instalasi Node.js & NPM
echo [1/4] Verifikasi Lingkungan Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Node.js tidak terdeteksi!
    echo Silakan unduh dan instal di: https://nodejs.org/
    echo.
    pause
    exit /b 1
) else (
    echo    OK - Node.js Terdeteksi!
)

:: 2. Buat File .env jika belum ada
echo [2/4] Mengatur File Konfigurasi (.env)...
if not exist .env (
    echo VITE_SUPABASE_URL=https://tbuyexfeehejbfyhpygg.supabase.co > .env
    echo VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRidXlleGZlZWhlamJmeWhweWdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyOTc0NDUsImV4cCI6MjA5ODg3MzQ0NX0.RBk_MBcqoyYiFdDZNhn7Vlbg7M3o0Ae4vMTwlTRLMto >> .env
    echo    OK - File .env berhasil dibuat dengan kredensial KSADZZIKRA.
) else (
    echo    OK - File .env sudah ada.
)

:: 3. Instalasi Dependensi
echo [3/4] Menginstal Dependensi (npm install)...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Gagal install dependencies.
    pause
    exit /b 1
) else (
    echo    OK - Semua dependencies berhasil diinstal!
)

:: 4. Selesai
echo.
echo ========================================================================
echo              SETUP SELESAI! KSA MART SYARIAH SIAP DIGUNAKAN
echo ========================================================================
echo.
echo Jalankan aplikasi dengan perintah:
echo    npm run dev
echo.
echo Akses di browser: http://localhost:3000
echo.
echo Panduan deploy ke Netlify: NETLIFY_DEPLOY_GUIDE.md
echo Supabase project KSADZZIKRA: https://tbuyexfeehejbfyhpygg.supabase.co
echo ========================================================================
echo.
pause
