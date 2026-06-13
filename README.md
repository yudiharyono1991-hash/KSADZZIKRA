# 🟢 SmartPOS Shariah - Digital POS & Accounting Platform

> Platform Kasir Terintegrasi dengan Akuntansi Syariah, Manajemen Inventori, dan Kalkulasi Zakat Otomatis untuk UMKM Indonesia

Proyek ini telah dirapikan secara modular dan siap digunakan langsung di VS Code Anda. Seluruh file utama, routing, state management (Zustand), styling (Tailwind CSS), dan visualizer analitik (Recharts) sudah dikonfigurasi dengan aman, teruji lint bebas error, dan siap dijalankan.

---

## 🚀 Panduan Membuka & Menjalankan di VS Code

### 1. Ekspor & Unduh Proyek
Pilih menu **Settings** di pojok kanan atas Google AI Studio, lalu pilih **Export to ZIP** untuk mengunduh seluruh folder proyek ini ke komputer lokal Anda.

### 2. Buka di VS Code
- Ekstrak file zip yang diunduh.
- Jalankan VS Code, pilih **File -> Open Folder**, lalu pilih folder hasil ekstrak tersebut.

### 3. Instalasi Dependensi
Buka terminal baru di VS Code (`Ctrl + ~`), lalu jalankan perintah berikut untuk menginstal seluruh package yang diperlukan:
```bash
npm install
```

### 4. Jalankan Development Server
Setelah instalasi selesai, jalankan perintah development server:
```bash
npm run dev
```
Aplikasi POS Syariah Anda akan siap diakses di URL lokal (biasanya `http://localhost:3000` atau `http://localhost:5173`).

---

## 📁 Struktur Folder Proyek yang Dirapikan

```
smartpos-shariah/
├── src/
│   ├── components/
│   │   └── Layout/
│   │       ├── Sidebar.tsx        # Navigasi Menu Shariah Emerald Theme
│   │       ├── TopBar.tsx         # Live KPI & Jam Waktu Rill
│   │       ├── MainLayout.tsx     # Frame Layar Utama Terpadu
│   │       └── index.ts           # Modular Export Layout
│   ├── pages/
│   │   ├── KasirPOS.tsx          # Konsol Transaksi POS (QRIS, Tunai, Bank Transfer)
│   │   ├── InventoryPage.tsx      # Manajemen Stok & Batas Kritik Inventori
│   │   ├── TrendPage.tsx          # Analitik Penjualan, Margin, & Zakat (Recharts)
│   │   ├── SalesReportPage.tsx    # Arsip Invoice Struk Belanja & Cetak Ulang
│   │   ├── FinancialReportPage.tsx# Laporan Laba Rugi & Neraca Berimbang
│   │   ├── ZakatPage.tsx          # Kalkulator Zakat Mal Dagang (Acuan Nisab Emas)
│   │   ├── AuditLogPage.tsx       # Log Audit Sistem & Keamanan Operator
│   │   └── index.ts               # Modular Export Pages
│   ├── store/
│   │   └── index.ts               # Global State (Zustand) & Logic Kasir
│   ├── types/
│   │   └── index.ts               # Strict Typings (Product, Transaction, Zakat, Logs)
│   ├── App.tsx                    # React Router Index Declarations
│   ├── index.css                  # Tailwind CSS Core Imports
│   └── main.tsx                   # React DOM Renderer Bootstrapper
├── package.json                   # Dependensi & Script Project
├── vite.config.ts                 # Konfigurasi Build Pipeline Vite
├── tsconfig.json                  # Konfigurasi Kompiler TypeScript
└── README.md                      # Dokumentasi Panduan Berjalan
```

---

## 📋 Fitur Utama yang Telah Diimplementasikan

1. **Kasir POS Terpadu (`/kasir`)**
   * Cari produk berdasarkan nama/SKU/Barcode.
   * Filter cepat berdasarkan komoditas barang.
   * Keranjang belanja dinamis berbasis stok produk rill.
   * Dialog pembayaran interaktif: Cash (autocalculate kembalian), QRIS Shariah, atau Transfer BSI.
   * Tampilan mockup cetak struk lengkap dengan pencadangan sedekah/zakat 2.5% dari profit margin.

2. **Manajemen Stok (`/inventory`)**
   * Kartu metrik: Jumlah SKU, status kritis (menipis), dan estimasi total aset modal.
   * Tabel master stok dilengkapi tombol penyesuaian cepat (+/- stok).
   * Modal form penambahan SKU baru dengan validasi syariah (Harga Jual wajib ≥ Harga Beli).

3. **Tren & Grafik Analitik (`/trend`)**
   * Digerakkan penuh oleh pustaka visualisasi **Recharts**.
   * Grafik Area perkembangan Omset Vs Margin Mingguan.
   * Distribusi share kategori utama toko menggunakan donat Pie chart.
   * Akumulasi potensi Zakat terkumpul harian dalam format Bar chart.

4. **Laporan Keuangan Madani (`/laporan-keuangan`)**
   * Laporan Laba Rugi rill (Omset, HPP, Laba Kotor, Beban Operasional, Laba Bersih, Cadangan Zakat Usaha).
   * Neraca Keuangan seimbang (Total Aktiva/Aset = Pasiva/Hutang + Modal Sendiri).

5. **Kalkulator Zakat Mal Perniagaan (`/zakat`)**
   * Menghitung kelayakan nishab mal (setara nilai pasar 85g emas).
   * Menghitung total porsi harta wajib zakat dikurangi kewajiban hutang toko.
   * Menyimpan histori pencatatan zakat periodik.

6. **Audit Trail Keamanan (`/audit-log`)**
   * Log rill dari aktivitas operator: login kasir, penambahan produk baru, mutasi stok, hingga pencatatan POS.
   * Jejak alamat IP dan penanda kategori log (POS, Finance, Inventory, System).
