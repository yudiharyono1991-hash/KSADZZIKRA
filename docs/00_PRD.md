# Product Requirement Document (PRD) - SmartPOS Shariah (BA Mart)

## 1. Pendahuluan & Ringkasan Solusi
**SmartPOS Shariah - BA Mart v1.0** adalah sistem Point of Sale (POS) dan manajemen keuangan mikro berbasis syariah. Sistem dirancang khusus untuk memenuhi kebutuhan operasional toko ritel staple goods (sembako) dalam lingkungan kampus atau lembaga syariah.

Sistem ini memastikan kepatuhan penuh terhadap fatwa-fatwa perdagangan Dewan Syariah Nasional Majelis Ulama Indonesia (DSN-MUI). Dilengkapi dengan integrasi perhitungan Zakat Mal perdagangan, pembatasan ketat riba, serta sinkronisasi modern dengan database Supabase, dan model operasi offline-fallback yang handal.

---

## 2. Nilai Kepatuhan Syariah (Shariah Core Compliance)
Semua alur fungsional sistem harus selaras dengan nilai keislaman untuk menegakkan kejujuran dan menghindari *gharar* (ketidakpastian) serta *riba* (bunga).

| Komponen Kepatuhan | Aturan Bisnis & Implementasi |
| :--- | :--- |
| **Harga Jual Adil / Halal** | Setiap produk harus memiliki Harga Jual yang lebih besar atau sama dengan Harga Modal ($\text{Harga Jual} \ge \text{Harga Modal}$). Jika tidak, sistem akan mementalkan validasi error demi menghindarkan kerugian kemitraan. |
| **Ketersediaan Stok Fisik** | Menghindari penjualan barang gaib atau fiktif (*bai' ma'dum*). Produk dengan stok $\le 0$ otomatis terkunci (*disabled*) di halaman Kasir POS dan tidak dapat ditransaksikan. |
| **Bebas Riba & Bunga** | Seluruh perhitungan penjualan dilakukan langsung tanpa tambahan bunga kredit atau penalty bersifat eksploitatif. |
| **Zakat Mal Perdagangan** | Perhitungan zakat perdagangan otomatis sebesar $2.5\%$ bila aset lancar (stok produk + saldo kas) telah menyentuh batas Nisab emas tahunan (ekuivalen 85 gram emas per tahun/periode). |

---

## 3. Matriks Peran Pengguna (Role Permission Matrix)
Sistem membatasi otorisasi menu dan penentuan harga berdasarkan peran yang telah ditentukan:

1. **Kasir (Operator POS)**
   - Dapat melakukan checkout transaksi penjualan secara langsung.
   - **Restriksi**: Sama sekali tidak diperbolehkan mengedit atau mengubah harga beli/pokok/jual produk di kasir. Semua harga terkunci mutlak.
2. **Admin (Superadmin)**
   - Dapat menambah SKU baru, mengelola inventori produk, mengatur batas minimum stok (*reorder point*).
   - **Restriksi**: Hanya boleh mengubah harga produk apabila stok barang bersangkutan telah menembus **batas menipis** (di bawah batas minimum stok). Untuk produk bersetatus aman, form edit harga dikunci (*disabled*) guna meredam spekulasi harga sepihak.
3. **Owner (Pemilik Toko)**
   - Memiliki visibilitas penuh terhadap laporan laba rugi, modul zakat mal, dan audit log harian.
   - Hak prerogatif penuh untuk mengubah harga beli/modal maupun jual kapan saja tanpa terhambat oleh status batas kuantitas stok.

---

## 4. Daftar Fitur Utama (Core App Features)

### 4.1. Modul Aplikasi Kasir (POS Interface)
- **Katalog Produk Cepat**: Menampilkan grid produk sembako dan staple goods berdasar klasifikasi kategori.
- **Keranjang Belanja**: Menghitung subtotal secara langsung tanpa unsur denda ataupun bunga tersembunyi.
- **Validasi Stok Real-Time**: Tombol dikunci otomatis jika kuantitas barang dagang menyentuh angka 0.

### 4.2. Manajemen Inventori & Gudang
- **Pengaturan Minimun Alert**: Mendefinisikan garis ambang aman ketersediaan stok barang.
- **Form Edit Multi-Kriteria**: Validasi bersyarat untuk harga barang berdasar level pengguna (Admin vs Owner).

### 4.3. Laporan Keuangan & Kalkulator Zakat
- **Laba Rugi**: Laporan margin rill bersih dari penjualan produk.
- **Perhitungan Nisab Zakat**: Input dinamis harga emas hari ini untuk mengetahui kecukupan Nisab dan rekomendasi pengeluaran Zakat Mal secara syar'i.

### 4.4. Audit Trail & Log Keamanan
- Pencatatan otomatis setiap aksi krusial (login, transaksi penjualan, penyesuaian stok, perubahan harga modal). Log ini bersifat *append-only* (hanya bisa dibaca/ditambah, tidak boleh dihapus atau disunting) guna menjaga integritas akuntabilitas.

---

## 5. Spesifikasi Teknis (System Spec)
- **Framework Frontend**: React v19.x & TypeScript
- **State Management**: Zustand
- **Modul Styling**: Tailwind CSS v4.x
- **Build Tool**: Vite v6.x
- **Library Grafik**: Recharts (untuk tren penjualan)
- **Database**: Supabase Realtime SDK (dengan Fallback Mode Offline otomatis jika internet padam)
