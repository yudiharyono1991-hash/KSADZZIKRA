import React, { useState, useMemo } from 'react';
import { useBranchData } from '../hooks/useBranchData';
import { useAppStore } from '../store';
import { 
  AreaChart, 
  Area, 
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
  const { settings, addPettyCashDeposit, journalEntries, getCalculatedPettyCash } = useAppStore();
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

  const { chartData, totals, comparisons, ratios } = useMemo(() => {
    const today = new Date().toLocaleDateString('en-CA');
    const todayTransactions = filteredTransactions.filter(tx => String(tx.timestamp || '').startsWith(today));
    
    // Summary Metrics
    const totalOmset = filteredTransactions.reduce((sum, tx) => sum + (Number(tx.totalAmount) || 0), 0);
    const todayOmset = todayTransactions.reduce((sum, tx) => sum + (Number(tx.totalAmount) || 0), 0);
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
      const acc = txs.reduce((a, t) => {
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

        a.omset += t.totalAmount;
        a.margin += tMargin;
        a.count += 1;
        return a;
      }, { omset: 0, margin: 0, count: 0 });
      
      const totalExp = exps.reduce((a, e) => a + (Number(e.amount) || 0), 0);
      const zakat = acc.margin > 0 ? Math.round(acc.margin * 0.025) : 0;
      return { ...acc, zakat, expenses: totalExp, netProfit: acc.margin - totalExp };
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

      existing.omset += t.totalAmount;
      existing.margin += tMargin;
    });

    // Recalculate Zakat once per aggregated period (e.g., per day/month)
    mapData.forEach(value => {
      value.zakat = value.margin > 0 ? Math.round(value.margin * 0.025) : 0;
    });

    let finalChartData = [];
    if (!isYearly) {
      for (let i = 0; i < daysCount; i++) {
        const d = new Date(startObj);
        d.setDate(startObj.getDate() + i);
        const key = d.toLocaleString('id-ID', { day: '2-digit', month: 'short' });
        finalChartData.push(mapData.get(key) || { name: key, omset: 0, margin: 0, zakat: 0 });
      }
    } else {
      let curr = new Date(startObj);
      curr.setDate(1);
      while (curr <= endDate) {
        const key = curr.toLocaleString('id-ID', { month: 'short', year: 'numeric' });
        finalChartData.push(mapData.get(key) || { name: key, omset: 0, margin: 0, zakat: 0 });
        curr.setMonth(curr.getMonth() + 1);
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
    let totalSales = 0;
    filteredTransactions.forEach(tx => {
      tx.items.forEach(item => {
        // Simplified category mapping since we don't store category in tx.items
        // We'd ideally join with products, but for mock display we'll infer
        const isFood = item.productName.toLowerCase().includes('beras') || item.productName.toLowerCase().includes('gula') || item.productName.toLowerCase().includes('minyak');
        const isFresh = item.productName.toLowerCase().includes('telur') || item.productName.toLowerCase().includes('ayam') || item.productName.toLowerCase().includes('ikan');
        const isDrink = item.productName.toLowerCase().includes('teh') || item.productName.toLowerCase().includes('kopi') || item.productName.toLowerCase().includes('air');
        const cat = isFood ? 'Sembako' : isFresh ? 'Fresh Food' : isDrink ? 'Minuman' : 'Lainnya';
        counts[cat] = (counts[cat] || 0) + (item.price * item.quantity);
        totalSales += (item.price * item.quantity);
      });
    });

    const colors: Record<string, string> = {
      'Sembako': '#047857',
      'Fresh Food': '#fbbf24',
      'Minuman': '#34d399',
      'Lainnya': '#111827'
    };

    return Object.keys(counts).map(k => ({
      name: k,
      value: totalSales > 0 ? Math.round((counts[k] / totalSales) * 100) : 0,
      color: colors[k] || '#9ca3af'
    })).sort((a, b) => b.value - a.value);

  }, [filteredTransactions]);

  const averageTxValue = totals.count > 0 ? totals.omset / totals.count : 0;

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

      {/* Saldo Kas Kecil Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-5 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-50 rounded-xl">
            <Wallet className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Saldo Kas Kecil (Fisik)</p>
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">Rp {dynamicPettyCash.toLocaleString('id-ID')}</h3>
          </div>
        </div>
        <button 
          onClick={() => setShowTopUpModal(true)}
          className="mt-4 md:mt-0 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-sm transition-colors"
        >
          + Top Up Modal Kas Kecil
        </button>
      </div>

      {/* Visual Analytics Quick Stats - Vibrant Gradients */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Omset - Blue Gradient */}
        <div className="relative overflow-hidden bg-blue-600 bg-gradient-to-br from-blue-500 to-cyan-600 p-5 rounded-2xl shadow-lg border-none text-white">
          <div className="absolute -right-4 -bottom-4 opacity-15 transform rotate-12">
            <LineChartIcon className="w-32 h-32" />
          </div>
          <div className="relative z-10">
            <p className="text-white/80 text-xs font-bold uppercase tracking-wider mb-2">Omset {totals.label}</p>
            <div className="flex items-baseline justify-between">
              <h3 className="text-2xl font-extrabold">Rp {totals.omset.toLocaleString('id-ID')}</h3>
            </div>
            <div className="mt-3 flex items-center justify-between">
              {renderGrowth(comparisons.omset, true)}
              <span className="text-white/70 text-[10px] font-medium">Berdasar periode</span>
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
            <div className="mt-3 flex items-center justify-between">
              <span className="text-white bg-white dark:bg-slate-900/20 px-2 py-0.5 rounded text-[11px] font-bold">{(totals.omset > 0 ? (totals.margin/totals.omset) * 100 : 0).toFixed(1)}% Rate</span>
              {renderGrowth(comparisons.margin, true)}
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

          <div className="h-72 w-full">
            <ResponsiveContainer width="99%" height="100%" minWidth={1} minHeight={1}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorOmset" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.05}/>
                  </linearGradient>
                  <linearGradient id="colorMargin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d97706" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#d97706" stopOpacity={0.05}/>
                  </linearGradient>
                  <linearGradient id="colorZakat" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => [`Rp ${value.toLocaleString('id-ID')}`]}
                />
                <Area type="monotone" dataKey="omset" stroke="#059669" strokeWidth={3} fillOpacity={1} fill="url(#colorOmset)" name="Omset Dagang" />
                <Area type="monotone" dataKey="margin" stroke="#d97706" strokeWidth={3} fillOpacity={1} fill="url(#colorMargin)" name="Margin Keuntungan" />
                <Area type="monotone" dataKey="zakat" stroke="#0d9488" strokeWidth={3} fillOpacity={1} fill="url(#colorZakat)" name="Zakat Terkumpul" />
              </AreaChart>
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
                  dataKey="value"
                >
                  {categoryShare.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ fontSize: '11px', borderRadius: '8px' }}
                  formatter={(value) => [`${value}% Share`]}
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
          <div className="space-y-2 mt-4 text-xs font-semibold">
            {categoryShare.map((entry, idx) => (
              <div key={idx} className="flex items-center justify-between text-gray-600 dark:text-slate-400">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: entry.color }}></span>
                  <span className="text-gray-700 dark:text-slate-300">{entry.name}</span>
                </div>
                <span className="font-mono">{entry.value}%</span>
              </div>
            ))}
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
