import React, { useState } from 'react';
import { useBranchData } from '../hooks/useBranchData';
import { UserCheck, Clock, CheckCircle, Search, AlertTriangle, ThumbsUp, ThumbsDown, Banknote, Calculator, Printer, AlertCircle } from 'lucide-react';

export default function StaffManagementPage() {
  const store = useBranchData();
  const { users, currentUser, transactions } = store;
  const attendances: any[] = (store as any).attendances || [];
  const expenses: any[] = (store as any).expenses || [];
  const addAttendanceCorrection = (store as any).addAttendanceCorrection || (() => {});
  const updateAttendanceCorrection = (store as any).updateAttendanceCorrection || (() => {});
  const reviewAttendanceCorrection = (store as any).reviewAttendanceCorrection || ((id: string, approve: boolean) => {});

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'LOG' | 'CORRECTIONS' | 'CASH_OPNAME'>('LOG');

  // Cash Opname State
  const [opnameDate, setOpnameDate] = useState(new Date().toISOString().split('T')[0]);
  const [physicalCash, setPhysicalCash] = useState('');
  const [opnameCashierName, setOpnameCashierName] = useState('');
  const [opnameNotes, setOpnameNotes] = useState('');
  const [savedOpnameResults, setSavedOpnameResults] = useState<Array<{
    date: string; cashierName: string; systemCash: number; physicalCash: number;
    difference: number; notes: string; recordedBy: string; timestamp: string;
  }>>([]);

  if (!['ADMIN', 'OWNER', 'SUPERADMIN', 'MANAGER', 'PENGURUS'].includes(currentUser?.role || '')) {
    return <div className="p-6 text-red-500">Akses Ditolak. Khusus Admin/Owner.</div>;
  }


  const filteredAttendances = attendances.filter(a => a.userName.toLowerCase().includes(searchTerm.toLowerCase()));

  const pendingCorrections = attendances.filter(a => a.correctionStatus === 'PENDING');

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-teal-100 text-teal-800 rounded-xl">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-slate-200">Manajemen Karyawan (HR)</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">Log absensi shift dan manajemen staf.</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-slate-700 gap-1 flex-wrap">
        <button
          onClick={() => setActiveTab('LOG')}
          className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors ${activeTab === 'LOG' ? 'border-b-2 border-teal-600 text-teal-700 bg-teal-50' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:text-slate-300'}`}
        >
          <Clock className="w-4 h-4 inline mr-1" /> Log Absensi
        </button>
        <button
          onClick={() => setActiveTab('CORRECTIONS')}
          className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'CORRECTIONS' ? 'border-b-2 border-amber-500 text-amber-700 bg-amber-50' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:text-slate-300'}`}
        >
          <AlertTriangle className="w-4 h-4" /> Permohonan Koreksi
          {pendingCorrections.length > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">{pendingCorrections.length}</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('CASH_OPNAME')}
          className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'CASH_OPNAME' ? 'border-b-2 border-green-600 text-green-700 bg-green-50' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:text-slate-300'}`}
        >
          <Banknote className="w-4 h-4" /> Cash Opname
        </button>
      </div>

      {activeTab === 'LOG' && (
        <div className="grid grid-cols-1 gap-6">
          {/* Attendances Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="font-bold text-gray-800 dark:text-slate-200 flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-600" /> Log Absensi
              </h2>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input type="text" placeholder="Cari nama..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8 pr-3 py-1.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:ring-2 focus:ring-teal-500 w-48" />
              </div>
            </div>
            <div className="overflow-x-auto max-h-[400px]">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-slate-400 font-bold uppercase tracking-wide sticky top-0">
                  <tr>
                    <th className="px-4 py-3">Tanggal</th>
                    <th className="px-4 py-3">Nama Staff</th>
                    <th className="px-4 py-3 text-center">Foto Masuk</th>
                    <th className="px-4 py-3 text-center">Masuk</th>
                    <th className="px-4 py-3 text-center">Keluar</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {filteredAttendances.map(a => (
                    <tr key={a.id} className="hover:bg-gray-50 dark:bg-slate-800">
                      <td className="px-4 py-3">
                        {a.date}
                        {a.isRevised && <span className="ml-1 text-[10px] bg-amber-100 text-amber-700 px-1 rounded">Direvisi</span>}
                      </td>
                      <td className="px-4 py-3 font-bold text-gray-800 dark:text-slate-200">{a.userName}</td>
                      <td className="px-4 py-3 text-center flex justify-center">
                        {a.photoUrl ? (
                          <div className="relative group cursor-pointer w-8 h-8 rounded-full overflow-hidden border-2 border-teal-500 shadow-sm">
                            <img src={a.photoUrl} alt="Selfie" className="w-full h-full object-cover" />
                            <div className="hidden group-hover:block absolute bottom-0 left-0 w-32 h-32 z-50 bg-white rounded shadow-xl overflow-hidden transform translate-x-4 -translate-y-4">
                              <img src={a.photoUrl} alt="Selfie Zoom" className="w-full h-full object-cover" />
                            </div>
                          </div>
                        ) : (
                           <span className="text-[10px] text-gray-400">-</span>
                        )}
                      </td>
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
                      <td colSpan={6} className="px-4 py-6 text-center text-gray-500 dark:text-slate-400">Belum ada log absensi.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Correction Requests Tab */}
      {activeTab === 'CORRECTIONS' && (
        <div className="space-y-4">
          {pendingCorrections.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 border border-gray-100 dark:border-slate-800 shadow-sm text-center">
              <CheckCircle className="w-16 h-16 text-green-200 mx-auto mb-4" />
              <h3 className="font-bold text-gray-700 dark:text-slate-300 text-lg">Tidak Ada Permohonan Koreksi</h3>
              <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Semua absensi karyawan sudah berstatus normal.</p>
            </div>
          ) : (
            pendingCorrections.map(a => (
              <div key={a.id} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-amber-100 overflow-hidden">
                <div className="p-4 bg-amber-50 border-b border-amber-100 flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-bold text-gray-800 dark:text-slate-200 text-sm">{a.userName} — <span className="text-amber-700">{a.date}</span></p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">Memohon koreksi: <strong>{a.correctionType === 'CLOCK_IN' ? 'Jam Masuk' : a.correctionType === 'CLOCK_OUT' ? 'Jam Keluar' : 'Jam Masuk & Keluar'}</strong></p>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-3">
                      <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Jam Masuk Saat Ini</p>
                      <p className="font-bold text-gray-800 dark:text-slate-200">{new Date(a.clockIn).toLocaleString('id-ID')}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs text-blue-500 mb-1">Jam Masuk yang Diminta</p>
                      <p className="font-bold text-blue-800">{a.requestedClockIn ? new Date(a.requestedClockIn).toLocaleString('id-ID') : '(tidak diubah)'}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-3">
                      <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Jam Keluar Saat Ini</p>
                      <p className="font-bold text-gray-800 dark:text-slate-200">{a.clockOut ? new Date(a.clockOut).toLocaleString('id-ID') : '(belum absen)'}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs text-blue-500 mb-1">Jam Keluar yang Diminta</p>
                      <p className="font-bold text-blue-800">{a.requestedClockOut ? new Date(a.requestedClockOut).toLocaleString('id-ID') : '(tidak diubah)'}</p>
                    </div>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-3">
                    <p className="text-xs text-amber-600 font-bold mb-1">Alasan Karyawan:</p>
                    <p className="text-sm text-amber-900 italic">"{a.correctionReason}"</p>
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={() => { reviewAttendanceCorrection(a.id, false); }}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl font-bold text-sm transition-colors"
                    >
                      <ThumbsDown className="w-4 h-4" /> Tolak
                    </button>
                    <button
                      onClick={() => { reviewAttendanceCorrection(a.id, true); alert(`Koreksi absen ${a.userName} berhasil disetujui. Data jam absen telah diperbarui.`); }}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm transition-colors"
                    >
                      <ThumbsUp className="w-4 h-4" /> Setujui Koreksi
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
      {/* Cash Opname Tab */}
      {activeTab === 'CASH_OPNAME' && (() => {
        // Calculate system cash for selected date and cashier
        const dateTransactions = transactions.filter(tx => {
          const txDate = tx.timestamp.split('T')[0];
          const matchDate = txDate === opnameDate;
          const matchCashier = opnameCashierName ? tx.cashierName === opnameCashierName : true;
          return matchDate && matchCashier;
        });
        const systemCashIn = dateTransactions.filter(t => t.paymentMethod === 'CASH').reduce((s,t) => s + t.totalAmount, 0);
        const systemExpenses = expenses.filter(exp => {
          const expDate = exp.date.split('T')[0];
          const matchDate = expDate === opnameDate;
          const matchCashier = opnameCashierName ? exp.createdBy === opnameCashierName : true;
          return matchDate && matchCashier && exp.category === 'OPERASIONAL';
        }).reduce((s,e) => s + e.amount, 0);
        const systemNetCash = systemCashIn - systemExpenses;
        const physicalNum = parseFloat(physicalCash.replace(/[^0-9]/g, '')) || 0;
        const difference = physicalNum - systemNetCash;
        const cashierNames = [...new Set(transactions.map(t => t.cashierName).filter(Boolean))];

        return (
          <div className="space-y-6">
            {/* Header banner */}
            <div className="bg-gradient-to-r from-green-700 to-teal-700 text-white rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute -top-8 -right-8 opacity-10"><Banknote className="w-40 h-40"/></div>
              <div className="relative z-10">
                <h2 className="font-bold text-xl mb-1 flex items-center gap-2"><Calculator className="w-5 h-5"/> Cash Opname</h2>
                <p className="text-green-100 text-sm">Verifikasi uang fisik di kasir vs data laporan keuangan sistem.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Input Form */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6 space-y-4">
                <h3 className="font-bold text-gray-800 dark:text-slate-200 border-b pb-3 flex items-center gap-2"><Calculator className="w-4 h-4 text-green-600"/> Form Penghitungan</h3>
                
                <div>
                  <label className="text-xs font-bold text-gray-600 dark:text-slate-400 uppercase mb-1 block">Tanggal Opname</label>
                  <input type="date" value={opnameDate} onChange={e => setOpnameDate(e.target.value)}
                    className="w-full border border-gray-200 dark:border-slate-700 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-green-500 outline-none"/>
                </div>
                
                <div>
                  <label className="text-xs font-bold text-gray-600 dark:text-slate-400 uppercase mb-1 block">Kasir yang Bertugas</label>
                  <select value={opnameCashierName} onChange={e => setOpnameCashierName(e.target.value)}
                    className="w-full border border-gray-200 dark:border-slate-700 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-green-500 outline-none">
                    <option value="">-- Semua Kasir --</option>
                    {cashierNames.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 space-y-2 border border-slate-200 dark:border-slate-700">
                  <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm mb-2">💻 Data Sistem</h4>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Total Tunai Masuk</span>
                    <span className="font-bold text-green-700">Rp {systemCashIn.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Total Pengeluaran Kas Kecil</span>
                    <span className="font-bold text-red-600">- Rp {systemExpenses.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-slate-300 dark:border-slate-600 pt-2 mt-1">
                    <span className="font-bold text-slate-800 dark:text-slate-200">Kas Bersih Sistem</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">Rp {systemNetCash.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-600 dark:text-slate-400 uppercase mb-1 block">💵 Uang Fisik di Laci (Hasil Hitung)</label>
                  <input type="number" value={physicalCash} onChange={e => setPhysicalCash(e.target.value)}
                    placeholder="Masukkan jumlah uang fisik..."
                    className="w-full border border-gray-200 dark:border-slate-700 rounded-lg py-2.5 px-3 text-sm focus:ring-2 focus:ring-green-500 outline-none font-bold"/>
                </div>

                {physicalCash && (
                  <div className={`rounded-xl p-4 border-2 ${difference === 0 ? 'bg-green-50 border-green-300' : difference > 0 ? 'bg-blue-50 border-blue-300' : 'bg-red-50 border-red-300'}`}>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-sm">
                        {difference === 0 ? '✅ SEIMBANG' : difference > 0 ? '⬆️ SELISIH LEBIH' : '⬇️ SELISIH KURANG'}
                      </span>
                      <span className={`font-extrabold text-lg ${difference === 0 ? 'text-green-700' : difference > 0 ? 'text-blue-700' : 'text-red-700'}`}>
                        {difference > 0 ? '+' : ''} Rp {Math.abs(difference).toLocaleString('id-ID')}
                      </span>
                    </div>
                    {difference !== 0 && (
                      <p className="text-xs mt-1 opacity-70">
                        {difference > 0 ? 'Ada uang lebih dari yang tercatat di sistem.' : 'Ada kekurangan uang dibanding catatan sistem.'}
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-gray-600 dark:text-slate-400 uppercase mb-1 block">Catatan Opname</label>
                  <textarea value={opnameNotes} onChange={e => setOpnameNotes(e.target.value)}
                    placeholder="Contoh: Semua sesuai. / Selisih disebabkan uang kembalian rusak."
                    rows={2}
                    className="w-full border border-gray-200 dark:border-slate-700 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-green-500 outline-none resize-none"/>
                </div>

                <button
                  disabled={!physicalCash}
                  onClick={() => {
                    const newRecord = {
                      date: opnameDate,
                      cashierName: opnameCashierName || 'Semua Kasir',
                      systemCash: systemNetCash,
                      physicalCash: physicalNum,
                      difference,
                      notes: opnameNotes,
                      recordedBy: currentUser?.name || 'Admin',
                      timestamp: new Date().toISOString(),
                    };
                    setSavedOpnameResults(prev => [newRecord, ...prev]);
                    setPhysicalCash('');
                    setOpnameNotes('');
                    alert('✅ Cash Opname berhasil disimpan!');
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle className="w-4 h-4" /> Simpan Hasil Opname
                </button>
              </div>

              {/* History */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-slate-800">
                  <h3 className="font-bold text-gray-800 dark:text-slate-200 flex items-center gap-2"><Printer className="w-4 h-4 text-gray-500 dark:text-slate-400"/> Riwayat Cash Opname</h3>
                </div>
                <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                  {savedOpnameResults.length === 0 ? (
                    <div className="p-8 text-center">
                      <Banknote className="w-14 h-14 text-gray-200 mx-auto mb-3"/>
                      <p className="text-sm text-gray-400">Belum ada riwayat cash opname.</p>
                    </div>
                  ) : (
                    savedOpnameResults.map((r, i) => (
                      <div key={i} className="p-4 hover:bg-gray-50 dark:bg-slate-800 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-bold text-sm text-gray-800 dark:text-slate-200">{new Date(r.date + 'T00:00:00').toLocaleDateString('id-ID', {weekday:'long', day:'numeric', month:'short', year:'numeric'})}</p>
                            <p className="text-xs text-gray-500 dark:text-slate-400">Kasir: {r.cashierName} | Dicatat: {r.recordedBy}</p>
                          </div>
                          <span className={`text-[10px] font-extrabold px-2 py-1 rounded-full ${
                            r.difference === 0 ? 'bg-green-100 text-green-700' :
                            r.difference > 0 ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {r.difference === 0 ? 'BALANCE' : r.difference > 0 ? 'LEBIH' : 'KURANG'}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2 text-center">
                            <p className="text-gray-500 dark:text-slate-400">Sistem</p>
                            <p className="font-bold text-gray-800 dark:text-slate-200">Rp {r.systemCash.toLocaleString('id-ID')}</p>
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2 text-center">
                            <p className="text-gray-500 dark:text-slate-400">Fisik</p>
                            <p className="font-bold text-gray-800 dark:text-slate-200">Rp {r.physicalCash.toLocaleString('id-ID')}</p>
                          </div>
                          <div className={`rounded-lg p-2 text-center ${
                            r.difference === 0 ? 'bg-green-50' : r.difference > 0 ? 'bg-blue-50' : 'bg-red-50'
                          }`}>
                            <p className="text-gray-500 dark:text-slate-400">Selisih</p>
                            <p className={`font-extrabold ${
                              r.difference === 0 ? 'text-green-700' : r.difference > 0 ? 'text-blue-700' : 'text-red-700'
                            }`}>{r.difference >= 0 ? '+' : ''}Rp {r.difference.toLocaleString('id-ID')}</p>
                          </div>
                        </div>
                        {r.notes && <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 italic">📝 {r.notes}</p>}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
