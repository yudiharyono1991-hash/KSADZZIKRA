import React, { useState, useRef } from 'react';
import { useAppStore } from '../store';
import { Lock, Printer, Plus, AlertCircle, CheckCircle, Calculator, Banknote, MapPin, Camera, Image as ImageIcon, Edit2, X } from 'lucide-react';

const getDistanceFromLatLonInM = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; // Radius of the earth in m
  const dLat = (lat2-lat1) * (Math.PI/180);
  const dLon = (lon2-lon1) * (Math.PI/180); 
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * (Math.PI/180)) * Math.cos(lat2 * (Math.PI/180)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return Math.round(R * c);
};

export default function KasirShiftPage() {
  const { transactions, currentUser, addExpense, expenses, addLog, attendances, clockIn, clockOut, activeBranchId, requestAttendanceCorrection, settings } = useAppStore();
  const [pettyCashAmount, setPettyCashAmount] = useState('');
  const [pettyCashDesc, setPettyCashDesc] = useState('');
  const [pettyCashType, setPettyCashType] = useState<'PENGELUARAN' | 'PEMASUKAN'>('PENGELUARAN');
  const [coaAccount, setCoaAccount] = useState('');
  
  const todayDate = new Date().toISOString().split('T')[0];
  const [pettyCashDate, setPettyCashDate] = useState(todayDate);
  const [pettyCashStartDate, setPettyCashStartDate] = useState(todayDate);
  const [pettyCashEndDate, setPettyCashEndDate] = useState(todayDate);

  const [actualCash, setActualCash] = useState<string>('');
  const [isShiftClosed, setIsShiftClosed] = useState(false);
  const [clockingMode, setClockingMode] = useState<'IN' | 'OUT' | null>(null);
  const [selfieData, setSelfieData] = useState<string>('');
  const [locationData, setLocationData] = useState<{lat: number, lng: number} | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Correction Request Modal State
  const [correctionModal, setCorrectionModal] = useState<{open: boolean; attendanceId: string | null}>({open: false, attendanceId: null});
  const [corrType, setCorrType] = useState<'CLOCK_IN' | 'CLOCK_OUT' | 'BOTH'>('CLOCK_IN');
  const [corrReqClockIn, setCorrReqClockIn] = useState('');
  const [corrReqClockOut, setCorrReqClockOut] = useState('');
  const [corrReason, setCorrReason] = useState('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert("Kamera terblokir. Pastikan Anda mengakses aplikasi ini menggunakan HTTPS dan memberikan izin akses kamera pada browser.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setIsCameraActive(false);
  };

  const takePicture = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.8);
        setSelfieData(dataUrl);
        stopCamera();
      }
    }
  };


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
    .filter(t => t.paymentMethod === 'CASH' && !t.isVoided)
    .reduce((sum, t) => sum + t.totalAmount, 0);

  const totalQris = myTransactions
    .filter(t => t.paymentMethod.includes('QRIS') && !t.isVoided)
    .reduce((sum, t) => sum + t.totalAmount, 0);

  const totalTransfer = myTransactions
    .filter(t => t.paymentMethod.includes('TRANSFER') && !t.isVoided)
    .reduce((sum, t) => sum + t.totalAmount, 0);

  const totalKasbon = myTransactions
    .filter(t => t.paymentMethod === 'KASBON' && !t.isVoided)
    .reduce((sum, t) => sum + t.totalAmount, 0);

  const totalPettyCash = myExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Fisik Tunai yang Diharapkan
  const expectedCash = totalTunai - totalPettyCash;

  const handleAddPettyCash = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pettyCashAmount || !pettyCashDesc) return;
    
    const amountNum = Number(pettyCashAmount);
    const finalAmount = pettyCashType === 'PEMASUKAN' ? -Math.abs(amountNum) : Math.abs(amountNum);
    const expenseDate = pettyCashDate ? new Date(pettyCashDate).toISOString() : new Date().toISOString();

    if (currentUser) {
      addExpense({
        tenantId: currentUser.tenantId || 'tenant_default',
        amount: finalAmount,
        category: 'OPERASIONAL',
        date: expenseDate,
        description: `Kas Kecil: ${pettyCashDesc}`,
        coaId: coaAccount || undefined
      } as any);
    }
    
    setPettyCashAmount('');
    setPettyCashDesc('');
    setCoaAccount('');
  };

  const handleCloseShift = () => {
    if (actualCash === '') {
      alert('Silakan masukkan jumlah uang fisik di laci terlebih dahulu!');
      return;
    }
    const variance = Number(actualCash) - expectedCash;
    addLog(
      'SHIFT_CLOSED',
      'SYSTEM',
      `Tutup Shift ${currentUser?.name}. Tunai Seharusnya: Rp ${expectedCash.toLocaleString('id-ID')} | Fisik: Rp ${Number(actualCash).toLocaleString('id-ID')} | Selisih: Rp ${variance.toLocaleString('id-ID')}`
    );
    setIsShiftClosed(true);
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const [historyFilter, setHistoryFilter] = useState<'ALL' | '7_DAYS' | '1_MONTH' | '1_YEAR'>('7_DAYS');

  const filteredHistory = attendances.filter(a => {
    if (a.userId !== currentUser?.username) return false;
    if (historyFilter === 'ALL') return true;
    
    const attDate = new Date(a.date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - attDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (historyFilter === '7_DAYS') return diffDays <= 7;
    if (historyFilter === '1_MONTH') return diffDays <= 30;
    if (historyFilter === '1_YEAR') return diffDays <= 365;
    return true;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="print:hidden space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-slate-200 flex items-center gap-2">
            <Lock className="w-6 h-6 text-green-600" />
            Rekap & Tutup Shift
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Cek uang laci, catat pengeluaran kas kecil, dan cetak laporan akhir shift.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Absensi Card */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden md:col-span-2">
          <div className="p-4 border-b border-gray-100 dark:border-slate-800 bg-teal-50 flex items-center justify-between">
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
                <p className="text-sm text-gray-600 dark:text-slate-400">
                  Waktu Masuk: <span className="font-bold text-gray-800 dark:text-slate-200">{myAttendance ? new Date(myAttendance.clockIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(/:/g, '.') : '-'}</span>
                </p>
                <p className="text-sm text-gray-600 dark:text-slate-400">
                  Waktu Keluar: <span className="font-bold text-gray-800 dark:text-slate-200">{myAttendance?.clockOut ? new Date(myAttendance.clockOut).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(/:/g, '.') : '-'}</span>
                </p>
                {myAttendance?.photoUrl && (
                  <p className="text-xs text-teal-700 mt-2 font-semibold flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Selfie Terekam</p>
                )}
                {myAttendance?.latitude && (
                  <p className="text-xs text-teal-700 mt-1 font-semibold flex items-center gap-1"><MapPin className="w-3 h-3"/> Geotag: {myAttendance.latitude.toFixed(4)}, {myAttendance.longitude?.toFixed(4)}</p>
                )}
              </div>
              <div className="flex gap-2">
                {!myAttendance && currentUser && !clockingMode && (
                  <button 
                    onClick={() => setClockingMode('IN')}
                    className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-6 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Camera className="w-4 h-4"/> Mulai Absen Masuk
                  </button>
                )}
                {myAttendance && !myAttendance.clockOut && !clockingMode && (
                  <button 
                    onClick={() => setClockingMode('OUT')}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-6 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Camera className="w-4 h-4"/> Mulai Absen Keluar
                  </button>
                )}
              </div>
            </div>

            {/* Clock-In/Out Widget: Selfie & GPS */}
            {clockingMode && currentUser && (
              <div className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 mt-2">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-3 text-sm flex items-center gap-2">Verifikasi Kehadiran ({clockingMode === 'IN' ? 'Masuk' : 'Keluar'})</h4>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 space-y-3">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Mohon izinkan akses Kamera dan Lokasi (GPS) untuk melakukan absensi.</p>
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
                        className={`text-xs py-2 px-3 rounded border font-bold flex items-center gap-1 ${locationData ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-800'}`}
                      >
                        <MapPin className="w-4 h-4"/> {locationData ? 'Lokasi Tersimpan' : 'Ambil Lokasi (GPS)'}
                      </button>
                      <button 
                        onClick={startCamera}
                        className={`text-xs py-2 px-3 rounded border font-bold flex items-center gap-1 ${selfieData ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-800'}`}
                      >
                        <Camera className="w-4 h-4" /> {selfieData ? 'Foto Tersimpan' : 'Ambil Selfie (Opsional)'}
                      </button>
                    </div>

                    {/* Camera Live View UI */}
                    {isCameraActive && (
                      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4">
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl max-w-md w-full shadow-2xl flex flex-col items-center">
                          <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-2">Ambil Selfie Absen</h3>
                          <div className="relative w-full aspect-square bg-slate-900 rounded-lg overflow-hidden mb-4">
                            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]"></video>
                          </div>
                          <div className="flex gap-3 w-full">
                            <button onClick={stopCamera} className="flex-1 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 dark:text-slate-300 font-bold rounded-lg">Batal</button>
                            <button onClick={takePicture} className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg flex justify-center items-center gap-2"><Camera className="w-5 h-5"/> Jepret</button>
                          </div>
                          <canvas ref={canvasRef} className="hidden"></canvas>
                        </div>
                      </div>
                    )}

                    {selfieData && !isCameraActive && (
                      <div className="mt-2 relative inline-block">
                        <img src={selfieData} alt="Selfie" className="h-24 w-24 object-cover rounded-lg border-2 border-green-500 shadow-sm" />
                        <button onClick={() => setSelfieData('')} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600" title="Hapus Foto">
                           <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                      </div>
                    )}


                    <div className="pt-3 flex flex-col gap-2">
                      {!locationData && (
                        <p className="text-[10px] text-red-500 font-bold mb-1">
                          * Wajib mengambil Lokasi (GPS) terlebih dahulu agar tombol absen aktif.
                        </p>
                      )}
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setClockingMode(null)}
                          className="py-2 px-4 text-xs font-bold text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-50 dark:bg-slate-800"
                        >
                          Batal
                        </button>
                        <button 
                          disabled={!locationData}
                          onClick={() => {
                            if (locationData) {
                              // Validasi Geofencing
                              if (settings?.storeLocationLat && settings?.storeLocationLng) {
                                const radiusLimit = settings.attendanceRadiusMeters || 50;
                                const distance = getDistanceFromLatLonInM(locationData.lat, locationData.lng, settings.storeLocationLat, settings.storeLocationLng);
                                if (distance > radiusLimit) {
                                  alert(`GAGAL ABSEN: Anda berada di luar area toko.\n\nJarak Anda: ${distance} meter.\nMaksimal Jarak: ${radiusLimit} meter.`);
                                  return; // Stop the process
                                }
                              }

                              if (clockingMode === 'IN') {
                                clockIn(currentUser.username, currentUser.name, selfieData, locationData.lat, locationData.lng);
                              } else if (clockingMode === 'OUT' && myAttendance) {
                                clockOut(myAttendance.id, selfieData, locationData.lat, locationData.lng);
                              }
                              setClockingMode(null);
                              setSelfieData('');
                              setLocationData(null);
                            }
                          }}
                          className="py-2 px-4 text-xs font-bold text-white bg-teal-600 rounded hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Submit Absen {clockingMode === 'IN' ? 'Masuk' : 'Keluar'}
                        </button>
                      </div>
                    </div>
                  </div>
                  {(selfieData || locationData) && (
                    <div className="w-32 flex-shrink-0">
      {selfieData ? (
                         <img src={selfieData} alt="Selfie" className="w-full h-32 object-cover rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm" />
                      ) : (
                         <div className="w-full h-32 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-center text-slate-400 flex-col gap-1">
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
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
            <h2 className="font-bold text-gray-800 dark:text-slate-200 text-md">Rekapitulasi Shift Hari Ini</h2>
          </div>
          <div className="p-5 space-y-4 text-sm text-gray-600 dark:text-slate-400">
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-slate-800">
              <span>Total Transaksi</span>
              <span className="font-bold">{myTransactions.filter(t => !t.isVoided).length} Struk</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-slate-800">
              <span>Pembayaran Tunai</span>
              <span className="font-bold text-gray-800 dark:text-slate-200">Rp {totalTunai.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-slate-800">
              <span>Pembayaran QRIS</span>
              <span className="font-bold text-blue-600">Rp {totalQris.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-slate-800">
              <span>Pembayaran Transfer</span>
              <span className="font-bold text-indigo-600">Rp {totalTransfer.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-slate-800">
              <span>Pembayaran Kasbon</span>
              <span className="font-bold text-red-600">Rp {totalKasbon.toLocaleString('id-ID')}</span>
            </div>
            <div className={`flex justify-between items-center py-3 border-b border-gray-100 dark:border-slate-800 ${totalPettyCash < 0 ? 'text-green-600' : 'text-red-600'}`}>
              <span>Kas Kecil (Net)</span>
              <span className="font-bold">{totalPettyCash < 0 ? '+' : '-'} Rp {Math.abs(totalPettyCash).toLocaleString('id-ID')}</span>
            </div>
            <div className="pt-4 flex justify-between items-center">
              <span className="font-bold text-green-800">ESTIMASI TUNAI DI LACI</span>
              <span className="font-extrabold text-2xl text-green-700">Rp {expectedCash.toLocaleString('id-ID')}</span>
            </div>
            
            <div className="pt-4 space-y-2">
              <label className="font-bold text-gray-800 dark:text-slate-200 text-sm">Uang Fisik di Laci (Rp) *</label>
              <input 
                type="text" 
                inputMode="numeric"
                required
                value={actualCash}
                onChange={(e) => setActualCash(e.target.value)}
                className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-3 text-lg font-bold text-gray-800 dark:text-slate-200 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-orange-500 outline-none"
                placeholder="Ketikkan jumlah uang fisik di laci.."
              />
            </div>
          </div>
          
          <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-gray-100 dark:border-slate-800 no-print">
            <button
              onClick={handleCloseShift}
              disabled={isShiftClosed}
              className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors flex-1 text-white text-lg shadow-lg shadow-orange-900/20 active:scale-95 disabled:opacity-50 ${
                isShiftClosed 
                ? 'bg-orange-600 cursor-not-allowed opacity-50' 
                : 'bg-orange-600 hover:bg-orange-700'
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
            <p className="text-xs text-amber-700 mb-2 leading-relaxed">
              Catat pengeluaran tunai tak terduga selama shift Anda (misal: bayar parkir, beli galon, dll) agar perhitungan akhir tunai di laci tetap akurat.
            </p>
            <div className="mb-4 bg-amber-100/50 p-2 rounded-lg border border-amber-200/50 flex justify-between items-center">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Saldo Kas Fisik</span>
              <span className="text-sm font-black text-amber-900">Rp {(settings?.pettyCashBalance || 0).toLocaleString('id-ID')}</span>
            </div>
            <form onSubmit={handleAddPettyCash} className="space-y-3 relative z-10">
              <div className="flex bg-amber-100 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setPettyCashType('PENGELUARAN')}
                  className={`flex-1 text-xs font-bold py-1.5 rounded-md transition-colors ${pettyCashType === 'PENGELUARAN' ? 'bg-amber-500 text-white shadow-sm' : 'text-amber-800 hover:bg-amber-200'}`}
                >
                  Pengeluaran
                </button>
                <button
                  type="button"
                  onClick={() => setPettyCashType('PEMASUKAN')}
                  className={`flex-1 text-xs font-bold py-1.5 rounded-md transition-colors ${pettyCashType === 'PEMASUKAN' ? 'bg-amber-500 text-white shadow-sm' : 'text-amber-800 hover:bg-amber-200'}`}
                >
                  Pemasukan
                </button>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-amber-800 uppercase">Tanggal Input</label>
                  <input 
                    type="date"
                    required
                    value={pettyCashDate}
                    onChange={(e) => setPettyCashDate(e.target.value)}
                    className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-amber-800 uppercase">Jumlah Rp</label>
                  <input 
                    type="text" 
                    inputMode="numeric"
                    min="0"
                    required
                    value={pettyCashAmount}
                    onChange={(e) => setPettyCashAmount(e.target.value)}
                    className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                    placeholder="0"
                  />
                </div>
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
              <div>
                <label className="text-[10px] font-bold text-amber-800 uppercase">Jurnal Lawan (CoA)</label>
                <select
                  value={coaAccount}
                  onChange={(e) => setCoaAccount(e.target.value)}
                  className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                >
                  <option value="">Pilih Akun (Otomatis jika kosong)</option>
                  {useAppStore.getState().coaList?.filter((c: any) => c.isActive).map((c: any) => (
                    <option key={c.id} value={`${c.code} - ${c.name}`}>{c.code} - {c.name}</option>
                  ))}
                </select>
              </div>
              <button 
                type="submit"
                disabled={isShiftClosed}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 rounded-lg transition-colors flex justify-center items-center gap-1 disabled:opacity-50 shadow-md shadow-amber-900/10"
              >
                <Plus className="w-4 h-4" /> {pettyCashType === 'PEMASUKAN' ? 'Tambah Pemasukan' : 'Tambah Pengeluaran'}
              </button>
            </form>
          </div>

          {/* List Kas Kecil */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
             <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex justify-between items-center">
               <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">Riwayat Kas Kecil</h3>
               <div className="flex items-center space-x-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1">
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                 <input
                   type="date"
                   value={pettyCashStartDate}
                   onChange={(e) => setPettyCashStartDate(e.target.value)}
                   className="bg-transparent border-none text-xs focus:outline-none text-slate-700 dark:text-slate-300 font-medium"
                 />
                 <span className="text-slate-400 text-xs">s/d</span>
                 <input
                   type="date"
                   value={pettyCashEndDate}
                   onChange={(e) => setPettyCashEndDate(e.target.value)}
                   className="bg-transparent border-none text-xs focus:outline-none text-slate-700 dark:text-slate-300 font-medium"
                 />
               </div>
             </div>
             <div className="p-2 space-y-1 max-h-60 overflow-y-auto overflow-x-auto">
                {(() => {
                  const filteredPettyCash = expenses.filter(exp => 
                    exp.createdBy === currentUser?.name && 
                    exp.category === 'OPERASIONAL' &&
                    exp.date >= pettyCashStartDate && exp.date <= pettyCashEndDate + 'T23:59:59'
                  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                  return filteredPettyCash.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4 italic">Belum ada transaksi kas kecil.</p>
                  ) : (
                    filteredPettyCash.map(exp => (
                      <div key={exp.id} className="min-w-[320px] flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:bg-slate-800 rounded text-xs transition-colors border-b border-slate-100 dark:border-slate-700/50">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-700 dark:text-slate-300">{exp.description}</span>
                          <span className="text-[9px] text-slate-400">{new Date(exp.date).toLocaleDateString("id-ID")}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`font-bold ${exp.amount < 0 ? "text-green-600" : "text-rose-600"}`}>
                            {exp.amount < 0 ? "+" : "-"} Rp {Math.abs(exp.amount).toLocaleString("id-ID")}
                          </span>
                          <button 
                            onClick={() => {
                              if ((exp as any).isManual) {
                                alert("Transaksi ini diinput manual dari Jurnal Umum. Harap hapus melalui menu Jurnal Umum.");
                                return;
                              }
                              if (window.confirm("Hapus riwayat kas ini? Jurnal terkait juga akan dihapus.")) {
                                useAppStore.getState().deleteExpense(exp.id);
                                useAppStore.getState().deleteJournalEntryByRef(exp.id);
                              }
                            }}
                            className="text-gray-400 hover:text-red-500 transition-colors p-1"
                            title="Hapus riwayat kas"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                          </button>
                        </div>
                      </div>
                    ))
                  );
                })()}
             </div>
          </div>
        </div>
      </div>

      {/* Riwayat Absensi */}
      <div className="print:hidden bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <h2 className="font-bold text-slate-800 dark:text-slate-200 text-md flex items-center gap-2">
            Riwayat Absensi Anda
          </h2>
          <select 
            value={historyFilter}
            onChange={(e) => setHistoryFilter(e.target.value as any)}
            className="p-2 text-sm border border-gray-200 dark:border-slate-700 rounded-lg"
          >
            <option value="7_DAYS">7 Hari Terakhir</option>
            <option value="1_MONTH">1 Bulan Terakhir</option>
            <option value="1_YEAR">1 Tahun Terakhir</option>
            <option value="ALL">Semua Riwayat</option>
          </select>
        </div>
        <div className="p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase">
                <th className="p-4 font-bold border-b border-slate-200 dark:border-slate-700">Tanggal</th>
                <th className="p-4 font-bold border-b border-slate-200 dark:border-slate-700">Jam Masuk</th>
                <th className="p-4 font-bold border-b border-slate-200 dark:border-slate-700">Jam Keluar</th>
                <th className="p-4 font-bold border-b border-slate-200 dark:border-slate-700">Bukti Kehadiran</th>
                <th className="p-4 font-bold border-b border-slate-200 dark:border-slate-700">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">Tidak ada riwayat absensi.</td>
                </tr>
              ) : (
                filteredHistory.map(att => (
                  <tr key={att.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:bg-slate-800">
                    <td className="p-4 text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {new Date(att.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                      {att.isRevised && <span className="ml-1 text-[10px] bg-amber-100 text-amber-700 px-1 rounded">Direvisi</span>}
                      {att.correctionStatus === 'PENDING' && <span className="ml-1 text-[10px] bg-blue-100 text-blue-700 px-1 rounded">Menunggu Koreksi</span>}
                      {att.correctionStatus === 'REJECTED' && <span className="ml-1 text-[10px] bg-red-100 text-red-700 px-1 rounded">Koreksi Ditolak</span>}
                    </td>
                    <td className="p-4 text-sm text-slate-700 dark:text-slate-300">{new Date(att.clockIn).toLocaleTimeString('id-ID')}</td>
                    <td className="p-4 text-sm text-slate-700 dark:text-slate-300">{att.clockOut ? new Date(att.clockOut).toLocaleTimeString('id-ID') : '-'}</td>
                    <td className="p-4 flex gap-2 items-center">
                      {att.photoUrl ? (
                        <div className="flex flex-col gap-1 items-center" title="Foto Masuk">
                          <img src={att.photoUrl} alt="Masuk" className="w-8 h-8 object-cover rounded border border-green-500" />
                          <span className="text-[10px] text-green-600 font-bold">Masuk</span>
                        </div>
                      ) : <span className="text-xs text-slate-400">Tidak ada foto masuk</span>}
                      
                      {att.clockOutPhotoUrl ? (
                        <div className="flex flex-col gap-1 items-center" title="Foto Keluar">
                          <img src={att.clockOutPhotoUrl} alt="Keluar" className="w-8 h-8 object-cover rounded border border-amber-500" />
                          <span className="text-[10px] text-amber-600 font-bold">Keluar</span>
                        </div>
                      ) : (
                        att.clockOut && <span className="text-xs text-slate-400">Tidak ada foto keluar</span>
                      )}
                    </td>
                    <td className="p-4">
                      {att.correctionStatus !== 'PENDING' && att.correctionStatus !== 'APPROVED' && (
                        <button
                          onClick={() => { setCorrectionModal({open: true, attendanceId: att.id}); setCorrType('CLOCK_IN'); setCorrReason(''); setCorrReqClockIn(''); setCorrReqClockOut(''); }}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded border border-blue-200"
                          title="Ajukan Koreksi Absen"
                        >
                          <Edit2 className="w-3 h-3" /> Koreksi
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>

      {/* Hidden Thermal Print Receipt for Shift Close */}
      {isShiftClosed && (
        <>
          <style type="text/css" media="print">
            {`
              @page { size: 58mm auto; margin: 0; }
              body * { visibility: hidden; }
              body { margin: 0; padding: 0; background: white; }
              .printable-thermal, .printable-thermal * { visibility: visible; }
              .printable-thermal { position: absolute; left: 0; top: 0; width: 58mm; padding: 2mm; margin: 0; border: none; max-height: none; overflow: visible; font-size: 10px; color: black; }
            `}
          </style>
          <div id="printable-receipt" className="hidden print:block printable-thermal font-mono text-black bg-white">
            <div className="text-center space-y-1 border-b border-dashed border-black pb-3 mb-3">
              <h2 className="font-bold text-base uppercase">Rekap Tutup Shift</h2>
              <p>Toko KSA Mart</p>
              <p className="text-[10px] uppercase">{activeBranchId ? `Cabang ${activeBranchId}` : 'Kantor Pusat'}</p>
              <p>================================</p>
              <p className="text-left">Tanggal : {new Date().toLocaleString('id-ID')}</p>
              <p className="text-left">Kasir   : {currentUser?.name}</p>
            </div>
          
          <div className="space-y-2 border-b border-dashed border-black pb-3 mb-3">
            <div className="flex justify-between">
              <span>Total Transaksi :</span>
              <span>{myTransactions.filter(t => !t.isVoided).length} Struk</span>
            </div>
            <div className="flex justify-between">
              <span>Penerimaan Tunai:</span>
              <span>Rp {totalTunai.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span>Penerimaan QRIS :</span>
              <span>Rp {totalQris.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span>Penerimaan Transfer :</span>
              <span>Rp {totalTransfer.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span>Piutang Kasbon :</span>
              <span>Rp {totalKasbon.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div className="space-y-2 border-b border-dashed border-black pb-3 mb-3">
            <p className="font-bold">Transaksi Kas Kecil:</p>
            {myExpenses.length === 0 ? <p>- Nihil -</p> : myExpenses.map(exp => (
              <div key={exp.id} className="flex justify-between pl-2">
                <span>{exp.description.replace('Kas Kecil: ', '').replace('Pemasukan Kas: ', '[+] ')}</span>
                <span>{exp.amount < 0 ? '+' : '-'} Rp {Math.abs(exp.amount).toLocaleString('id-ID')}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold pt-1 border-t border-black mt-1">
              <span>Total Bersih:</span>
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
        </>
      )}
      {/* Correction Request Modal */}
      {correctionModal.open && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setCorrectionModal({open: false, attendanceId: null})}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg flex items-center gap-2"><Edit2 className="w-5 h-5 text-blue-500"/>Ajukan Koreksi Absen</h3>
              <button onClick={() => setCorrectionModal({open: false, attendanceId: null})} className="p-1 hover:bg-slate-100 dark:bg-slate-800 rounded-lg"><X className="w-5 h-5 text-slate-500 dark:text-slate-400"/></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Bagian yang Perlu Dikoreksi *</label>
                <select value={corrType} onChange={e => setCorrType(e.target.value as any)} className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="CLOCK_IN">Jam Masuk</option>
                  <option value="CLOCK_OUT">Jam Keluar</option>
                  <option value="BOTH">Keduanya</option>
                </select>
              </div>
              {(corrType === 'CLOCK_IN' || corrType === 'BOTH') && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Jam Masuk yang Seharusnya *</label>
                  <input type="datetime-local" value={corrReqClockIn} onChange={e => setCorrReqClockIn(e.target.value)} className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"/>
                </div>
              )}
              {(corrType === 'CLOCK_OUT' || corrType === 'BOTH') && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Jam Keluar yang Seharusnya *</label>
                  <input type="datetime-local" value={corrReqClockOut} onChange={e => setCorrReqClockOut(e.target.value)} className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"/>
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Alasan Permohonan Koreksi *</label>
                <textarea value={corrReason} onChange={e => setCorrReason(e.target.value)} placeholder="Jelaskan alasan koreksi absen Anda..." className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none h-20"></textarea>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setCorrectionModal({open: false, attendanceId: null})} className="flex-1 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-400 font-bold text-sm hover:bg-slate-50 dark:bg-slate-800">Batal</button>
                <button
                  disabled={!corrReason || ((corrType === 'CLOCK_IN' || corrType === 'BOTH') && !corrReqClockIn) || ((corrType === 'CLOCK_OUT' || corrType === 'BOTH') && !corrReqClockOut)}
                  onClick={() => {
                    if (!correctionModal.attendanceId) return;
                    requestAttendanceCorrection(
                      correctionModal.attendanceId,
                      corrType,
                      corrReason,
                      corrReqClockIn ? new Date(corrReqClockIn).toISOString() : undefined,
                      corrReqClockOut ? new Date(corrReqClockOut).toISOString() : undefined
                    );
                    setCorrectionModal({open: false, attendanceId: null});
                    alert('Permohonan koreksi absen berhasil diajukan. Mohon tunggu persetujuan Admin/Owner.');
                  }}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Kirim Permohonan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
