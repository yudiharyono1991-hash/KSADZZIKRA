import React, { useState } from 'react';
import { useAppStore } from '../store';
import { UserCheck, Clock, Calendar, CheckCircle, Search } from 'lucide-react';

export default function StaffManagementPage() {
  const { attendances, users, currentUser, transactions } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');

  if (currentUser?.role !== 'ADMIN' && currentUser?.role !== 'OWNER') {
    return <div className="p-6 text-red-500">Akses Ditolak. Khusus Admin/Owner.</div>;
  }

  // Calculate commission
  const getCommission = (cashierName: string) => {
    // 1% of total transaction amounts handled by this cashier
    const totalSales = transactions
      .filter(t => t.cashierName === cashierName)
      .reduce((sum, t) => sum + t.totalAmount, 0);
    return totalSales * 0.01;
  };

  const filteredAttendances = attendances.filter(a => a.userName.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-teal-100 text-teal-800 rounded-xl">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Manajemen Karyawan (HR)</h1>
            <p className="text-sm text-gray-500">Log absensi shift dan perhitungan komisi performa kasir.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Attendances Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-600" /> Log Absensi
            </h2>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input type="text" placeholder="Cari nama..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-teal-500 w-48" />
            </div>
          </div>
          <div className="overflow-x-auto max-h-[400px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/50 text-gray-500 font-bold uppercase tracking-wide sticky top-0">
                <tr>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Nama Staff</th>
                  <th className="px-4 py-3 text-center">Masuk</th>
                  <th className="px-4 py-3 text-center">Keluar</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {filteredAttendances.map(a => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{a.date}</td>
                    <td className="px-4 py-3 font-bold text-gray-800">{a.userName}</td>
                    <td className="px-4 py-3 text-center text-teal-600">{new Date(a.clockIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                    <td className="px-4 py-3 text-center text-amber-600">
                      {a.clockOut ? new Date(a.clockOut).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 bg-teal-50 text-teal-700 rounded border border-teal-100 text-[10px]">
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredAttendances.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-gray-500">Belum ada log absensi.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Commission Report */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" /> Estimasi Komisi (1% Sales)
            </h2>
          </div>
          <div className="p-4">
            <div className="space-y-4">
              {users.filter(u => u.role === 'CASHIER').map(u => {
                const commission = getCommission(u.name);
                return (
                  <div key={u.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                        {u.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800 text-sm">{u.name}</p>
                        <p className="text-[10px] text-gray-500">@{u.username}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-gray-500 font-bold mb-0.5">EST. KOMISI</p>
                      <p className="font-extrabold text-emerald-600 text-sm">Rp {commission.toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                );
              })}
              {users.filter(u => u.role === 'CASHIER').length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">Belum ada akun kasir terdaftar.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
