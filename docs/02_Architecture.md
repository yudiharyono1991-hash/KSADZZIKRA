# 02. Arsitektur Teknis & Database Integration

Sistem BA Mart dibangun menggunakan pendekatan decoupled full-stack berbasis Single Page Application (SPA) yang modern, efisien, dan andal secara real-time.

```
                  ┌──────────────────────────────────────────────┐
                  │                 USER INTERFACE               │
                  │   (Vite-React Client, Tailwind & Lucide)    │
                  └──────────────────────┬───────────────────────┘
                                         │
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │           ZUSTAND STATE INTERFACE            │
                  │   • Memfilter menu berdasarkan role          │
                  │   • Mengunci harga kasir (Murabahah)         │
                  │   • Menyimpan entri log audit                │
                  └──────────────────────┬───────────────────────┘
                                         │
                   (Sync Otomatis jika API Key Terkonfigurasi)
                                         │
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │           SUPABASE CLIENT SERVICE            │
                  │   (Simulasi Offline Fallback jika unkey)    │
                  └──────────────────────┬───────────────────────┘
                                         │
                     ┌───────────────────┴───────────────────┐
                     ▼                                       ▼
         [ Tabel products ]                      [ Tabel transactions ]
         - id (UUID / Text)                      - id (Text)
         - sku (Unique SKU)                      - invoice_no (INV-...)
         - name (Product Name)                   - timestamp (ISO-8601)
         - category (Sembako, etc)               - cashier_name (Operator)
         - price (Sell Price)                    - items (JSONB)
         - cost_price (Buy Price)                - total_amount
         - stock (Quantity)                      - payment_method
         - min_stock (Warn levels)               - amount_paid
                                                 - change_amount
                                                 - zakat_contribution
                                                 - margin_contribution
```

### 1. Stack Teknologi Rintis
*   **Aplikasi Frontend**: React 18+ dirakit dengan modul bundling super cepat **Vite 6** dan bahasa pemograman bertipe kuat **TypeScript**.
*   **Utility Interface & Icon**: Tailwind CSS v4 untuk pengaturan layout yang presisi serta Lucide React untuk penyediaan ikon penunjuk yang profesional.
*   **State Management**: Zustand — sebuah engine state global super ringan berbasis hooks yang efisien mengelola status pembayaran transaksi, data keranjang belanja, sesi login pengguna, dan logs riwayat kerja.

### 2. Integrasi Database Supabase (v2 SDK)
Aplikasi ini mendukung sinkronisasi backend dua-arah secara transparan menggunakan modul `@supabase/supabase-js`. 

*   **Deteksi Konektivitas Otomatis**: Jika variabel lingkungan `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` belum terpasang, sistem secara mandiri berjalan dalam **Mode Offline Terproteksi** dengan penyimpanan memori internal sementara yang stabil agar tidak terjadi crash program saat rintis lokal.
*   **Metode Penyelamatan Data (Sync Pro-aktif)**:
    - Setiap transaksi kasir POS yang berhasil diselesaikan langsung di-insert ke tabel Supabase `transactions`, dan secara paralel memicu update sisa kuantitas pada tabel `products`.
    - Setiap modifikasi inventori sembako oleh Admin langsung diunggah ke tabel `products`.
    - Semua pencatatan audit log otomatis tersimpan di tabel `audit_logs` untuk mencegah manipulasi angka mutasi keuangan harian.

### 3. Skema Replikasi Tabel SQL Supabase (Rujukan Migration)

Berikut adalah struktur SQL DDL jika ingin mempersiapkan tabel di konsol Supabase SQL Editor:

```sql
-- 1. Tabel Produk / Sembako
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  sku VARCHAR(50) UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  price NUMERIC NOT NULL,
  cost_price NUMERIC NOT NULL,
  stock INT NOT NULL,
  min_stock INT NOT NULL,
  unit VARCHAR(20) NOT NULL,
  barcode VARCHAR(100),
  is_halal BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabel Transaksi Penjualan
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  invoice_no VARCHAR(50) UNIQUE NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  cashier_name TEXT NOT NULL,
  items JSONB NOT NULL,
  total_amount NUMERIC NOT NULL,
  payment_method VARCHAR(30) NOT NULL,
  amount_paid NUMERIC NOT NULL,
  change_amount NUMERIC NOT NULL,
  zakat_contribution NUMERIC NOT NULL,
  margin_contribution NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabel Audit Logs Pengguna
CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL,
  username TEXT NOT NULL,
  action VARCHAR(50) NOT NULL,
  category VARCHAR(50) NOT NULL,
  details TEXT NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabel Histori Kalkulasi Zakat Maal
CREATE TABLE zakat_records (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL,
  gold_price NUMERIC NOT NULL,
  nisab_value NUMERIC NOT NULL,
  liquid_assets NUMERIC NOT NULL,
  inventory_value NUMERIC NOT NULL,
  receivables NUMERIC NOT NULL,
  liabilities NUMERIC NOT NULL,
  net_wealth NUMERIC NOT NULL,
  is_eligible BOOLEAN DEFAULT TRUE,
  zakat_due NUMERIC NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabel Histori Penyaluran Zakat & ESG
CREATE TABLE zakat_distributions (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL,
  amount NUMERIC NOT NULL,
  recipient TEXT NOT NULL,
  esg_category VARCHAR(30) NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```
