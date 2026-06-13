import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Lock, Printer, Plus, AlertCircle, CheckCircle } from 'lucide-react';

export default function KasirShiftPage() {
  const { transactions, currentUser, addExpense, expenses, addLog, attendances, clockIn, clockOut } = useAppStore();
  
  const [pettyCashAmount, setPettyCashAmount] = useState('');
  const [pettyCashDesc, setPettyCashDesc] = useState('');
  const [isShiftClosed, setIsShiftClosed] = useState(false);

  // Filter Today's data for this cashier
  const today = new Date().toISOString().split('T')[0];
  const myTransactions = transactions.filter(tx => 
    tx.timestamp.startsWith(today) && tx.cashierName === currentUser?.name
  );

  const myAttendance = currentUser ? attendances.find(a => a.userId === currentUser.username && a.date === today) : undefined;

  const myExpenses = expenses.filter(exp => 
    exp.date.startsWith(today) && exp.createdBy === currentUser?.name && exp.category === 'OPERASIONAL'
  );

  const totalTunai = myTransactions
    .filter(t => t.paymentMethod === 'CASH')
    .reduce((sum, t) => sum + t.totalAmount, 0);

  const totalQris = myTransactions
    .filter(t => t.paymentMethod === 'QRIS_SHARIAH')
    .reduce((sum, t) => sum + t.totalAmount, 0);

  const totalTransfer = myTransactions
    .filter(t => t.paymentMethod === 'TRANSFER_BSI')
    .reduce((sum, t) => sum + t.totalAmount, 0);

  const totalPettyCash = myExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Fisik Tunai yang Diharapkan
  const expectedCash = totalTunai - totalPettyCash;

  const handleAddPettyCash = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pettyCashAmount || !pettyCashDesc) return;
    
    addExpense({
      date: new Date().toISOString(),
      category: 'OPERASIONAL',
      amount: Number(pettyCashAmount),
      description: `Kas Kecil: ${pettyCashDesc}`
    });
    
    setPettyCashAmount('');
    setPettyCashDesc('');
  };

  const handleCloseShift = () => {
    addLog(
      'SHIFT_CLOSED',
      'SYSTEM',
      `Tutup Shift ${currentUser?.name}. Tunai Seharusnya: Rp ${expectedCash.toLocaleString('id-ID')}`
    );
    setIsShiftClosed(true);
    setTimeout(() => {
      window.print();
    }, 500);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Lock className="w-6 h-6 text-emerald-600" />
            Rekap & Tutup Shift
          </h1>
          <p className="text-sm text-gray-500 mt-1">Cek uang laci, catat pengeluaran kas kecil, dan cetak laporan akhir shift.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Absensi Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden md:col-span-2">
          <div className="p-4 border-b border-gray-100 bg-teal-50 flex items-center justify-between">
            <h2 className="font-bold text-teal-900 text-md flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-teal-600" />
              Status Absensi Hari Ini
            </h2>
            {myAttendance ? (
              <span className="px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-xs font-bold">Sudah Absen</span>
            ) : (
              <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold">Belum Absen</span>
            )}
          </div>
          <div className="p-5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-600">
                Waktu Masuk: <span className="font-bold text-gray-800">{myAttendance ? new Date(myAttendance.clockIn).toLocaleTimeString() : '-'}</span>
              </p>
              <p className="text-sm text-gray-600">
                Waktu Keluar: <span className="font-bold text-gray-800">{myAttendance?.clockOut ? new Date(myAttendance.clockOut).toLocaleTimeString() : '-'}</span>
              </p>
            </div>
            <div className="flex gap-2">
              {!myAttendance && currentUser && (
                <button 
                  onClick={() => clockIn(currentUser.username, currentUser.name)}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                >
                  Absen Masuk (Clock-In)
                </button>
              )}
              {myAttendance && !myAttendance.clockOut && (
                <button 
                  onClick={() => clockOut(myAttendance.id)}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                >
                  Absen Keluar (Clock-Out)
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Ringkasan Shift */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-slate-50">
            <h2 className="font-bold text-gray-800 text-md">Rekapitulasi Shift Hari Ini</h2>
          </div>
          <div className="p-5 space-y-4 text-sm text-gray-600">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span>Total Transaksi</span>
              <span className="font-bold">{myTransactions.length} Struk</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span>Pembayaran Tunai</span>
              <span className="font-bold text-gray-800">Rp {totalTunai.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span>Pembayaran QRIS</span>
              <span className="font-bold text-blue-600">Rp {totalQris.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span>Pembayaran Transfer</span>
              <span className="font-bold text-blue-600">Rp {totalTransfer.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100 text-red-600">
              <span>Pengeluaran Kas Kecil</span>
              <span className="font-bold">- Rp {totalPettyCash.toLocaleString('id-ID')}</span>
            </div>
            <div className="pt-4 flex justify-between items-center">
              <span className="font-bold text-emerald-800">ESTIMASI TUNAI DI LACI</span>
              <span className="font-extrabold text-2xl text-emerald-700">Rp {expectedCash.toLocaleString('id-ID')}</span>
            </div>
          </div>
          
          <div className="p-4 bg-slate-50 border-t border-gray-100 no-print">
            <button
              onClick={handleCloseShift}
              disabled={isShiftClosed}
              className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${
                isShiftClosed 
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-md'
              }`}
            >
              <Printer className="w-5 h-5" />
              {isShiftClosed ? 'Shift Telah Ditutup' : 'Cetak & Tutup Shift'}
            </button>
          </div>
        </div>

        {/* Kas Kecil Input */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden no-print">
            <div className="p-4 border-b border-gray-100 bg-amber-50">
              <h2 className="font-bold text-amber-900 text-md flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Catat Kas Kecil
              </h2>
            </div>
            <form onSubmit={handleAddPettyCash} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Nominal (Rp)</label>
                <input
                  type="number"
                  required
                  value={pettyCashAmount}
                  onChange={(e) => setPettyCashAmount(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="Misal: 5000"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Keterangan</label>
                <input
                  type="text"
                  required
                  value={pettyCashDesc}
                  onChange={(e) => setPettyCashDesc(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="Misal: Parkir Galon"
                />
              </div>
              <button 
                type="submit"
                disabled={isShiftClosed}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 rounded-lg transition-colors flex justify-center items-center gap-1 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" /> Tambah Pengeluaran
              </button>
            </form>
          </div>

          {/* List Kas Kecil */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="p-3 border-b border-gray-100">
               <h3 className="font-bold text-sm text-gray-700">Daftar Kas Kecil (Shift Ini)</h3>
             </div>
             <div className="p-2 space-y-1">
                {myExpenses.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">Tidak ada pengeluaran kas kecil.</p>
                ) : (
                  myExpenses.map(exp => (
                    <div key={exp.id} className="flex justify-between items-center p-2 bg-gray-50 rounded text-xs">
                      <span className="text-gray-600">{exp.description}</span>
                      <span className="font-bold text-red-600">- Rp {exp.amount.toLocaleString('id-ID')}</span>
                    </div>
                  ))
                )}
             </div>
          </div>
        </div>
      </div>

      {/* Hidden Thermal Print Receipt for Shift Close */}
      {isShiftClosed && (
        <div id="printable-receipt" className="hidden print:block fixed inset-0 bg-white p-4 font-mono text-xs text-black">
          <div className="text-center space-y-1 border-b border-dashed border-black pb-3 mb-3">
            <h2 className="font-bold text-base uppercase">Rekap Tutup Shift</h2>
            <p>Toko Berkah Amanah Mart</p>
            <p>================================</p>
            <p className="text-left">Tanggal : {new Date().toLocaleString('id-ID')}</p>
            <p className="text-left">Kasir   : {currentUser?.name}</p>
          </div>
          
          <div className="space-y-2 border-b border-dashed border-black pb-3 mb-3">
            <div className="flex justify-between">
              <span>Total Transaksi :</span>
              <span>{myTransactions.length} Struk</span>
            </div>
            <div className="flex justify-between">
              <span>Penerimaan Tunai:</span>
              <span>Rp {totalTunai.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between">
              <span>Penerimaan QRIS :</span>
              <span>Rp {totalQris.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between">
              <span>Penerimaan Trans:</span>
              <span>Rp {totalTransfer.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div className="space-y-2 border-b border-dashed border-black pb-3 mb-3">
            <p className="font-bold">Pengeluaran Kas Kecil:</p>
            {myExpenses.length === 0 ? <p>- Nihil -</p> : myExpenses.map(exp => (
              <div key={exp.id} className="flex justify-between pl-2">
                <span>{exp.description.replace('Kas Kecil: ', '')}</span>
                <span>Rp {exp.amount.toLocaleString('id-ID')}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold pt-1 border-t border-black mt-1">
              <span>Total Pengeluaran:</span>
              <span>Rp {totalPettyCash.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div className="space-y-2 pt-1 font-bold text-sm">
            <div className="flex justify-between">
              <span>ESTIMASI TUNAI DI LACI:</span>
              <span>Rp {expectedCash.toLocaleString('id-ID')}</span>
            </div>
            <p className="text-center mt-6 text-[10px] font-normal italic">
              "Semoga lelah menjadi lillah, harta menjadi berkah"
            </p>
            <p className="text-center mt-2">--------------------------------</p>
            <div className="flex justify-between mt-8 text-[10px] px-4">
              <div className="text-center">
                <p>Kasir</p>
                <br/><br/>
                <p>( {currentUser?.name} )</p>
              </div>
              <div className="text-center">
                <p>Admin/SPV</p>
                <br/><br/>
                <p>( .................... )</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
