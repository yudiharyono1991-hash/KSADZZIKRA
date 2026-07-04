# 🟢 KSA Mart Syariah - Sistem POS & Akuntansi Koperasi Digital

> Platform Kasir Terintegrasi dengan Akuntansi Syariah, Manajemen Inventori, dan Kalkulasi Zakat Otomatis untuk Koperasi Syariah ADZ-ZIKRA

**Project:** KSADZZIKRA | **Supabase ID:** rxuwdnaycysgmofazjmz | **GitHub:** yudiharyono1991-hash/KSADZZIKRA

---

## 🚀 Panduan Menjalankan di Lokal (VS Code)

### 1. Instalasi Dependensi
```bash
npm install
```

### 2. Jalankan Development Server
```bash
npm run dev
```
Aplikasi bisa diakses di: `http://localhost:3000`

---

## 📁 Struktur Folder Proyek

```
KSAMart/
├── src/
│   ├── components/
│   │   └── Layout/
│   │       ├── Sidebar.tsx        # Navigasi Menu Syariah Emerald Theme
│   │       ├── TopBar.tsx         # Live KPI & Status Supabase
│   │       ├── MainLayout.tsx     # Frame Layar Utama Terpadu
│   │       └── index.ts           # Modular Export Layout
│   ├── pages/
│   │   ├── KasirPOS.tsx          # Konsol Transaksi POS (QRIS, Tunai, BSI)
│   │   ├── InventoryPage.tsx      # Manajemen Stok & Inventori
│   │   ├── TrendPage.tsx          # Analitik Penjualan & Margin (Recharts)
│   │   ├── SalesReportPage.tsx    # Arsip Invoice & Cetak Struk
│   │   ├── CustomerPortal.tsx     # Portal Belanja Pelanggan Member
│   │   ├── KatalogUmumPage.tsx    # Katalog Belanja Umum (non-member)
│   │   ├── OnlineOrdersPage.tsx   # Kelola Pesanan Online Masuk
│   │   ├── ZakatPage.tsx          # Kalkulator Zakat Mal Dagang
│   │   ├── SettingsPage.tsx       # Pengaturan Toko & Supabase Sync
│   │   └── index.ts               # Modular Export Pages
│   ├── store/
│   │   └── index.ts               # Global State (Zustand) & Logic Kasir
│   ├── lib/
│   │   └── supabase.ts            # Koneksi Supabase KSADZZIKRA
│   ├── types/
│   │   └── index.ts               # TypeScript Types
│   ├── App.tsx                    # React Router & Routes
│   └── main.tsx                   # Entry Point
├── supabase_schema.sql            # ✅ SATU FILE SQL Lengkap untuk KSADZZIKRA
├── .env                           # Kredensial Supabase (tidak masuk GitHub)
├── .env.example                   # Contoh format .env
├── netlify.toml                   # Konfigurasi Deploy Netlify
└── package.json                   # Dependensi & Script
```

---

## 📋 Fitur Utama

1. **Kasir POS Terpadu** - Transaksi Cash, QRIS Syariah, Transfer BSI
2. **Manajemen Stok & Inventori** - Barcode, multi-unit (Pcs/Box), ekspiry date
3. **Portal Pelanggan Member** - Login, poin loyalitas, riwayat pesanan, diskon
4. **Katalog Belanja Umum** - Order tanpa login, cek jarak GPS, periode delivery
5. **Pesanan Online** - Sinkronisasi real-time ke dashboard admin
6. **Akuntansi Syariah** - Jurnal umum, CoA, laporan laba rugi, neraca
7. **Zakat Otomatis** - Kalkulasi zakat mal & distribusi ESG
8. **Manajemen SDM** - Absensi, shift, koreksi jam, cash opname
9. **Koperasi** - Anggota koperasi, SHU, simpanan
10. **Multi-cabang** - Filter data per cabang, admin pusat

---

## ⚙️ Konfigurasi Supabase KSADZZIKRA

Buat file `.env` di root folder:
```env
VITE_SUPABASE_URL=https://rxuwdnaycysgmofazjmz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4dXdkbmF5Y3lzZ21vZmF6am16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5NDQzODMsImV4cCI6MjA5ODUyMDM4M30.OOmVoWbtCbpavCReyh5jVOWhTe0uhywV3NA3nXmcfXI
```

Jalankan `supabase_schema.sql` di SQL Editor Supabase KSADZZIKRA untuk membuat semua tabel.

---

## 🌐 Deploy ke Netlify

1. Push ke GitHub: `git push origin main`
2. Buka Netlify → **Add new site** → **Import from Git** → pilih repo `KSADZZIKRA`
3. Build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
4. Environment Variables:
   - `VITE_SUPABASE_URL` = `https://rxuwdnaycysgmofazjmz.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = (key KSADZZIKRA di atas)
5. Klik **Deploy Site**

---

*KSA Mart Syariah — Halal. Amanah. Berkah. 🕌✨*
