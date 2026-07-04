import React, { useState } from 'react';
import { useBranchData } from '../hooks/useBranchData';
import { Award, Search, TrendingUp, Users, Gift, ShieldCheck } from 'lucide-react';

export default function LoyaltyProgramPage() {
  const { customers, transactions, currentUser } = useBranchData();
  const [searchQuery, setSearchQuery] = useState('');

  // Protect route
  if (!['ADMIN', 'OWNER', 'SUPERADMIN', 'MANAGER', 'PENGURUS'].includes(currentUser?.role || '')) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4 py-20">
        <ShieldCheck className="w-16 h-16 text-red-400" />
        <h2 className="text-xl font-bold">Akses Ditolak</h2>
        <p className="text-sm">Anda tidak memiliki izin untuk mengakses halaman Program Loyalitas.</p>
      </div>
    );
  }

  // Calculate metrics
  const totalPointsDistributed = transactions.reduce((sum, tx) => sum + (tx.pointsEarned || 0), 0);
  const totalPointsRedeemed = transactions.reduce((sum, tx) => sum + (tx.pointsRedeemed || 0), 0);
  const totalDiscountGiven = transactions.reduce((sum, tx) => sum + (tx.pointsDiscount || 0), 0);

  // Filter customers with points
  const sortedCustomers = [...customers]
    .filter(c => c.points > 0 || c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => b.points - a.points);

  const filteredCustomers = sortedCustomers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.phone.includes(searchQuery)
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Program Loyalitas & Poin</h1>
          <p className="text-slate-500 text-sm">Manajemen poin pelanggan dan riwayat klaim reward</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-fuchsia-100 text-fuchsia-700 rounded-lg"><Award className="w-6 h-6"/></div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Poin Beredar</p>
            <h3 className="text-xl font-bold text-slate-800">{customers.reduce((sum, c) => sum + (c.points || 0), 0).toLocaleString('id-ID')}</h3>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-700 rounded-lg"><TrendingUp className="w-6 h-6"/></div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Poin Dibagikan (All Time)</p>
            <h3 className="text-xl font-bold text-slate-800">{totalPointsDistributed.toLocaleString('id-ID')}</h3>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-100 text-amber-700 rounded-lg"><Gift className="w-6 h-6"/></div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Poin Ditukar</p>
            <h3 className="text-xl font-bold text-slate-800">{totalPointsRedeemed.toLocaleString('id-ID')}</h3>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-700 rounded-lg"><Users className="w-6 h-6"/></div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Nilai Diskon Poin</p>
            <h3 className="text-xl font-bold text-slate-800">Rp {totalDiscountGiven.toLocaleString('id-ID')}</h3>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h2 className="font-bold text-slate-700">Leaderboard Poin Pelanggan</h2>
          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input 
              type="text"
              placeholder="Cari nama atau telepon..."
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-slate-200">
                <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase">Peringkat</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase">Nama Pelanggan</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase">No. Telepon</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase">Status Anggota</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase text-right">Saldo Poin</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase text-right">Estimasi Nilai</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 text-sm">
                    Tidak ada pelanggan yang ditemukan
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer, idx) => (
                  <tr key={customer.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      {idx < 3 ? (
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${idx === 0 ? 'bg-amber-100 text-amber-700' : idx === 1 ? 'bg-slate-200 text-slate-700' : 'bg-orange-100 text-orange-700'}`}>
                          {idx + 1}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium ml-2">{idx + 1}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{customer.name}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{customer.phone}</td>
                    <td className="py-3 px-4">
                      {customer.isKoperasiMember ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">Anggota Koperasi</span>
                      ) : (
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-bold">Umum</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-black text-fuchsia-600 bg-fuchsia-50 px-2 py-1 rounded-lg border border-fuchsia-100">
                        {customer.points} Pts
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-700">
                      Rp {(customer.points * 10).toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
