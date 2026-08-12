import React, { useState, useRef } from 'react';
import { useAppStore } from '../store';
import { Lock, Printer, Plus, AlertCircle, CheckCircle, Calculator, Banknote, MapPin, Camera, Image as ImageIcon, Edit2, X, Bluetooth, MessageCircle, Download, Search } from 'lucide-react';
import { printKasbonPaymentToBluetooth } from '../lib/bluetoothPrinter';
import * as XLSX from 'xlsx';

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

const getLocalTodayDate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export default function KasirShiftPage() {
  const { transactions, products, currentUser, addExpense, updateExpense, expenses, journalEntries, addJournalEntry, addLog, attendances, clockIn, clockOut, activeBranchId, requestAttendanceCorrection, settings, getCalculatedPettyCash, customers, kasbonPayments, updateCustomer, addKasbonPayment, coaList, addJournalEntries } = useAppStore();
  const [pettyCashAmount, setPettyCashAmount] = useState('');
  const [pettyCashDesc, setPettyCashDesc] = useState('');
  const [pettyCashCustomDesc, setPettyCashCustomDesc] = useState('');
  const [pettyCashType, setPettyCashType] = useState<'PENGELUARAN' | 'PEMASUKAN'>('PENGELUARAN');
  const [coaAccount, setCoaAccount] = useState('');
  const [kasAccount, setKasAccount] = useState('');
  
  const [editExpenseModal, setEditExpenseModal] = useState<{isOpen: boolean, id: string, amount: string, desc: string, coaAccount: string, kasAccount: string, type: 'PENGELUARAN'|'PEMASUKAN'}>({
    isOpen: false, id: '', amount: '', desc: '', coaAccount: '', kasAccount: '', type: 'PENGELUARAN'
  });

  const [payoffModal, setPayoffModal] = useState<{ isOpen: boolean, customerId: string, customerName: string, debtAmount: number, payAmount: number, paymentMethod: string, notes?: string, selectedInvoices: string[], debitAccountId?: string, creditAccountId?: string }>({
    isOpen: false, customerId: '', customerName: '', debtAmount: 0, payAmount: 0, paymentMethod: 'CASH', selectedInvoices: [], debitAccountId: '', creditAccountId: ''
  });
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [receiptModal, setReceiptModal] = useState<{ isOpen: boolean, record: import('../types').KasbonPaymentRecord | null }>({ isOpen: false, record: null });
  const [waNumber, setWaNumber] = useState('');
  
  const [todayDate, setTodayDate] = useState(getLocalTodayDate());
  const firstDayOfMonth = todayDate.substring(0, 8) + '01';

  const handleBluetoothPrint = async () => {
    if (!receiptModal.record) return;
    try {
      await printKasbonPaymentToBluetooth(
        receiptModal.record,
        settings.storeName || 'KSA Mart',
        settings.storeAddress || '',
        settings.storePhone || ''
      );
    } catch (err: any) {
      alert(err.message || 'Gagal mencetak ke printer Bluetooth');
    }
  };

  const handleSendWA = () => {
    if (!receiptModal.record || !waNumber) return;
    const rec = receiptModal.record;
    
    let text = `*BUKTI ${rec.isFullyPaid ? 'KASBON LUNAS' : 'PEMBAYARAN KASBON'}*\n`;
    text += `${settings.storeName}\n\n`;
    text += `Tanggal: ${new Date(rec.paymentDate).toLocaleString('id-ID')}\n`;
    text += `Pelanggan: ${rec.customerName}\n`;
    text += `Nominal Bayar: Rp ${rec.amountPaid.toLocaleString('id-ID')}\n`;
    text += `Sisa Kasbon: Rp ${rec.remainingDebt.toLocaleString('id-ID')}\n`;
    if (rec.notes) text += `Catatan: ${rec.notes}\n`;
    text += `\nTerima kasih.`;
    
    const url = `https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };
  
  const [pettyCashDate, setPettyCashDate] = useState(todayDate);
  const [pettyCashStartDate, setPettyCashStartDate] = useState(firstDayOfMonth);
  const [pettyCashEndDate, setPettyCashEndDate] = useState(todayDate);
  const [pettyCashSearch, setPettyCashSearch] = useState('');
  const [pettyCashFilter, setPettyCashFilter] = useState<'ALL' | 'IN' | 'OUT'>('ALL');

  const [actualCash, setActualCash] = useState<string>('');
  const [digitalBalances, setDigitalBalances] = useState({
    radar: '', kemenkuota: '', bosspulsa: '', tokopedia: '', dana: ''
  });
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
  
  const [modalTab, setModalTab] = useState<'IZIN' | 'LUPA_ABSEN'>('IZIN');
  const [izinStartDate, setIzinStartDate] = useState(todayDate);
  const [izinEndDate, setIzinEndDate] = useState(todayDate);
  const [izinType, setIzinType] = useState<'IZIN' | 'SAKIT' | 'CUTI' | 'CUTI_TAHUNAN'>('IZIN');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Auto-update date if user leaves app open overnight
  React.useEffect(() => {
    const interval = setInterval(() => {
      const freshDate = getLocalTodayDate();
      setTodayDate(prev => {
        if (prev !== freshDate) {
          // Day rolled over, update defaults
          setPettyCashDate(freshDate);
          setPettyCashEndDate(freshDate);
          setPettyCashStartDate(freshDate.substring(0, 8) + '01');
          setIzinStartDate(freshDate);
          setIzinEndDate(freshDate);
          return freshDate;
        }
        return prev;
      });
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

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


  // Helper for timezone-safe local date string
  const getLocalDateStr = (dStr: string | Date | undefined) => {
    if (!dStr) return '';
    if (typeof dStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dStr)) return dStr;
    const d = new Date(dStr);
    if (isNaN(d.getTime())) return String(dStr).substring(0, 10);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Filter Today's data for this cashier
  const today = todayDate;
  const myTransactions = (transactions || []).filter(tx => 
    getLocalDateStr(tx.timestamp) === today && 
    (!currentUser?.name || !tx.cashierName || tx.cashierName.trim().toLowerCase() === currentUser.name.trim().toLowerCase())
  );

  const myAttendance = currentUser ? attendances.find(a => a.userId === currentUser.username && a.date === today) : undefined;

  const myExpenses = (expenses || []).filter(exp => 
    getLocalDateStr(exp.date) === today && exp.category === 'OPERASIONAL'
  );

  const manualJournalsToday = (journalEntries || []).filter(j => 
    getLocalDateStr(j.date) === today && 
    j.referenceType === 'MANUAL' && 
    j.account && 
    (j.account.toLowerCase().includes('kas kecil') || j.account.includes('1102'))
  );

  const totalTunai = myTransactions
    .filter(t => !t.isVoided)
    .reduce((sum, t) => {
      if (t.paymentMethod === 'CASH') return sum + t.totalAmount;
      if (t.splitPayments) {
        const cashSplit = t.splitPayments.find((sp: any) => sp.method === 'CASH');
        if (cashSplit) return sum + (cashSplit.amount - (t.changeAmount || 0));
      }
      return sum;
    }, 0);

  let totalFisik = 0;
  let totalPPOB = 0;
  
  myTransactions.filter(t => !t.isVoided).forEach(t => {
    t.items?.forEach((item: any) => {
      const p = products.find((prod: any) => prod.id === item.productId);
      const isPPOB = p ? p.isPPOB : false;
      const lineTotal = item.price * item.quantity;
      if (isPPOB) totalPPOB += lineTotal;
      else totalFisik += lineTotal;
    });
  });

  const totalQris = myTransactions
    .filter(t => !t.isVoided && (t.paymentMethod.includes('QRIS') || (t.splitPayments && t.splitPayments.some((sp: any) => sp.method.includes('QRIS')))))
    .reduce((sum, t) => {
      if (t.paymentMethod.includes('QRIS')) return sum + t.totalAmount;
      if (t.splitPayments) {
        const qrisSplit = t.splitPayments.find((sp: any) => sp.method.includes('QRIS'));
        if (qrisSplit) return sum + qrisSplit.amount;
      }
      return sum;
    }, 0);

  const totalTransfer = myTransactions
    .filter(t => !t.isVoided && (t.paymentMethod.includes('TRANSFER') || (t.splitPayments && t.splitPayments.some((sp: any) => sp.method.includes('TRANSFER')))))
    .reduce((sum, t) => {
      if (t.paymentMethod.includes('TRANSFER')) return sum + t.totalAmount;
      if (t.splitPayments) {
        const tfSplit = t.splitPayments.find((sp: any) => sp.method.includes('TRANSFER'));
        if (tfSplit) return sum + tfSplit.amount;
      }
      return sum;
    }, 0);

  const totalKasbon = myTransactions
    .filter(t => t.paymentMethod === 'KASBON' && !t.isVoided)
    .reduce((sum, t) => sum + t.totalAmount, 0);

  const totalPettyCash = myExpenses.reduce((sum, exp) => sum + exp.amount, 0) + 
    manualJournalsToday.reduce((sum, j) => sum + (j.credit || 0) - (j.debit || 0), 0);

  // Fisik Tunai yang Diharapkan adalah SISA SALDO BENAR di Jurnal Kas (1-1000)
  const expectedCash = getCalculatedPettyCash();

  const handleAddPettyCash = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validasi Akun Kas (Khusus 1102 Kas Kecil)
    const selectedKasCode = kasAccount ? kasAccount.split(' - ')[0].trim() : '1102';
    if (selectedKasCode !== '1102' && !kasAccount.toLowerCase().includes('kas kecil')) {
      alert('⛔ DITOLAK OLEH SISTEM:\n\nFormulir ini khusus untuk transaksi KAS KECIL (Kode Akun 1102).\n\nTransaksi menggunakan Kas Utama (1101) atau Rekening Bank ditolak di halaman ini. Silakan gunakan menu Jurnal Umum untuk transaksi Kas Utama/Bank.');
      return;
    }

    // 2. Validasi Jumlah Nominal Rp
    const amountNum = Number(pettyCashAmount);
    if (!pettyCashAmount || isNaN(amountNum) || amountNum <= 0) {
      alert('⚠️ HARAP DIISI DENGAN BENAR:\n\nNominal Rp transaksi Kas Kecil wajib diisi dan harus lebih besar dari Rp 0.');
      return;
    }

    // 3. Validasi Keterangan
    if (!pettyCashDesc || !pettyCashDesc.trim()) {
      alert('⚠️ HARAP DIISI DENGAN BENAR:\n\nKeterangan transaksi Kas Kecil wajib diisi lengkap (contoh: Belanja Stok, Honor Kasir, dsb).');
      return;
    }

    // 4. Validasi Jurnal Lawan (CoA)
    if (!coaAccount || !coaAccount.trim()) {
      alert('⚠️ HARAP DIPILIH DENGAN BENAR:\n\nJurnal Lawan (CoA) wajib dipilih agar transaksi terintegrasi otomatis ke pos Laporan Keuangan yang sesuai.');
      return;
    }

    const finalAmount = pettyCashType === 'PEMASUKAN' ? -Math.abs(amountNum) : Math.abs(amountNum);
    const expenseDate = pettyCashDate
      ? (() => {
          const today = new Date().toISOString().split('T')[0];
          if (pettyCashDate === today) return new Date().toISOString();
          return new Date(`${pettyCashDate}T12:00:00+07:00`).toISOString();
        })()
      : new Date().toISOString();

    if (currentUser) {
      let finalCoa = coaAccount.split(' - ')[0].trim();

      addExpense({
        tenantId: currentUser.tenantId || 'tenant_default',
        amount: finalAmount,
        category: 'OPERASIONAL',
        date: expenseDate,
        description: `Kas Kecil: ${pettyCashDesc.trim()}`,
        coaId: finalCoa,
        kasAccountId: '1102'
      } as any);
    }
    
    setPettyCashAmount('');
    setPettyCashDesc('');
    setPettyCashCustomDesc('');
    setCoaAccount('');
    setKasAccount('1102 - Kas Kecil');
  };

  const handleCloseShift = () => {
    if (actualCash === '') {
      alert('Silakan masukkan jumlah uang fisik di laci terlebih dahulu!');
      return;
    }
    const variance = Number(actualCash) - expectedCash;
    
    // Process Digital Balances
    const processDigital = (code: string, actualStr: string, name: string) => {
      if (!actualStr) return;
      const actualNum = Number(actualStr);
      // Calculate current balance
      const currentBal = (journalEntries || []).reduce((sum, j) => {
        if (j.account === code) {
          return sum + (j.debit || 0) - (j.credit || 0);
        }
        return sum;
      }, 0);
      const diff = actualNum - currentBal;
      
      if (diff !== 0) {
        const isIncome = diff > 0;
        const amount = Math.abs(diff);
        const dateStr = new Date().toISOString();
        const refId = `shift_${Date.now()}_${code}`;
        
        // Debit Leg
        addJournalEntry({
          tenantId: currentUser?.tenantId || 'tenant_default',
          date: dateStr,
          account: isIncome ? code : '5400',
          debit: amount,
          credit: 0,
          description: `Penyesuaian Tutup Shift: ${name}`,
          referenceType: 'MANUAL',
          referenceId: refId
        });
        
        // Credit Leg
        addJournalEntry({
          tenantId: currentUser?.tenantId || 'tenant_default',
          date: dateStr,
          account: isIncome ? '3-1000' : code,
          debit: 0,
          credit: amount,
          description: `Penyesuaian Tutup Shift: ${name}`,
          referenceType: 'MANUAL',
          referenceId: refId
        });
      }
    };

    processDigital('1-1050', digitalBalances.radar, 'Radar Pulsa');
    processDigital('1-1051', digitalBalances.kemenkuota, 'Kemenkuota');
    processDigital('1-1052', digitalBalances.bosspulsa, 'Boss Pulsa');
    processDigital('1-1053', digitalBalances.tokopedia, 'Tokopedia');
    processDigital('1117', digitalBalances.dana, 'Saldo Dana Dokuku');

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

  const filteredHistory = (attendances || []).filter(a => {
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
                {!clockingMode && (
                  <button 
                    onClick={() => setCorrectionModal({open: true, attendanceId: myAttendance?.id || null})}
                    className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-6 rounded-lg transition-colors flex items-center gap-2 text-sm"
                  >
                    Pengajuan Izin / Lupa Absen
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
          <div className="p-4 border-b border-gray-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex justify-between items-center">
            <h2 className="font-bold text-gray-800 dark:text-slate-200 text-md">Rekapitulasi Shift Hari Ini</h2>
            <span className="text-[10px] font-bold text-teal-700 bg-teal-50 dark:bg-teal-900/40 px-2.5 py-1 rounded-full border border-teal-200 dark:border-teal-800">Kas Kecil 1102</span>
          </div>
          <div className="p-5 space-y-4 text-sm text-gray-600 dark:text-slate-400">
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-slate-800">
              <span className="font-medium">Total Transaksi Shift Ini</span>
              <span className="font-bold text-gray-800 dark:text-slate-200">{myTransactions.filter(t => !t.isVoided).length} Struk</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-gray-100 dark:border-slate-800">
              <span className="text-xs text-gray-500 ml-4">↳ Penjualan Produk Fisik (Mart)</span>
              <span className="font-bold text-gray-700 dark:text-slate-300 text-sm">Rp {totalFisik.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-gray-100 dark:border-slate-800">
              <span className="text-xs text-gray-500 ml-4">↳ Penjualan Layanan PPOB</span>
              <span className="font-bold text-gray-700 dark:text-slate-300 text-sm">Rp {totalPPOB.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-slate-800">
              <div>
                <span className="font-medium block">Pembayaran Tunai</span>
                <span className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold">(Uang Tunai Masuk Laci 1102)</span>
              </div>
              <span className="font-bold text-gray-800 dark:text-slate-200">Rp {totalTunai.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-slate-800">
              <div>
                <span className="font-medium block">Pembayaran QRIS</span>
                <span className="text-[10px] text-blue-500 font-semibold">(Rekening QRIS Dana 1-1020)</span>
              </div>
              <span className="font-bold text-blue-600">Rp {totalQris.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-slate-800">
              <div>
                <span className="font-medium block">Pembayaran Transfer</span>
                <span className="text-[10px] text-indigo-500 font-semibold">(Rekening Bank BSI 1103)</span>
              </div>
              <span className="font-bold text-indigo-600">Rp {totalTransfer.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-slate-800">
              <div>
                <span className="font-medium block">Pembayaran Kasbon</span>
                <span className="text-[10px] text-rose-500 font-semibold">(Piutang Pelanggan 1-1030)</span>
              </div>
              <span className="font-bold text-rose-600">Rp {totalKasbon.toLocaleString('id-ID')}</span>
            </div>
            <div className={`flex justify-between items-center py-3 border-b border-gray-100 dark:border-slate-800 ${totalPettyCash < 0 ? 'text-green-600' : 'text-rose-600'}`}>
              <div>
                <span className="font-medium block">Mutasi Kas Kecil Shift Ini</span>
                <span className="text-[10px] text-gray-500 font-semibold">(Dipakai dari / Disetor ke Kas Kecil 1102)</span>
              </div>
              <span className="font-bold">{totalPettyCash < 0 ? '+' : '-'} Rp {Math.abs(totalPettyCash).toLocaleString('id-ID')}</span>
            </div>
            
            <div className="pt-3 pb-1 border-t border-teal-200 dark:border-teal-800">
              <div className="flex justify-between items-center py-2.5 px-3.5 bg-teal-50/70 dark:bg-teal-950/40 rounded-lg border border-teal-200/80 dark:border-teal-800/80">
                <div>
                  <span className="font-bold text-teal-900 dark:text-teal-200 text-xs block">Estimasi Fisik Tunai di Laci</span>
                  <span className="text-[9.5px] font-semibold text-teal-700 dark:text-teal-400 uppercase">(Kas Kecil 1102)</span>
                </div>
                <span className="font-extrabold text-base text-teal-800 dark:text-teal-200 font-mono">Rp {expectedCash.toLocaleString('id-ID')}</span>
              </div>

              <div className="mt-2 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200/60 dark:border-slate-700/60 text-[10px] text-slate-600 dark:text-slate-400">
                <p className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 leading-snug">
                  💡 Komposisi Uang Laci = Modal Awal Kas Kecil (1102) + Penjualan Tunai + Pelunasan Kasbon Tunai - Mutasi Kas Kecil.
                </p>
              </div>
            </div>
            
            <div className="pt-3 space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="font-bold text-gray-800 dark:text-slate-200 text-xs">Uang Fisik di Laci Kasir (Rp) <span className="text-red-500">*</span></label>
                <span className="text-[10px] text-gray-400 italic">Hitung total uang kertas & koin</span>
              </div>
              <input 
                type="number" 
                required
                value={actualCash}
                onChange={(e) => setActualCash(e.target.value)}
                className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm font-bold text-gray-800 dark:text-slate-200 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-orange-500 outline-none"
                placeholder="Ketikkan jumlah fisik uang tunai di laci.."
              />
            </div>
            
            <div className="pt-6 border-t border-gray-100 dark:border-slate-800 mt-4 space-y-3">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-orange-500"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>
                Laporan Saldo Digital Akhir Shift
              </h3>
              <p className="text-[10px] text-slate-500 mb-2 leading-relaxed">
                Opsional: Isi saldo sisa di masing-masing aplikasi untuk dicocokkan otomatis oleh sistem. Kosongkan jika tidak ada perubahan.
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Radar Pulsa</label>
                  <input type="number" value={digitalBalances.radar} onChange={e => setDigitalBalances(d => ({...d, radar: e.target.value}))} className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 outline-none focus:border-orange-400" placeholder="Rp..." />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Kemenkuota</label>
                  <input type="number" value={digitalBalances.kemenkuota} onChange={e => setDigitalBalances(d => ({...d, kemenkuota: e.target.value}))} className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 outline-none focus:border-orange-400" placeholder="Rp..." />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Boss Pulsa</label>
                  <input type="number" value={digitalBalances.bosspulsa} onChange={e => setDigitalBalances(d => ({...d, bosspulsa: e.target.value}))} className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 outline-none focus:border-orange-400" placeholder="Rp..." />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Tokopedia</label>
                  <input type="number" value={digitalBalances.tokopedia} onChange={e => setDigitalBalances(d => ({...d, tokopedia: e.target.value}))} className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 outline-none focus:border-orange-400" placeholder="Rp..." />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Dana Dokuku (1117)</label>
                  <input type="number" value={digitalBalances.dana} onChange={e => setDigitalBalances(d => ({...d, dana: e.target.value}))} className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 outline-none focus:border-orange-400" placeholder="Rp..." />
                </div>
              </div>
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
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Saldo Kas Kecil (1102)</span>
              <span className="text-sm font-black text-amber-900">
                Rp {(() => {
                  const kasKecilCoa = coaList?.find(c => c.name.toLowerCase().includes('kas kecil') || c.code === '1102');
                  const targetCode = kasKecilCoa ? kasKecilCoa.code : '1102';
                  const bal = (journalEntries || []).reduce((sum, j) => {
                    const accCode = j.account?.includes(' - ') ? j.account.split(' - ')[0].trim() : j.account?.trim();
                    if (accCode === targetCode || accCode === '1102') {
                      return sum + (Number(j.debit) || 0) - (Number(j.credit) || 0);
                    }
                    return sum;
                  }, 0);
                  return bal.toLocaleString('id-ID');
                })()}
              </span>
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
              <div className="mt-4 space-y-3">
                                <div className="flex-1">
                  <label className="text-[10px] font-bold text-amber-800 uppercase">Keterangan</label>
                  <input
                    list="keterangan-options"
                    required
                    value={pettyCashDesc}
                    onChange={(e) => setPettyCashDesc(e.target.value)}
                    placeholder="Ketik keterangan atau pilih dari daftar..."
                    className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                  />
                  <datalist id="keterangan-options">
                    {pettyCashType === 'PENGELUARAN' ? (
                      <>
                        <option value="BELANJA STOK" />
                        <option value="HONOR KASIR" />
                        <option value="TUNJANGAN KASIR" />
                        <option value="BENSIN" />
                        <option value="TARIK TUNAI" />
                        <option value="HONOR PERBAIKAN TOKO/MOTOR/FASILITAS" />
                        <option value="TALANGAN COD PAKET" />
                        <option value="SETOR IPL" />
                      </>
                    ) : (
                      <>
                        <option value="BAYAR IPL" />
                        <option value="SIMPANAN POKOK" />
                        <option value="SIMPANAN WAJIB" />
                        <option value="ANGSURAN PEMBIAYAAN" />
                        <option value="JASA TRANSFER (5000)" />
                        <option value="JASA TRANSFER (NOMINAL YANG DITRANSFER)" />
                        <option value="TALANGAN COD PAKET" />
                      </>
                    )}
                  </datalist>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-amber-800 uppercase">Akun Kas (Sumber/Tujuan)</label>
                  <input
                    type="text"
                    readOnly
                    value="1102 - Kas Kecil"
                    className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm font-bold bg-amber-100/70 text-amber-900 cursor-not-allowed outline-none"
                    title="Formulir ini khusus untuk transaksi Kas Kecil (1102)"
                  />
                  <span className="text-[9px] font-semibold text-amber-700 italic mt-0.5 block">Khusus Kas Kecil (1102)</span>
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-amber-800 uppercase">Jurnal Lawan (CoA) *</label>
                  <input
                    list="coa-options"
                    required
                    value={coaAccount}
                    onChange={(e) => setCoaAccount(e.target.value)}
                    placeholder="Wajib pilih jurnal lawan..."
                    className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none bg-white font-medium"
                  />
                  <datalist id="coa-options">
                    {useAppStore.getState().coaList?.filter((c: any) => c.isActive && c.code !== '1102' && !c.name.toLowerCase().includes('kas kecil')).map((c: any) => (
                      <option key={c.id} value={`${c.code} - ${c.name}`} />
                    ))}
                  </datalist>
                </div>
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

          {/* Quick Kasbon Payoff */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 mb-4">
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
              <Banknote className="w-4 h-4 text-blue-500" />
              Pelunasan Kasbon Pelanggan KSA Mart
            </h3>
            <div className="flex gap-2 relative">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Cari nama/HP pelanggan yang punya kasbon..."
                  value={customerSearchTerm}
                  onChange={(e) => {
                    setCustomerSearchTerm(e.target.value);
                    setShowCustomerSearch(true);
                  }}
                  onFocus={() => setShowCustomerSearch(true)}
                  onBlur={() => setShowCustomerSearch(false)}
                  className="w-full border border-blue-300 rounded-lg pl-8 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                />
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                
                {showCustomerSearch && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {customers.filter(c => (c.debtAmount || 0) > 0 && (!customerSearchTerm || c.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) || c.phone.includes(customerSearchTerm))).length > 0 ? (
                      customers.filter(c => (c.debtAmount || 0) > 0 && (!customerSearchTerm || c.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) || c.phone.includes(customerSearchTerm))).map(c => (
                        <div
                          key={c.id}
                          className="p-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0"
                          onMouseDown={(e) => {
                            e.preventDefault(); // Prevent onBlur from firing before click
                            setPayoffModal({
                              isOpen: true,
                              customerId: c.id!,
                              customerName: c.name,
                              debtAmount: c.debtAmount || 0,
                              payAmount: 0,
                              paymentMethod: 'CASH',
                              selectedInvoices: [],
                              debitAccountId: '1102 - Kas Kecil',
                              creditAccountId: '1030 - Piutang Kasbon Pelanggan'
                            });
                            setCustomerSearchTerm('');
                            setShowCustomerSearch(false);
                          }}
                        >
                          <div className="font-bold text-sm text-gray-800">{c.name}</div>
                          <div className="text-xs text-red-600 font-bold">Kasbon: Rp {(c.debtAmount || 0).toLocaleString('id-ID')}</div>
                        </div>
                      ))
                    ) : (
                      <div className="p-2 text-xs text-gray-500 text-center italic">Tidak ada pelanggan dengan kasbon yang cocok.</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* List Kas Kecil */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
             <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex justify-between items-center flex-wrap gap-2">
               <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">Riwayat Kas Kecil</h3>
               <div className="flex items-center gap-2 flex-wrap">
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
                 <button
                   onClick={() => {
                     const baseExpenses = (expenses || []).filter(exp =>
                       exp.category === 'OPERASIONAL' &&
                       exp.date >= pettyCashStartDate && exp.date <= pettyCashEndDate + 'T23:59:59'
                     );
                     const manualJournals = (journalEntries || [])
                       .filter(j => {
                         if (j.referenceType !== 'MANUAL' || !j.account) return false;
                         const kasKecilCoa = useAppStore.getState().coaList.find(c => c.name.toLowerCase().includes('kas kecil') || c.code === '1102') || useAppStore.getState().coaList.find(c => c.code === '1101');
                         const kasAccount = kasKecilCoa ? kasKecilCoa.code : '1101';
                         const entryAccCode = j.account?.includes(' - ') ? j.account.split(' - ')[0].trim() : j.account?.trim();
                         if (entryAccCode !== kasAccount) return false;
                         return j.date >= pettyCashStartDate && j.date <= pettyCashEndDate + 'T23:59:59';
                       })
                       .map(j => ({ id: j.id, description: `[Jurnal Umum] ${j.description}`, date: j.date, amount: (j.credit || 0) - (j.debit || 0) } as any));
                     const allData = [...baseExpenses, ...manualJournals].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                     const totalIn = allData.reduce((s, e) => e.amount < 0 ? s + Math.abs(e.amount) : s, 0);
                     const totalOut = allData.reduce((s, e) => e.amount > 0 ? s + e.amount : s, 0);
                     const coaList = useAppStore.getState().coaList || [];
                     const rows = allData.map(exp => {
                       const dateOnly = String(exp.date).split('T')[0];
                       const desc = (exp.description || '').toLowerCase();
                       const isIncome = exp.amount < 0;
                       let warning = '';
                       if (!isIncome && (desc.includes('kembalian') || desc.includes('bayar belanja') || desc.includes(' sw ') || desc.includes('simpanan') || desc.includes('angsuran') || desc.includes('ipl') || desc.includes('jasa tf') || desc.includes('hasil jual') || desc.includes('bayar pulsa') || desc.includes('sw '))) {
                         warning = '⚠️ DICEK: kemungkinan harusnya PEMASUKAN';
                       }
                       if (isIncome && (desc.includes('honor') || (desc.includes('belanja') && !desc.includes('bayar belanja')) || desc.includes('bensin') || desc.includes('talang') || desc.includes('tunjangan'))) {
                         warning = '⚠️ DICEK: kemungkinan harusnya PENGELUARAN';
                       }
                       const kasCode = (exp.kasAccountId && exp.kasAccountId !== '1101') ? exp.kasAccountId : '1102';
                       let coaCode = exp.coaId;
                       if (!coaCode || coaCode === '5400') {
                         if (desc.includes('honor') || desc.includes('gaji') || desc.includes('tunjangan') || desc.includes('bonus')) coaCode = '5101';
                         else if (desc.includes('belanja') || desc.includes('stok') || desc.includes('kulakan') || desc.includes('telur') || desc.includes('roti') || desc.includes('sosis') || desc.includes('minuman') || desc.includes('indomaret') || desc.includes('alfagift')) coaCode = '1110';
                         else if (desc.includes('ipl')) coaCode = '2106';
                         else if (desc.includes('simpanan')) coaCode = '3103';
                         else if (desc.includes('talangan') || desc.includes('cod')) coaCode = '1107';
                         else if (desc.includes('tarik tunai') || desc.includes('jasa tf') || desc.includes('transfer')) coaCode = '1103';
                         else coaCode = '5400';
                       }
                       const kasObj = coaList.find(c => c.code === kasCode);
                       const coaObj = coaList.find(c => c.code === coaCode);
                       return {
                         'Tanggal': dateOnly,
                         'Keterangan': exp.description,
                         'Akun Kas (Sumber/Tujuan)': kasObj ? `${kasObj.code} - ${kasObj.name}` : kasCode,
                         'Jurnal Lawan': coaObj ? `${coaObj.code} - ${coaObj.name}` : coaCode,
                         'Jenis': isIncome ? 'Pemasukan' : 'Pengeluaran',
                         'Nominal (Rp)': Math.abs(exp.amount),
                         'Keterangan Jenis': isIncome ? `+${Math.abs(exp.amount).toLocaleString('id-ID')}` : `-${Math.abs(exp.amount).toLocaleString('id-ID')}`,
                         'Perlu Koreksi?': warning
                       };
                     });
                     rows.push({ 'Tanggal': '', 'Keterangan': 'TOTAL PEMASUKAN', 'Akun Kas (Sumber/Tujuan)': '', 'Jurnal Lawan': '', 'Jenis': '', 'Nominal (Rp)': totalIn, 'Keterangan Jenis': `+${totalIn.toLocaleString('id-ID')}`, 'Perlu Koreksi?': '' } as any);
                     rows.push({ 'Tanggal': '', 'Keterangan': 'TOTAL PENGELUARAN', 'Akun Kas (Sumber/Tujuan)': '', 'Jurnal Lawan': '', 'Jenis': '', 'Nominal (Rp)': totalOut, 'Keterangan Jenis': `-${totalOut.toLocaleString('id-ID')}`, 'Perlu Koreksi?': '' } as any);
                     rows.push({ 'Tanggal': '', 'Keterangan': 'SELISIH (Net)', 'Akun Kas (Sumber/Tujuan)': '', 'Jurnal Lawan': '', 'Jenis': '', 'Nominal (Rp)': totalIn - totalOut, 'Keterangan Jenis': `${(totalIn - totalOut) >= 0 ? '+' : ''}${(totalIn - totalOut).toLocaleString('id-ID')}`, 'Perlu Koreksi?': '' } as any);
                     const ws = XLSX.utils.json_to_sheet(rows);
                     ws['!cols'] = [{ wch: 14 }, { wch: 50 }, { wch: 25 }, { wch: 30 }, { wch: 14 }, { wch: 16 }, { wch: 20 }, { wch: 50 }];
                     const wb = XLSX.utils.book_new();
                     XLSX.utils.book_append_sheet(wb, ws, 'Riwayat Kas Kecil');
                     XLSX.writeFile(wb, `Riwayat_KasKecil_${pettyCashStartDate}_sd_${pettyCashEndDate}.xlsx`);
                   }}
                   className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                   title="Unduh Riwayat Kas Kecil sebagai Excel"
                 >
                   <Download className="w-3.5 h-3.5" />
                   Unduh Excel
                 </button>
               </div>
             </div>
             <div className="p-2 space-y-1 max-h-60 overflow-y-auto overflow-x-auto">
                {(() => {
                  const baseExpenses = (expenses || []).filter(exp => 
                    exp.category === 'OPERASIONAL' &&
                    exp.date >= pettyCashStartDate && exp.date <= pettyCashEndDate + 'T23:59:59'
                  );
                  
                  const manualJournals = (journalEntries || [])
                    .filter(j => {
                      if (j.referenceType !== 'MANUAL' || !j.account) return false;
                      const kasKecilCoa = useAppStore.getState().coaList.find(c => c.name.toLowerCase().includes('kas kecil') || c.code === '1102') || useAppStore.getState().coaList.find(c => c.code === '1101');
                      const kasAccount = kasKecilCoa ? kasKecilCoa.code : '1101';
                      const entryAccCode = j.account?.includes(' - ') ? j.account.split(' - ')[0].trim() : j.account?.trim();
                      if (entryAccCode !== kasAccount) return false;
                      return j.date >= pettyCashStartDate && j.date <= pettyCashEndDate + 'T23:59:59';
                    })
                    .map(j => ({
                      id: j.id,
                      description: `[Jurnal Umum] ${j.description}`,
                      date: j.date,
                      amount: (j.credit || 0) - (j.debit || 0),
                      isManual: true,
                      createdBy: j.createdBy
                    } as any));

                  const filteredPettyCash = [...baseExpenses, ...manualJournals]
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                  const totalIn = filteredPettyCash.reduce((sum, exp) => exp.amount < 0 ? sum + Math.abs(exp.amount) : sum, 0);
                  const totalOut = filteredPettyCash.reduce((sum, exp) => exp.amount > 0 ? sum + exp.amount : sum, 0);

                  const displayedPettyCash = filteredPettyCash.filter(exp => {
                    if (pettyCashFilter === 'IN' && exp.amount > 0) return false;
                    if (pettyCashFilter === 'OUT' && exp.amount < 0) return false;
                    if (pettyCashSearch && !exp.description.toLowerCase().includes(pettyCashSearch.toLowerCase())) return false;
                    return true;
                  });

                  return (
                    <div className="flex flex-col h-full">
                      <div className="mb-2 px-1">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Cari transaksi..."
                            value={pettyCashSearch}
                            onChange={(e) => setPettyCashSearch(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none dark:bg-slate-800"
                          />
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                        </div>
                      </div>
                      <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 mb-2">
                        <button onClick={() => setPettyCashFilter('ALL')} className={`flex-1 text-[10px] font-bold py-1.5 rounded-md transition-colors ${pettyCashFilter === 'ALL' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>Semua</button>
                        <button onClick={() => setPettyCashFilter('IN')} className={`flex-1 text-[10px] font-bold py-1.5 rounded-md transition-colors ${pettyCashFilter === 'IN' ? 'bg-white dark:bg-slate-700 shadow-sm text-green-600' : 'text-slate-500 hover:text-green-600'}`}>Pemasukan</button>
                        <button onClick={() => setPettyCashFilter('OUT')} className={`flex-1 text-[10px] font-bold py-1.5 rounded-md transition-colors ${pettyCashFilter === 'OUT' ? 'bg-white dark:bg-slate-700 shadow-sm text-rose-600' : 'text-slate-500 hover:text-rose-600'}`}>Pengeluaran</button>
                      </div>

                      <div className="space-y-1 overflow-y-auto max-h-60 mb-2">
                        {displayedPettyCash.length === 0 ? (
                          <p className="text-xs text-slate-400 text-center py-4 italic">Belum ada transaksi.</p>
                        ) : (
                          displayedPettyCash.map(exp => (
                            <div key={exp.id} className="min-w-[320px] flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:bg-slate-800 rounded text-xs transition-colors border-b border-slate-100 dark:border-slate-700/50">
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-700 dark:text-slate-300">{exp.description}</span>
                                <span className="text-[9px] text-slate-400">
                                  {(() => {
                                    const d = new Date(exp.date);
                                    const t = d.toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' });
                                    const dateStr = d.toLocaleDateString("id-ID", { year: 'numeric', month: 'numeric', day: 'numeric' });
                                    return (t === '07.00' || t === '07:00') ? dateStr : `${dateStr}, ${t}`;
                                  })()}
                                </span>
                              </div>
                              <div className="flex items-center space-x-3">
                                <span className={`font-bold whitespace-nowrap ${exp.amount < 0 ? "text-green-600" : "text-rose-600"}`}>
                                  {exp.amount < 0 ? "+" : "-"} Rp {Math.abs(exp.amount).toLocaleString("id-ID")}
                                </span>
                                <button 
                                  onClick={() => {
                                    if ((exp as any).isManual) {
                                      alert("Transaksi ini diinput manual dari Jurnal Umum. Harap hapus/edit melalui menu Jurnal Umum.");
                                      return;
                                    }
                                    setEditExpenseModal({
                                      isOpen: true,
                                      id: exp.id,
                                      amount: Math.abs(exp.amount).toString(),
                                      desc: exp.description.replace('Kas Kecil: ', ''),
                                      coaAccount: exp.coaId || '',
                                      kasAccount: exp.kasAccountId || '',
                                      type: exp.amount < 0 ? 'PEMASUKAN' : 'PENGELUARAN'
                                    });
                                  }}
                                  className="text-gray-400 hover:text-blue-500 transition-colors p-1"
                                  title="Edit riwayat kas"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
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
                        )}
                      </div>

                      <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg flex justify-between items-center text-xs mt-auto">
                        <div className="flex flex-col">
                          <span className="text-[9px] text-slate-500 font-bold uppercase">Tot Pemasukan</span>
                          <span className="text-green-600 font-black">+ Rp {totalIn.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex flex-col text-right">
                          <span className="text-[9px] text-slate-500 font-bold uppercase">Tot Pengeluaran</span>
                          <span className="text-rose-600 font-black">- Rp {totalOut.toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                    </div>
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
            {myExpenses.length === 0 && manualJournalsToday.length === 0 ? <p>- Nihil -</p> : (
              <>
                {myExpenses.map(exp => (
                  <div key={exp.id} className="flex justify-between pl-2">
                    <span>{exp.description.replace('Kas Kecil: ', '').replace('Pemasukan Kas: ', '[+] ')}</span>
                    <span>{exp.amount < 0 ? '+' : '-'} Rp {Math.abs(exp.amount).toLocaleString('id-ID')}</span>
                  </div>
                ))}
                {manualJournalsToday.map(j => {
                  const amt = (j.credit || 0) - (j.debit || 0);
                  return (
                    <div key={j.id} className="flex justify-between pl-2">
                      <span>[Jurnal] {j.description}</span>
                      <span>{amt < 0 ? '+' : '-'} Rp {Math.abs(amt).toLocaleString('id-ID')}</span>
                    </div>
                  );
                })}
              </>
            )}
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
            <div className="flex justify-between">
              <span>FISIK TUNAI DI LACI:</span>
              <span>Rp {Number(actualCash).toLocaleString('id-ID')}</span>
            </div>
            <div className={`flex justify-between ${(Number(actualCash) - expectedCash) < 0 ? 'text-rose-600' : ''}`}>
              <span>SELISIH:</span>
              <span>Rp {(Number(actualCash) - expectedCash).toLocaleString('id-ID')}</span>
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
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg flex items-center gap-2"><Edit2 className="w-5 h-5 text-teal-600"/>Pengajuan Izin / Lupa Absen</h3>
              <button onClick={() => setCorrectionModal({open: false, attendanceId: null})} className="p-1 hover:bg-slate-100 dark:bg-slate-800 rounded-lg"><X className="w-5 h-5 text-slate-500 dark:text-slate-400"/></button>
            </div>
            
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-4">
              <button 
                onClick={() => setModalTab('IZIN')}
                className={`flex-1 text-sm font-bold py-2 rounded-lg transition-all ${modalTab === 'IZIN' ? 'bg-white dark:bg-slate-700 shadow-sm text-teal-600' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
              >
                Izin / Cuti
              </button>
              <button 
                onClick={() => setModalTab('LUPA_ABSEN')}
                className={`flex-1 text-sm font-bold py-2 rounded-lg transition-all ${modalTab === 'LUPA_ABSEN' ? 'bg-white dark:bg-slate-700 shadow-sm text-teal-600' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
              >
                Lupa Absen
              </button>
            </div>

            <div className="space-y-4">
              {modalTab === 'IZIN' ? (
                <>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Mulai Tanggal *</label>
                      <input type="date" value={izinStartDate} onChange={e => setIzinStartDate(e.target.value)} className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none"/>
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Sampai Tanggal *</label>
                      <input type="date" value={izinEndDate} onChange={e => setIzinEndDate(e.target.value)} className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none"/>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Jenis Izin *</label>
                    <select value={izinType} onChange={e => setIzinType(e.target.value as any)} className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none">
                      <option value="IZIN">Izin Kepentingan Lain</option>
                      <option value="SAKIT">Sakit</option>
                      <option value="CUTI_TAHUNAN">Cuti Tahunan</option>
                      <option value="CUTI">Cuti</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Alasan *</label>
                    <textarea value={corrReason} onChange={e => setCorrReason(e.target.value)} placeholder="Tuliskan keterangan detail..." className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none h-20"></textarea>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Bagian yang Perlu Dikoreksi *</label>
                    <select value={corrType} onChange={e => setCorrType(e.target.value as any)} className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none">
                      <option value="CLOCK_IN">Jam Masuk</option>
                      <option value="CLOCK_OUT">Jam Keluar</option>
                      <option value="BOTH">Keduanya</option>
                    </select>
                  </div>
                  {(corrType === 'CLOCK_IN' || corrType === 'BOTH') && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Jam Masuk yang Seharusnya *</label>
                      <input type="datetime-local" value={corrReqClockIn} onChange={e => setCorrReqClockIn(e.target.value)} className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none"/>
                    </div>
                  )}
                  {(corrType === 'CLOCK_OUT' || corrType === 'BOTH') && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Jam Keluar yang Seharusnya *</label>
                      <input type="datetime-local" value={corrReqClockOut} onChange={e => setCorrReqClockOut(e.target.value)} className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none"/>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Alasan Permohonan Koreksi *</label>
                    <textarea value={corrReason} onChange={e => setCorrReason(e.target.value)} placeholder="Jelaskan alasan koreksi absen Anda..." className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none h-20"></textarea>
                  </div>
                </>
              )}
              
              <div className="flex gap-3 pt-2">
                <button onClick={() => setCorrectionModal({open: false, attendanceId: null})} className="flex-1 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-400 font-bold text-sm hover:bg-slate-50 dark:bg-slate-800">Batal</button>
                <button
                  disabled={!corrReason || (modalTab === 'LUPA_ABSEN' && (((corrType === 'CLOCK_IN' || corrType === 'BOTH') && !corrReqClockIn) || ((corrType === 'CLOCK_OUT' || corrType === 'BOTH') && !corrReqClockOut)))}
                  onClick={() => {
                    if (modalTab === 'IZIN') {
                      if (currentUser) {
                        const start = new Date(izinStartDate);
                        const end = new Date(izinEndDate);
                        const newLeaves = [];
                        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                          const dateStr = d.toISOString().split('T')[0];
                          const newAtt = {
                            id: Date.now().toString() + '-' + dateStr,
                            userId: currentUser.username,
                            userName: currentUser.name,
                            date: dateStr,
                            clockIn: d.toISOString(),
                            photoUrl: '',
                            latitude: 0,
                            longitude: 0,
                            status: izinType,
                            correctionStatus: 'PENDING',
                            correctionReason: corrReason,
                            correctionType: 'LEAVE',
                            leaveType: izinType
                          };
                          newLeaves.push(newAtt);
                        }
                        useAppStore.setState(state => ({
                          attendances: [...state.attendances, ...newLeaves as any]
                        }));
                        useAppStore.getState().addLog('ATTENDANCE', 'SYSTEM', `Pengajuan Izin/Cuti diajukan dari ${izinStartDate} s/d ${izinEndDate}`);
                      }
                    } else {
                      let attId = correctionModal.attendanceId;
                      if (!attId && currentUser) {
                        // Buat record absen dummy untuk hari ini karena lupa absen
                        attId = Date.now().toString();
                        const todayLocal = getLocalTodayDate();
                        const newAtt = {
                          id: attId,
                          userId: currentUser.username,
                          userName: currentUser.name,
                          date: todayLocal,
                          clockIn: new Date().toISOString(),
                          photoUrl: '',
                          latitude: 0,
                          longitude: 0,
                          status: 'PRESENT',
                          correctionStatus: 'PENDING',
                          correctionReason: corrReason,
                          correctionType: corrType,
                          requestedClockIn: corrReqClockIn ? new Date(corrReqClockIn).toISOString() : undefined,
                          requestedClockOut: corrReqClockOut ? new Date(corrReqClockOut).toISOString() : undefined
                        };
                        
                        useAppStore.setState(state => ({
                          attendances: [...state.attendances, newAtt as any]
                        }));
                        useAppStore.getState().addLog('ATTENDANCE', 'SYSTEM', `Permohonan lupa absen diajukan untuk ID baru: ${attId}`);
                      } else if (attId) {
                        requestAttendanceCorrection(
                          attId,
                          corrType,
                          corrReason,
                          corrReqClockIn ? new Date(corrReqClockIn).toISOString() : undefined,
                          corrReqClockOut ? new Date(corrReqClockOut).toISOString() : undefined
                        );
                      }
                    }
                    
                    setCorrectionModal({open: false, attendanceId: null});
                    setCorrReason('');
                    alert('Pengajuan berhasil dikirim. Mohon tunggu persetujuan Admin/Owner.');
                  }}
                  className="flex-1 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Kirim Pengajuan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editExpenseModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 shadow-xl border border-gray-100 dark:border-slate-800">
            <h3 className="text-lg font-bold text-gray-800 dark:text-slate-200 mb-4 flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-blue-600" />
              Edit Kas Kecil
            </h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              let finalCoa = editExpenseModal.coaAccount ? editExpenseModal.coaAccount.split(' - ')[0].trim() : undefined;
              const descLower = editExpenseModal.desc.toLowerCase();
              if (!finalCoa && editExpenseModal.type === 'PENGELUARAN' && (descLower.includes('stok') || descLower.includes('barang') || descLower.includes('kulakan') || descLower.includes('persediaan') || descLower.includes('belanja'))) {
                const persediaanCoa = useAppStore.getState().coaList?.find((c: any) => c.name.toLowerCase().includes('persediaan'));
                if (persediaanCoa) {
                  finalCoa = persediaanCoa.code;
                }
              }
              const amountNum = Number(editExpenseModal.amount);
              const finalAmount = editExpenseModal.type === 'PEMASUKAN' ? -Math.abs(amountNum) : Math.abs(amountNum);
              updateExpense(editExpenseModal.id, {
                amount: finalAmount,
                description: `Kas Kecil: ${editExpenseModal.desc}`,
                coaId: finalCoa,
                kasAccountId: '1102'
              });
              setEditExpenseModal({ isOpen: false, id: '', amount: '', desc: '', coaAccount: '', kasAccount: '', type: 'PENGELUARAN' });
            }} className="space-y-4">
              <div className="flex gap-2 mb-2">
                <button type="button" onClick={() => setEditExpenseModal({ ...editExpenseModal, type: 'PENGELUARAN' })} className={`flex-1 py-2 rounded-lg font-bold text-xs transition-colors ${editExpenseModal.type === 'PENGELUARAN' ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-600 hover:bg-rose-200'}`}>Pengeluaran</button>
                <button type="button" onClick={() => setEditExpenseModal({ ...editExpenseModal, type: 'PEMASUKAN' })} className={`flex-1 py-2 rounded-lg font-bold text-xs transition-colors ${editExpenseModal.type === 'PEMASUKAN' ? 'bg-green-500 text-white' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>Pemasukan</button>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700">Nominal Rp</label>
                <input type="number" required value={editExpenseModal.amount} onChange={(e) => setEditExpenseModal({ ...editExpenseModal, amount: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700">Keterangan</label>
                <input type="text" required value={editExpenseModal.desc} onChange={(e) => setEditExpenseModal({ ...editExpenseModal, desc: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs font-bold text-gray-700">Akun Kas</label>
                  <input type="text" readOnly value="1102 - Kas Kecil" className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-100 font-bold text-gray-700 cursor-not-allowed" />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-bold text-gray-700">Jurnal Lawan *</label>
                  <input list="coa-options" required value={editExpenseModal.coaAccount} onChange={(e) => setEditExpenseModal({ ...editExpenseModal, coaAccount: e.target.value })} placeholder="Wajib pilih..." className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setEditExpenseModal({ ...editExpenseModal, isOpen: false })} className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-lg font-bold text-sm">Batal</button>
                <button type="submit" className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold text-sm">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {payoffModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 shadow-xl border border-gray-100 dark:border-slate-800">
            <h3 className="text-lg font-bold text-gray-800 dark:text-slate-200 mb-4 flex items-center gap-2">
              <Banknote className="w-5 h-5 text-blue-600" />
              Lunasi Kasbon Pelanggan
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Nama Pelanggan</label>
                <div className="font-bold text-gray-800 dark:text-slate-200">{payoffModal.customerName}</div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Total Piutang (Kasbon)</label>
                <div className="font-bold text-red-600 text-lg">Rp {payoffModal.debtAmount.toLocaleString('id-ID')}</div>
              </div>

              {/* Invoice Selection */}
              {(() => {
                const debitsRaw = transactions
                  .filter(t => t.customerId === payoffModal.customerId && t.paymentMethod === 'KASBON' && !t.isVoided)
                  .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

                const explicitPaidInvoiceNos = new Set<string>();
                kasbonPayments.forEach(p => {
                  if (p.customerId === payoffModal.customerId && p.targetInvoiceNos) {
                    p.targetInvoiceNos.forEach(id => explicitPaidInvoiceNos.add(id));
                  }
                });

                let totalDebits = 0;
                let explicitPaidAmount = 0;
                debitsRaw.forEach(tx => {
                   totalDebits += tx.totalAmount;
                   if (explicitPaidInvoiceNos.has(tx.invoiceNo)) {
                      explicitPaidAmount += tx.totalAmount;
                   }
                });

                let totalPaid = totalDebits - (payoffModal.debtAmount || 0);
                let unallocatedPayment = totalPaid - explicitPaidAmount;

                let unpaidInvoices = debitsRaw.filter(tx => !explicitPaidInvoiceNos.has(tx.invoiceNo));
                
                if (unallocatedPayment > 0) {
                   unpaidInvoices = unpaidInvoices.filter(tx => {
                       if (unallocatedPayment >= tx.totalAmount - 0.01) {
                           unallocatedPayment -= tx.totalAmount;
                           return false;
                       } else {
                           unallocatedPayment -= tx.totalAmount;
                           if (unallocatedPayment >= -0.01) return false;
                       }
                       return true;
                   });
                }
                
                if ((payoffModal.debtAmount || 0) <= 0) unpaidInvoices = [];
                unpaidInvoices.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

                if (unpaidInvoices.length === 0) return null;

                return (
                  <div className="border border-gray-200 dark:border-slate-700 rounded-xl p-3 bg-gray-50 dark:bg-slate-800 max-h-48 overflow-y-auto">
                    <div className="mb-2">
                      <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-0.5">Pilih Struk Kasbon yang Dilunasi (Opsional)</label>
                    </div>
                    <div className="space-y-2">
                      {unpaidInvoices.map(inv => (
                        <label key={inv.id} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
                          <input 
                            type="checkbox" 
                            className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                            checked={payoffModal.selectedInvoices.includes(inv.invoiceNo)}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              const amount = inv.totalAmount;
                              setPayoffModal(prev => {
                                let newSelected = [...prev.selectedInvoices];
                                let newPayAmount = prev.payAmount;

                                if (checked) {
                                  newSelected.push(inv.invoiceNo);
                                  newPayAmount += amount;
                                } else {
                                  newSelected = newSelected.filter(id => id !== inv.invoiceNo);
                                  newPayAmount -= amount;
                                }
                                
                                if (newPayAmount > prev.debtAmount) newPayAmount = prev.debtAmount;

                                return { ...prev, selectedInvoices: newSelected, payAmount: newPayAmount };
                              });
                            }}
                          />
                          <div className="flex-1">
                            <div className="text-xs font-bold text-gray-800 dark:text-slate-200">{inv.invoiceNo}</div>
                            <div className="text-[10px] text-gray-500">{new Date(inv.timestamp).toLocaleDateString('id-ID')}</div>
                          </div>
                          <div className="text-sm font-bold text-red-600">Rp {inv.totalAmount.toLocaleString('id-ID')}</div>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-gray-700 dark:text-slate-300 mb-1 uppercase">Akun Kas Penerima (Debit)</label>
                  <input
                    list="debit-options"
                    value={payoffModal.debitAccountId || ''}
                    onChange={(e) => setPayoffModal({ ...payoffModal, debitAccountId: e.target.value })}
                    placeholder="Pilih Akun Kas/Bank"
                    className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <datalist id="debit-options">
                    {coaList?.filter((c: any) => c.isActive && c.name.toLowerCase().includes('kas') || c.name.toLowerCase().includes('bank')).map((c: any) => (
                      <option key={c.id} value={`${c.code} - ${c.name}`} />
                    ))}
                  </datalist>
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-gray-700 dark:text-slate-300 mb-1 uppercase">Akun Piutang Kasbon (Kredit)</label>
                  <input
                    list="credit-options"
                    value={payoffModal.creditAccountId || ''}
                    onChange={(e) => setPayoffModal({ ...payoffModal, creditAccountId: e.target.value })}
                    placeholder="Pilih Akun Piutang"
                    className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <datalist id="credit-options">
                    {coaList?.filter((c: any) => c.isActive && c.name.toLowerCase().includes('piutang')).map((c: any) => (
                      <option key={c.id} value={`${c.code} - ${c.name}`} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">Nominal Pelunasan</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">Rp</span>
                  <input
                    type="number"
                    min="1"
                    max={payoffModal.debtAmount}
                    value={payoffModal.payAmount || ''}
                    onChange={(e) => setPayoffModal({ ...payoffModal, payAmount: Number(e.target.value) })}
                    className="w-full p-3 pl-10 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 text-xl font-bold text-gray-800 dark:text-slate-200"
                  />
                </div>
                {payoffModal.payAmount > 0 && (
                  <div className="mt-2 text-sm">
                    Sisa Kasbon setelah pelunasan: <span className="font-bold text-green-600">Rp {(payoffModal.debtAmount - payoffModal.payAmount).toLocaleString('id-ID')}</span>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">Catatan Tambahan (Opsional)</label>
                <input
                  type="text"
                  value={payoffModal.notes || ''}
                  onChange={(e) => setPayoffModal({ ...payoffModal, notes: e.target.value })}
                  placeholder="Misal: Diwakilkan istri"
                  className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setPayoffModal({ isOpen: false, customerId: '', customerName: '', debtAmount: 0, payAmount: 0, paymentMethod: 'CASH', selectedInvoices: [], debitAccountId: '', creditAccountId: '' })}
                  className="flex-1 py-3 px-4 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    const { customerId, customerName, debtAmount, payAmount, paymentMethod } = payoffModal;
                    if (payAmount <= 0) return;
                    if (payAmount > debtAmount) {
                      alert('Nominal pelunasan tidak boleh lebih besar dari total piutang!');
                      return;
                    }

                    const newDebt = debtAmount - payAmount;
                    updateCustomer(customerId, { debtAmount: newDebt });

                    const getAccountForMethod = (method: string) => {
                      if (method === 'QRIS_SHARIAH') return '1-1020';
                      if (method === 'TRANSFER_BSI') return '1103';
                      return '1101';
                    };

                    let targetAccount = getAccountForMethod(paymentMethod);
                    if (payoffModal.debitAccountId) {
                      targetAccount = payoffModal.debitAccountId.split(' - ')[0].trim();
                    }

                    let targetCreditAccount = '1030';
                    if (payoffModal.creditAccountId) {
                      targetCreditAccount = payoffModal.creditAccountId.split(' - ')[0].trim();
                    }

                    const dateStr = new Date().toISOString();
                    const tenantIdStr = currentUser?.tenantId || 'tenant_default';

                    addJournalEntries([
                      {
                        tenantId: tenantIdStr,
                        date: dateStr,
                        account: targetAccount,
                        description: `[Auto] Pelunasan piutang (kasbon) dari pelanggan: ${customerName} via ${paymentMethod}${payoffModal.notes ? ' - ' + payoffModal.notes : ''}`,
                        debit: payAmount,
                        credit: 0,
                        referenceId: customerId,
                        referenceType: 'MANUAL',
                        createdBy: currentUser?.name || 'System',
                        branchId: currentUser?.branchId
                      },
                      {
                        tenantId: tenantIdStr,
                        date: dateStr,
                        account: targetCreditAccount, 
                        description: `[Auto] Pengurangan piutang pelanggan: ${customerName}${payoffModal.notes ? ' - ' + payoffModal.notes : ''}`,
                        debit: 0,
                        credit: payAmount,
                        referenceId: customerId,
                        referenceType: 'MANUAL',
                        createdBy: currentUser?.name || 'System',
                        branchId: currentUser?.branchId
                      }
                    ]);

                    const newPaymentRecord = {
                      tenantId: tenantIdStr,
                      customerId,
                      customerName,
                      amountPaid: payAmount,
                      remainingDebt: newDebt,
                      paymentMethod,
                      cashierName: currentUser?.name || 'Kasir',
                      isFullyPaid: newDebt <= 0,
                      notes: payoffModal.notes,
                      targetInvoiceNos: payoffModal.selectedInvoices
                    };
                    addKasbonPayment(newPaymentRecord);
                    setPayoffModal({ isOpen: false, customerId: '', customerName: '', debtAmount: 0, payAmount: 0, paymentMethod: 'CASH', selectedInvoices: [], debitAccountId: '', creditAccountId: '' });
                    setReceiptModal({ isOpen: true, record: { ...newPaymentRecord, id: `kp_${Date.now()}`, paymentDate: dateStr } });
                  }}
                  disabled={payoffModal.payAmount <= 0}
                  className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Proses Pelunasan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {receiptModal.isOpen && receiptModal.record && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            <div className="p-4 bg-green-50 border-b border-green-100 flex justify-between items-center no-print">
              <h3 className="font-extrabold text-green-800 text-sm flex items-center gap-2">
                <Printer className="w-5 h-5" /> Cetak Struk
              </h3>
              <button onClick={() => setReceiptModal({ isOpen: false, record: null })} className="text-gray-500 hover:text-gray-700">Tutup</button>
            </div>
            
            <div className="p-6 bg-white flex-1 overflow-y-auto text-sm text-gray-800 dark:text-gray-800 print-area relative" id="print-area">
              <div className="text-center mb-6">
                <h2 className="font-extrabold text-xl">{settings.storeName || 'KSA Mart'}</h2>
                <p className="text-xs text-gray-500">{settings.storeAddress || ''}</p>
                <p className="text-xs text-gray-500">Telp: {settings.storePhone || ''}</p>
              </div>

              <div className="border-t border-b border-dashed border-gray-300 py-3 mb-4 text-center">
                <p className="font-bold uppercase tracking-widest">{receiptModal.record.isFullyPaid ? 'BUKTI KASBON LUNAS' : 'BUKTI PEMBAYARAN KASBON'}</p>
              </div>

              <div className="space-y-1 mb-4 text-xs">
                <p><span className="text-slate-400">Tanggal:</span> {new Date(receiptModal.record.paymentDate).toLocaleString('id-ID')}</p>
                <p><span className="text-slate-400">Pelanggan:</span> {receiptModal.record.customerName}</p>
                <p><span className="text-slate-400">Kasir:</span> {receiptModal.record.cashierName}</p>
                <p><span className="text-slate-400">Metode:</span> {receiptModal.record.paymentMethod}</p>
              </div>

              <div className="border-t border-dashed border-gray-300 py-3 mb-4 space-y-2 text-right">
                <div className="flex justify-between font-bold text-sm">
                  <span>Nominal Bayar:</span>
                  <span>Rp {receiptModal.record.amountPaid.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-xs text-amber-700 font-bold border-t border-gray-200 pt-2">
                  <span>Sisa Kasbon:</span>
                  <span>Rp {receiptModal.record.remainingDebt.toLocaleString('id-ID')}</span>
                </div>
              </div>

              {receiptModal.record.isFullyPaid && (
                <div className="border-t border-green-900/20 pt-3 text-center text-green-800 bg-green-50 p-2.5 rounded-lg border border-green-100 mt-4">
                  <p className="font-extrabold uppercase tracking-widest text-lg">LUNAS</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800 flex flex-col gap-2 no-print">
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-2 bg-green-700 hover:bg-green-800 text-white font-bold text-xs rounded-lg text-center shadow-xs flex items-center justify-center gap-1"
                >
                  <Printer className="w-4 h-4" /> Cetak Biasa
                </button>
                <button
                  onClick={handleBluetoothPrint}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg text-center shadow-xs flex items-center justify-center gap-1"
                >
                  <Bluetooth className="w-4 h-4" /> Print Bluetooth
                </button>
              </div>
              <div className="mt-2 border-t border-gray-200 dark:border-slate-700 pt-3">
                <p className="text-xs font-bold text-gray-600 dark:text-slate-400 mb-2 flex items-center gap-1">
                  <MessageCircle className="w-4 h-4" /> Kirim Struk via WhatsApp
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={waNumber}
                    onChange={(e) => setWaNumber(e.target.value)}
                    placeholder="No WA (misal: 0812...)"
                    className="flex-1 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-green-500"
                  />
                  <button
                    onClick={handleSendWA}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap"
                  >
                    Kirim WA
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
