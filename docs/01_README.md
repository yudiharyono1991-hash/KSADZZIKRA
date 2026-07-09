# 🟢 KSA Mart Syariah — README

> Platform Kasir Terintegrasi dengan Akuntansi Syariah, Manajemen Inventori, dan Kalkulasi Zakat Otomatis untuk Koperasi Syariah ADZ-ZIKRA

**Project:** KSADZZIKRA | **Supabase ID:** rxuwdnaycysgmofazjmz | **GitHub:** yudiharyono1991-hash/KSADZZIKRA

---

## 🚀 Quick Start

### Prasyarat
- [Node.js](https://nodejs.org/) versi 18+ (disarankan LTS)
- NPM (termasuk dalam Node.js)
- Code Editor (VS Code disarankan)

### Instalasi Cepat (Windows)
```bash
# Jalankan setup otomatis
setup.bat
```

### Instalasi Manual
```bash
# 1. Clone repository
git clone https://github.com/yudiharyono1991-hash/KSADZZIKRA.git
cd KSAMart

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env
# Edit .env dengan kredensial Supabase Anda

# 4. Jalankan development server
npm run dev
```

Aplikasi bisa diakses di: `http://localhost:3000`

---

## 📁 Struktur Folder

```
KSAMart/
├── docs/                          # 📚 Dokumentasi Proyek
│   ├── 00_PRD.md                  # Product Requirements Document
│   ├── 01_README.md               # Panduan Penggunaan (file ini)
│   ├── 02_Architecture.md         # Arsitektur Sistem
│   ├── 03_Compliance.md           # Kepatuhan Syariah & Regulasi
│   ├── 04_AI_Spec.md              # Spesifikasi AI & Gemini
│   ├── 05_Dev_Guide.md            # Panduan Developer
│   ├── 06_Security.md             # Kebijakan Keamanan
│   ├── 07_Business_Rules.md       # Aturan Bisnis
│   ├── 08_UI_Guidelines.md        # Panduan Desain UI
│   └── 09_BACKLOG.md              # Product Backlog
│
├── src/
│   ├── components/
│   │   └── Layout/
│   │       ├── Sidebar.tsx        # Navigasi Menu Syariah Emerald Theme
│   │       ├── TopBar.tsx         # Live KPI & Status Supabase
│   │       ├── MainLayout.tsx     # Frame Layar Utama Terpadu
│   │       └── index.ts           # Modular Export Layout
│   ├── pages/                     # 40 halaman fitur (lihat PRD)
│   ├── store/
│   │   └── index.ts               # Global State (Zustand) & Business Logic
│   ├── lib/
│   │   └── supabase.ts            # Koneksi & Service Supabase KSADZZIKRA
│   ├── hooks/
│   │   └── useBranchData.ts       # Custom Hook untuk Filter Cabang
│   ├── types/
│   │   └── index.ts               # TypeScript Interfaces & Types
│   ├── utils/
│   │   └── distance.ts            # GPS Distance Calculator
│   ├── App.tsx                    # React Router & Routes
│   ├── main.tsx                   # Entry Point
│   └── index.css                  # Global Styles (Tailwind)
│
├── public/                        # Static Assets (logo, PWA icons)
├── supabase_schema.sql            # ✅ Schema SQL Lengkap KSADZZIKRA
├── migrate_ba_to_ksa.sql          # Script Migrasi Database
├── .env                           # Kredensial Supabase (tidak masuk Git)
├── .env.example                   # Template Environment Variables
├── vite.config.ts                 # Konfigurasi Vite + PWA
├── package.json                   # Dependencies & Scripts
├── netlify.toml                   # Konfigurasi Deploy Netlify
└── tsconfig.json                  # TypeScript Configuration
```

---

## 📋 Fitur Utama

| # | Modul | Deskripsi |
|---|-------|-----------|
| 1 | **Kasir POS** | Transaksi Cash, QRIS Syariah, Transfer BSI, Kasbon |
| 2 | **Manajemen Stok** | Barcode, multi-unit (Pcs/Box), expiry date, foto produk |
| 3 | **Portal Member** | Login pelanggan, poin loyalitas, riwayat pesanan |
| 4 | **Katalog Umum** | Order tanpa login, cek jarak GPS, delivery |
| 5 | **Pesanan Online** | Sinkronisasi real-time ke dashboard admin |
| 6 | **Akuntansi Syariah** | CoA, jurnal umum, neraca, laba rugi, arus kas |
| 7 | **Zakat Otomatis** | Kalkulasi zakat niaga & distribusi ESG |
| 8 | **SDM & Absensi** | Shift, clock-in/out GPS+foto, koreksi absen |
| 9 | **Koperasi** | Anggota, SHU, simpanan, pembiayaan |
| 10 | **Multi-cabang** | Filter per cabang, admin pusat |
| 11 | **PPOB** | Pulsa, token PLN, PDAM, BPJS |
| 12 | **Konten Islami** | Al-Quran digital, jadwal shalat, artikel fikih |

---

## 🔐 Default Login

| Username | Password | Role |
|----------|----------|------|
| `superadmin.platform` | `superadmin123!` | SUPERADMIN |
| `superadmin.23kk` | `admin123!` | ADMIN |
| `asy.23.kk` | `kasir123!` | CASHIER |
| `owner` | `owner123` | OWNER |
| `pelanggan1` | `password123` | PELANGGAN |

---

## ⚙️ Environment Variables

```env
VITE_SUPABASE_URL=https://rxuwdnaycysgmofazjmz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0aWF0b21hZWx6cnB0YXpheW1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NjUyMjQsImV4cCI6MjA5ODQ0MTIyNH0.9vkvEYp1BFcIdkt1YSx87K6zlVkZUrmd1xLPpHmILn0
VITE_APP_PREFIX=ksa_
VITE_DB_PREFIX=ksa_
```

---

## 🌐 Deploy ke Netlify

1. Push ke GitHub: `git push origin main`
2. Buka Netlify → **Add new site** → **Import from Git**
3. Build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
4. Set Environment Variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
5. Klik **Deploy Site**

---

## 📖 Dokumentasi Lengkap

Semua dokumentasi tersedia di folder `/docs`:

- [PRD](docs/00_PRD.md) — Product Requirements Document
- [Architecture](docs/02_Architecture.md) — Arsitektur & Tech Stack
- [Compliance](docs/03_Compliance.md) — Kepatuhan Syariah
- [AI Spec](docs/04_AI_Spec.md) — Spesifikasi AI
- [Dev Guide](docs/05_Dev_Guide.md) — Panduan Developer
- [Security](docs/06_Security.md) — Kebijakan Keamanan
- [Business Rules](docs/07_Business_Rules.md) — Aturan Bisnis
- [UI Guidelines](docs/08_UI_Guidelines.md) — Panduan UI
- [Backlog](docs/09_BACKLOG.md) — Product Backlog

---

## 📜 NPM Scripts

| Script | Perintah | Fungsi |
|--------|----------|--------|
| `dev` | `npm run dev` | Jalankan development server (port 3000) |
| `build` | `npm run build` | Build production bundle |
| `preview` | `npm run preview` | Preview production build |
| `clean` | `npm run clean` | Hapus dist & server.js |
| `lint` | `npm run lint` | TypeScript type checking |

---

*KSA Mart Syariah — Halal. Amanah. Berkah. 🕌✨*
