# 06. Protokol Keamanan Data & Sistem Audit Trail

Amanah dalam tata kelola keuangan retail adalah rukun mutlak yang harus dijamin sistem digital BA Mart. Sistem mengimplementasikan kendali keamanan berlapis:

### 1. Sistem Autentikasi & Batasan Peran Sesi (Role-Based Access Control)
Sistem memisahkan kredensial masuk operator kasir, pengelolaan admin, dan persetujuan owner secara ketat:

*   **Kasir (`CASHIER` role)**:
    - Akun: `asy.23.kk` | Sandi: `kasir123!`
    - Keterbatasan: Hanya diijinkan membuka menu Kasir POS untuk melayani pembeli. Pembatasan total terhadap fitur finansial laba-rugi, perubah harga komoditas produk, neraca saldo, zakat perdagangan, dan riwayat audit trail.
*   **Superadmin (`ADMIN` role)**:
    - Akun: `superadmin.23kk` | Sandi: `admin123!`
    - Keterbatasan: Diijinkan mengupdate stok sembako serta menyunting harga komoditas **KHUSUS** yang kondisinya menipis (<= Batas Minimum). Terblokir dari menu Laporan Neraca Keuangan Laba Rugi rahasia perusahaan dan Audit Log sistem.
*   **Owner (`OWNER` role)**:
    - Akun: `owner.23kk` | Sandi: `owner123!`
    - Keterbatasan: Pemilik mutlak bisnis. Diijinkan mengakses seluruh pelaporan laporan laba rugi, penyesuaian harga aman, audit trail, serta pencatatan asnaf zakat.

### 2. Buku Log Digital Anti Manipulasi (System Audit Trail)
Setiap tindakan operasional penting yang memengaruhi integritas sistem, stok, dan keuangan otomatis direkam oleh sistem log internal:

*   Pemicu log terjadi saat ada peristiwa: Operator masuk/keluar (*login/logout*), transaksi POS rampung diselesaikan, penambahan SKU komoditas baru, perubahan detail barang oleh Admin, penyesuaian level sisa stok, pencatatan taksiran zakat mal, dan pencatatan asnaf penyaluran dana.
*   Log mencatatkan stempel waktu lengkap (*timestamp* ISO-8601), nama operator yang aktif melakukan tugas, jenis aktivitas kerja (*action tag*), serta rincian perubahan yang mendetail.
*   Data log ini otomatis disinkronkan ke tabel `audit_logs` di database Supabase terpusat dan bersifat *Read-Only* bagi segenap operator demi mencegah upaya kotor penghapusan atau perubahan catatan (*non-repudiation*).
