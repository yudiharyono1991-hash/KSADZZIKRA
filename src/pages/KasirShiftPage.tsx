import React, { useState, useRef } from 'react';
import { useAppStore } from '../store';
import { Lock, Printer, Plus, AlertCircle, CheckCircle, Calculator, Banknote, MapPin, Camera, Image as ImageIcon } from 'lucide-react';

export default function KasirShiftPage() {
  const { transactions, currentUser, addExpense, expenses, addLog, attendances, clockIn, clockOut, activeBranchId } = useAppStore();
  
  const [pettyCashAmount, setPettyCashAmount] = useState('');
  const [pettyCashDesc, setPettyCashDesc] = useState('');
  const [isShiftClosed, setIsShiftClosed] = useState(false);
  const [isClockingIn, setIsClockingIn] = useState(false);
  const [selfieData, setSelfieData] = useState<string>('');
  const [locationData, setLocationData] = useState<{lat: number, lng: number} | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
          <div className="p-5 flex flex-col items-start gap-4">
            <div className="w-full flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <p className="text-sm text-gray-600">
                  Waktu Masuk: <span className="font-bold text-gray-800">{myAttendance ? new Date(myAttendance.clockIn).toLocaleTimeString() : '-'}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Waktu Keluar: <span className="font-bold text-gray-800">{myAttendance?.clockOut ? new Date(myAttendance.clockOut).toLocaleTimeString() : '-'}</span>
                </p>
                {myAttendance?.photoUrl && (
                  <p className="text-xs text-teal-700 mt-2 font-semibold flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Selfie Terekam</p>
                )}
                {myAttendance?.latitude && (
                  <p className="text-xs text-teal-700 mt-1 font-semibold flex items-center gap-1"><MapPin className="w-3 h-3"/> Geotag: {myAttendance.latitude.toFixed(4)}, {myAttendance.longitude?.toFixed(4)}</p>
                )}
              </div>
              <div className="flex gap-2">
                {!myAttendance && currentUser && !isClockingIn && (
                  <button 
                    onClick={() => setIsClockingIn(true)}
                    className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-6 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Camera className="w-4 h-4"/> Mulai Absen (Selfie & GPS)
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

            {/* Clock-In Widget: Selfie & GPS */}
            {isClockingIn && !myAttendance && currentUser && (
              <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 mt-2">
                <h4 className="font-bold text-slate-800 mb-3 text-sm flex items-center gap-2">Verifikasi Kehadiran</h4>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 space-y-3">
                    <p className="text-xs text-slate-500">Mohon izinkan akses Kamera dan Lokasi (GPS) untuk melakukan absensi kehadiran.</p>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          if ("geolocation" in navigator) {
                            navigator.geolocation.getCurrentPosition(
                              (position) => {
                                setLocationData({ lat: position.coords.latitude, lng: position.coords.longitude });
                              },
                              (err) => alert("Gagal mengambil lokasi. Pastikan GPS aktif.")
                            );
                          } else {
                            alert("Browser tidak mendukung Geolocation");
                          }
                        }}
                        className={`text-xs py-2 px-3 rounded border font-bold flex items-center gap-1 ${locationData ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}
                      >
                        <MapPin className="w-4 h-4"/> {locationData ? 'Lokasi Tersimpan' : 'Ambil Lokasi (GPS)'}
                      </button>
                      <label className={`cursor-pointer text-xs py-2 px-3 rounded border font-bold flex items-center gap-1 ${selfieData ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}>
                        <Camera className="w-4 h-4" /> {selfieData ? 'Foto Tersimpan' : 'Ambil Selfie'}
                        <input type="file" accept="image/*" capture="user" className="hidden" onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              if (ev.target?.result) setSelfieData(ev.target.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }} />
                      </label>
                    </div>

                    <div className="pt-3 flex gap-2">
                      <button 
                        onClick={() => setIsClockingIn(false)}
                        className="py-2 px-4 text-xs font-bold text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-50"
                      >
                        Batal
                      </button>
                      <button 
                        disabled={!selfieData || !locationData}
                        onClick={() => {
                          if (selfieData && locationData) {
                            clockIn(currentUser.username, currentUser.name, selfieData, locationData.lat, locationData.lng);
                            setIsClockingIn(false);
                          }
                        }}
                        className="py-2 px-4 text-xs font-bold text-white bg-teal-600 rounded hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Submit Absen Masuk
                      </button>
                    </div>
                  </div>
                  {(selfieData || locationData) && (
                    <div className="w-32 flex-shrink-0">
                      {selfieData ? (
                         <img src={selfieData} alt="Selfie" className="w-full h-32 object-cover rounded-lg border border-slate-200 shadow-sm" />
                      ) : (
                         <div className="w-full h-32 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 flex-col gap-1">
                           <ImageIcon className="w-6 h-6" />
                           <span className="text-[10px]">Belum Ada Foto</span>
                         </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
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
              className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors flex-1 text-white text-lg shadow-lg shadow-rose-900/20 active:scale-95 disabled:opacity-50 ${
                isShiftClosed 
                ? 'bg-rose-600 cursor-not-allowed opacity-50' 
                : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {isShiftClosed ? <CheckCircle className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
              {isShiftClosed ? 'Shift Berhasil Ditutup' : 'Tutup Shift Sekarang'}
            </button>
          </div>
        </div>

        {/* Right Column: Kas Kecil & Print Trigger */}
        <div className="space-y-6">
          <div className="bg-amber-50 rounded-xl p-5 border border-amber-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Calculator className="w-16 h-16 text-amber-900" />
            </div>
            <h3 className="font-bold text-amber-900 flex items-center gap-2 mb-2"><Banknote className="w-5 h-5"/> Input Kas Kecil</h3>
            <p className="text-xs text-amber-700 mb-4 leading-relaxed">
              Catat pengeluaran tunai tak terduga selama shift Anda (misal: bayar parkir, beli galon, dll) agar perhitungan akhir tunai di laci tetap akurat.
            </p>
            <form onSubmit={handleAddPettyCash} className="space-y-3 relative z-10">
              <div>
                <label className="text-[10px] font-bold text-amber-800 uppercase">Jumlah Rp</label>
                <input 
                  type="number" 
                  min="0"
                  required
                  value={pettyCashAmount}
                  onChange={(e) => setPettyCashAmount(e.target.value)}
                  className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-amber-800 uppercase">Keterangan</label>
                <input 
                  type="text" 
                  required
                  value={pettyCashDesc}
                  onChange={(e) => setPettyCashDesc(e.target.value)}
                  className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                  placeholder="Misal: Parkir Galon"
                />
              </div>
              <button 
                type="submit"
                disabled={isShiftClosed}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 rounded-lg transition-colors flex justify-center items-center gap-1 disabled:opacity-50 shadow-md shadow-amber-900/10"
              >
                <Plus className="w-4 h-4" /> Tambah Pengeluaran
              </button>
            </form>
          </div>

          {/* List Kas Kecil */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="p-3 border-b border-slate-100 bg-slate-50">
               <h3 className="font-bold text-sm text-slate-700">Daftar Kas Kecil (Shift Ini)</h3>
             </div>
             <div className="p-2 space-y-1">
                {myExpenses.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4 italic">Belum ada pengeluaran.</p>
                ) : (
                  myExpenses.map(exp => (
                    <div key={exp.id} className="flex justify-between items-center p-2 bg-slate-50 hover:bg-slate-100 rounded text-xs transition-colors">
                      <span className="text-slate-600 font-medium">{exp.description}</span>
                      <span className="font-bold text-rose-600">- Rp {exp.amount.toLocaleString('id-ID')}</span>
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
            <p className="text-[10px] uppercase">{activeBranchId ? `Cabang ${activeBranchId}` : 'Kantor Pusat'}</p>
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
