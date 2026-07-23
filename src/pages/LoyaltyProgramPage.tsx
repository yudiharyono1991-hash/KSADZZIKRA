import React, { useState } from 'react';
import { useBranchData } from '../hooks/useBranchData';
import { Award, Search, TrendingUp, Users, Gift, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';

export default function LoyaltyProgramPage() {
  const { customers, transactions, currentUser, settings } = useBranchData();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Protect route
  if (!['ADMIN', 'OWNER', 'SUPERADMIN', 'MANAGER', 'PENGURUS'].includes(currentUser?.role || '')) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400 space-y-4 py-20">
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

  // Pagination logic
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const currentData = filteredCustomers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Reset page on search
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Program Loyalitas & Poin</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Manajemen poin pelanggan dan riwayat klaim reward</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-fuchsia-100 text-fuchsia-700 rounded-lg"><Award className="w-6 h-6"/></div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Poin Beredar</p>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">{customers.reduce((sum, c) => sum + (c.points || 0), 0).toLocaleString('id-ID')}</h3>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-700 rounded-lg"><TrendingUp className="w-6 h-6"/></div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Poin Dibagikan (All Time)</p>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">{totalPointsDistributed.toLocaleString('id-ID')}</h3>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-100 text-amber-700 rounded-lg"><Gift className="w-6 h-6"/></div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Poin Ditukar</p>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">{totalPointsRedeemed.toLocaleString('id-ID')}</h3>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-700 rounded-lg"><Users className="w-6 h-6"/></div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Nilai Diskon Poin</p>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Rp {totalDiscountGiven.toLocaleString('id-ID')}</h3>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
          <h2 className="font-bold text-slate-700 dark:text-slate-300">Leaderboard Poin Pelanggan</h2>
          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input 
              type="text"
              placeholder="Cari nama atau telepon..."
              className="w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                <th className="py-3 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Peringkat</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Nama Pelanggan</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">No. Telepon</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Status Anggota</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase text-right">Saldo Poin</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase text-right">Estimasi Nilai</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                    Tidak ada pelanggan yang ditemukan
                  </td>
                </tr>
              ) : (
                currentData.map((customer, i) => {
                  const absoluteIdx = (currentPage - 1) * itemsPerPage + i;
                  return (
                  <tr key={customer.id} className="hover:bg-slate-50 dark:bg-slate-800 transition-colors">
                    <td className="py-3 px-4">
                      {absoluteIdx < 3 ? (
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${absoluteIdx === 0 ? 'bg-amber-100 text-amber-700' : absoluteIdx === 1 ? 'bg-slate-200 text-slate-700 dark:text-slate-300' : 'bg-orange-100 text-orange-700'}`}>
                          {absoluteIdx + 1}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium ml-2">{absoluteIdx + 1}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">{customer.name}</td>
                    <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">{customer.phone}</td>
                    <td className="py-3 px-4">
                      {customer.isKoperasiMember ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">Anggota Koperasi</span>
                      ) : (
                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded text-xs font-bold">Umum</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-black text-fuchsia-600 bg-fuchsia-50 px-2 py-1 rounded-lg border border-fuchsia-100">
                        {customer.points.toLocaleString('id-ID')} Pts
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-700 dark:text-slate-300">
                      Rp {(customer.points * (settings?.pointRedemptionValue || 10)).toLocaleString('id-ID')}
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-800">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Menampilkan <span className="font-bold text-slate-700 dark:text-slate-300">{((currentPage - 1) * itemsPerPage) + 1}</span> - <span className="font-bold text-slate-700 dark:text-slate-300">{Math.min(currentPage * itemsPerPage, filteredCustomers.length)}</span> dari <span className="font-bold text-slate-700 dark:text-slate-300">{filteredCustomers.length}</span> pelanggan
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300 px-2">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
