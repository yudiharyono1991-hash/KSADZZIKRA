import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Calculator, Wallet, Users, Award, Download, Info } from 'lucide-react';

interface KoperasiMember {
  id: string;
  nia: string;
  name: string;
  points: number;
  simpananPokok: number;
  simpananWajib: number;
  simpananSukarela: number;
}

const DUMMY_MEMBERS: KoperasiMember[] = [
  { id: 'kop_1', nia: 'NIA-001', name: 'Ahmad Fauzi', points: 1540, simpananPokok: 100000, simpananWajib: 120000, simpananSukarela: 500000 },
  { id: 'kop_2', nia: 'NIA-002', name: 'Budi Santoso', points: 850, simpananPokok: 100000, simpananWajib: 110000, simpananSukarela: 0 },
  { id: 'kop_3', nia: 'NIA-003', name: 'Siti Aminah', points: 2100, simpananPokok: 100000, simpananWajib: 100000, simpananSukarela: 1500000 },
  { id: 'kop_4', nia: 'NIA-004', name: 'Dewi Lestari', points: 320, simpananPokok: 100000, simpananWajib: 90000, simpananSukarela: 50000 }
];

export default function KoperasiSHUPage() {
  const { currentUser } = useAppStore();
  const [labaBersih, setLabaBersih] = useState(25000000); // Rp 25 Juta Dummy Laba Bersih
  const [porsiModal, setPorsiModal] = useState(40); // 40% untuk Jasa Modal
  const [porsiUsaha, setPorsiUsaha] = useState(30); // 30% untuk Jasa Usaha (Belanja)
  const [porsiPengurus, setPorsiPengurus] = useState(20); // 20% Pengurus
  const [porsiSosial, setPorsiSosial] = useState(10); // 10% Dana Sosial

  if (!['ADMIN', 'OWNER', 'SUPERADMIN', 'MANAGER', 'PENGURUS'].includes(currentUser?.role || '')) {
    return <div className="p-6 text-red-500">Akses Ditolak. Khusus Admin/Owner.</div>;
  }

  // Perhitungan Global
  const totalSimpananKoperasi = DUMMY_MEMBERS.reduce((sum, m) => sum + m.simpananPokok + m.simpananWajib + m.simpananSukarela, 0);
  const totalPoinKoperasi = DUMMY_MEMBERS.reduce((sum, m) => sum + m.points, 0);

  const totalShuModal = (labaBersih * porsiModal) / 100;
  const totalShuUsaha = (labaBersih * porsiUsaha) / 100;
  const totalShuPengurus = (labaBersih * porsiPengurus) / 100;
  const totalShuSosial = (labaBersih * porsiSosial) / 100;

  // Hitung SHU Per Anggota
  const shuMembers = DUMMY_MEMBERS.map(m => {
    const totalSimpananAnggota = m.simpananPokok + m.simpananWajib + m.simpananSukarela;
    
    // Porsi Jasa Modal: (Simpanan Anggota / Total Simpanan Koperasi) * Total SHU Modal
    const shuModal = totalSimpananKoperasi > 0 ? (totalSimpananAnggota / totalSimpananKoperasi) * totalShuModal : 0;
    
    // Porsi Jasa Usaha: (Poin Anggota / Total Poin Koperasi) * Total SHU Usaha
    const shuUsaha = totalPoinKoperasi > 0 ? (m.points / totalPoinKoperasi) * totalShuUsaha : 0;

    return {
      ...m,
      totalSimpananAnggota,
      shuModal,
      shuUsaha,
      totalShu: shuModal + shuUsaha
    };
  }).sort((a, b) => b.totalShu - a.totalShu); // Urutkan dari SHU terbesar

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-green-100 text-green-800 rounded-xl shadow-sm">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Simulasi Pembagian SHU</h1>
            <p className="text-sm text-gray-500">Sisa Hasil Usaha berdasarkan Jasa Modal dan Jasa Usaha (Poin Belanja).</p>
          </div>
        </div>
        <button className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md transition-all">
          <Download className="w-4 h-4"/> Export Excel / Cetak
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Konfigurasi SHU */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-green-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Wallet className="w-32 h-32" />
            </div>
            <h2 className="text-lg font-bold text-green-900 mb-4 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-green-600" />
              Laba Bersih Tahunan
            </h2>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-500">Rp</span>
              <input 
                type="number" 
                value={labaBersih}
                onChange={e => setLabaBersih(Number(e.target.value))}
                className="w-full bg-green-50 border border-green-200 text-green-900 font-black text-xl rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2 flex items-start gap-1">
              <Info className="w-3 h-3 mt-0.5 shrink-0" />
              Nilai ini bisa diambil otomatis dari laporan Neraca Laba Rugi akhir tahun.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wider">Persentase Alokasi SHU</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-semibold text-gray-700">Jasa Modal (Simpanan)</span>
                  <span className="font-bold text-green-600">{porsiModal}%</span>
                </div>
                <input type="range" min="0" max="100" value={porsiModal} onChange={e => setPorsiModal(Number(e.target.value))} className="w-full accent-green-600" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-semibold text-gray-700">Jasa Usaha (Poin Belanja)</span>
                  <span className="font-bold text-amber-600">{porsiUsaha}%</span>
                </div>
                <input type="range" min="0" max="100" value={porsiUsaha} onChange={e => setPorsiUsaha(Number(e.target.value))} className="w-full accent-amber-500" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-semibold text-gray-700">Dana Pengurus</span>
                  <span className="font-bold text-blue-600">{porsiPengurus}%</span>
                </div>
                <input type="range" min="0" max="100" value={porsiPengurus} onChange={e => setPorsiPengurus(Number(e.target.value))} className="w-full accent-blue-600" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-semibold text-gray-700">Dana Sosial / ZISWAF</span>
                  <span className="font-bold text-purple-600">{porsiSosial}%</span>
                </div>
                <input type="range" min="0" max="100" value={porsiSosial} onChange={e => setPorsiSosial(Number(e.target.value))} className="w-full accent-purple-600" />
              </div>
            </div>
            
            {(porsiModal + porsiUsaha + porsiPengurus + porsiSosial) !== 100 && (
              <div className="mt-4 p-3 bg-red-50 text-red-600 text-xs font-bold rounded-lg border border-red-200">
                ⚠️ Peringatan: Total persentase harus persis 100%. Saat ini: {porsiModal + porsiUsaha + porsiPengurus + porsiSosial}%
              </div>
            )}
          </div>
        </div>

        {/* Kolom Kanan: Distribusi SHU */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-green-50 p-4 rounded-xl border border-green-100">
              <p className="text-[10px] text-green-600 font-bold uppercase">Total SHU Modal</p>
              <p className="text-lg font-black text-green-800">Rp {(totalShuModal / 1000000).toFixed(1)} Jt</p>
            </div>
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
              <p className="text-[10px] text-amber-600 font-bold uppercase">Total SHU Usaha</p>
              <p className="text-lg font-black text-amber-800">Rp {(totalShuUsaha / 1000000).toFixed(1)} Jt</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
              <p className="text-[10px] text-blue-600 font-bold uppercase">Total Pengurus</p>
              <p className="text-lg font-black text-blue-800">Rp {(totalShuPengurus / 1000000).toFixed(1)} Jt</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
              <p className="text-[10px] text-purple-600 font-bold uppercase">Total Sosial</p>
              <p className="text-lg font-black text-purple-800">Rp {(totalShuSosial / 1000000).toFixed(1)} Jt</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 bg-green-900 text-white flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2"><Users className="w-5 h-5"/> Distribusi SHU Anggota</h3>
              <div className="text-xs font-medium bg-green-800 px-3 py-1 rounded-full border border-green-700">
                Total Anggota: {DUMMY_MEMBERS.length}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 text-gray-500 font-semibold text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3">NIA / Nama</th>
                    <th className="px-5 py-3 text-right">Modal Koperasi</th>
                    <th className="px-5 py-3 text-center">Poin Usaha</th>
                    <th className="px-5 py-3 text-right text-green-600 bg-green-50">SHU Modal</th>
                    <th className="px-5 py-3 text-right text-amber-600 bg-amber-50">SHU Usaha</th>
                    <th className="px-5 py-3 text-right font-bold text-gray-800">Total SHU Diterima</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {shuMembers.map((m, idx) => (
                    <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-gray-800 flex items-center gap-2">
                          {idx === 0 && <Award className="w-4 h-4 text-amber-500"/>}
                          {m.name}
                        </div>
                        <div className="text-[10px] text-gray-500">{m.nia}</div>
                      </td>
                      <td className="px-5 py-4 text-right font-medium text-gray-600">
                        Rp {m.totalSimpananAnggota.toLocaleString('id-ID')}
                      </td>
                      <td className="px-5 py-4 text-center font-bold text-gray-600">
                        {m.points.toLocaleString('id-ID')}
                      </td>
                      <td className="px-5 py-4 text-right font-medium text-green-700 bg-green-50/50">
                        Rp {Math.round(m.shuModal).toLocaleString('id-ID')}
                      </td>
                      <td className="px-5 py-4 text-right font-medium text-amber-700 bg-amber-50/50">
                        Rp {Math.round(m.shuUsaha).toLocaleString('id-ID')}
                      </td>
                      <td className="px-5 py-4 text-right font-black text-green-800 bg-green-50">
                        Rp {Math.round(m.totalShu).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-green-950 text-white font-bold">
                    <td colSpan={3} className="px-5 py-3 text-right text-xs tracking-wider uppercase">Grand Total SHU Anggota Dibagikan</td>
                    <td className="px-5 py-3 text-right text-green-300">Rp {totalShuModal.toLocaleString('id-ID')}</td>
                    <td className="px-5 py-3 text-right text-amber-300">Rp {totalShuUsaha.toLocaleString('id-ID')}</td>
                    <td className="px-5 py-3 text-right text-white text-base">Rp {(totalShuModal + totalShuUsaha).toLocaleString('id-ID')}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
