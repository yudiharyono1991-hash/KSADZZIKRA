#!/bin/bash

# Setup Script - KSA Mart Syariah (KSADZZIKRA)
# Koperasi Syariah ADZ-ZIKRA - Sistem POS & Akuntansi Syariah

clear
echo "========================================================================"
echo "         KSA MART SYARIAH - KOPERASI SYARIAH ADZ-ZIKRA"
echo "         Setup Otomatis - Sistem POS & Akuntansi Syariah"
echo "========================================================================"
echo ""

# 1. Verifikasi Node.js
echo "[1/4] Verifikasi Lingkungan Node.js..."
if ! command -v node &> /dev/null
then
    echo "ERROR: Node.js tidak terdeteksi!"
    echo "Silakan install di: https://nodejs.org/"
    exit 1
else
    NODE_VER=$(node -v)
    echo "   OK - Node.js Terdeteksi: ${NODE_VER}"
fi

# 2. Buat .env jika belum ada
echo "[2/4] Mengatur File Konfigurasi (.env)..."
if [ ! -f .env ]; then
    echo 'VITE_SUPABASE_URL=https://stiatomaelzrptazayml.supabase.co' > .env
    echo 'VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0aWF0b21hZWx6cnB0YXpheW1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NjUyMjQsImV4cCI6MjA5ODQ0MTIyNH0.9vkvEYp1BFcIdkt1YSx87K6zlVkZUrmd1xLPpHmILn0' >> .env
    echo "   OK - File .env dibuat dengan kredensial KSADZZIKRA."
else
    echo "   OK - File .env sudah ada."
fi

# 3. Install dependencies
echo "[3/4] Menginstal Dependensi (npm install)..."
npm install
if [ $? -eq 0 ]; then
    echo "   OK - Semua dependencies berhasil diinstal!"
else
    echo "ERROR: Gagal install dependencies."
    exit 1
fi

# 4. Selesai
echo ""
echo "========================================================================"
echo "         SETUP SELESAI! KSA MART SYARIAH SIAP DIGUNAKAN"
echo "========================================================================"
echo ""
echo "Jalankan aplikasi:"
echo "   npm run dev"
echo ""
echo "Akses di browser: http://localhost:3000"
echo "Panduan deploy: NETLIFY_DEPLOY_GUIDE.md"
echo "Supabase KSADZZIKRA: https://stiatomaelzrptazayml.supabase.co"
echo ""
