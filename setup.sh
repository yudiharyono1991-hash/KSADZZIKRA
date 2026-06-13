#!/bin/bash

# Setup Script untuk SmartPOS Shariah - Berkah Amanah Mart
# Dibuat otomatis oleh AI Coding Agent untuk eksekusi cepat di VS Code Terminal

# Reset styling
NC='\033;0m'
GREEN='\033;0;32m'
BG_GREEN='\033;42;1;37m'
BLUE='\033;0;34m'
YELLOW='\033;1;33m'
RED='\033;0;31m'
BOLD='\033;1m'

clear
echo -e "${GREEN}========================================================================${NC}"
echo -e "${GREEN}              🚀 SELAMAT DATANG DI SETUP OTOMATIS SMARTPOS 🚀            ${NC}"
echo -e "${GREEN}                        BERKAH AMANAH MART SYARIAH                       ${NC}"
echo -e "${GREEN}========================================================================${NC}"
echo ""

# 1. Verifikasi Instalasi Node.js & NPM
echo -e "${BLUE}[1/5] Verifikasi Lingkungan Node.js...${NC}"
if ! command -v node &> /dev/null
then
    echo -e "${RED}❌ ERROR: Node.js tidak terdeteksi di sistem Anda!${NC}"
    echo -e "${YELLOW}Silakan unduh dan instal Node.js terlebih dahulu di: https://nodejs.org/${NC}"
    exit 1
else
    NODE_VER=$(node -v)
    NPM_VER=$(npm -v)
    echo -e "   ✅ Node.js Terdeteksi: ${GREEN}${NODE_VER}${NC}"
    echo -e "   ✅ NPM Terdeteksi: ${GREEN}${NPM_VER}${NC}"
fi

# 2. Sinkronisasi File Environment (.env)
echo -e "${BLUE}[2/5] Mengatur File Konfigurasi (.env)...${NC}"
if [ -f .env.example ]; then
    cp .env.example .env
    echo -e "   ✅ File ${GREEN}.env${NC} berhasil disalin dari .env.example secara otomatis."
else
    echo -e "   ⚠️ File .env.example tidak ditemukan. Membuat file .env baru..."
    echo 'VITE_SUPABASE_URL="https://wzfwiuolqzxbovpcpbli.supabase.co"' > .env
    echo 'VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6ZndpdW9scXp4Ym92cGNwYmxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5NjA3NjgsImV4cCI6MjA3NzUzNjc2OH0.gpe9qIamqwXIUUqe8ui5pVBbq14xS0CXOfxyJDyWqMw"' >> .env
    echo -e "   ✅ File ${GREEN}.env${NC} berhasil dibuat otomatis."
fi

# 3. Instalasi Dependensi Otomatis
echo -e "${BLUE}[3/5] Mengunduh & Menginstal File Dependensi (npm install)...${NC}"
echo -e "      (Proses ini memakan waktu beberapa detik, mohon bersabar...)"
npm install

if [ $? -eq 0 ]; then
    echo -e "   ✅ Seluruh package dependencies berhasil diinstal!"
else
    echo -e "${RED}❌ Gagal menginstal dependencies. Periksa koneksi internet Anda atau jalankan 'npm install' secara manual.${NC}"
    exit 1
fi

# 4. Melakukan Uji Build (npm run build)
echo -e "${BLUE}[4/5] Menguji Build Produksi Lokal (npm run build)...${NC}"
npm run build

if [ $? -eq 0 ]; then
    echo -e "   ✅ Uji Build BERHASIL! Folder '${GREEN}dist${NC}' siap dipublish."
else
    echo -e "${RED}❌ ERROR: Build gagal. Pastikan tidak ada kodingan yang error di VS Code Anda.${NC}"
    exit 1
fi

# 5. Panduan Selesai & Ready to Run!
echo ""
echo -e "${GREEN}========================================================================${NC}"
echo -e "             🎉 PROSES SETUP OTOMATIS SELESAI DENGAN SUKSES! 🎉          "
echo -e "${GREEN}========================================================================${NC}"
echo ""
echo -e "${BOLD}Cara Menjalankan Server POS Syariah Lokal (Development Mode):${NC}"
echo -e "👉 Jalankan perintah berikut di VS Code terminal Anda:"
echo -e "   ${YELLOW}npm run dev${NC}"
echo ""
echo -e "${BOLD}Cara Deploy ke Netlify dalam 1 Menit:${NC}"
echo -e "👉 Silakan ikuti instruksi lengkap di panduan ${GREEN}NETLIFY_DEPLOY_GUIDE.md${NC}."
echo ""
echo -e "Hubungkan juga dengan repository GitHub Anda:"
echo -e "👉 ${BLUE}git remote add origin https://github.com/Yharyono123/Yudi-Hariyono---Shariah-Accounting-Dashboard..git${NC}"
echo -e "========================================================================"
