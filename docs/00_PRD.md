# 📋 Product Requirements Document (PRD)
# KSA Mart Syariah — Sistem POS & Akuntansi Koperasi Digital

> **Project:** KSADZZIKRA  
> **Versi:** 1.0  
> **Tanggal:** Juli 2026  
> **Organisasi:** Koperasi Syariah ADZ-ZIKRA  
> **Owner:** Dr. Grandis Imama Hendra, S.E.I., M.Sc (Acc), SAS.

---

## 1. Ringkasan Eksekutif

KSA Mart Syariah adalah platform Point-of-Sale (POS) terintegrasi yang dirancang khusus untuk **Koperasi Syariah ADZ-ZIKRA**. Sistem ini menggabungkan fungsi kasir modern dengan akuntansi berbasis syariah, kalkulasi zakat otomatis, dan manajemen koperasi — semuanya dalam satu aplikasi web Progressive Web App (PWA).

### Visi
*"Menepis Transaksi Riba, Demi Meraih Keberkahan Laba"*

### Misi
Menyediakan infrastruktur digital yang memungkinkan koperasi syariah beroperasi secara transparan, efisien, dan sesuai prinsip Islam dalam setiap transaksi.

---

## 2. Stakeholders

| Stakeholder | Peran | Kebutuhan Utama |
|-------------|-------|-----------------|
| Dr. Grandis Imama Hendra | Owner / Ketua Koperasi | Dashboard eksekutif, laporan keuangan, kontrol penuh |
| Kasir Toko | Operator POS | Interface kasir cepat, barcode scan, struk digital |
| Admin/Superadmin | Manajer Operasional | Manajemen stok, user, cabang, dan konfigurasi sistem |
| Pelanggan Member | Customer End-User | Portal belanja, poin loyalitas, riwayat pesanan |
| Pelanggan Umum | Visitor | Katalog produk, order tanpa login |
| Pengurus Koperasi | Manajemen Koperasi | SHU, anggota, pembiayaan, laporan keuangan |

---

## 3. Fitur Produk

### 3.1 Modul POS (Point of Sale)
- **Kasir POS** — Transaksi tunai, QRIS Syariah, Transfer BSI, Kasbon
- **Kasir Shift** — Manajemen shift, cash opname awal/akhir, rekap shift
- **Riwayat Kasir** — Arsip invoice, void request/approval, cetak struk
- **Split Payment** — Pembayaran gabungan multi-metode
- **PPOB** — Pulsa, token listrik, PDAM, BPJS

### 3.2 Modul Inventori
- **Manajemen Stok** — SKU, barcode, multi-unit (Pcs/Box), foto produk
- **Stock Opname** — Rekonsiliasi stok fisik vs sistem
- **Purchase Order** — Pemesanan ke supplier, tracking status
- **Stok Minimum Alert** — Notifikasi otomatis saat stok kritis
- **Expiry Date Tracking** — Pelacakan tanggal kadaluarsa produk

### 3.3 Modul Akuntansi Syariah
- **Chart of Accounts (CoA)** — Bagan akun standar koperasi syariah
- **Jurnal Umum** — Pencatatan jurnal otomatis + manual
- **Neraca & Laba Rugi** — Laporan keuangan real-time
- **Arus Kas** — Cash flow tracking
- **Zakat Niaga** — Kalkulasi zakat mal perdagangan otomatis (2.5%)
- **ESG Dashboard** — Distribusi zakat + laporan Environmental/Social/Governance

### 3.4 Modul Pelanggan & E-Commerce
- **Portal Member** — Login, poin loyalitas, riwayat pesanan, diskon member
- **Katalog Umum** — Browsing produk tanpa login, order via GPS
- **Pesanan Online** — Real-time sync ke dashboard admin + chat
- **Loyalty Program** — Sistem poin, reward redemption

### 3.5 Modul SDM & Operasional
- **Staff Management** — Data karyawan, role assignment
- **Absensi** — Clock-in/out dengan foto & GPS, koreksi absen
- **Struktur Organisasi** — Bagan organisasi koperasi

