import React, { useState } from 'react';
import { ArrowLeft, BookOpen, ChevronRight, BookText, X, Scale, HeartHandshake, BookHeart, Calculator } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ARTIKEL_MOCK = [
  {
    id: 1,
    title: "Mengenal Prinsip Fikih Muamalah dalam Perdagangan Ritel",
    author: "Dewan Syariah Nasional MUI",
    date: "Hari ini",
    excerpt: "Panduan komprehensif memahami dasar-dasar akad jual beli (Al-Bai') yang sah, syarat kerelaan, serta larangan Gharar dan Maysir menurut pandangan ulama empat mazhab.",
    content: "Fikih muamalah adalah fondasi utama bagi setiap Muslim yang terjun ke dunia bisnis. Dalam perdagangan ritel modern, batas antara yang halal dan syubhat seringkali menjadi kabur karena kompleksitas sistem promosi dan distribusi.\n\n### 1. Rukun dan Syarat Jual Beli (Al-Bai')\nJual beli dalam Islam didefinisikan sebagai pertukaran harta dengan harta berdasarkan kerelaan (Tawadhu'). Rukun jual beli meliputi:\n- **'Aqidain** (Penjual dan Pembeli): Harus baligh, berakal, dan tidak dipaksa.\n- **Ma'qud 'Alaih** (Barang dan Harga): Barang harus suci, bermanfaat, dapat diserahterimakan, dan jelas wujud serta sifatnya.\n- **Sighat** (Ijab Kabul): Kesepakatan yang menunjukkan kerelaan kedua belah pihak.\n\nAllah ﷻ berfirman dalam Surat An-Nisa ayat 29:\nيَا أَيُّهَا الَّذِينَ آمَنُوا لَا تَأْكُلُوا أَمْوَالَكُم بَيْنَكُم بِالْبَاطِلِ إِلَّا أَن تَكُونَ تِجَارَةً عَن تَرَاضٍ مِّنكُمْ\n*\"Hai orang-orang yang beriman, janganlah kamu saling memakan harta sesamamu dengan jalan yang batil, kecuali dengan jalan perniagaan yang berlaku dengan suka sama-suka di antara kamu.\"*\n\n### 2. Larangan Riba, Gharar, dan Maysir\n- **Riba**: Tambahan yang disyaratkan dalam transaksi hutang piutang (Riba Duyuun) atau pertukaran barang sejenis (Riba Buyuu').\n- **Gharar**: Ketidakjelasan dalam transaksi, baik dari sisi harga, waktu penyerahan, maupun spesifikasi barang (seperti sistem mystery box yang tidak jelas nilainya).\n- **Maysir**: Unsur spekulasi atau untung-untungan (judi) yang dilarang keras, seringkali tersembunyi dalam program undian berbayar.\n\n### 3. Integritas dan Keberkahan\nRasulullah ﷺ bersabda:\n*\"Penjual dan pembeli memiliki hak khiyar (memilih) selama mereka belum berpisah. Jika keduanya jujur dan menjelaskan (kondisi barang), maka jual beli mereka diberkahi. Namun jika keduanya menyembunyikan (cacat) dan berdusta, maka dihapus keberkahan jual beli mereka.\"* (HR. Bukhari & Muslim)\n\n---\n**Referensi & Rujukan:**\n1. *Al-Fiqh Al-Islami wa Adillatuh*, Prof. Dr. Wahbah Az-Zuhaili, Jilid 5.\n2. *Fatwa DSN-MUI No. 110/DSN-MUI/IX/2017* tentang Akad Jual Beli.\n3. *Fatawa Al-Lajnah Ad-Daimah*, Bab Al-Buyuu'.",
    icon: Scale,
    bgGradient: "from-emerald-500 to-emerald-700",
    colorClass: "text-emerald-700"
  },
  {
    id: 2,
    title: "Hukum Cashback e-Wallet dan Paylater dalam Tinjauan Fikih",
    author: "Ust. Dr. Erwandi Tarmizi, MA",
    date: "Kemarin",
    excerpt: "Analisis mendalam mengenai status hukum cashback dari dompet digital dan penggunaan fitur paylater dalam transaksi belanja sehari-hari.",
    content: "Perkembangan teknologi keuangan (FinTech) melahirkan metode pembayaran baru seperti e-Wallet (dompet digital) dan Paylater. Bagaimana pandangan fikih terhadap diskon atau cashback yang diberikan?\n\n### 1. Status Top-Up e-Wallet\nMayoritas ulama kontemporer mengkategorikan saldo yang mengendap di e-Wallet sebagai akad *Qardh* (piutang) dari pengguna kepada perusahaan aplikasi. \n\nKaidah fikih yang masyhur berbunyi:\nكُلُّ قَرْضٍ جَرَّ مَنْفَعَةً فَهُوَ رِبَا\n*\"Setiap piutang yang mendatangkan kemanfaatan (bagi pemberi piutang) adalah riba.\"*\n\nOleh karena itu, diskon atau cashback yang disyaratkan khusus bagi pengguna e-Wallet tertentu (karena mereka meminjamkan uang ke aplikasi melalui top-up) dikategorikan sebagai riba oleh sebagian ulama. Namun, jika e-Wallet tersebut murni sebagai alat bayar tanpa pengendapan dana (langsung debit dari rekening syariah), maka diskon tersebut diperbolehkan karena berstatus sebagai *Hadiah* dari penjual (akad *Ju'alah*).\n\n### 2. Hukum Paylater\nPaylater pada dasarnya adalah skema *Qardh* (pinjaman) talangan dari penyedia jasa, atau akad *Murabahah* jika aplikasi bertindak sebagai pembeli lalu menjual kembali ke konsumen.\nMasalah utama Paylater saat ini adalah adanya klausul denda keterlambatan (Gharamah) berupa persentase atau nominal tambahan jika telat bayar. Denda keterlambatan atas hutang disepakati oleh seluruh ulama sebagai **Riba Jahiliyah** yang diharamkan secara mutlak.\n\n### Solusi bagi Pengusaha Ritel\nBagi pemilik toko, menerima pembayaran dari e-Wallet adalah mubah (boleh) karena akad jual beli barangnya sah. Dosa riba (jika ada) ditanggung oleh pengguna dan penyedia aplikasi. Namun, sangat dianjurkan untuk mendukung metode pembayaran tunai atau transfer bank syariah langsung (QRIS Syariah).\n\n---\n**Referensi & Rujukan:**\n1. *Harta Haram Muamalat Kontemporer*, Cetakan ke-22, Hal. 420-435.\n2. *Fatwa DSN-MUI No. 116/DSN-MUI/IX/2017* tentang Uang Elektronik Syariah.\n3. *Majma' Al-Fiqh Al-Islami*, Resolusi tentang Kartu Kredit dan Diskon.",
    icon: HeartHandshake,
    bgGradient: "from-amber-500 to-orange-600",
    colorClass: "text-amber-600"
  },
  {
    id: 3,
    title: "Sistem Dropship dan Reseller: Mana yang Halal?",
    author: "Tim Ahli Fikih BA Mart",
    date: "2 Hari yang lalu",
    excerpt: "Membedah perbedaan mendasar antara skema dropshipping modern dan reseller tradisional dari kacamata syariat Islam.",
    content: "Model bisnis dropship semakin diminati karena minim modal. Namun, apakah menjual barang yang belum dimiliki diperbolehkan dalam Islam?\n\n### Larangan Menjual Barang yang Belum Dimiliki\nRasulullah ﷺ bersabda kepada Hakim bin Hizam:\nلَا تَبِعْ مَا لَيْسَ عِنْدَكَ\n*\"Janganlah engkau menjual sesuatu yang tidak ada padamu (tidak kau miliki).\"* (HR. Abu Daud, Tirmidzi)\n\nDalam skema dropship konvensional, dropshipper menerima uang dari pembeli untuk barang yang belum ia beli dan belum ia terima dari supplier. Ini melanggar hadits di atas karena mengandung unsur *Gharar* (ketidakpastian pengiriman barang).\n\n### Solusi Dropship Syariah\nUntuk men-syariah-kan model bisnis ini, ada 3 skema akad yang bisa digunakan:\n\n1. **Skema Samsarah (Makelar/Broker)**:\n   Dropshipper bertindak sebagai agen pemasaran bagi supplier. Ia tidak mematok harga sendiri, melainkan menjual sesuai harga supplier dan mendapatkan *Ujrah* (fee/komisi) yang disepakati di awal.\n   \n2. **Skema Salam (Pesan Buat/Beli)**:\n   Pembeli membayar lunas di awal kepada dropshipper dengan spesifikasi barang yang sangat jelas. Kemudian dropshipper memesan barang tersebut ke supplier. (Biasanya berlaku untuk barang komoditas atau custom).\n\n3. **Wakalah bil Ujrah**:\n   Pembeli mewakilkan (Wakalah) kepada dropshipper untuk mencarikan dan membelikan barang tertentu dengan memberikan upah jasa pencarian barang.\n\n### Reseller Tradisional\nReseller yang membeli stok barang terlebih dahulu (barang sudah dikuasai baik secara fisik maupun konstruktif), lalu menjualnya kembali, adalah praktik jual beli normal yang dihalalkan dan dianjurkan, karena risiko kerusakan barang sudah berpindah kepadanya (Kaidah: *Al-Kharaj bidh Dhaman*).\n\n---\n**Referensi & Rujukan:**\n1. *Al-Mu'amalat Al-Maliyah Al-Mu'ashirah*, Prof. Dr. Khalid Al-Musyaiqih.\n2. *Fatawa Asy-Syabakah Al-Islamiyah*, No. 13244 tentang Dropshipping.\n3. *Al-Ma'ayir Asy-Syar'iyyah AAOIFI*, Standar No. 10 tentang Salam.",
    icon: BookHeart,
    bgGradient: "from-blue-500 to-indigo-600",
    colorClass: "text-indigo-600"
  },
  {
    id: 4,
    title: "Panduan Zakat Perniagaan untuk UMKM",
    author: "Lembaga Zakat Nasional",
    date: "3 Hari yang lalu",
    excerpt: "Cara menghitung nisab dan haul zakat perniagaan dari stok barang dan piutang dagang secara akurat berdasarkan standar fikih zakat.",
    content: "Zakat perniagaan (Zakah 'Urudh At-Tijarah) diwajibkan atas aset-aset yang diperjualbelikan dengan niat mendapatkan keuntungan. \n\n### Syarat Wajib Zakat Perniagaan\n1. **Niat Dagang**: Barang dibeli untuk dijual kembali.\n2. **Mencapai Nisab**: Nilai kekayaan dagang mencapai setara 85 gram emas murni (24 karat).\n3. **Mencapai Haul**: Kekayaan tersebut telah berjalan selama 1 tahun Hijriah (Qamariyah).\n\n### Cara Menghitung (Rumus Ulama Kontemporer)\nFormula yang paling disepakati berdasarkan pandangan Mazhab Syafi'i dan Hambali adalah pada akhir tahun tutup buku:\n\n**Aset Zakat = (Modal Tunai + Saldo Bank) + (Nilai Stok Barang Dagangan) + (Piutang yang Diharapkan Cair)**\n\n*(Catatan: Aset tetap seperti mesin kasir, etalase, rak toko, dan bangunan toko tidak dihitung dalam zakat).* \n\nSetelah itu, kurangi dengan hutang operasional yang jatuh tempo tahun tersebut:\n**Net Aset Zakat = Aset Zakat - Hutang Jatuh Tempo**\n\nJika *Net Aset Zakat* melebihi batas Nisab emas (sekitar Rp 85.000.000,- saat ini), maka wajib dikeluarkan zakatnya sebesar **2.5%**.\n\n### Nilai Stok Barang\nUlama kontemporer (seperti resolusi Muktamar Zakat Internasional) menetapkan bahwa evaluasi stok barang di akhir tahun dinilai berdasarkan **Harga Jual Pasar (Market Value) saat ini**, bukan harga modal awal pembelian. Ini karena yang dizakati adalah nilai potensial harta tersebut.\n\n---\n**Referensi & Rujukan:**\n1. *Fiqh Az-Zakah*, Syaikh Dr. Yusuf Al-Qaradawi.\n2. *Fatwa DSN-MUI*, tentang Zakat Perusahaan.\n3. Kitab *Al-Mughni*, Ibnu Qudamah, Bab Zakat Urudh At-Tijarah.",
    icon: Calculator,
    bgGradient: "from-rose-500 to-rose-700",
    colorClass: "text-rose-600"
  }
];


