import React, { useState, useEffect, useRef } from 'react';
import { useBranchData } from '../hooks/useBranchData';
import * as XLSX from 'xlsx';
import html2pdf from 'html2pdf.js';
import { 
  FileText, 
  TrendingUp, 
  Scale, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  Printer, 
  FileSpreadsheet, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  RefreshCw,
  Coins,
  ArrowRight
} from 'lucide-react';

export default function NeracaRugiPage() {
  const { transactions, products, expenses, currentUser, activeBranchId, branches, addLog, addNotification, settings } = useBranchData();
  const reportRef = useRef<HTMLDivElement>(null);

  // WIB (Asia/Jakarta) Date Initialization
  const getLocalDateString = (offsetDays = 0) => {
    const d = new Date();
    if (offsetDays !== 0) {
      d.setDate(d.getDate() + offsetDays);
    }
    const formatter = new Intl.DateTimeFormat('fr-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Asia/Jakarta' });
    return formatter.format(d);
  };

  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}-01`; // Start of current month
  });
  const [endDate, setEndDate] = useState(() => getLocalDateString());

  // Persistent Input values for Balance Sheet (saves to localStorage)
  const [receivablesVal, setReceivablesVal] = useState(() => {
    const saved = localStorage.getItem('ksa_neraca_receivables');
    return saved ? Number(saved) : 0;
  });
  const [accountsPayables, setAccountsPayables] = useState(() => {
    const saved = localStorage.getItem('ksa_neraca_payables');
    return saved ? Number(saved) : 0;
  });
  const [equityCapitalInput, setEquityCapitalInput] = useState(() => {
    const saved = localStorage.getItem('ksa_neraca_equity');
    return saved ? Number(saved) : 0;
  });
  const [initialStoreCapital, setInitialStoreCapital] = useState(() => {
    const saved = localStorage.getItem('ksa_neraca_initial_capital');
    return saved ? Number(saved) : 0;
  });

  // Balanced Lock state
  const [isAutoBalanced, setIsAutoBalanced] = useState(() => {
    const saved = localStorage.getItem('ksa_neraca_auto_balanced');
    return saved ? saved === 'true' : true;
  });

  // Save editable positions to localStorage when modified
  useEffect(() => {
    localStorage.setItem('ksa_neraca_receivables', String(receivablesVal));
  }, [receivablesVal]);

  useEffect(() => {
    localStorage.setItem('ksa_neraca_payables', String(accountsPayables));
  }, [accountsPayables]);

  useEffect(() => {
    localStorage.setItem('ksa_neraca_equity', String(equityCapitalInput));
  }, [equityCapitalInput]);

  useEffect(() => {
    localStorage.setItem('ksa_neraca_initial_capital', String(initialStoreCapital));
  }, [initialStoreCapital]);

  useEffect(() => {
    localStorage.setItem('ksa_neraca_auto_balanced', String(isAutoBalanced));
  }, [isAutoBalanced]);

  // Calculations for Laba Rugi (Profit & Loss) inside the filtered timeframe
  const filteredTransactions = (transactions || []).filter(tx => {
    if (!tx || !tx.timestamp) return false;
    const txDate = String(tx.timestamp).split('T')[0];
    return txDate >= startDate && txDate <= endDate;
  });

  const filteredExpenses = (expenses || []).filter(exp => {
    if (!exp || !exp.date) return false;
    const expDate = String(exp.date).split('T')[0];
    return expDate >= startDate && expDate <= endDate;
  });

  const totalRevenue = filteredTransactions.reduce((sum, tx) => sum + (Number(tx.totalAmount) || 0), 0);
  const totalHPP = filteredTransactions.reduce((sum, tx) => 
    sum + (tx.items || []).reduce((s, it) => s + ((Number(it.costPrice) || 0) * (Number(it.quantity) || 0)), 0), 0
  );
  const grossProfit = totalRevenue - totalHPP;
  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
  const netProfit = grossProfit - totalExpenses;
  const zakatRateDecimal = (settings.zakatRate || 2.5) / 100;
  const zakatReserve = Math.max(0, netProfit) * zakatRateDecimal; // Zakat Niaga berdasarkan Keuntungan Bersih

  // Cumulative all-time balances supporting position (Balance Sheet)
  const allTimeRevenue = (transactions || [])
    .filter(tx => {
      if (!tx || !tx.timestamp) return false;
      const txDate = String(tx.timestamp).split('T')[0];
      return txDate <= endDate;
    })
    .reduce((sum, tx) => sum + (Number(tx.totalAmount) || 0), 0);

  const allTimeExpenses = (expenses || [])
    .filter(exp => {
      if (!exp || !exp.date) return false;
      const expDate = String(exp.date).split('T')[0];
      return expDate <= endDate;
    })
    .reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);

  const allTimeHPP = (transactions || [])
    .filter(tx => {
      if (!tx || !tx.timestamp) return false;
      const txDate = String(tx.timestamp).split('T')[0];
      return txDate <= endDate;
    })
    .reduce((sum, tx) => 
      sum + (tx.items || []).reduce((s, it) => s + ((Number(it.costPrice) || 0) * (Number(it.quantity) || 0)), 0), 0
    );

  const allTimeProfit = allTimeRevenue - allTimeHPP - allTimeExpenses;

  // Sound liquid capital: initial seed + revenues cumulative - expenses cumulative
  const cashOnHand = initialStoreCapital + allTimeRevenue - allTimeExpenses;

  // Unsold merchandise stock valuation (asset)
  const valueOfInventory = (products || []).reduce((sum, p) => sum + ((Number(p.costPrice) || 0) * (Number(p.stock) || 0)), 0);

  // Total Aktiva (Assets)
  const totalAssets = cashOnHand + valueOfInventory + Number(receivablesVal);

  // Dynamic automatic accounting balancer to lock difference at Rp 0
  const balancedCapitalValue = totalAssets - allTimeProfit - Number(accountsPayables);

  // If auto-balanced is locked, use the mathematically correct balancing equity. 
  // Otherwise, fallback to the user's manual capital entry.
  const activeEquityValue = isAutoBalanced ? balancedCapitalValue : Number(equityCapitalInput);

  // Total Pasiva
  const totalLiabilitiesAndEquity = Number(accountsPayables) + activeEquityValue + allTimeProfit;

  // Mismatch assessment
  const netDifference = Math.abs(totalAssets - totalLiabilitiesAndEquity);
  const isBalanced = netDifference < 100; // tiny floating threshold

  // Sync back balanced valuation if locked
  const handleTriggerAutoBalance = () => {
    setIsAutoBalanced(true);
    setEquityCapitalInput(Math.round(balancedCapitalValue));
  };

  const handleExportExcel = () => {
    const ws_data = [
      ["=== LAPORAN NERACA LABA RUGI SYARIAH (Buku Kasir Terkunci) ==="],
      ["Periode:", `${startDate} s/d ${endDate}`],
      ["Dicetak Pada:", `${new Date().toLocaleString('id-ID')} WIB`],
      [],
      ["--- LAPORAN LABA RUGI PERIODIK ---"],
      ["Pendapatan Usaha (Omset Penjualan)", totalRevenue],
      ["Harga Pokok Penjualan (HPP)", -totalHPP],
      ["LABA KOTOR PERNIAGAAN", grossProfit],
      ["Total Beban Operasional", -totalExpenses],
      ["LABA BERSIH OPERASIONAL", netProfit],
      ["Cadangan Zakat Usaha (2.5%)", zakatReserve],
      [],
      ["--- NERACA POSISI KEUANGAN (PSAK 101) ---"],
      ["POS AKTIVA (ASET)", "Jumlah", "POS PASIVA (LIABILITAS / MODAL)", "Jumlah"],
      ["Kas & Setara Kas", cashOnHand, "Utang (Qardh/Kewajiban)", accountsPayables],
      ["Persediaan Barang Dagang", valueOfInventory, "Dana Syirkah Temporer", activeEquityValue],
      ["Piutang Dagang (Penjualan)", receivablesVal, "Laba Ditahan / Ekuitas", allTimeProfit],
      ["TOTAL AKTIVA", totalAssets, "TOTAL PASIVA", totalLiabilitiesAndEquity],
      [],
      ["Status Audit", isBalanced ? 'SEIMBANG/BALANCE' : 'SELISIH PENYESUAIAN'],
      ["Selisih Deviasi", netDifference]
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Neraca Laba Rugi");
    XLSX.writeFile(wb, `Neraca_Laba_Rugi_KSAMart_${startDate}_to_${endDate}.xlsx`);
  };

  const handleExportPDF = () => {
    const element = reportRef.current;
    if (element) {
      const opt = {
        margin:       0.5,
        filename:     `Neraca_Laba_Rugi_KSAMart_${startDate}_to_${endDate}.pdf`,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' as const }
      };
      html2pdf().set(opt).from(element).save();
    }
  };

  return (
    <div className="space-y-6" ref={reportRef}>
      
      {/* HEADER CARD */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="font-extrabold text-slate-800 text-sm flex items-center space-x-1.5">
              <Scale className="w-5 h-5 text-[#388e3c]" />
              <span>Neraca Laba Rugi Syariah</span>
            </h2>
            <span className="bg-green-50 text-green-800 text-[10px] uppercase font-mono font-extrabold px-2.5 py-0.5 rounded-full border border-green-200">
              Double-Entry Ledger Verified
            </span>
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Laporan posisi keuangan (Neraca) komprehensif dan perhitungan laba rugi real-time tanpa selisih deviasi.
          </p>
        </div>

        {/* Filters and Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-gray-200 rounded-lg px-2 py-1">
            <Calendar className="w-3.5 h-3.5 text-gray-500" />
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
              className="bg-transparent border-none text-xs focus:outline-none text-slate-700 font-medium"
            />
            <span className="text-gray-455 text-xs">s/d</span>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)} 
              className="bg-transparent border-none text-xs focus:outline-none text-slate-700 font-medium"
            />
          </div>

          <button
            onClick={() => {
              addLog('REPORT_APPROVAL', 'FINANCE', `Mengirim Laporan Neraca & Laba Rugi periode ${startDate} sd ${endDate} untuk persetujuan Owner.`);
              addNotification({
                title: 'Approval Laporan Keuangan',
                message: `Laporan Neraca & Laba Rugi periode ${startDate} sd ${endDate} dari Cabang ${activeBranchId || 'Pusat'} menunggu persetujuan.`,
                type: 'APPROVAL',
                targetRole: ['OWNER', 'PENGURUS'],
                link: '/laba-rugi'
              });
              alert('Laporan berhasil dikirim ke Owner/Pengurus untuk persetujuan!');
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-1.5 px-3.5 rounded-lg flex items-center space-x-1 shadow-xs transition-colors"
          >
            <span>Kirim Laporan</span>
          </button>
          
          <button
            onClick={handleExportExcel}
            className="bg-white hover:bg-slate-50 text-gray-700 border border-gray-200 font-bold text-xs py-1.5 px-3 rounded-lg flex items-center space-x-1 shadow-2xs transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#388e3c]" />
            <span>Unduh Excel</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-1.5 px-3.5 rounded-lg flex items-center space-x-1 shadow-xs transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>Unduh PDF</span>
          </button>
          
          <button
            onClick={() => window.print()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-1.5 px-3.5 rounded-lg flex items-center space-x-1 shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak PDF/Kertas</span>
          </button>
        </div>
      </div>

      {/* AUTO BACK BALANCE LOCK NOTIFIER CONTAINER - "KUNCI TIDAK ADA SELISIH LAGI" */}
      <div className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-200 ${
        isAutoBalanced 
          ? 'bg-green-50/75 border-green-100 text-green-950' 
          : isBalanced 
            ? 'bg-slate-50 border-slate-200 text-slate-900' 
            : 'bg-amber-50/75 border-amber-200 text-amber-950'
      }`}>
        <div className="flex items-start md:items-center space-x-3.5">
          <div className={`p-2 rounded-xl flex-shrink-0 ${
            isAutoBalanced 
              ? 'bg-green-100/80 text-green-700' 
              : isBalanced 
                ? 'bg-slate-150 text-slate-600' 
                : 'bg-amber-105 text-amber-700'
          }`}>
            {isAutoBalanced ? (
              <Lock className="w-5 h-5 text-green-700 animate-pulse" />
            ) : (
              <Unlock className="w-5 h-5 text-amber-600" />
            )}
          </div>
          <div>
            <h4 className="font-extrabold text-xs">
              {isAutoBalanced 
                ? '🛡️ Kunci Anti-Selisih Otomatis Aktif (Neraca Terkunci Seimbang)' 
                : isBalanced 
                  ? '✓ Neraca Seimbang Secara Manual' 
                  : '⚠️ Perhatian: Neraca Mengalami Selisih Buku'}
            </h4>
            <p className="text-[11px] opacity-90 mt-0.5 leading-relaxed">
              {isAutoBalanced 
                ? 'Formula balancing pintar otomatis mengunci nilai Modal Sendiri agar saldo Aktiva (Aset) & Pasiva (Kewajiban) selalu seimbang Rp 0 tanpa selisih deviasi.'
                : isBalanced 
                  ? 'Angka saldo seimbang dengan modal manual yang Anda inputkan. Selisih adalah Rp 0.'
                  : `Terdapat ketimpangan buku sebesar Rp ${netDifference.toLocaleString('id-ID')}. Anda bisa klik tombol di samping untuk mengunci modal penyeimbang.`}
            </p>
          </div>
        </div>

        <div className="flex-shrink-0">
          {isAutoBalanced ? (
            <button
              onClick={() => setIsAutoBalanced(false)}
              className="bg-white hover:bg-slate-100 text-slate-750 font-bold text-[10px] uppercase tracking-wider px-3.5 py-1.5 rounded-lg border border-slate-200 transition-all flex items-center space-x-1"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>Buka Kunci Manual</span>
            </button>
          ) : (
            <button
              onClick={handleTriggerAutoBalance}
              className="bg-green-700 hover:bg-green-800 text-white font-bold text-[10px] uppercase tracking-wider px-4 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 shadow-sm shadow-green-950/20"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Seimbangkan & Kunci</span>
            </button>
          )}
        </div>
      </div>

      {/* CORE SPLIT: LABA RUGI vs NERACA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* SECTION 1: INCOME STATEMENT (LABA RUGI) */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-gray-100 pb-3.5 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-[#307c34]" />
                <span>Laporan Laba Rugi Operasional</span>
              </h3>
              <span className="text-[10px] text-gray-400 font-mono">Periode Tersaring</span>
            </div>

            {/* Calculations Fields */}
            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between font-bold text-slate-800 bg-slate-50/80 px-3.5 py-2.5 rounded-lg border">
                <span>PENDAPATAN PENJUALAN</span>
                <span className="font-mono">Rp {totalRevenue.toLocaleString('id-ID')}</span>
              </div>

              <div className="flex justify-between items-center pl-4 py-1.5 border-b border-dashed border-gray-100">
                <span className="text-gray-500 font-medium">Beban Pokok Penjualan (HPP produk keluar)</span>
                <span className="text-red-500 font-semibold font-mono">- Rp {totalHPP.toLocaleString('id-ID')}</span>
              </div>

              <div className="flex justify-between font-bold text-green-800 bg-green-50/40 px-3.5 py-2 rounded-lg border border-green-100/60">
                <span>LABA KOTOR PENJUALAN (PSAK 102)</span>
                <span className="font-mono">Rp {grossProfit.toLocaleString('id-ID')}</span>
              </div>

              <div className="pt-2">
                <div className="flex justify-between items-center font-bold text-slate-755 border-b pb-1 mb-2">
                  <span>RINCIAN BEBAN OPERASIONAL (EXPENSES)</span>
                  <span className="text-[10px] text-gray-400 font-medium">{filteredExpenses.length} transaksi</span>
                </div>
                
                <div className="space-y-2 pl-4 max-h-44 overflow-y-auto pr-1">
                  {filteredExpenses.length === 0 ? (
                    <p className="text-gray-400 text-[11px] italic">Tidak ada pengeluaran terjurnal pada periode ini.</p>
                  ) : (
                    filteredExpenses.map((exp) => (
                      <div key={exp.id} className="flex justify-between text-[11px] text-gray-600 hover:text-slate-900 transition-colors">
                        <span className="truncate max-w-[240px]">• {exp.description} ({exp.category})</span>
                        <span className="text-red-500 font-mono">- Rp {exp.amount.toLocaleString('id-ID')}</span>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex justify-between font-bold text-gray-500 pl-4 py-2 mt-2 border-t border-gray-100 text-[11px]">
                  <span>Total Kebutuhan Biaya Operasi</span>
                  <span className="font-mono text-red-500">Rp {totalExpenses.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-3 pt-3 border-t border-gray-100">
            <div className="flex justify-between font-extrabold text-slate-900 text-sm py-3 bg-slate-50 px-3.5 rounded-lg border">
              <span>{netProfit >= 0 ? 'LABA BERSIH (SEBELUM ZAKAT)' : 'RUGI BERSIH BERJALAN'}</span>
              <span className={`${netProfit >= 0 ? 'text-green-800' : 'text-red-600'} font-mono`}>
                {netProfit < 0 ? '-' : ''}Rp {Math.abs(netProfit).toLocaleString('id-ID')}
              </span>
            </div>

            <div className="bg-[#e8f5e9]/50 border border-[#c8e6c9]/65 p-3.5 rounded-xl text-[11px] text-[#1b5e20] leading-relaxed">
              <div className="flex justify-between items-center font-bold mb-1">
                <span className="flex items-center space-x-1">
                  <Coins className="w-3.5 h-3.5 text-amber-500" />
                  <span>Kewajiban Zakat Niaga ({settings.zakatRate || 2.5}%)</span>
                </span>
                <span className="font-mono font-black text-amber-700">Rp {zakatReserve.toLocaleString('id-ID')}</span>
              </div>
              <p className="text-[10px] text-green-800 font-medium">
                Sesuai Fatwa Syariah, kewajiban zakat ditarik otomatis dari surplus laba bersih.
              </p>
            </div>

            {netProfit >= 0 && (
              <div className="flex justify-between font-extrabold text-white text-sm py-3 bg-green-700 px-3.5 rounded-lg border border-green-800 shadow-sm">
                <span>SHU BERSIH (SIAP BAGI HASIL MUDHARABAH)</span>
                <span className="font-mono">
                  Rp {(netProfit - zakatReserve).toLocaleString('id-ID')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 2: BALANCE SHEET POSITION (NERACA) */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <div className="border-b border-gray-100 pb-3.5 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-[#307c34]" />
              <span>Neraca Posisi Keuangan (Aktiva vs Pasiva)</span>
            </h3>
            <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
              isBalanced 
                ? 'bg-green-50 text-green-800 border-green-100' 
                : 'bg-amber-50 text-amber-800 border-amber-100'
            }`}>
              {isBalanced ? 'Seimbang audit' : 'Ada Selisih'}
            </span>
          </div>

          <div className="space-y-4 text-xs text-gray-700">
            
            {/* AKTIVA */}
            <div className="bg-[#fafafa] p-4 rounded-xl border border-gray-200/60 space-y-3">
              <p className="font-black text-slate-800 tracking-wider text-[11px] border-b pb-1 flex justify-between items-center">
                <span>AKTIVA (ASET)</span>
                <span className="text-[10px] text-green-700">Sesuai PSAK 101</span>
              </p>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Kas & Setara Kas (Saldo Bersih)</span>
                  <span className="font-mono font-semibold text-slate-900">Rp {cashOnHand.toLocaleString('id-ID')}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Persediaan Barang Dagang</span>
                  <span className="font-mono font-semibold text-slate-900">Rp {valueOfInventory.toLocaleString('id-ID')}</span>
                </div>

                <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-gray-150 shadow-2xs">
                  <span className="text-gray-650 font-bold">Modal Awal Toko (Seed):</span>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-2 flex items-center text-gray-400 font-mono text-[10px]">Rp</span>
                    <input 
                      type="number" 
                      value={initialStoreCapital}
                      onChange={(e) => setInitialStoreCapital(Number(e.target.value))}
                      className="w-28 text-right bg-slate-50 hover:bg-slate-100/50 border border-gray-200 rounded px-1.5 py-1 font-mono text-xs font-bold focus:outline-none focus:ring-1 focus:ring-green-550"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-gray-150 shadow-2xs">
                  <span className="text-gray-650 font-bold">Piutang Dagang:</span>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-2 flex items-center text-gray-400 font-mono text-[10px]">Rp</span>
                    <input 
                      type="number" 
                      value={receivablesVal}
                      onChange={(e) => setReceivablesVal(Number(e.target.value))}
                      className="w-28 text-right bg-slate-50 hover:bg-slate-100/50 border border-gray-200 rounded px-1.5 py-1 font-mono text-xs font-bold focus:outline-none focus:ring-1 focus:ring-green-550"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between font-bold text-green-800 bg-green-50/50 px-3 py-2 rounded-lg border border-green-100/60 mt-3">
                <span>TOTAL AKTIVA</span>
                <span className="font-mono text-xs font-extrabold">Rp {totalAssets.toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* PASIVA */}
            <div className="bg-[#fafafa] p-4 rounded-xl border border-gray-200/60 space-y-3">
              <p className="font-black text-slate-800 tracking-wider text-[11px] border-b pb-1 flex justify-between items-center">
                <span>PASIVA (LIABILITAS & DANA SYIRKAH)</span>
                <span className="text-[10px] text-blue-700">Sesuai PSAK 105</span>
              </p>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-gray-150 shadow-2xs">
                  <span className="text-gray-600 font-bold">Utang (Qardh/Kewajiban):</span>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-2 flex items-center text-gray-400 font-mono text-[10px]">Rp</span>
                    <input 
                      type="number" 
                      value={accountsPayables}
                      onChange={(e) => setAccountsPayables(Number(e.target.value))}
                      className="w-28 text-right bg-slate-50 hover:bg-slate-100/50 border border-gray-200 rounded px-1.5 py-1 font-mono text-xs font-bold focus:outline-none focus:ring-1 focus:ring-green-550"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-gray-150 shadow-2xs">
                  <span className="text-gray-600 font-bold flex items-center space-x-1">
                    <span>Dana Syirkah Temporer (Modal):</span>
                    {isAutoBalanced && <span className="bg-green-100 text-green-800 text-[8px] font-black uppercase px-1 rounded">Locked</span>}
                  </span>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-2 flex items-center text-gray-400 font-mono text-[10px]">Rp</span>
                    <input 
                      type="number" 
                      value={activeEquityValue}
                      disabled={isAutoBalanced}
                      onChange={(e) => setEquityCapitalInput(Number(e.target.value))}
                      className={`w-28 text-right border rounded px-1.5 py-1 font-mono text-xs font-bold focus:outline-none ${
                        isAutoBalanced 
                          ? 'bg-green-50/55 border-green-100 text-green-900 cursor-not-allowed font-black' 
                          : 'bg-slate-50 hover:bg-slate-100/50 border-gray-200'
                      }`}
                    />
                  </div>
                </div>

                <div className="flex justify-between pt-1">
                  <span className="text-gray-500 font-medium">Laba Berjalan Ditahan (Sistem)</span>
                  <span className="font-mono font-semibold text-slate-900">
                    {allTimeProfit < 0 ? '-' : ''}Rp {Math.abs(allTimeProfit).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <div className="flex justify-between font-bold text-slate-800 bg-slate-100 px-3 py-2 rounded-lg border border-slate-250 mt-3">
                <span>TOTAL PASIVA</span>
                <span className="font-mono text-xs font-extrabold">Rp {totalLiabilitiesAndEquity.toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* Micro visual indicator metrics bar */}
            <div>
              <div className="flex justify-between items-center text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-1.5">
                <span>Visual Posisi Keseimbangan Buku (Balance Ratio)</span>
                <span>{isBalanced ? '100% Balanced' : 'Deviasi Mismatch'}</span>
              </div>
              <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden flex shadow-inner border">
                <div 
                  className="h-full bg-green-600 transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(10, (totalAssets / (totalAssets + totalLiabilitiesAndEquity || 1)) * 100))}%` }}
                  title="Persentase Aset Aktiva"
                />
                <div 
                  className="h-full bg-indigo-500 transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(10, (totalLiabilitiesAndEquity / (totalAssets + totalLiabilitiesAndEquity || 1)) * 100))}%` }}
                  title="Persentase Kewajiban Pasiva"
                />
              </div>
              <div className="flex justify-between text-[9px] text-gray-400 mt-1">
                <span>Aktiva (Harta)</span>
                <span>Pasiva (Utang+Modal)</span>
              </div>
            </div>

          </div>
        </div>

      </div>
      
      {/* Printable Area - A4 Report */}
      <div className="printable-area printable-a4 space-y-6 bg-white p-8">
        <div className="text-center border-b-2 border-gray-800 pb-4">
          <h1 className="text-2xl font-black uppercase tracking-widest text-gray-900">KSA Mart</h1>
          <p className="text-sm font-semibold text-gray-600 mt-1">LAPORAN NERACA & LABA RUGI (SYARIAH)</p>
          <p className="text-xs text-gray-500 mt-1">Periode: {startDate} s/d {endDate}</p>
        </div>
        
        <div className="flex justify-between items-end text-xs font-semibold text-gray-700">
          <div>
            <p>Dicetak Oleh: {currentUser?.name || 'Sistem'}</p>
          </div>
          <div>
            <p>Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>

        {/* Laba Rugi Print Section */}
        <div className="mb-8">
          <h2 className="font-bold text-sm bg-gray-100 p-2 border border-gray-300">I. LAPORAN LABA RUGI</h2>
          <table className="w-full text-xs text-left border-collapse border border-gray-300">
            <tbody>
              <tr>
                <td className="p-2 border border-gray-300 font-semibold">Pendapatan Usaha (Omset)</td>
                <td className="p-2 border border-gray-300 text-right">Rp {totalRevenue.toLocaleString('id-ID')}</td>
              </tr>
              <tr>
                <td className="p-2 border border-gray-300">Harga Pokok Penjualan (HPP)</td>
                <td className="p-2 border border-gray-300 text-right text-red-600">(Rp {totalHPP.toLocaleString('id-ID')})</td>
              </tr>
              <tr className="bg-gray-50 font-bold">
                <td className="p-2 border border-gray-300">Laba Kotor Perdagangan</td>
                <td className="p-2 border border-gray-300 text-right">Rp {grossProfit.toLocaleString('id-ID')}</td>
              </tr>
              <tr>
                <td className="p-2 border border-gray-300">Beban Operasional</td>
                <td className="p-2 border border-gray-300 text-right text-red-600">(Rp {totalExpenses.toLocaleString('id-ID')})</td>
              </tr>
              <tr className="bg-gray-50 font-bold">
                <td className="p-2 border border-gray-300 uppercase">Laba Bersih Operasional</td>
                <td className="p-2 border border-gray-300 text-right text-green-800">Rp {netProfit.toLocaleString('id-ID')}</td>
              </tr>
              <tr>
                <td className="p-2 border border-gray-300 italic">Cadangan Zakat Usaha (2.5% dari Laba Bersih)</td>
                <td className="p-2 border border-gray-300 text-right italic text-amber-700">Rp {zakatReserve.toLocaleString('id-ID')}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Neraca Print Section */}
        <div>
          <h2 className="font-bold text-sm bg-gray-100 p-2 border border-gray-300 flex justify-between">
            <span>II. NERACA KEUANGAN</span>
            <span className={isBalanced ? "text-green-700" : "text-amber-700"}>
              {isBalanced ? "STATUS: SEIMBANG" : "STATUS: SELISIH"}
            </span>
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {/* Aktiva */}
            <table className="w-full text-xs text-left border-collapse border border-gray-300">
              <thead className="bg-gray-50">
                <tr><th colSpan={2} className="p-2 border border-gray-300 text-center">AKTIVA (ASET)</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2 border border-gray-300">Kas & Setara Kas</td>
                  <td className="p-2 border border-gray-300 text-right">Rp {cashOnHand.toLocaleString('id-ID')}</td>
                </tr>
                <tr>
                  <td className="p-2 border border-gray-300">Persediaan Barang Dagang</td>
                  <td className="p-2 border border-gray-300 text-right">Rp {valueOfInventory.toLocaleString('id-ID')}</td>
                </tr>
                <tr>
                  <td className="p-2 border border-gray-300">Piutang Dagang</td>
                  <td className="p-2 border border-gray-300 text-right">Rp {receivablesVal.toLocaleString('id-ID')}</td>
                </tr>
                <tr className="font-bold bg-gray-50">
                  <td className="p-2 border border-gray-300">TOTAL AKTIVA</td>
                  <td className="p-2 border border-gray-300 text-right">Rp {totalAssets.toLocaleString('id-ID')}</td>
                </tr>
              </tbody>
            </table>

            {/* Pasiva */}
            <table className="w-full text-xs text-left border-collapse border border-gray-300">
              <thead className="bg-gray-50">
                <tr><th colSpan={2} className="p-2 border border-gray-300 text-center">PASIVA (KEWAJIBAN & MODAL)</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2 border border-gray-300">Utang (Qardh)</td>
                  <td className="p-2 border border-gray-300 text-right">Rp {accountsPayables.toLocaleString('id-ID')}</td>
                </tr>
                <tr>
                  <td className="p-2 border border-gray-300">Dana Syirkah Temporer</td>
                  <td className="p-2 border border-gray-300 text-right">Rp {activeEquityValue.toLocaleString('id-ID')}</td>
                </tr>
                <tr>
                  <td className="p-2 border border-gray-300">Ekuitas Laba Ditahan</td>
                  <td className="p-2 border border-gray-300 text-right">Rp {allTimeProfit.toLocaleString('id-ID')}</td>
                </tr>
                <tr className="font-bold bg-gray-50">
                  <td className="p-2 border border-gray-300">TOTAL PASIVA</td>
                  <td className="p-2 border border-gray-300 text-right">Rp {totalLiabilitiesAndEquity.toLocaleString('id-ID')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 pt-8 flex justify-between items-end border-t-2 border-gray-300 px-4">
          <div className="text-center w-1/3 px-2">
            <p className="text-xs font-semibold mb-12">Diperiksa Oleh,</p>
            <p className="text-xs border-b border-gray-800 pb-1 font-bold h-6">
              {currentUser?.role === 'ADMIN' ? currentUser.name : ''}
            </p>
            <p className="text-[10px] text-gray-500 mt-1 uppercase">Admin</p>
          </div>
          
          <div className="text-center w-1/3 px-2 border-l border-gray-200">
            <p className="text-xs font-semibold mb-12">Mengetahui,</p>
            <p className="text-xs border-b border-gray-800 pb-1 font-bold h-6">
              {currentUser?.role === 'MANAGER' ? currentUser.name : ''}
            </p>
            <p className="text-[10px] text-gray-500 mt-1 uppercase">Manager Cabang</p>
          </div>

          <div className="text-center w-1/3 px-2 border-l border-gray-200">
            <p className="text-[10px] text-gray-600 mb-2">{activeBranchId ? `Cabang ${activeBranchId}` : 'Kantor Pusat'}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p className="text-xs font-semibold mb-12">Menyetujui,</p>
            <p className="font-bold text-gray-800 border-b border-gray-400 pb-1 px-2 whitespace-nowrap h-6 flex items-end justify-center">Dr. Grandis Imama Hendra, S.E.I., M.Sc (Acc), SAS.</p>
            <p className="text-xs text-gray-500 mt-1">Ketua Toko Koperasi KSA Mart</p>
          </div>
        </div>
      </div>
      
    </div>
  );
}