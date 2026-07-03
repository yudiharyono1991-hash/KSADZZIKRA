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
      { id: 'k1', title: 'Cara Memulai Shift Kasir', content: 'Masuk ke menu Kasir POS. Anda bisa langsung melayani transaksi.' },
      { id: 'k2', title: 'Cara Transaksi Penjualan', content: 'Masuk ke menu Kasir POS. Anda bisa scan barcode barang atau ketik nama/SKU di kolom pencarian lalu tekan Enter. Pastikan barang masuk ke keranjang, pilih metode pembayaran, dan cetak struk.' }
    ];
    
    const adminGuide = [
      { id: 'a1', title: 'Manajemen Data Barang', content: 'Masuk ke menu Inventory & Stok. Anda dapat menambah, mengedit, atau menghapus barang. Pastikan Barcode dan SKU unik. Anda juga bisa mengatur jumlah minimum stok untuk notifikasi.' },
      { id: 'a2', title: 'Laporan Keuangan', content: 'Masuk ke Dashboard & Laporan. Anda bisa melihat Jurnal Umum, Laporan Penjualan, dan Arus Kas. Anda bisa mencetak laporan ke PDF atau Excel.' },
      { id: 'a3', title: 'Stock Opname', content: 'Masuk ke Stock Opname, lalu masukkan jumlah fisik barang yang ada di rak. Sistem akan otomatis menghitung selisih dan mencatatnya.' }
    ];
    
    const ownerGuide = [
      { id: 'o1', title: 'Pengaturan Koperasi Syariah', content: 'Masuk ke menu Tata Kelola > Pengaturan Toko. Aktifkan tipe bisnis KOPERASI. Anda dapat mengatur nama bank koperasi, nomor rekening BSI, dan mengunggah QRIS Toko untuk pembayaran digital anggota secara realtime.' },
      { id: 'o2', title: 'Laporan Laba Rugi & Neraca Syariah', content: 'Akses menu Dashboard & Laporan > Neraca Laba Rugi. Laporan ini memisahkan margin keuntungan (murabahah) dengan pendapatan lainnya secara syariah. Mempermudah penghitungan zakat niaga dan sisa hasil usaha (SHU).' },
      { id: 'o3', title: 'Manajemen Chart of Accounts (CoA)', content: 'Gunakan menu baru "Daftar Akun (CoA)" untuk menambah, mengubah, atau menonaktifkan kode akun akuntansi. Anda juga dapat memetakan akun pendapatan dan akun HPP pada setiap barang di menu Inventory agar pencatatan jurnal umum berjalan otomatis.' },
      { id: 'o4', title: 'Manajemen Loyalitas Poin Belanja', content: 'KSA Mart menggunakan rasio poin loyalitas otomatis: setiap belanja kelipatan Rp 1.000, pelanggan mendapatkan 1 poin. Poin tersebut dapat ditukarkan di POS Kasir dengan nilai 100 poin = Rp 1.000 diskon belanja. Jumlah poin terkumpul dapat dipantau langsung oleh pelanggan di Member Portal mereka.' },
      { id: 'o5', title: 'Akses User & Mandiri Register', content: 'Pelanggan dapat mendaftar mandiri via halaman login (klasifikasi Anggota vs Non-Anggota Koperasi) dan langsung otomatis disetujui (auto-approve) untuk masuk ke Member Portal. Sedangkan pendaftar dengan peran Kasir atau Admin harus disetujui secara manual oleh Owner di menu "Akses & Akun Pengguna".' },
      { id: 'o6', title: 'Zakat & Pembagian SHU', content: 'Akses menu Dashboard & Laporan > Zakat untuk menghitung zakat maal/niaga berdasarkan nisab emas 85gr. Untuk pembagian keuntungan anggota koperasi, akses menu Koperasi Syariah > Pembagian SHU untuk mendistribusikan SHU secara merata berdasarkan keaktifan simpanan/belanja.' }
    ];

    if (role === 'KASIR') return kasirGuide;
    if (role === 'ADMIN') return [...kasirGuide, ...adminGuide];
    return [...kasirGuide, ...adminGuide, ...ownerGuide]; // OWNER sees all
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
          <h2 className="font-bold text-gray-800 text-lg border-b pb-2">Panduan Operasional</h2>
          {guides.map((item) => (
            <div key={item.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition">
              <button 
                onClick={() => toggleSection(item.id)}
                className="w-full text-left px-5 py-4 font-semibold text-green-800 flex justify-between items-center bg-gray-50 hover:bg-green-50"
              >
                {item.title}
                {openSection === item.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
              {openSection === item.id && (
                <div className="p-5 text-gray-600 bg-white leading-relaxed text-sm border-t border-gray-100">
                  {item.content}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <h2 className="font-bold text-gray-800 text-lg border-b pb-2">Hubungan Peran & Izin</h2>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-green-100 p-2 rounded-lg text-green-700 mt-1"><UserCheck className="w-5 h-5"/></div>
              <div>
                <h3 className="font-bold text-gray-800">1. KASIR</h3>
                <p className="text-xs text-gray-500 mt-1">Akses sangat terbatas pada operasional harian (Transaksi POS, Riwayat Transaksi). Tidak dapat mengedit harga barang atau menghapus log.</p>
              </div>
            </div>
            
            {(currentUser?.role === 'ADMIN' || currentUser?.role === 'OWNER') && (
              <div className="flex items-start gap-3">
                <div className="bg-amber-100 p-2 rounded-lg text-amber-700 mt-1"><ShieldCheck className="w-5 h-5"/></div>
                <div>
                  <h3 className="font-bold text-gray-800">2. ADMIN</h3>
                  <p className="text-xs text-gray-500 mt-1">Akses manajerial. Bisa mengatur inventori, mencetak laporan arus kas, serta mendata supplier dan pelanggan. Tidak punya akses ke audit log sensitif atau hak menyetujui akun.</p>
                </div>
              </div>
            )}

            {currentUser?.role === 'OWNER' && (
              <div className="flex items-start gap-3">
                <div className="bg-purple-100 p-2 rounded-lg text-purple-700 mt-1"><Settings className="w-5 h-5"/></div>
                <div>
                  <h3 className="font-bold text-gray-800">3. OWNER (Ketua Koperasi)</h3>
                  <p className="text-xs text-gray-500 mt-1">Hak akses penuh (Superadmin). Pemilik bisa melihat Neraca Laba Rugi, mengatur semua Hak Akses, Zakat, hingga fitur penuh Koperasi Syariah.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