export default function ArtikelIslamiPage() {
  const navigate = useNavigate();
  const [selectedArticle, setSelectedArticle] = useState<typeof ARTIKEL_MOCK[0] | null>(null);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans pb-12">
      <header className="bg-emerald-800 text-white shadow-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => navigate('/')}
              className="p-2 hover:bg-emerald-700 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-2">
              <BookOpen className="w-6 h-6 text-amber-400" />
              <h1 className="text-xl font-bold tracking-tight">Edukasi Fikih Muamalah</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 mt-8 animate-in fade-in duration-500">
        
        {/* HERO ARTICLE */}
        <div 
          onClick={() => setSelectedArticle(ARTIKEL_MOCK[0])}
          className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col md:flex-row group cursor-pointer hover:shadow-md hover:border-emerald-200 transition-all mb-10"
        >
          <div className={`w-full md:w-1/2 h-64 md:h-auto relative overflow-hidden bg-gradient-to-br ${ARTIKEL_MOCK[0].bgGradient} flex items-center justify-center p-8`}>
            {(() => {
              const Icon = ARTIKEL_MOCK[0].icon;
              return <Icon className="w-32 h-32 text-white opacity-80 group-hover:scale-110 transition-transform duration-700" />;
            })()}
            <div className="absolute top-4 left-4 bg-white/20 backdrop-blur-sm border border-white/40 text-white px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase">
              Artikel Pilihan
            </div>
          </div>
          <div className="w-full md:w-1/2 p-8 flex flex-col justify-center">
            <div className="flex items-center space-x-2 text-sm text-slate-500 mb-3 font-medium">
              <span>{ARTIKEL_MOCK[0].author}</span>
              <span>•</span>
              <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">Baru Diperbarui</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-4 leading-tight group-hover:text-emerald-700 transition-colors">
              {ARTIKEL_MOCK[0].title}
            </h2>
            <p className="text-slate-600 leading-relaxed mb-6">
              {ARTIKEL_MOCK[0].excerpt}
            </p>
            <button className="flex items-center space-x-2 text-emerald-600 font-bold group-hover:text-emerald-800 transition-colors w-max">
              <span>Baca Selengkapnya</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <BookText className="w-6 h-6 text-emerald-700" />
            <h2 className="text-xl font-bold text-slate-800">Artikel Terbaru</h2>
          </div>
          <div className="text-xs text-slate-500 italic bg-white px-3 py-1.5 rounded-full border border-slate-200">
            Diperbarui secara berkala
          </div>
        </div>

        {/* ARTICLES GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ARTIKEL_MOCK.slice(1).map((artikel) => {
            const IconComponent = artikel.icon;
            return (
              <div 
                key={artikel.id} 
                onClick={() => setSelectedArticle(artikel)}
                className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden group cursor-pointer hover:shadow-md hover:border-emerald-200 transition-all flex flex-col"
              >
                <div className={`h-40 relative overflow-hidden bg-gradient-to-br ${artikel.bgGradient} flex items-center justify-center`}>
                  <IconComponent className="w-16 h-16 text-white opacity-80 group-hover:scale-110 transition-transform duration-500" />
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex justify-between items-center text-xs text-slate-500 font-medium mb-3">
                    <span className="truncate pr-2">{artikel.author}</span>
                    <span className="whitespace-nowrap font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded">{artikel.date}</span>
                  </div>
                  <h3 className={`font-bold text-lg text-slate-800 leading-tight mb-2 group-hover:${artikel.colorClass} transition-colors`}>
                    {artikel.title}
                  </h3>
                  <p className="text-sm text-slate-600 line-clamp-3 mb-4 flex-1">
                    {artikel.excerpt}
                  </p>
                  <div className={`flex items-center font-bold text-sm mt-auto ${artikel.colorClass}`}>
                    Baca Artikel <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </main>

      {/* ARTICLE READING MODAL */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 flex justify-center items-end sm:items-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl sm:rounded-3xl rounded-t-3xl max-h-[90vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-8 duration-300">
            {/* Modal Header */}
            <div className={`p-6 sm:p-8 sm:rounded-t-3xl rounded-t-3xl bg-gradient-to-br ${selectedArticle.bgGradient} text-white relative`}>
              <button 
                onClick={() => setSelectedArticle(null)}
                className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 p-2 rounded-full backdrop-blur-md transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
              <div className="flex items-center space-x-2 text-white/80 text-sm mb-3 font-medium">
                <span className="bg-white/20 px-2 py-0.5 rounded border border-white/20">{selectedArticle.author}</span>
                <span>•</span>
                <span>{selectedArticle.date}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight mb-2">
                {selectedArticle.title}
              </h2>
            </div>
            
            {/* Modal Content */}
            <div className="p-6 sm:p-8 overflow-y-auto bg-[#fafafa]">
              <p className="text-slate-800 text-base sm:text-lg leading-relaxed whitespace-pre-line font-medium">
                {selectedArticle.content}
              </p>
              
              <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                <p className="text-sm text-slate-500 italic text-center sm:text-left">
                  Materi ini disediakan khusus untuk edukasi pengguna SmartPOS Shariah.
                </p>
                <button 
                  onClick={() => setSelectedArticle(null)}
                  className={`px-6 py-2 rounded-full font-bold text-white shadow-md transition-transform hover:scale-105 bg-gradient-to-r ${selectedArticle.bgGradient}`}
                >
                  Tutup Artikel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
