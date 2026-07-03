import React, { useState, useEffect } from 'react';
import { FileText, Download, TrendingUp, TrendingDown, Landmark } from 'lucide-react';

export default function KoperasiKeuanganPage() {
  const [pembiayaan, setPembiayaan] = useState<any[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('ksa_pembiayaan');
    if (saved) {
      try { setPembiayaan(JSON.parse(saved)); } catch(e) {}
    }
  }, []);

  const totalPiutang = pembiayaan.reduce((acc, curr) => acc + curr.nominal + curr.margin, 0);
  const totalPokok = pembiayaan.reduce((acc, curr) => acc + curr.nominal, 0);
  const totalMargin = pembiayaan.reduce((acc, curr) => acc + curr.margin, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FileText className="w-6 h-6 text-green-600" />
            Laporan Keuangan & Piutang Koperasi
          </h1>
          <p className="text-sm text-gray-500 mt-1">Ringkasan kesehatan finansial khusus untuk unit simpan pinjam / pembiayaan syariah.</p>
        </div>
        <button 
          className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-900 transition"
        >
          <Download className="w-4 h-4" /> Unduh PDF
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-green-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><Landmark className="w-16 h-16 text-green-900"/></div>
          <p className="text-sm font-bold text-gray-500 mb-1">Total Piutang Berjalan</p>
          <p className="text-3xl font-extrabold text-green-700">Rp {totalPiutang.toLocaleString('id-ID')}</p>
          <p className="text-xs text-green-600 mt-2 font-medium bg-green-50 inline-block px-2 py-1 rounded">Dari {pembiayaan.length} Transaksi Akad</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><TrendingUp className="w-16 h-16 text-blue-900"/></div>
          <p className="text-sm font-bold text-gray-500 mb-1">Total Saldo Pokok Disalurkan</p>
          <p className="text-3xl font-extrabold text-blue-700">Rp {totalPokok.toLocaleString('id-ID')}</p>
          <p className="text-xs text-blue-600 mt-2 font-medium bg-blue-50 inline-block px-2 py-1 rounded">Modal Inti Koperasi</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-amber-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><TrendingDown className="w-16 h-16 text-amber-900"/></div>
          <p className="text-sm font-bold text-gray-500 mb-1">Proyeksi Pendapatan Margin/Ujrah</p>
          <p className="text-3xl font-extrabold text-amber-600">Rp {totalMargin.toLocaleString('id-ID')}</p>
          <p className="text-xs text-amber-700 mt-2 font-medium bg-amber-50 inline-block px-2 py-1 rounded">Potensi Keuntungan (Belum Terealisasi Penuh)</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-5 border-b border-gray-100 bg-gray-50">
          <h2 className="font-bold text-gray-800 text-lg">Rincian Piutang Anggota</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white text-gray-600 border-b">
              <tr>
                <th className="p-4 font-semibold">Nama Anggota</th>
                <th className="p-4 font-semibold">Jenis Akad</th>
                <th className="p-4 font-semibold text-right">Pokok Hutang</th>
                <th className="p-4 font-semibold text-right">Margin Akad</th>
                <th className="p-4 font-semibold text-right">Total Kewajiban</th>
                <th className="p-4 font-semibold text-center">Tenor</th>
                <th className="p-4 font-semibold text-right">Cicilan /Bulan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pembiayaan.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-gray-400">Belum ada portofolio pembiayaan</td></tr>
              ) : pembiayaan.map((item) => {
                const total = item.nominal + item.margin;
                const cicilan = Math.round(total / (item.tenorBulan || 1));
                return (
                  <tr key={item.id} className="hover:bg-gray-50/50">
                    <td className="p-4 font-bold text-gray-800">{item.anggotaName}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 text-[10px] font-bold uppercase rounded-full bg-slate-100 border border-slate-200 text-slate-700">
                        {item.akad}
                      </span>
                    </td>
                    <td className="p-4 text-right font-medium text-gray-600">Rp {item.nominal.toLocaleString('id-ID')}</td>
                    <td className="p-4 text-right font-medium text-gray-600">Rp {item.margin.toLocaleString('id-ID')}</td>
                    <td className="p-4 text-right font-bold text-red-600">Rp {total.toLocaleString('id-ID')}</td>
                    <td className="p-4 text-center text-gray-600">{item.tenorBulan} Bln</td>
                    <td className="p-4 text-right font-bold text-green-600">Rp {cicilan.toLocaleString('id-ID')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
