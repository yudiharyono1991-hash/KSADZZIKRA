# 07. Aturan Bisnis & Logika Validasi Transaksi

Guna menegakkan keadilan transaksi (*Adl*) sesuai fitrah muamalah Islam, sistem BA Mart mengonfigurasikan logika validasi baku yang diotomatiskan dalam baris-baris kode program:

### 1. Pembatasan Kekuatan Penentuan Harga Barang
*   **Kasir POS**: Tidak ada tombol, masukan (*input*), maupun menu untuk mengedit atau mengetikkan nominal harga beli, harga pokok, maupun harga jual barang di kasir. Semua angka didefinisikan mutlak dari sistem.
*   **Superadmin (Admin)**: Hanya dapat mengedit atau memperbarui harga komoditas produk jika level stok tersimpan barang bersangkutan berstatus **menipis (menembus batas minimum stok)**. Apabila produk yang dipilih memiliki stok melimpah di atas batas aman minimum, masukan isian harga modal dan harga jual otomatis terkunci (*disabled*) dalam modal lembar sunting barang.
*   **Owner (Pemilik)**: Memiliki hak prerogatif mengedit harga beli, modal, maupun harga jual eceran kapan saja tanpa terhambat status kecukupan kuantiti stok.

### 2. Aturan Margin Keuntungan yang Adil / Halal
*   **Validasi Margin Sehat**: Pada saat penyimpanan SKU baru maupun sunting produk, sistem mengecek kecocokan logis harga jual dan harga beli:
    $$\text{Harga Jual POS} \ge \text{Harga Modal (Harga Beli Rill)}$$
    Bila Harga Jual dikonfigurasikan lebih rendah daripada Harga Modal, sistem menolak penyimpanan dan mementalkan pesan peringatan Shariah: *"Harga Jual tidak boleh lebih kecil dari Harga Beli untuk menjaga akad perdagangan yang adil/halal."* Hal ini menghindarkan kerugian mudlarat dalam kemitraan.

### 3. Validasi Amannya Kecukupan Stok Barang Dagang
Perdagangan islam melarang mutlak penyelesaian transaksi atas barang yang belum dimiliki secara rill (*gharar / bai' ma'dum*).
*   Sistem POS memvalidasi sisa stok secara real-time. Bila sisa stok komoditas $\le 0$, tombol *"Pilih Produk"* di katalog kasir otomatis berubah rupa menjadi mati (*disabled*) bertuliskan *"Stok Kosong"*.
*   Di dalam lembar keranjang belanja (*shopping cart*), penambahan kuantiti berlebih juga dipancangkan validasi ketat. Sistem menolak penambahan pcs barang jika jumlah belanjaan terpilih telah menyentuh batas stok inventori teraktual.
