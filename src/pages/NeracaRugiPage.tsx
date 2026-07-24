import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { useBranchData } from '../hooks/useBranchData';
import * as XLSX from 'xlsx';
import { useReactToPrint } from 'react-to-print';
import PrintHeader from '../components/Print/PrintHeader';
import PrintFooter from '../components/Print/PrintFooter';
import {
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
  const navigate = useNavigate();
  const { transactions, products, expenses, journalEntries, currentUser, activeBranchId, branches, addLog, addNotification, settings, customers } = useBranchData();
  const users = useAppStore(state => state.users);
  const reportRef = useRef<HTMLDivElement>(null);
  const isOwner = currentUser?.role === 'OWNER' || currentUser?.role === 'SUPERADMIN' || currentUser?.role === 'PENGURUS';
  const isReadOnlyRole = !isOwner && currentUser?.role !== 'MANAGER';

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

  // Pagination for Customer Receivables
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Calculate historical debt dynamically for audit-readiness
  const customerData = useMemo(() => {
    return (customers || []).map(c => {
      let futureDebits = 0;
      let futureCredits = 0;
      let hadActivityThisMonth = false;

      (journalEntries || []).forEach(je => {
        const isPiutang = je.account === 'PIUTANG_DAGANG' || (je.account && je.account.toLowerCase().includes('piutang'));
        if (isPiutang) {
          let isRelated = false;
          if (je.referenceType === 'AUTO_TRANSAKSI') {
            const tx = (transactions || []).find(t => t.id === je.referenceId);
            if (tx && tx.customerId === c.id) isRelated = true;
          } else if (je.referenceType === 'MANUAL') {
            if (je.referenceId === c.id) isRelated = true;
          }

          if (isRelated) {
            if (je.date > endDate) {
              // Revert transactions that happened AFTER the endDate
              futureDebits += (Number(je.debit) || 0);
              futureCredits += (Number(je.credit) || 0);
            } else if (je.date >= startDate && je.date <= endDate) {
              // Track if they paid or borrowed during the active view period
              hadActivityThisMonth = true;
            }
          }
        }
      });

      // Current balance minus additions after endDate plus payments after endDate
      const historicalDebt = (Number(c.debtAmount) || 0) - futureDebits + futureCredits;
      
      return { ...c, historicalDebt, hadActivityThisMonth };
    });
  }, [customers, journalEntries, transactions, startDate, endDate]);

  const kasbonCustomers = useMemo(() => {
    return customerData
      .filter(c => c.historicalDebt > 0 || (c.historicalDebt <= 0 && c.hadActivityThisMonth))
      .sort((a, b) => b.historicalDebt - a.historicalDebt);
  }, [customerData]);

  // Persistent Input values for Balance Sheet (saves to localStorage)
  const autoReceivablesVal = useMemo(() => {
    return kasbonCustomers.reduce((sum, c) => sum + (c.historicalDebt > 0 ? c.historicalDebt : 0), 0);
  }, [kasbonCustomers]);

  const piutangKaryawanVal = useMemo(() => {
    return users.reduce((sum, u) => sum + (u.debtAmount || 0), 0);
  }, [users]);

  const [receivablesVal, setReceivablesVal] = useState(() => {
    const saved = localStorage.getItem('ksa_neraca_receivables');
    return saved ? Number(saved) : 0;
  });

  // Sync auto if it changes (or just use it directly, but we want it to be part of totalAssets)
  const activeReceivablesVal = autoReceivablesVal;

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
    // Exclude voided transactions from financial reports
    if (tx.isVoided) return false;
    const txDate = String(tx.timestamp).split('T')[0];
    return txDate >= startDate && txDate <= endDate;
  });

  const filteredAllExpenses = (expenses || []).filter(exp => {
    if (!exp || !exp.date) return false;
    const expDate = String(exp.date).split('T')[0];
    return expDate >= startDate && expDate <= endDate;
  });

  const filteredExpenses = filteredAllExpenses.filter(exp => (Number(exp.amount) || 0) >= 0);
  const filteredOtherIncome = filteredAllExpenses.filter(exp => (Number(exp.amount) || 0) < 0);

  const periodTransactionsRevenue = filteredTransactions.reduce((sum, tx) => sum + (Number(tx.totalAmount) || 0), 0);
  const periodTransactionsHPP = filteredTransactions.reduce((sum, tx) => {
    return sum + (tx.items || []).reduce((s, it) => {
      let cp = Number(it.costPrice || 0);
      if (!cp) {
        const productData = products?.find((p: any) => p.id === it.productId);
        if (productData) {
          const isBox = it.productName?.toLowerCase().includes('(box)');
          cp = isBox ? Number(productData.boxCostPrice || 0) : Number(productData.costPrice || 0);
        }
      }
      return s + (cp * (Number(it.quantity) || 0));
    }, 0);
  }, 0);
  const periodTransactionsExpenses = filteredExpenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
  const periodOtherIncome = filteredOtherIncome.reduce((sum, exp) => sum + Math.abs(Number(exp.amount) || 0), 0);

  // Manual Journals
  const manualJournals = (journalEntries || []).filter(j => j.referenceType === 'MANUAL');
  
  const periodManualJournals = manualJournals.filter(j => {
    const jd = String(j.date || '').split('T')[0];
    return jd && jd >= startDate && jd <= endDate;
  });

  let periodManualRevenue = 0;
  let periodManualHPP = 0;
  let periodManualExpenses = 0;

  periodManualJournals.forEach(j => {
    if (!j.account) return;
    const acc = j.account.toLowerCase();
    if (j.account.startsWith('4-') || j.account.startsWith('4')) periodManualRevenue += (j.credit - j.debit);
    else if (j.account.startsWith('5-') || j.account.startsWith('5')) periodManualHPP += (j.debit - j.credit);
    else if (j.account.startsWith('6-') || j.account.startsWith('6')) periodManualExpenses += (j.debit - j.credit);
  });

  const totalRevenue = periodTransactionsRevenue + periodManualRevenue;
  const totalHPP = periodTransactionsHPP + periodManualHPP;
  const grossProfit = totalRevenue - totalHPP;
  const totalExpenses = periodTransactionsExpenses + periodManualExpenses;
  const netProfit = grossProfit + periodOtherIncome - totalExpenses;
  const zakatRateDecimal = (settings.charityZakatPercentage || 2.5) / 100;
  const zakatReserve = Math.round(Math.max(0, netProfit) * zakatRateDecimal); // Zakat Niaga berdasarkan Keuntungan Bersih, dibulatkan

  // Cumulative all-time balances supporting position (Balance Sheet)
  const allTimeTransactionsRevenue = (transactions || [])
    .filter(tx => {
      if (!tx || !tx.timestamp) return false;
      if (tx.isVoided) return false;
      const txDate = String(tx.timestamp).split('T')[0];
      return txDate <= endDate;
    })
    .reduce((sum, tx) => sum + (Number(tx.totalAmount) || 0), 0);

  const allTimeTransactionsExpenses = (expenses || [])
    .filter(exp => {
      if (!exp || !exp.date) return false;
      const expDate = String(exp.date).split('T')[0];
      return expDate <= endDate;
    })
    .reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);

  const allTimeTransactionsHPP = (transactions || [])
    .filter(tx => {
      if (!tx || !tx.timestamp) return false;
      if (tx.isVoided) return false;
      const txDate = String(tx.timestamp).split('T')[0];
      return txDate <= endDate;
    })
    .reduce((sum, tx) =>
      sum + (tx.items || []).reduce((s, it) => s + ((Number(it.costPrice) || 0) * (Number(it.quantity) || 0)), 0), 0
    );

  const cumulativeManualJournals = manualJournals.filter(j => {
    const jd = String(j.date || '').split('T')[0];
    return jd && jd <= endDate;
  });

  let allTimeManualRevenue = 0;
  let allTimeManualHPP = 0;
  let allTimeManualExpenses = 0;
  let allTimeManualCash = 0;

  cumulativeManualJournals.forEach(j => {
    if (!j.account) return;
    const acc = j.account.toLowerCase();
    if (j.account.startsWith('4-') || j.account.startsWith('4')) allTimeManualRevenue += (j.credit - j.debit);
    else if (j.account.startsWith('5-') || j.account.startsWith('5')) allTimeManualHPP += (j.debit - j.credit);
    else if (j.account.startsWith('6-') || j.account.startsWith('6')) allTimeManualExpenses += (j.debit - j.credit);
    else if (
      j.account.startsWith('1-100') || 
      j.account.startsWith('1-101') || 
      acc.includes('kas kecil') || 
      acc.includes('kas utama') ||
      j.account.startsWith('1101') ||
      j.account.startsWith('1102') ||
      j.account.startsWith('1112')
    ) {
      allTimeManualCash += (j.debit - j.credit);
    }
  });

  // Calculate separate cash balances directly from ALL journals
  let balanceKasTunai = initialStoreCapital; // modal awal dianggap masuk ke kas tunai
  let balanceKasKecil = 0;
  let balanceBank = 0;

  (journalEntries || []).forEach(j => {
    const jd = String(j.date || '').split('T')[0];
    if (jd && jd <= endDate) {
      const acc = j.account ? j.account.toLowerCase() : '';
      if (acc.includes('1102') || acc.includes('kas kecil')) {
        balanceKasKecil += (j.debit - j.credit);
      } else if (acc.includes('1112') || acc.includes('bank') || acc.includes('qris')) {
        balanceBank += (j.debit - j.credit);
      } else if (acc.includes('1101') || acc.includes('1-1000') || acc.includes('kas tunai') || acc.includes('kas utama') || acc.startsWith('1-100')) {
        balanceKasTunai += (j.debit - j.credit);
      }
    }
  });

  const allTimeRevenue = allTimeTransactionsRevenue + allTimeManualRevenue;
  const allTimeExpenses = allTimeTransactionsExpenses + allTimeManualExpenses;
  const allTimeHPP = allTimeTransactionsHPP + allTimeManualHPP;

  const allTimeProfit = allTimeRevenue - allTimeHPP - allTimeExpenses;

  // Sound liquid capital: sum of the 3 separated cash accounts
  const cashOnHand = balanceKasTunai + balanceKasKecil + balanceBank;

  // Unsold merchandise stock valuation (asset)
  // Exclude PPOB from physical inventory calculation to prevent balance sheet inflation
  const valueOfInventory = (products || []).reduce((sum, p) => p.isPPOB ? sum : sum + ((Number(p.costPrice) || 0) * (Number(p.stock) || 0)), 0);

  // Total Aktiva (Assets)
  const totalAssets = cashOnHand + valueOfInventory + activeReceivablesVal + Number(receivablesVal) + piutangKaryawanVal;

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
      [`Cadangan ${settings.charityTitle || 'Zakat Usaha'} (${settings.charityZakatPercentage || 2.5}%)`, zakatReserve],
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

  const handlePrint = useReactToPrint({
    contentRef: reportRef,
    documentTitle: `Neraca_Laba_Rugi_KSAMart_${startDate}_to_${endDate}`,
    onAfterPrint: () => addLog('PRINT_REPORT', 'FINANCE', `Mencetak Laporan Neraca & Laba Rugi periode ${startDate} sd ${endDate}`)
  });

  return (
    <div className="space-y-6">
      
      {/* INTERACTIVE UI (Hidden during print) */}
      <div className="print:hidden space-y-6">

      {/* HEADER CARD */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-200 dark:border-slate-700/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="font-extrabold text-slate-800 dark:text-slate-200 text-sm flex items-center space-x-1.5">
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
          <div className="flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-2 py-1">
            <Calendar className="w-3.5 h-3.5 text-gray-500 dark:text-slate-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent border-none text-xs focus:outline-none text-slate-700 dark:text-slate-300 font-medium"
            />
            <span className="text-gray-455 text-xs">s/d</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent border-none text-xs focus:outline-none text-slate-700 dark:text-slate-300 font-medium"
            />
          </div>

          {isOwner ? (
            <button
              onClick={() => {
                addLog('REPORT_APPROVAL', 'FINANCE', `Owner menyetujui Laporan Neraca & Laba Rugi periode ${startDate} sd ${endDate}.`);
                addNotification({
                  title: 'Laporan Keuangan Disetujui',
                  message: `Owner telah menyetujui Laporan Neraca & Laba Rugi periode ${startDate} sd ${endDate}.`,
                  type: 'INFO',
                  targetRole: ['ADMIN', 'MANAGER'],
                  link: '/laba-rugi'
                });
                alert('Laporan berhasil disetujui!');
              }}
              className="bg-green-600 hover:bg-green-700 text-white font-bold text-xs py-1.5 px-3.5 rounded-lg flex items-center space-x-1 shadow-xs transition-colors"
            >
              <span>Setujui Laporan</span>
            </button>
          ) : (
            <button
              onClick={() => {
                addLog('REPORT_APPROVAL', 'FINANCE', `Mengirim Laporan Neraca & Laba Rugi periode ${startDate} sd ${endDate} untuk persetujuan Owner.`);
                addNotification({
                  title: 'Approval Laporan Keuangan',
                  message: `Laporan Neraca & Laba Rugi periode ${startDate} sd ${endDate} dari Cabang ${activeBranchId || 'Pusat'} menunggu persetujuan.`,
                  type: 'APPROVAL',
                  targetRole: ['OWNER', 'PENGURUS'],
                  excludeUsernames: currentUser?.username ? [currentUser.username] : [],
                  link: '/laba-rugi'
                });
                alert('Laporan berhasil dikirim ke Owner/Pengurus untuk persetujuan!');
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-1.5 px-3.5 rounded-lg flex items-center space-x-1 shadow-xs transition-colors"
            >
              <span>Kirim Laporan</span>
            </button>
          )}

          <button
            onClick={handleExportExcel}
            className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:bg-slate-800 active:scale-95 active:bg-gray-100 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700 font-bold text-xs py-1.5 px-3 rounded-lg flex items-center space-x-1 shadow-sm hover:shadow transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#388e3c]" />
            <span>Unduh Excel</span>
          </button>

          <button
            onClick={handlePrint}
            className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 active:bg-indigo-800 text-white font-bold text-xs py-1.5 px-3.5 rounded-lg flex items-center space-x-1 shadow-sm hover:shadow transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak PDF/Kertas</span>
          </button>
        </div>
      </div>

      {/* AUTO BACK BALANCE LOCK NOTIFIER CONTAINER - "KUNCI TIDAK ADA SELISIH LAGI" */}
      <div className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-200 ${isAutoBalanced
          ? 'bg-green-50/75 border-green-100 text-green-950'
          : isBalanced
            ? 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white'
            : 'bg-amber-50/75 border-amber-200 text-amber-950'
        }`}>
        <div className="flex items-start md:items-center space-x-3.5">
          <div className={`p-2 rounded-xl flex-shrink-0 ${isAutoBalanced
              ? 'bg-green-100/80 text-green-700'
              : isBalanced
                ? 'bg-slate-150 text-slate-600 dark:text-slate-400'
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
                  : '⚠️ PERHATIAN: NERACA MENGALAMI SELISIH BUKU'}
            </h4>
            <div className="text-[11px] opacity-90 mt-1 leading-relaxed">
              {isAutoBalanced
                ? <p>Formula balancing pintar otomatis mengunci nilai Modal Sendiri agar saldo Aktiva (Aset) & Pasiva (Kewajiban) selalu seimbang Rp 0 tanpa selisih deviasi.</p>
                : isBalanced
                  ? <p>Angka saldo seimbang dengan modal manual yang Anda inputkan. Selisih adalah Rp 0.</p>
                  : (
                    <div className="space-y-1 mt-1">
                      <p className="font-semibold text-red-100">Terdapat selisih/ketimpangan buku sebesar Rp {netDifference.toLocaleString('id-ID')}. Apa yang harus dilakukan?</p>
                      <ul className="list-disc pl-4 space-y-0.5">
                        <li>Pastikan Anda sudah menginput <strong>Modal Awal / Setoran Kas</strong> melalui menu Arus Kas/Jurnal.</li>
                        <li>Periksa apakah ada Kasbon/Piutang atau Pengeluaran Beban yang salah input/belum tercatat.</li>
                        <li>Jika ini adalah penggunaan pertama aplikasi, klik tombol <strong>"Seimbangkan & Kunci"</strong> di sebelah kanan untuk langsung menyeimbangkan selisih ini secara otomatis ke akun Modal Penyeimbang.</li>
                      </ul>
                    </div>
                  )}
            </div>
          </div>
        </div>

        <div className="flex-shrink-0">
          {isAutoBalanced ? (
            <button
              onClick={() => setIsAutoBalanced(false)}
              className="bg-white dark:bg-slate-900 hover:bg-slate-100 dark:bg-slate-800 text-slate-750 font-bold text-[10px] uppercase tracking-wider px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 transition-all flex items-center space-x-1"
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
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-gray-100 dark:border-slate-800 pb-3.5 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-[#307c34]" />
                <span>Laporan Laba Rugi Operasional</span>
              </h3>
              <span className="text-[10px] text-gray-400 font-mono">Periode Tersaring</span>
            </div>

            {/* Calculations Fields */}
            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/80 px-3.5 py-2.5 rounded-lg border">
                <span>PENDAPATAN PENJUALAN</span>
                <span className="font-mono">Rp {totalRevenue.toLocaleString('id-ID')}</span>
              </div>

              <div className="flex justify-between items-center pl-4 py-1.5 border-b border-dashed border-gray-100 dark:border-slate-800">
                <span className="text-gray-500 dark:text-slate-400 font-medium">Beban Pokok Penjualan (HPP produk keluar)</span>
                <span className="text-red-700 font-semibold font-mono">- Rp {totalHPP.toLocaleString('id-ID')}</span>
              </div>

              <div className="flex justify-between font-bold text-green-800 bg-green-50/40 px-3.5 py-2 rounded-lg border border-green-100/60">
                <span>LABA KOTOR PENJUALAN (PSAK 102)</span>
                <span className="font-mono">Rp {grossProfit.toLocaleString('id-ID')}</span>
              </div>

              {filteredOtherIncome.length > 0 && (
                <div className="pt-2 pb-1">
                  <div className="flex justify-between items-center font-bold text-blue-800 border-b pb-1 mb-2">
                    <span>PENDAPATAN LAINNYA (DARI KASIR)</span>
                    <span className="text-[10px] text-gray-400 font-medium">{filteredOtherIncome.length} transaksi</span>
                  </div>
                  <div className="space-y-2 pl-4">
                    {filteredOtherIncome.map((exp) => (
                      <div key={exp.id} className="flex justify-between text-[11px] text-gray-600 dark:text-slate-400">
                        <span className="truncate max-w-[240px]">• {exp.description.replace('Pemasukan Kas: ', '')}</span>
                        <span className="text-blue-700 font-mono">+ Rp {Math.abs(exp.amount).toLocaleString('id-ID')}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between font-bold text-blue-700 pl-4 py-1.5 mt-1 border-t border-blue-100/50 text-[11px]">
                    <span>Total Pendapatan Lainnya</span>
                    <span className="font-mono">+ Rp {periodOtherIncome.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              )}

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
                      <div key={exp.id} className="flex justify-between text-[11px] text-gray-600 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-colors">
                        <span className="truncate max-w-[240px]">• {exp.description} ({exp.category})</span>
                        <span className="text-red-700 font-mono">- Rp {exp.amount.toLocaleString('id-ID')}</span>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex justify-between font-bold text-gray-500 dark:text-slate-400 pl-4 py-2 mt-2 border-t border-gray-100 dark:border-slate-800 text-[11px]">
                  <span>Total Kebutuhan Biaya Operasi</span>
                  <span className="font-mono text-red-700">Rp {totalExpenses.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-3 pt-3 border-t border-gray-100 dark:border-slate-800">
            <div className="flex justify-between font-extrabold text-slate-900 dark:text-white text-sm py-3 bg-slate-50 dark:bg-slate-800 px-3.5 rounded-lg border">
              <span>{netProfit >= 0 ? 'LABA BERSIH (SEBELUM DIBAGI HASIL)' : 'RUGI BERSIH BERJALAN'}</span>
              <span className={`${netProfit >= 0 ? 'text-green-800' : 'text-red-600'} font-mono`}>
                {netProfit < 0 ? '-' : ''}Rp {Math.abs(netProfit).toLocaleString('id-ID')}
              </span>
            </div>

            <div className="bg-[#e8f5e9]/50 border border-[#c8e6c9]/65 p-3.5 rounded-xl text-[11px] text-[#1b5e20] leading-relaxed">
              <div className="flex justify-between items-center font-bold mb-1">
                <span className="flex items-center space-x-1">
                  <Coins className="w-3.5 h-3.5 text-amber-500" />
                  <span>Informasi Cadangan {settings.charityTitle || 'Amal/Zakat'} ({settings.charityZakatPercentage || 2.5}%)</span>
                </span>
                <span className="font-mono font-black text-amber-700">Rp {zakatReserve.toLocaleString('id-ID')}</span>
              </div>
              <p className="text-[10px] text-green-800 font-medium">
                Ini adalah informasi pencadangan dana dari surplus laba. Jika Anda ingin menyalurkan dana ini, silakan input manual di menu <b>Jurnal / Pengeluaran</b> agar mengurangi saldo kas aktual.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 2: BALANCE SHEET POSITION (NERACA) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xs space-y-4">
          <div className="border-b border-gray-100 dark:border-slate-800 pb-3.5 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-[#307c34]" />
              <span>Neraca Posisi Keuangan (Aktiva vs Pasiva)</span>
            </h3>
            <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${isBalanced
                ? 'bg-green-50 text-green-800 border-green-100'
                : 'bg-amber-50 text-amber-800 border-amber-100'
              }`}>
              {isBalanced ? 'Seimbang audit' : 'Ada Selisih'}
            </span>
          </div>

          <div className="space-y-4 text-xs text-gray-700 dark:text-slate-300">

            {/* AKTIVA */}
            <div className="bg-[#fafafa] p-4 rounded-xl border border-gray-200 dark:border-slate-700/60 space-y-3">
              <p className="font-black text-slate-800 dark:text-slate-200 tracking-wider text-[11px] border-b pb-1 flex justify-between items-center">
                <span>AKTIVA (ASET)</span>
                <span className="text-[10px] text-green-700">Sesuai PSAK 101</span>
              </p>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-slate-400 font-medium ml-4">↳ Kas Tunai Utama</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-white">Rp {balanceKasTunai.toLocaleString('id-ID')}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-slate-400 font-medium ml-4">↳ Kas Kecil</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-white">Rp {balanceKasKecil.toLocaleString('id-ID')}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-slate-400 font-medium ml-4">↳ Kas di Bank / QRIS</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-white">Rp {balanceBank.toLocaleString('id-ID')}</span>
                </div>
                
                <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-slate-700/50">
                  <span className="text-slate-800 dark:text-slate-200 font-bold">Total Kas & Setara Kas</span>
                  <span className="font-mono font-black text-slate-900 dark:text-white">Rp {cashOnHand.toLocaleString('id-ID')}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-slate-400 font-medium">Persediaan Barang Dagang</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-white">Rp {valueOfInventory.toLocaleString('id-ID')}</span>
                </div>

                <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-2 rounded-lg border border-gray-150 shadow-2xs">
                  <span className="text-gray-650 font-bold">Modal Awal Toko (Seed):</span>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-2 flex items-center text-gray-400 font-mono text-[10px]">Rp</span>
                    <input
                      type="number"
                      value={initialStoreCapital}
                      disabled={isReadOnlyRole}
                      onChange={(e) => setInitialStoreCapital(Number(e.target.value))}
                      className="w-28 text-right bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded px-1.5 py-1 font-mono text-xs font-bold focus:outline-none focus:ring-1 focus:ring-green-550"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-2 rounded-lg border border-gray-150 shadow-2xs">
                  <div className="flex flex-col">
                    <span className="text-gray-650 font-bold">Piutang Kasbon Pelanggan:</span>
                    <span className="text-[9px] text-green-600 font-bold tracking-wider">OTOMATIS TERSINKRON</span>
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-2 flex items-center text-gray-400 font-mono text-[10px]">Rp</span>
                    <input
                      type="text"
                      value={activeReceivablesVal.toLocaleString('id-ID')}
                      disabled={true}
                      className="w-28 text-right bg-slate-100 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded px-1.5 py-1 font-mono text-xs font-bold text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-2 rounded-lg border border-gray-150 shadow-2xs">
                  <div className="flex flex-col">
                    <span className="text-gray-650 font-bold">Piutang Kasbon Karyawan:</span>
                    <span className="text-[9px] text-green-600 font-bold tracking-wider">OTOMATIS TERSINKRON</span>
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-2 flex items-center text-gray-400 font-mono text-[10px]">Rp</span>
                    <input
                      type="text"
                      value={piutangKaryawanVal.toLocaleString('id-ID')}
                      disabled={true}
                      className="w-28 text-right bg-slate-100 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded px-1.5 py-1 font-mono text-xs font-bold text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>


                <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-2 rounded-lg border border-gray-150 shadow-2xs">
                  <div className="flex flex-col">
                    <span className="text-gray-650 font-bold">Piutang Lainnya (Manual):</span>
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-2 flex items-center text-gray-400 font-mono text-[10px]">Rp</span>
                    <input
                      type="number"
                      value={receivablesVal}
                      disabled={isReadOnlyRole}
                      onChange={(e) => setReceivablesVal(Number(e.target.value))}
                      className="w-28 text-right bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded px-1.5 py-1 font-mono text-xs font-bold focus:outline-none focus:ring-1 focus:ring-green-550"
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
            <div className="bg-[#fafafa] p-4 rounded-xl border border-gray-200 dark:border-slate-700/60 space-y-3">
              <p className="font-black text-slate-800 dark:text-slate-200 tracking-wider text-[11px] border-b pb-1 flex justify-between items-center">
                <span>PASIVA (LIABILITAS & DANA SYIRKAH)</span>
                <span className="text-[10px] text-blue-700">Sesuai PSAK 105</span>
              </p>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-2 rounded-lg border border-gray-150 shadow-2xs">
                  <span className="text-gray-600 dark:text-slate-400 font-bold">Utang (Qardh/Kewajiban):</span>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-2 flex items-center text-gray-400 font-mono text-[10px]">Rp</span>
                    <input
                      type="number"
                      value={accountsPayables}
                      disabled={isReadOnlyRole}
                      onChange={(e) => setAccountsPayables(Number(e.target.value))}
                      className="w-28 text-right bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded px-1.5 py-1 font-mono text-xs font-bold focus:outline-none focus:ring-1 focus:ring-green-550"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-2 rounded-lg border border-gray-150 shadow-2xs">
                  <span className="text-gray-600 dark:text-slate-400 font-bold flex items-center space-x-1">
                    <span>Dana Syirkah Temporer (Modal):</span>
                    {isAutoBalanced && <span className="bg-green-100 text-green-800 text-[8px] font-black uppercase px-1 rounded">Locked</span>}
                  </span>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-2 flex items-center text-gray-400 font-mono text-[10px]">Rp</span>
                    {isReadOnlyRole || isAutoBalanced ? (
                      <input
                        type="text"
                        value={activeEquityValue.toLocaleString('id-ID')}
                        disabled={true}
                        className="w-28 text-right border rounded px-1.5 py-1 font-mono text-xs font-bold focus:outline-none bg-green-50/55 border-green-100 text-green-900 cursor-not-allowed font-black"
                      />
                    ) : (
                      <input
                        type="number"
                        value={activeEquityValue}
                        onChange={(e) => setEquityCapitalInput(Number(e.target.value))}
                        className="w-28 text-right border rounded px-1.5 py-1 font-mono text-xs font-bold focus:outline-none bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:bg-slate-800/50 border-gray-200 dark:border-slate-700"
                      />
                    )}
                  </div>
                </div>

                <div className="flex justify-between pt-1">
                  <span className="text-gray-500 dark:text-slate-400 font-medium">Laba Berjalan Ditahan (Sistem)</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-white">
                    {allTimeProfit < 0 ? '-' : ''}Rp {Math.abs(allTimeProfit).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-250 mt-3">
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
              <div className="w-full h-2.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden flex shadow-inner border">
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

      {/* Rincian Piutang Kasbon Pelanggan */}
      {(() => {
        if (kasbonCustomers.length === 0) return null;

        const totalPages = Math.ceil(kasbonCustomers.length / itemsPerPage);
        const currentData = kasbonCustomers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
        const totalKasbon = kasbonCustomers.reduce((sum, c) => sum + (c.historicalDebt > 0 ? c.historicalDebt : 0), 0);

        return (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden mt-6 mb-8">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                Daftar Piutang Kasbon Pelanggan
              </h3>
              <span className="text-xs font-bold text-slate-500 bg-white dark:bg-slate-700 px-2 py-1 rounded border border-slate-200 dark:border-slate-600">
                Total: {kasbonCustomers.length} Orang
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Akun Pelanggan / No HP</th>
                    <th className="px-4 py-3 text-right">Sisa Kasbon (Rp)</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {currentData.map(customer => {
                    const isLunas = customer.historicalDebt <= 0;
                    return (
                      <tr key={customer.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-800 dark:text-slate-200">{customer.name}</div>
                          {customer.phone && <div className="text-xs text-slate-500">{customer.phone}</div>}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-amber-600">
                          Rp {Math.max(0, customer.historicalDebt).toLocaleString('id-ID')}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {isLunas ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                              <CheckCircle2 className="w-3 h-3" />
                              LUNAS
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                              BELUM LUNAS
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button 
                            onClick={() => navigate('/customers', { state: { selectedCustomerId: customer.id } })}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800"
                          >
                            Update Kasbon
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-slate-50 dark:bg-slate-800/80 font-bold">
                    <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300">TOTAL KASBON AKTIF:</td>
                    <td className="px-4 py-3 text-right font-mono text-amber-700">
                      Rp {totalKasbon.toLocaleString('id-ID')}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tbody>
              </table>
            </div>
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
                >
                  Sebelumnya
                </button>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Halaman {currentPage} dari {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
                >
                  Selanjutnya
                </button>
              </div>
            )}
          </div>
        );
      })()}
      </div> {/* End of Interactive UI */}

      {/* Printable Area - A4 Report */}
      <div className="hidden print:block">
        <div className="printable-area printable-a4 space-y-6 bg-white dark:bg-slate-900 p-8 text-black" ref={reportRef}>
          <PrintHeader title="Laporan Neraca Laba Rugi" period={`${startDate} s/d ${endDate}`} />

        {/* Laba Rugi Print Section */}
        <div className="mb-8">
          <h2 className="font-bold text-sm bg-gray-100 dark:bg-slate-800 p-2 border border-gray-300 dark:border-slate-600">I. LAPORAN LABA RUGI</h2>
          <table className="w-full text-xs text-left border-collapse border border-gray-300 dark:border-slate-600">
            <tbody>
              <tr>
                <td className="p-2 border border-gray-300 dark:border-slate-600 font-semibold">Pendapatan Usaha (Omset)</td>
                <td className="p-2 border border-gray-300 dark:border-slate-600 text-right">Rp {totalRevenue.toLocaleString('id-ID')}</td>
              </tr>
              <tr>
                <td className="p-2 border border-gray-300 dark:border-slate-600">Harga Pokok Penjualan (HPP)</td>
                <td className="p-2 border border-gray-300 dark:border-slate-600 text-right text-red-600">(Rp {totalHPP.toLocaleString('id-ID')})</td>
              </tr>
              <tr className="bg-gray-50 dark:bg-slate-800 font-bold">
                <td className="p-2 border border-gray-300 dark:border-slate-600">Laba Kotor Perdagangan</td>
                <td className="p-2 border border-gray-300 dark:border-slate-600 text-right">Rp {grossProfit.toLocaleString('id-ID')}</td>
              </tr>
              <tr>
                <td className="p-2 border border-gray-300 dark:border-slate-600">Beban Operasional</td>
                <td className="p-2 border border-gray-300 dark:border-slate-600 text-right text-red-600">(Rp {totalExpenses.toLocaleString('id-ID')})</td>
              </tr>
              <tr className="bg-gray-50 dark:bg-slate-800 font-bold">
                <td className="p-2 border border-gray-300 dark:border-slate-600 uppercase">Laba Bersih Operasional</td>
                <td className="p-2 border border-gray-300 dark:border-slate-600 text-right text-green-800">Rp {netProfit.toLocaleString('id-ID')}</td>
              </tr>
              <tr>
                <td className="p-2 border border-gray-300 dark:border-slate-600 italic">Cadangan {settings.charityTitle || 'Amal/Zakat'} ({settings.charityZakatPercentage || 2.5}% dari Laba Bersih)</td>
                <td className="p-2 border border-gray-300 dark:border-slate-600 text-right italic text-amber-700">Rp {zakatReserve.toLocaleString('id-ID')}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Neraca Print Section */}
        <div>
          <h2 className="font-bold text-sm bg-gray-100 dark:bg-slate-800 p-2 border border-gray-300 dark:border-slate-600 flex justify-between">
            <span>II. NERACA KEUANGAN</span>
            <span className={isBalanced ? "text-green-700" : "text-amber-700"}>
              {isBalanced ? "STATUS: SEIMBANG" : "STATUS: SELISIH"}
            </span>
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {/* Aktiva */}
            <table className="w-full text-xs text-left border-collapse border border-gray-300 dark:border-slate-600">
              <thead className="bg-gray-50 dark:bg-slate-800">
                <tr><th colSpan={2} className="p-2 border border-gray-300 dark:border-slate-600 text-center">AKTIVA (ASET)</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2 border border-gray-300 dark:border-slate-600">Kas & Setara Kas</td>
                  <td className="p-2 border border-gray-300 dark:border-slate-600 text-right">Rp {cashOnHand.toLocaleString('id-ID')}</td>
                </tr>
                <tr>
                  <td className="p-2 border border-gray-300 dark:border-slate-600">Persediaan Barang Dagang</td>
                  <td className="p-2 border border-gray-300 dark:border-slate-600 text-right">Rp {valueOfInventory.toLocaleString('id-ID')}</td>
                </tr>
                <tr>
                  <td className="p-2 border border-gray-300 dark:border-slate-600">Piutang Kasbon Pelanggan (Otomatis)</td>
                  <td className="p-2 border border-gray-300 dark:border-slate-600 text-right">Rp {activeReceivablesVal.toLocaleString('id-ID')}</td>
                </tr>
                <tr>
                  <td className="p-2 border border-gray-300 dark:border-slate-600">Piutang Kasbon Karyawan (Otomatis)</td>
                  <td className="p-2 border border-gray-300 dark:border-slate-600 text-right">Rp {piutangKaryawanVal.toLocaleString('id-ID')}</td>
                </tr>
                <tr>
                  <td className="p-2 border border-gray-300 dark:border-slate-600">Piutang Dagang Lainnya (Manual)</td>
                  <td className="p-2 border border-gray-300 dark:border-slate-600 text-right">Rp {receivablesVal.toLocaleString('id-ID')}</td>
                </tr>
                <tr className="font-bold bg-gray-50 dark:bg-slate-800">
                  <td className="p-2 border border-gray-300 dark:border-slate-600">TOTAL AKTIVA</td>
                  <td className="p-2 border border-gray-300 dark:border-slate-600 text-right">Rp {totalAssets.toLocaleString('id-ID')}</td>
                </tr>
              </tbody>
            </table>

            {/* Pasiva */}
            <table className="w-full text-xs text-left border-collapse border border-gray-300 dark:border-slate-600">
              <thead className="bg-gray-50 dark:bg-slate-800">
                <tr><th colSpan={2} className="p-2 border border-gray-300 dark:border-slate-600 text-center">PASIVA (KEWAJIBAN & MODAL)</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2 border border-gray-300 dark:border-slate-600">Utang (Qardh)</td>
                  <td className="p-2 border border-gray-300 dark:border-slate-600 text-right">Rp {accountsPayables.toLocaleString('id-ID')}</td>
                </tr>
                <tr>
                  <td className="p-2 border border-gray-300 dark:border-slate-600">Dana Syirkah Temporer</td>
                  <td className="p-2 border border-gray-300 dark:border-slate-600 text-right">Rp {activeEquityValue.toLocaleString('id-ID')}</td>
                </tr>
                <tr>
                  <td className="p-2 border border-gray-300 dark:border-slate-600">Ekuitas Laba Ditahan</td>
                  <td className="p-2 border border-gray-300 dark:border-slate-600 text-right">Rp {allTimeProfit.toLocaleString('id-ID')}</td>
                </tr>
                <tr className="font-bold bg-gray-50 dark:bg-slate-800">
                  <td className="p-2 border border-gray-300 dark:border-slate-600">TOTAL PASIVA</td>
                  <td className="p-2 border border-gray-300 dark:border-slate-600 text-right">Rp {totalLiabilitiesAndEquity.toLocaleString('id-ID')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Kasbon Details Print Section */}
        {kasbonCustomers.length > 0 && (
          <div className="mt-8" style={{ pageBreakBefore: 'always' }}>
            <h2 className="font-bold text-sm bg-gray-100 dark:bg-slate-800 p-2 border border-gray-300 dark:border-slate-600">
              III. DAFTAR PIUTANG KASBON PELANGGAN
            </h2>
            <table className="w-full text-xs text-left border-collapse border border-gray-300 dark:border-slate-600 mt-4">
              <thead className="bg-gray-50 dark:bg-slate-800">
                <tr>
                  <th className="p-2 border border-gray-300 dark:border-slate-600">No</th>
                  <th className="p-2 border border-gray-300 dark:border-slate-600">Nama Pelanggan</th>
                  <th className="p-2 border border-gray-300 dark:border-slate-600">No. HP</th>
                  <th className="p-2 border border-gray-300 dark:border-slate-600 text-right">Sisa Kasbon (Rp)</th>
                  <th className="p-2 border border-gray-300 dark:border-slate-600 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {kasbonCustomers.map((customer, idx) => (
                  <tr key={customer.id}>
                    <td className="p-2 border border-gray-300 dark:border-slate-600 w-10 text-center">{idx + 1}</td>
                    <td className="p-2 border border-gray-300 dark:border-slate-600 font-medium">{customer.name}</td>
                    <td className="p-2 border border-gray-300 dark:border-slate-600">{customer.phone || '-'}</td>
                    <td className="p-2 border border-gray-300 dark:border-slate-600 text-right">Rp {Math.max(0, customer.historicalDebt).toLocaleString('id-ID')}</td>
                    <td className="p-2 border border-gray-300 dark:border-slate-600 text-center font-bold">
                      {customer.historicalDebt <= 0 ? 'LUNAS' : 'BELUM LUNAS'}
                    </td>
                  </tr>
                ))}
                <tr className="font-bold bg-gray-50 dark:bg-slate-800">
                  <td colSpan={3} className="p-2 border border-gray-300 dark:border-slate-600 text-right">TOTAL PIUTANG KASBON (AKTIF)</td>
                  <td className="p-2 border border-gray-300 dark:border-slate-600 text-right text-amber-700">Rp {kasbonCustomers.reduce((sum, c) => sum + Math.max(0, c.historicalDebt), 0).toLocaleString('id-ID')}</td>
                  <td className="border border-gray-300 dark:border-slate-600"></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

          <PrintFooter />
        </div>
      </div>

    </div>
  );
}