### 3.6 Modul Koperasi
- **Anggota Koperasi** — Registrasi, data anggota
- **SHU (Sisa Hasil Usaha)** — Kalkulasi & distribusi SHU
- **Pembiayaan** — Manajemen pembiayaan koperasi
- **Keuangan Koperasi** — Laporan keuangan khusus koperasi

### 3.7 Modul Multi-Tenant & Multi-Cabang
- **Tenant Management** — Multi-tenant SaaS ready
- **Branch Management** — Filter data per cabang, admin pusat
- **Admin Management** — User approval workflow, role-based access

### 3.8 Modul Konten Islami
- **Al-Quran Digital** — Bacaan Al-Quran lengkap
- **Jadwal Shalat** — Jadwal shalat berdasarkan lokasi
- **Artikel Islami** — Konten edukasi fikih muamalah

### 3.9 Modul Sistem & Keamanan
- **Audit Log** — Pencatatan seluruh aktivitas sistem
- **Mode Pemeliharaan** — Lockdown sistem oleh Owner
- **Backup & Restore** — Import/export data via JSON
- **Supabase Sync** — Sinkronisasi cloud real-time

---

## 4. User Roles & Access Control

| Role | Level | Akses |
|------|-------|-------|
| `SUPERADMIN` | Platform | Semua fitur + tenant management |
| `OWNER` | Tenant | Semua fitur kecuali tenant management |
| `ADMIN` | Tenant | Manajemen operasional, stok, user |
| `MANAGER` | Branch | Approval void, laporan cabang |
| `PENGURUS` | Tenant | Modul koperasi (SHU, anggota, pembiayaan) |
| `CASHIER` | Branch | POS, shift, riwayat kasir |
| `STAFF_GUDANG` | Branch | Inventori, stock opname, PO |
| `STAFF_LAPANGAN` | Branch | Absensi, tugas lapangan |
| `PELANGGAN` | Public | Portal member, katalog, order |

---

## 5. Technical Requirements

### 5.1 Platform
- **Progressive Web App (PWA)** — Installable, offline-capable
- **Responsive** — Desktop, tablet, mobile
- **Browser Support** — Chrome, Edge, Firefox, Safari

### 5.2 Performance
- **Time-to-Interactive** — < 3 detik pada 4G
- **Offline Mode** — Transaksi tetap berjalan saat offline via localStorage
- **Auto-sync** — Sinkronisasi otomatis saat koneksi tersedia

### 5.3 Data
- **Cloud Storage** — Supabase (PostgreSQL) untuk data master
- **Local Storage** — localStorage untuk cache dan offline mode
- **Backup** — Export JSON manual + Supabase auto-backup

---

## 6. Metrik Keberhasilan

| Metrik | Target |
|--------|--------|
| Transaksi harian | ≥ 50 transaksi/hari |
| Uptime sistem | ≥ 99.5% |
| Waktu checkout | < 30 detik per transaksi |
| Akurasi stok | ≥ 98% match dengan fisik |
| Kalkulasi zakat | 100% sesuai fatwa MUI |
| User satisfaction | ≥ 4.0/5.0 |

---

## 7. Roadmap

### Phase 1 (Current) ✅
- POS kasir lengkap (CASH, QRIS, BSI, Kasbon)
- Inventori & purchase order
- Akuntansi syariah dasar (CoA, jurnal, neraca)
- Zakat niaga otomatis
- Portal pelanggan member

### Phase 2 (Q3 2026)
- Multi-cabang live sync
- Split payment
- Void request/approval workflow
- Loyalty program
- PPOB (Pulsa, PLN, PDAM)

### Phase 3 (Q4 2026)
- Mobile native app (React Native)
- Integrasi bank syariah API
- Barcode scanner hardware
- E-receipt WhatsApp
- AI-powered demand forecasting

---

*KSA Mart Syariah — Halal. Amanah. Berkah. 🕌✨*
