import React, { useState, useMemo } from 'react';
import { useBranchData } from '../hooks/useBranchData';
import { useAppStore } from '../store';
import { 
  AreaChart, 
  Area, 
  ComposedChart,
  Line,
  LabelList,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Percent, 
  HelpCircle,
  Coins,
  Calendar,
  Activity,
  Target,
  ShieldCheck,
  AlertTriangle,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Wallet
} from 'lucide-react';


export default function TrendPage() {
  const { transactions, expenses, products, activeBranchId } = useBranchData();
  const { settings, addPettyCashDeposit, journalEntries, getCalculatedPettyCash, customers } = useAppStore();
  const todayObj = new Date();
  const firstDay = new Date(todayObj.getFullYear(), todayObj.getMonth(), 1).toLocaleDateString('en-CA');
  const currentDay = todayObj.toLocaleDateString('en-CA');
  
  const [startDateStr, setStartDateStr] = useState(firstDay);
  const [endDateStr, setEndDateStr] = useState(currentDay);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [topUpDesc, setTopUpDesc] = useState('');

  const handleTopUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(topUpAmount) > 0) {
      addPettyCashDeposit(Number(topUpAmount), topUpDesc || 'Top Up Rutin');
      setShowTopUpModal(false);
      setTopUpAmount('');
      setTopUpDesc('');
      alert('Top Up Kas Kecil berhasil dicatat!');
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => !tx.isVoided && (!activeBranchId || tx.branchId === activeBranchId || !tx.branchId));
  }, [transactions, activeBranchId]);

  const dynamicPettyCash = getCalculatedPettyCash();
  const balanceKasKecil = useMemo(() => {
    return (journalEntries || []).reduce((sum, j) => {
      const acc = j.account ? j.account.toLowerCase() : '';
      if (acc.includes('1102') || acc.includes('kas kecil')) {
        return sum + (Number(j.debit || 0) - Number(j.credit || 0));
      }
      return sum;
    }, 0);
  }, [journalEntries]);

  const { chartData, totals, comparisons, ratios } = useMemo(() => {
    const today = new Date().toLocaleDateString('en-CA');
    const todayTransactions = filteredTransactions.filter(tx => String(tx.timestamp || '').startsWith(today));
    
    // Summary Metrics (Excluding PPOB)
    const calculatePhysicalOmset = (txs: any[]) => txs.reduce((sum, tx) => sum + (tx.items?.reduce((s: number, it: any) => {
      const prod = products.find((p: any) => p.id === it.productId);
      if (prod?.isPPOB) return s;
      return s + ((Number(it.price) || 0) * (Number(it.quantity) || 0));
    }, 0) || 0), 0);
    
    const totalOmset = calculatePhysicalOmset(filteredTransactions);
    const todayOmset = calculatePhysicalOmset(todayTransactions);
    const totalTransactions = filteredTransactions.length;
    const todayTransactionsCount = todayTransactions.length;
    
    const totalItemsSold = filteredTransactions.reduce((sum, tx) => sum + (tx.items?.reduce((s, item) => s + Number(item.quantity || 0), 0) || 0), 0);
    const todayItemsSold = todayTransactions.reduce((sum, tx) => sum + (tx.items?.reduce((s, item) => s + Number(item.quantity || 0), 0) || 0), 0);

    const calculateMargin = (txs: any[]) => {
      return txs.reduce((sum, tx) => {
        return sum + (tx.items?.reduce((s: number, it: any) => {
          let cp = Number(it.costPrice || 0);
          if (!cp) {
            const productData = products?.find((p: any) => p.id === it.productId);
            if (productData) {
              const isBox = it.productName?.toLowerCase().includes('(box)');
              cp = isBox ? Number(productData.boxCostPrice || 0) : Number(productData.costPrice || 0);
            }
          }
          return s + ((Number(it.price || 0) - cp) * (Number(it.quantity) || 0));
        }, 0) || 0);
      }, 0);
    };

    const totalMargin = calculateMargin(filteredTransactions);
    const todayMargin = calculateMargin(todayTransactions);
    
    const startObj = new Date(startDateStr);
    const endObj = new Date(endDateStr);
    const diffTime = Math.abs(endObj.getTime() - startObj.getTime());
    const daysCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const isYearly = daysCount > 90;
    const isWeekly = daysCount > 14 && daysCount <= 90;

    let startDate = new Date(startObj);
    startDate.setHours(0, 0, 0, 0);
    let endDate = new Date(endObj);
    endDate.setHours(23, 59, 59, 999);

    let prevStartDate = new Date(startObj);
    prevStartDate.setDate(startObj.getDate() - daysCount);
    let prevEndDate = new Date(startObj);
    prevEndDate.setDate(startObj.getDate() - 1);
    prevEndDate.setHours(23, 59, 59, 999);

    let label = `${startDateStr} s/d ${endDateStr}`;

    const currentTxs = filteredTransactions.filter(t => {
      const d = new Date(t.timestamp);
      return d >= startDate && d <= endDate;
    });
    const prevTxs = filteredTransactions.filter(t => {
      const d = new Date(t.timestamp);
      return d >= prevStartDate && d <= prevEndDate;
    });

    const currentExps = (expenses || []).filter(e => {
      const d = new Date(e.date);
      return d >= startDate && d <= endDate;
    });
    const prevExps = (expenses || []).filter(e => {
      const d = new Date(e.date);
      return d >= prevStartDate && d <= prevEndDate;
    });

    const aggregate = (txs, exps) => {
      const grouped = txs.reduce((a, t) => {
        let txPhysicalOmset = 0;
        let txPpobOmset = 0;
        let txPhysicalHpp = 0;
        let txPpobHpp = 0;

        t.items?.forEach((it: any) => {
          const prod = products.find((p: any) => p.id === it.productId);
          const isPpob = prod?.isPPOB || false;
          
          let cp = Number(it.costPrice || 0);
          if (!cp && prod) {
            const isBox = it.productName?.toLowerCase().includes('(box)');
            cp = isBox ? Number(prod.boxCostPrice || 0) : Number(prod.costPrice || 0);
          }

          const itemOmset = (Number(it.price) || 0) * (Number(it.quantity) || 0);
          const itemHpp = cp * (Number(it.quantity) || 0);

          if (isPpob) {
            txPpobOmset += itemOmset;
            txPpobHpp += itemHpp;
          } else {
            txPhysicalOmset += itemOmset;
            txPhysicalHpp += itemHpp;
          }
        });
        
        const itemSum = txPhysicalOmset + txPpobOmset;
        let finalPhysOmset = txPhysicalOmset;
        let finalPpobOmset = txPpobOmset;
        if (itemSum > 0) {
          finalPhysOmset = Math.round((Number(t.totalAmount) || 0) * (txPhysicalOmset / itemSum));
          finalPpobOmset = (Number(t.totalAmount) || 0) - finalPhysOmset;
        } else {
          finalPhysOmset = Number(t.totalAmount) || 0;
          finalPpobOmset = 0;
        }

        const totalCalcM = (txPhysicalOmset - txPhysicalHpp) + (txPpobOmset - txPpobHpp);
        let finalPhysMargin = txPhysicalOmset - txPhysicalHpp;
        let finalPpobMargin = txPpobOmset - txPpobHpp;
        const totalTxMargin = Number(t.marginContribution || 0);
        if (totalCalcM > 0) {
          const ratio = totalTxMargin / totalCalcM;
          finalPhysMargin = Math.round((txPhysicalOmset - txPhysicalHpp) * ratio);
          finalPpobMargin = totalTxMargin - finalPhysMargin;
        } else {
          finalPhysMargin = totalTxMargin;
          finalPpobMargin = 0;
        }

        a.omset += finalPhysOmset;
        a.omset_ppob += finalPpobOmset;
        a.hpp_fisik += txPhysicalHpp;
        a.hpp_ppob += txPpobHpp;
        a.margin += totalTxMargin;
        a.margin_fisik += finalPhysMargin;
        a.margin_ppob += finalPpobMargin;
        a.count += 1;
        return a;
      }, { omset: 0, omset_ppob: 0, hpp_fisik: 0, hpp_ppob: 0, margin: 0, margin_fisik: 0, margin_ppob: 0, count: 0 });
      
      const totalExp = exps.reduce((a, e) => a + (Number(e.amount) || 0), 0);
      const zakat = grouped.margin > 0 ? Math.round(grouped.margin * 0.025) : 0;
      return { ...grouped, zakat, expenses: totalExp, netProfit: grouped.margin - totalExp };
    };

    const curTotals = aggregate(currentTxs, currentExps);
    const prevTotals = aggregate(prevTxs, prevExps);

    const calcGrowth = (cur, prev) => {
      if (prev === 0) return cur > 0 ? 100 : 0;
      return ((cur - prev) / prev) * 100;
    };

    const mapData = new Map();
    currentTxs.forEach(t => {
      const d = new Date(t.timestamp);
      let key = '';
      if (isYearly) {
        key = d.toLocaleString('id-ID', { month: 'short', year: 'numeric' });
      } else if (isWeekly) {
        const diff = Math.floor((d.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const weekNum = Math.floor(diff / 7);
        const weekStart = new Date(startDate);
        weekStart.setDate(weekStart.getDate() + (weekNum * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        if (weekEnd > endDate) weekEnd.setTime(endDate.getTime());
        
        key = `${weekStart.getDate()} - ${weekEnd.getDate()} ${weekEnd.toLocaleString('id-ID', { month: 'short' })}`;
      } else {
        key = d.toLocaleString('id-ID', { day: '2-digit', month: 'short' });
      }
      
      if (!mapData.has(key)) {
        mapData.set(key, { name: key, omset: 0, margin: 0, zakat: 0 });
      }
      const existing = mapData.get(key);
      
      const tMargin = t.items?.reduce((s: number, it: any) => {
        let cp = Number(it.costPrice || 0);
        if (!cp) {
          const productData = products?.find((p: any) => p.id === it.productId);
          if (productData) {
            const isBox = it.productName?.toLowerCase().includes('(box)');
            cp = isBox ? Number(productData.boxCostPrice || 0) : Number(productData.costPrice || 0);
          }
        }
        return s + ((Number(it.price || 0) - cp) * (Number(it.quantity) || 0));
      }, 0) || 0;

      const physicalOmset = t.items?.reduce((s: number, it: any) => {
        const prod = products.find((p: any) => p.id === it.productId);
        if (prod?.isPPOB) return s;
        return s + ((Number(it.price) || 0) * (Number(it.quantity) || 0));
      }, 0) || 0;
      
      existing.omset += physicalOmset;
      existing.margin += tMargin;
    });

    // Recalculate Zakat once per aggregated period (e.g., per day/month)
    mapData.forEach(value => {
      value.zakat = value.margin > 0 ? Math.round(value.margin * 0.025) : 0;
    });

    let finalChartData = [];
    if (isYearly) {
      let curr = new Date(startObj);
      curr.setDate(1);
      while (curr <= endDate) {
        const key = curr.toLocaleString('id-ID', { month: 'short', year: 'numeric' });
        finalChartData.push(mapData.get(key) || { name: key, omset: 0, margin: 0, zakat: 0 });
        curr.setMonth(curr.getMonth() + 1);
      }
    } else if (isWeekly) {
      const numWeeks = Math.ceil(daysCount / 7);
      for (let i = 0; i < numWeeks; i++) {
        const weekStart = new Date(startObj);
        weekStart.setDate(weekStart.getDate() + (i * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        if (weekEnd > endDate) weekEnd.setTime(endDate.getTime());
        
        const key = `${weekStart.getDate()} - ${weekEnd.getDate()} ${weekEnd.toLocaleString('id-ID', { month: 'short' })}`;
        finalChartData.push(mapData.get(key) || { name: key, omset: 0, margin: 0, zakat: 0 });
      }
    } else {
      for (let i = 0; i < daysCount; i++) {
        const d = new Date(startObj);
        d.setDate(startObj.getDate() + i);
        const key = d.toLocaleString('id-ID', { day: '2-digit', month: 'short' });
        finalChartData.push(mapData.get(key) || { name: key, omset: 0, margin: 0, zakat: 0 });
      }
    }

    // Ratios Calculation
    const gpm = curTotals.omset > 0 ? (curTotals.margin / curTotals.omset) * 100 : 0;
    const npm = curTotals.omset > 0 ? (curTotals.netProfit / curTotals.omset) * 100 : 0;
    const bopo = curTotals.margin > 0 ? (curTotals.expenses / curTotals.margin) * 100 : 0;
    
    // Liquidity/Solvency snapshot
    const receivablesVal = Number(localStorage.getItem('ksa_neraca_receivables') || 0);
    const accountsPayables = Number(localStorage.getItem('ksa_neraca_payables') || 0);
    const equityCapitalInput = Number(localStorage.getItem('ksa_neraca_equity') || 0);

    const allTimeRevenue = (transactions || []).reduce((sum, tx) => sum + (Number(tx.totalAmount) || 0), 0);
    const allTimeExpenses = (expenses || []).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const initialCapital = Number(localStorage.getItem('ksa_neraca_initial_capital') || 0);
    const cashOnHand = initialCapital + allTimeRevenue - allTimeExpenses;
    const inventoryVal = (products || []).reduce((sum, p) => sum + ((Number(p.costPrice) || 0) * (Number(p.stock) || 0)), 0);
    
    const currentAssets = cashOnHand + inventoryVal + Number(receivablesVal || 0);
    const currentLiabs = Number(accountsPayables || 0);
    
    const currentRatio = currentLiabs > 0 ? (currentAssets / currentLiabs) : (currentAssets > 0 ? 99.99 : 0);
    const equityVal = Number(equityCapitalInput || 0);
    const der = equityVal > 0 ? (currentLiabs / equityVal) : 0;

    return {
      chartData: finalChartData,
      totals: { ...curTotals, label },
      comparisons: {
        omset: calcGrowth(curTotals.omset, prevTotals.omset),
        margin: calcGrowth(curTotals.margin, prevTotals.margin),
        zakat: calcGrowth(curTotals.zakat, prevTotals.zakat),
      },
      ratios: {
        gpm,
        npm,
        bopo,
        currentRatio,
        der
      }
    };
  }, [filteredTransactions, startDateStr, endDateStr, expenses, transactions, products]);

  const categoryShare = useMemo(() => {
    const counts: Record<string, number> = {};
    const qtyCounts: Record<string, number> = {};
    let totalSales = 0;
    
    // Vibrant colors for dynamic categories
    const palette = ['#047857', '#fbbf24', '#34d399', '#3b82f6', '#f43f5e', '#8b5cf6', '#f97316', '#06b6d4', '#10b981', '#ec4899', '#6366f1'];
    
    const startObj = new Date(startDateStr);
    startObj.setHours(0, 0, 0, 0);
    const endObj = new Date(endDateStr);
    endObj.setHours(23, 59, 59, 999);

    const currentTxs = filteredTransactions.filter(t => {
      const d = new Date(t.timestamp);
      return d >= startObj && d <= endObj;
    });

    currentTxs.forEach(tx => {
      tx.items.forEach(item => {
        let cat = 'Tanpa Kategori';
        if (products && products.length > 0) {
          const prod = products.find(p => p.id === item.productId);
          if (prod && prod.category) {
            cat = prod.category;
          }
        }
        
        counts[cat] = (counts[cat] || 0) + (item.price * item.quantity);
        qtyCounts[cat] = (qtyCounts[cat] || 0) + item.quantity;
        totalSales += (item.price * item.quantity);
      });
    });

    const result = Object.keys(counts).map((k, idx) => ({
      name: k,
      value: totalSales > 0 ? Math.round((counts[k] / totalSales) * 100) : 0,
      totalRp: counts[k],
      qty: qtyCounts[k],
      color: palette[idx % palette.length]
    })).sort((a, b) => b.totalRp - a.totalRp);
    
    // Group small categories (< 2%) into 'Lainnya' if there are too many
    let finalResult = [];
    let othersValue = 0;
    let othersRp = 0;
    let othersQty = 0;
    
    result.forEach((item, idx) => {
      if (idx > 6 || item.value < 2) {
        othersValue += item.value;
        othersRp += item.totalRp;
        othersQty += item.qty;
      } else {
        finalResult.push(item);
      }
    });
    
    if (othersValue > 0) {
      finalResult.push({ name: 'Lainnya', value: othersValue, totalRp: othersRp, qty: othersQty, color: '#475569' });
    }

    return finalResult.sort((a, b) => b.value - a.value);
  }, [filteredTransactions, products, startDateStr, endDateStr]);

  const averageTxValue = totals.count > 0 ? totals.omset / totals.count : 0;

  const topCustomers = useMemo(() => {
    if (!customers) return [];
    
    // Hitung jumlah transaksi per customer
    const txCounts: Record<string, number> = {};
    filteredTransactions.forEach(tx => {
      if (tx.customerId) {
        txCounts[tx.customerId] = (txCounts[tx.customerId] || 0) + 1;
      }
    });

    return [...customers]
      .filter(c => (c.points || 0) > 0)
      .sort((a, b) => (b.points || 0) - (a.points || 0))
      .slice(0, 10)
      .map(c => ({
        id: c.id,
        name: c.name.length > 15 ? c.name.substring(0, 15) + '...' : c.name,
        fullName: c.name,
        points: c.points || 0,
        txCount: txCounts[c.id] || 0
      }));
  }, [customers, filteredTransactions]);

  const formatSingkat = (val: number) => {
    if (val >= 1000000000) return (val/1000000000).toFixed(1) + 'M'; // Milyar
    if (val >= 1000000) return (val/1000000).toFixed(1) + 'Jt'; // Juta
    if (val >= 1000) return (val/1000).toFixed(0) + 'Rb'; // Ribu
    return val.toString();
  };

  const renderGrowth = (value: number, isDark = false) => {
    if (value > 0) return <span className={`${isDark ? 'text-green-200' : 'bg-green-50 text-green-700 border border-green-100'} text-[11px] font-bold px-2 py-0.5 rounded`}>+{value.toFixed(1)}%</span>;
    if (value < 0) return <span className={`${isDark ? 'text-red-200' : 'bg-red-50 text-red-700 border border-red-100'} text-[11px] font-bold px-2 py-0.5 rounded`}>{value.toFixed(1)}%</span>;
    return <span className={`${isDark ? 'text-white/70' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'} text-[11px] font-bold px-2 py-0.5 rounded`}>0%</span>;
  };

  return (
    <div className="space-y-6">
      {/* Date Filter Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-slate-200 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Grafik Trend & Analitik
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Bandingkan performa omset, margin, dan zakat.</p>
        </div>
          <div className="flex items-center space-x-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 print:hidden">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input 
              type="date" 
              value={startDateStr} 
              onChange={e => setStartDateStr(e.target.value)}
              className="bg-transparent text-sm font-bold text-slate-700 dark:text-slate-300 outline-none w-32"
            />
            <span className="text-slate-400 text-sm">s/d</span>
            <input 
              type="date" 
              value={endDateStr} 
              onChange={e => setEndDateStr(e.target.value)}
              className="bg-transparent text-sm font-bold text-slate-700 dark:text-slate-300 outline-none w-32"
            />
          </div>
      </div>

      {/* Saldo Kas Utama & Kas Kecil Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex justify-between items-center p-4 bg-teal-50/60 dark:bg-teal-950/40 rounded-2xl border border-teal-200 dark:border-teal-800 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-teal-100 dark:bg-teal-900/60 rounded-xl">
              <Wallet className="w-6 h-6 text-teal-700 dark:text-teal-300" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-teal-800 dark:text-teal-300 uppercase tracking-wider">Kas Utama Toko (1101 - Laci)</p>
              <h3 className="text-xl font-black text-teal-950 dark:text-teal-100">Rp {dynamicPettyCash.toLocaleString('id-ID')}</h3>
            </div>
          </div>
          <span className="text-[10px] font-bold bg-teal-100 text-teal-800 dark:bg-teal-900/80 dark:text-teal-200 px-2.5 py-1 rounded-full">Uang Laci POS</span>
        </div>

        <div className="flex justify-between items-center p-4 bg-amber-50/60 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-800 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/60 rounded-xl">
              <Wallet className="w-6 h-6 text-amber-700 dark:text-amber-300" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">Saldo Kas Kecil Toko (1102)</p>
              <h3 className="text-xl font-black text-amber-950 dark:text-amber-100">Rp {balanceKasKecil.toLocaleString('id-ID')}</h3>
            </div>
          </div>
          <button 
            onClick={() => setShowTopUpModal(true)}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-xs transition-colors shadow-sm"
          >
            + Top Up Kas Kecil
          </button>
        </div>
      </div>

      {/* Visual Analytics Quick Stats - Vibrant Gradients */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        
        {/* Omset - Blue Gradient */}
        <div className="relative overflow-hidden bg-blue-600 bg-gradient-to-br from-blue-500 to-cyan-600 p-5 rounded-2xl shadow-lg border-none text-white">
          <div className="absolute -right-4 -bottom-4 opacity-15 transform rotate-12">
            <LineChartIcon className="w-32 h-32" />
          </div>
          <div className="relative z-10">
            <p className="text-white/80 text-xs font-bold uppercase tracking-wider mb-2">Total Omset {totals.label}</p>
            <div className="flex items-baseline justify-between">
              <h3 className="text-2xl font-extrabold">Rp {(totals.omset + totals.omset_ppob).toLocaleString('id-ID')}</h3>
            </div>
            <div className="mt-3 flex flex-col gap-1">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-white/80">Fisik:</span>
                <span className="font-bold">Rp {totals.omset.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-white/80">PPOB:</span>
                <span className="font-bold">Rp {totals.omset_ppob.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* HPP - Slate Gradient */}
        <div className="relative overflow-hidden bg-slate-600 bg-gradient-to-br from-slate-500 to-slate-700 p-5 rounded-2xl shadow-lg border-none text-white">
          <div className="absolute -right-4 -bottom-4 opacity-15 transform rotate-12">
            <TrendingUp className="w-32 h-32" />
          </div>
          <div className="relative z-10">
            <p className="text-white/80 text-[11px] font-bold uppercase tracking-wider mb-2">Total HPP (Modal Pokok)</p>
            <div className="flex items-baseline justify-between">
              <h3 className="text-2xl font-extrabold">Rp {(totals.hpp_fisik + totals.hpp_ppob).toLocaleString('id-ID')}</h3>
            </div>
            <div className="mt-3 flex flex-col gap-1">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-white/80">HPP Fisik:</span>
                <span className="font-bold">Rp {totals.hpp_fisik.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-white/80">HPP PPOB:</span>
                <span className="font-bold">Rp {totals.hpp_ppob.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Margin - Orange Gradient */}
        <div className="relative overflow-hidden bg-orange-500 bg-gradient-to-br from-orange-400 to-orange-600 p-5 rounded-2xl shadow-lg border-none text-white">
          <div className="absolute -right-4 -bottom-4 opacity-15 transform rotate-12">
            <PieChartIcon className="w-32 h-32" />
          </div>
          <div className="relative z-10">
            <p className="text-white/80 text-xs font-bold uppercase tracking-wider mb-2">Sirkulasi Profit (Margin)</p>
            <div className="flex items-baseline justify-between">
              <h3 className="text-2xl font-extrabold">Rp {totals.margin.toLocaleString('id-ID')}</h3>
            </div>
            <div className="mt-3 flex flex-col gap-1">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-white/80">Profit Fisik:</span>
                <span className="font-bold">Rp {totals.margin_fisik.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-white/80">Profit PPOB:</span>
                <span className="font-bold">Rp {totals.margin_ppob.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Zakat - Green Gradient */}
        <div className="relative overflow-hidden bg-emerald-500 bg-gradient-to-br from-emerald-400 to-emerald-600 p-5 rounded-2xl shadow-lg border-none text-white">
          <div className="absolute -right-4 -bottom-4 opacity-15 transform rotate-12">
            <AlertTriangle className="w-32 h-32" />
          </div>
          <div className="relative z-10">
            <p className="text-white/80 text-xs font-bold uppercase tracking-wider mb-2">Himpunan Zakat (Est.)</p>
            <div className="flex items-baseline justify-between">
              <h3 className="text-2xl font-extrabold">Rp {Math.round(totals.zakat).toLocaleString('id-ID')}</h3>
            </div>
            <div className="mt-3 flex items-center justify-between">
              {renderGrowth(comparisons.zakat, true)}
              <span className="text-white/70 text-[10px] font-medium">Potensi Zakat</span>
            </div>
          </div>
        </div>

        {/* Average Tx - Purple Gradient */}
        <div className="relative overflow-hidden bg-indigo-500 bg-gradient-to-br from-purple-500 to-indigo-600 p-5 rounded-2xl shadow-lg border-none text-white">
          <div className="absolute -right-4 -bottom-4 opacity-15 transform rotate-12">
            <Users className="w-32 h-32" />
          </div>
          <div className="relative z-10">
            <p className="text-white/80 text-xs font-bold uppercase tracking-wider mb-2">Rata-rata Transaksi</p>
            <div className="flex items-baseline justify-between">
              <h3 className="text-2xl font-extrabold">Rp {averageTxValue.toLocaleString('id-ID', {maximumFractionDigits: 0})}</h3>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-white bg-white dark:bg-slate-900/20 px-2 py-0.5 rounded text-[11px] font-bold">{totals.count} Struk</span>
              <span className="text-white/70 text-[10px] font-medium">Per struk</span>
            </div>
          </div>
        </div>
      </div>



      {/* Main Charts area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Sales Omset & Profit Trend chart Area - Left (8 Cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-bold text-gray-800 dark:text-slate-200 text-sm">Grafik Perkembangan Penjualan</h2>
              <p className="text-[11px] text-gray-400 mt-0.5">Analisa komparatif harian omset dan margin bersih KSA Mart</p>
            </div>
            
            <div className="flex items-center space-x-4 text-xs font-semibold">
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="text-gray-500 dark:text-slate-400">Omset</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span className="text-gray-500 dark:text-slate-400">Margin</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                <span className="text-gray-500 dark:text-slate-400">Zakat</span>
              </span>
            </div>
          </div>

          <div className="h-80 w-full mt-4">
            <ResponsiveContainer width="99%" height="100%" minWidth={1} minHeight={1}>
              <ComposedChart data={chartData} margin={{ top: 25, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorOmset" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.2}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `Rp ${formatSingkat(val)}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => [`Rp ${value.toLocaleString('id-ID')}`]}
                  cursor={{fill: '#f8fafc'}}
                />
                <Bar dataKey="omset" fill="url(#colorOmset)" radius={[4, 4, 0, 0]} barSize={40} name="Omset Dagang">
                  {chartData.length <= 15 && (
                    <LabelList dataKey="omset" position="top" fill="#64748b" fontSize={10} formatter={(val: number) => val > 0 ? formatSingkat(val) : ''} />
                  )}
                </Bar>
                <Line type="monotone" dataKey="margin" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} name="Margin Keuntungan" />
                <Line type="monotone" dataKey="zakat" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 4 }} name="Zakat Terkumpul" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categories distribution panel - Right (4 Cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="font-bold text-gray-800 dark:text-slate-200 text-sm">Distribusi Kategori Produk</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">Penjualan berdasarkan kelompok barang halalan</p>
          </div>

          <div className="h-44 w-full flex items-center justify-center relative">
            <ResponsiveContainer width="99%" height="100%" minWidth={1} minHeight={1}>
              <PieChart>
                <Pie
                  data={categoryShare}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="totalRp"
                >
                  {categoryShare.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ fontSize: '11px', borderRadius: '8px' }}
                  formatter={(value: any, name: any, props: any) => {
                    const percent = props.payload.value;
                    return [`Rp ${value.toLocaleString('id-ID')} (${percent}%)`];
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Pie Center content */}
            <div className="absolute text-center">
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Utama</p>
              <p className="font-black text-green-950 text-md">{categoryShare.length > 0 ? categoryShare[0].name : 'N/A'}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold font-mono">{categoryShare.length > 0 ? categoryShare[0].value : 0}%</p>
            </div>
          </div>

          {/* Table index indicators */}
          <div className="space-y-1 mt-4 text-[10px]">
            {categoryShare.map((entry, idx) => (
              <div key={idx} className="flex items-center justify-between text-gray-600 dark:text-slate-400 py-1 border-b border-dashed border-gray-100 dark:border-slate-800 last:border-0">
                <div className="flex items-center space-x-1.5 min-w-0 flex-1">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }}></span>
                  <span className="text-gray-700 dark:text-slate-300 font-semibold truncate" title={entry.name}>{entry.name}</span>
                </div>
                <div className="flex items-center justify-end space-x-2 shrink-0">
                  <span className="text-slate-500 font-mono w-6 text-right">{entry.qty}x</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200 w-12 text-right">
                    {formatSingkat(entry.totalRp)}
                  </span>
                  <span className="font-bold text-slate-800 dark:text-white w-8 text-right bg-slate-100 dark:bg-slate-800 rounded px-1">{entry.value}%</span>
                </div>
              </div>
            ))}
            
            {/* Grand Total Row */}
            <div className="flex items-center justify-between text-gray-800 dark:text-slate-200 py-1.5 border-t border-gray-200 dark:border-slate-700 mt-2">
              <div className="flex items-center space-x-1.5 min-w-0 flex-1">
                <span className="font-bold uppercase text-[10px] tracking-wider text-slate-500">Total Kategori</span>
              </div>
              <div className="flex items-center justify-end space-x-2 shrink-0">
                <span className="text-slate-600 dark:text-slate-300 font-mono font-bold w-6 text-right">
                  {categoryShare.reduce((sum, item) => sum + item.qty, 0)}x
                </span>
                <span className="font-black text-slate-800 dark:text-slate-100 w-12 text-right">
                  {formatSingkat(categoryShare.reduce((sum, item) => sum + item.totalRp, 0))}
                </span>
                <span className="font-black text-white w-8 text-right bg-blue-600 dark:bg-blue-500 rounded px-1">100%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      
      {/* Financial Ratios Panel */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xs">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-bold text-gray-800 dark:text-slate-200 text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" />
              Analisa Rasio Keuangan
            </h2>
            <p className="text-[11px] text-gray-400 mt-0.5">Indikator kesehatan finansial dan performa operasional KSA Mart</p>
          </div>
          <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-indigo-100">
            Automated Audit
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4 hover:border-indigo-200 transition-colors">
            <div className="flex items-center gap-1.5 text-gray-500 dark:text-slate-400 mb-2">
              <Percent className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Gross Margin (GPM)</span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-black text-gray-800 dark:text-slate-200">{ratios.gpm.toFixed(1)}%</span>
            </div>
            <p className="text-[10px] mt-2 text-gray-500 dark:text-slate-400">
              {ratios.gpm >= 20 ? <span className="text-green-600 font-bold flex items-center gap-1"><ShieldCheck className="w-3 h-3"/> Sangat Sehat (&gt;20%)</span> : <span className="text-amber-600 font-bold flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> Perlu Evaluasi HPP</span>}
            </p>
          </div>

          <div className="border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4 hover:border-indigo-200 transition-colors">
            <div className="flex items-center gap-1.5 text-gray-500 dark:text-slate-400 mb-2">
              <Target className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Net Margin (NPM)</span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-black text-gray-800 dark:text-slate-200">{ratios.npm.toFixed(1)}%</span>
            </div>
            <p className="text-[10px] mt-2 text-gray-500 dark:text-slate-400">
              {ratios.npm >= 10 ? <span className="text-green-600 font-bold flex items-center gap-1"><ShieldCheck className="w-3 h-3"/> Sangat Sehat (&gt;10%)</span> : <span className="text-amber-600 font-bold flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> Cek Beban Operasional</span>}
            </p>
          </div>

          <div className="border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4 hover:border-indigo-200 transition-colors">
            <div className="flex items-center gap-1.5 text-gray-500 dark:text-slate-400 mb-2">
              <LineChartIcon className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Rasio Operasional (BOPO)</span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-black text-gray-800 dark:text-slate-200">{ratios.bopo.toFixed(1)}%</span>
            </div>
            <p className="text-[10px] mt-2 text-gray-500 dark:text-slate-400">
              {ratios.bopo <= 70 ? <span className="text-green-600 font-bold flex items-center gap-1"><ShieldCheck className="w-3 h-3"/> Sangat Efisien (&lt;70%)</span> : <span className="text-red-600 font-bold flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> Kurang Efisien</span>}
            </p>
          </div>

          <div className="border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4 hover:border-indigo-200 transition-colors">
            <div className="flex items-center gap-1.5 text-gray-500 dark:text-slate-400 mb-2">
              <Activity className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Current Ratio (Lancar)</span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-black text-gray-800 dark:text-slate-200">{ratios.currentRatio.toFixed(2)}x</span>
            </div>
            <p className="text-[10px] mt-2 text-gray-500 dark:text-slate-400">
              {ratios.currentRatio >= 1.5 ? <span className="text-green-600 font-bold flex items-center gap-1"><ShieldCheck className="w-3 h-3"/> Likuiditas Aman (&gt;1.5x)</span> : <span className="text-amber-600 font-bold flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> Risiko Likuiditas</span>}
            </p>
          </div>

          <div className="border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4 hover:border-indigo-200 transition-colors">
            <div className="flex items-center gap-1.5 text-gray-500 dark:text-slate-400 mb-2">
              <PieChartIcon className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Rasio Solvabilitas (DER)</span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-black text-gray-800 dark:text-slate-200">{ratios.der.toFixed(2)}x</span>
            </div>
            <p className="text-[10px] mt-2 text-gray-500 dark:text-slate-400">
              {ratios.der <= 1.0 ? <span className="text-green-600 font-bold flex items-center gap-1"><ShieldCheck className="w-3 h-3"/> Modal Kuat (&lt;1.0x)</span> : <span className="text-red-600 font-bold flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> Utang Tinggi</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Top 10 Customers by Points (Moved above Zakat) */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xs mt-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-bold text-gray-800 dark:text-slate-200 text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" />
              Top 10 Pelanggan (Poin Terbanyak)
            </h2>
            <p className="text-[11px] text-gray-400 mt-0.5">Tabel dan grafik loyalitas pelanggan berdasarkan transaksi</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 w-full">
            <ResponsiveContainer width="99%" height="100%" minWidth={1} minHeight={1}>
              <BarChart data={topCustomers} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} width={100} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => [`${value} Pts`, 'Poin']}
                  labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
                  cursor={{fill: '#f8fafc'}}
                />
                <Bar dataKey="points" radius={[0, 4, 4, 0]} barSize={20}>
                  {
                    topCustomers.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#8b5cf6' : (index < 3 ? '#a78bfa' : '#c4b5fd')} />
                    ))
                  }
                  <LabelList dataKey="points" position="right" fill="#64748b" fontSize={10} formatter={(val: number) => `${val} pts`} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-700">
                  <th className="py-2 px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Nama Pelanggan</th>
                  <th className="py-2 px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center">Jml Transaksi</th>
                  <th className="py-2 px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-right">Total Poin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {topCustomers.map((c, i) => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-2 px-3 text-sm font-semibold text-gray-800 dark:text-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-[10px] font-bold shrink-0">{i+1}</span>
                        <span className="truncate max-w-[120px]" title={c.fullName}>{c.fullName}</span>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-sm font-mono text-center text-gray-600 dark:text-slate-400">{c.txCount}x</td>
                    <td className="py-2 px-3 text-sm font-black text-right text-purple-600 dark:text-purple-400">{c.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bar graph comparing accumulated Zakat Funds */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xs">
        <div className="mb-4">
          <h2 className="font-bold text-gray-800 dark:text-slate-200 text-sm">Himpunan Dana Kebajikan (Zakat Perdagangan)</h2>
          <p className="text-[11px] text-gray-400 mt-0.5">Estimasi kontribusi dana zakat kemitraan per hari</p>
        </div>

        <div className="h-60 w-full">
          <ResponsiveContainer width="99%" height="100%" minWidth={1} minHeight={1}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                formatter={(value: any) => [`Rp ${value.toLocaleString('id-ID')}`]}
                cursor={{fill: '#f8fafc'}}
              />
              <Bar dataKey="zakat" fill="#059669" radius={[4, 4, 0, 0]} name="Zakat Terkumpul (Rp)" barSize={25} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>



      {/* Top Up Kas Kecil Modal */}
      {showTopUpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-amber-500 text-white">
              <h3 className="font-bold text-lg">Top Up Kas Kecil</h3>
              <button onClick={() => setShowTopUpModal(false)} className="text-white/70 hover:text-white text-xl font-bold">×</button>
            </div>
            <form onSubmit={handleTopUpSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1">Nominal Top Up (Rp) *</label>
                <input
                  type="number"
                  required
                  min="1000"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  className="w-full border border-gray-200 dark:border-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-amber-500 outline-none text-xl font-bold bg-white dark:bg-slate-900"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1">Keterangan Tambahan</label>
                <input
                  type="text"
                  value={topUpDesc}
                  onChange={(e) => setTopUpDesc(e.target.value)}
                  className="w-full border border-gray-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none bg-white dark:bg-slate-900"
                  placeholder="Misal: Dari kas utama / ATM"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl mt-4"
              >
                Simpan Saldo Masuk
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
