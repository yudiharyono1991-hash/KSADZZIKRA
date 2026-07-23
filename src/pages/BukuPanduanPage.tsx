import React, { useState } from 'react';
import { BookOpen, UserCheck, ShieldCheck, Settings, ShoppingCart, Users, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useAppStore } from '../store';

export default function BukuPanduanPage() {
  const { currentUser } = useAppStore();
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (id: string) => {
    setOpenSection(openSection === id ? null : id);
  };

  const getGuideByRole = () => {
    const role = currentUser?.role || 'KASIR';
    
    const kasirGuide = [
      { id: 'k0', title: 'Sistem Absensi (Clock In/Out) & Izin', content: 'Masuk ke menu Tutup & Rekap Shift. Anda wajib melakukan Absen Masuk (Clock In) sebelum memulai shift, dan Absen Keluar (Clock Out) saat selesai. Jika ada kendala, gunakan tombol "Ajukan Izin / Lupa Absen" di halaman yang sama.' },
      { id: 'k1', title: 'Cara Memulai Shift Kasir', content: 'Masuk ke menu Belanja Produk (sebelumnya Kasir POS). Anda bisa langsung melayani transaksi.' },
      { id: 'k2', title: 'Cara Transaksi Penjualan & Pembayaran QRIS', content: 'Di menu Belanja Produk, scan barcode barang atau ketik nama/SKU di kolom pencarian. Pada saat Checkout, jika memilih metode pembayaran QRIS, layar Anda akan memunculkan gambar QRIS Toko secara otomatis. Anda dapat meminta pembeli untuk men-scan layar HP atau monitor Anda langsung. Tekan "Verifikasi Bukti QRIS Selesai" jika pelanggan sudah berhasil bayar.' },
      { id: 'k3', title: 'Cara Menukarkan Poin Pelanggan', content: 'Saat Checkout, pastikan Anda telah memilih Nama Pelanggan (Anggota) di bagian atas. Jika pelanggan memiliki saldo poin loyalitas, sistem akan memunculkan opsi potong poin secara otomatis. Anda tinggal memasukkan jumlah poin yang ingin ditukarkan untuk mendiskon total belanjanya.' }
    ];
    
    const adminGuide = [
      { id: 'a1', title: 'Manajemen Data Barang', content: 'Masuk ke menu Inventory & Stok. Anda dapat menambah, mengedit, atau menghapus barang. Pastikan Barcode dan SKU unik. Anda juga bisa mengatur jumlah minimum stok untuk notifikasi.' },
      { id: 'a2', title: 'Manajemen Pesanan Online', content: 'Masuk ke menu Pesanan Online untuk memantau pesanan yang masuk dari aplikasi pelanggan. Anda bisa mengubah status pesanan (Diproses, Dikirim, Selesai) dan membalas chat pelanggan secara real-time.' },
      { id: 'a3', title: 'Stock Opname Dasar', content: 'Masuk ke Stock Opname, lalu masukkan jumlah fisik barang yang ada di rak. Sistem akan otomatis menghitung selisih dan mencatatnya.' },
      { id: 'a4', title: 'Manajemen Pelanggan & Kasbon', content: 'Gunakan menu Master Pelanggan untuk mengelola pelanggan. Anda bisa menambah pelanggan, mengubah Total Point, dan mencatat pelunasan hutang (Kasbon) dengan menekan tombol dompet hijau.' },
      { id: 'a5', title: 'Manajemen Karyawan & Kasbon Tunai', content: 'Di menu Manajemen Akun, Admin/Owner bisa menambahkan Pinjaman Tunai Karyawan (tombol + biru) atau mencatat Pelunasan cicilan karyawan (tombol centang hijau) pada kolom Piutang.' },
      { id: 'a6', title: 'Pembatalan Transaksi (Void)', content: 'Jika terjadi kesalahan, Anda dapat menekan tombol Void pada Riwayat Transaksi. Pengajuan akan dikirim ke notifikasi Manager untuk disetujui.' }
    ];

    const managerGuide = [
      { id: 'm1', title: 'Laporan Keuangan', content: 'Masuk ke Dashboard & Laporan. Anda bisa melihat Jurnal Umum, Laporan Penjualan, dan Arus Kas. Anda bisa mencetak laporan ke PDF atau Excel dengan blok tanda tangan 3 tingkat (Admin, Manager, Ketua).' },
      { id: 'm2', title: 'Review & Persetujuan HR (Absensi)', content: 'Masuk ke menu Manajemen Karyawan (HR). Anda dapat memantau kehadiran karyawan harian dan me-review pengajuan Izin, Cuti, Sakit, atau Lupa Absen pada tab Permohonan Koreksi.' },
      { id: 'm3', title: 'Manajemen CoA & Akun', content: 'Gunakan menu Daftar Akun (CoA) untuk menyesuaikan akun cabang dan struktur akuntansi syariah. Manager dapat menambah atau memperbarui akun yang terkait cabangnya.' },
      { id: 'm4', title: 'Manajemen Pelanggan Cabang', content: 'Gunakan menu Master Pelanggan untuk melihat dan mengubah Total Point, memantau penggunaan poin, serta mencatat piutang kasbon untuk cabang Anda.' },
      { id: 'm5', title: 'Approval Pembatalan (Void)', content: 'Setiap pengajuan pembatalan (Void) dari Kasir/Admin akan masuk ke ikon Lonceng (Notifikasi). Anda bisa langsung menuju Riwayat untuk Approve atau Reject.' }
    ];

      const ownerGuide = [
      { id: 'o1', title: 'Konfigurasi Sistem & Geofencing Lokasi', content: 'Masuk ke menu Tata Kelola > Pengaturan Toko. Anda dapat mengunci kordinat lokasi (Latitude & Longitude) toko dari GPS Anda, yang akan berfungsi ganda sebagai batas radius Absensi Karyawan dan batas maksimal pengiriman Pesanan Online.' },
      { id: 'o2', title: 'Standar Akuntansi Syariah (Laba Rugi & Neraca)', content: 'Akses menu Dashboard & Laporan > Laporan Laba Rugi. Laporan ini telah memisahkan Laba Bersih dan Zakat Niaga (2.5%), menyisakan SHU Bersih untuk dibagihasilkan secara Mudharabah. Fitur ini dirancang sesuai standar kepatuhan syariah (Review Pak Grandis).' },
      { id: 'o3', title: 'Manajemen Karyawan (HR) Menyeluruh', content: 'Pantau kehadiran, setujui permohonan cuti/izin/sakit, dan pantau kedisiplinan (Late/Alfa) karyawan seluruh cabang melalui menu Manajemen Karyawan (HR).' },
      { id: 'o4', title: 'Zakat Niaga Otomatis', content: 'Sistem mengkalkulasi kewajiban zakat (zakatReserve) otomatis sebesar 2.5% (atau sesuai pengaturan) dari netProfit berjalan jika usahanya untung. Transparan tanpa intervensi manual.' },
      { id: 'o5', title: 'Manajemen Pengguna Terpusat', content: 'Akses menu Manajemen Akun. Anda bisa melihat semua staf dari semua cabang. Manager hanya bisa melihat cabang mereka sendiri.' }
    ];

    if (role === 'KASIR') return kasirGuide;
    if (role === 'ADMIN') return adminGuide;
    if (role === 'MANAGER') return managerGuide;
    return ownerGuide; // OWNER / SUPERADMIN / PENGURUS
  };

  const guides = getGuideByRole();

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="bg-green-800 text-white p-8 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="absolute -top-12 -right-12 text-green-700 opacity-30">
          <BookOpen className="w-48 h-48" />
        </div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <HelpCircle className="w-8 h-8" />
            Buku Panduan KSA Mart
          </h1>
          <p className="mt-2 text-green-100 max-w-2xl">
            Selamat datang di pedoman penggunaan aplikasi. Silakan klik salah satu topik di bawah ini untuk mempelajari cara menggunakan fitur yang tersedia sesuai dengan hak akses Anda.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="space-y-4">
          <h2 className="font-bold text-gray-800 dark:text-slate-200 text-lg border-b pb-2">Panduan Operasional</h2>
          {guides.map((item) => (
            <div key={item.id} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition">
              <button 
                onClick={() => toggleSection(item.id)}
                className="w-full text-left px-5 py-4 font-semibold text-green-800 flex justify-between items-center bg-gray-50 dark:bg-slate-800 hover:bg-green-50"
              >
                {item.title}
                {openSection === item.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
              {openSection === item.id && (
                <div className="p-5 text-gray-600 dark:text-slate-400 bg-white dark:bg-slate-900 leading-relaxed text-sm border-t border-gray-100 dark:border-slate-800">
                  {item.content}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <h2 className="font-bold text-gray-800 dark:text-slate-200 text-lg border-b pb-2">Integrasi Perangkat & Sistem Eksternal</h2>
          <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 shadow-sm space-y-4 text-sm text-blue-900 leading-relaxed">
            <h3 className="font-bold text-blue-800 text-base mb-2">1. Dukungan Perangkat Keras (Hardware)</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Barcode Scanner:</strong> Aplikasi KSA Mart sepenuhnya mendukung pemindai *barcode* standar (USB/Bluetooth). Cukup arahkan kursor ke kolom pencarian di halaman Kasir POS, lalu *scan* barang. Scanner akan otomatis mengetikkan kode dan menekan tombol *Enter* untuk memasukkan barang ke keranjang secara instan.</li>
              <li><strong>Mesin Printer Kasir (Thermal):</strong> Pencetakan struk transaksi menggunakan fungsi cetak bawaan sistem (`window.print()`). Pada layar Kasir, Anda dapat menghubungkan printer kasir kabel/USB tipe lama maupun baru. Tersedia pilihan ukuran kertas (58mm, 80mm, atau A4) sesaat sebelum Anda menekan tombol Cetak, yang secara otomatis akan menyesuaikan ukuran struk agar pas di kertas tanpa terpotong.</li>
            </ul>
            <h3 className="font-bold text-blue-800 text-base mt-4 mb-2">2. Kerjasama Pihak Ketiga (PPOB, E-Wallet, VA)</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Aplikasi KSA Mart dikembangkan dengan arsitektur modern (React) yang sangat siap dan mudah dikoneksikan dengan layanan API Pihak Ketiga (seperti Payment Gateway Midtrans, Xendit, atau penyedia PPOB).</li>
              <li>Untuk tahap produksi selanjutnya, ketika koperasi sudah melakukan penandatanganan kontrak dengan penyedia PPOB/VA, integrasi *backend API* (Webhook) dapat langsung disematkan pada sistem ini tanpa merombak ulang tampilan aplikasi.</li>
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="font-bold text-gray-800 dark:text-slate-200 text-lg border-b pb-2">Hubungan Peran & Izin</h2>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm space-y-4">
            {((currentUser?.role as any) === 'KASIR' || (currentUser?.role as any) === 'KASIR_TOKO') && (
              <div className="flex items-start gap-3">
                <div className="bg-green-100 p-2 rounded-lg text-green-700 mt-1"><UserCheck className="w-5 h-5"/></div>
                <div>
                  <h3 className="font-bold text-gray-800 dark:text-slate-200">KASIR</h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Akses sangat terbatas pada operasional harian (Transaksi POS, Riwayat Transaksi). Tidak dapat mengedit harga barang atau menghapus log.</p>
                </div>
              </div>
            )}
            
            {currentUser?.role === 'ADMIN' && (
              <div className="flex items-start gap-3">
                <div className="bg-amber-100 p-2 rounded-lg text-amber-700 mt-1"><ShieldCheck className="w-5 h-5"/></div>
                <div>
                  <h3 className="font-bold text-gray-800 dark:text-slate-200">ADMIN</h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Akses staf untuk inventori dasar dan mencatat pesanan. Tidak punya akses ke Laba Rugi atau Pengaturan Toko.</p>
                </div>
              </div>
            )}

            {currentUser?.role === 'MANAGER' && (
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 p-2 rounded-lg text-blue-700 mt-1"><Users className="w-5 h-5"/></div>
                <div>
                  <h3 className="font-bold text-gray-800 dark:text-slate-200">MANAGER</h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Akses manajerial. Bisa mengatur cabang, menyetujui akun, dan melihat laporan penjualan serta kas. Tidak dapat mengubah pengaturan krusial toko.</p>
                </div>
              </div>
            )}

            {(currentUser?.role === 'OWNER' || currentUser?.role === 'PENGURUS' || currentUser?.role === 'SUPERADMIN') && (
              <div className="flex items-start gap-3">
                <div className="bg-purple-100 p-2 rounded-lg text-purple-700 mt-1"><Settings className="w-5 h-5"/></div>
                <div>
                  <h3 className="font-bold text-gray-800 dark:text-slate-200">OWNER / PENGAWAS</h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Hak akses penuh (Superadmin). Pemilik bisa melihat Neraca Laba Rugi, mengatur semua Hak Akses, Zakat, hingga fitur penuh Tata Kelola Toko.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
