import React, { useState, useMemo } from 'react';
import { useBranchData } from '../hooks/useBranchData';
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
  PieChart as PieChartIcon
} from 'lucide-react';

type DateRange = 'TODAY' | '7_DAYS' | '30_DAYS' | 'THIS_YEAR';

export default function TrendPage() {
  const { transactions, expenses, products, activeBranchId } = useBranchData();
  const [dateRange, setDateRange] = useState<DateRange>('7_DAYS');

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => !tx.isVoided && (!activeBranchId || tx.branchId === activeBranchId || !tx.branchId));
  }, [transactions, activeBranchId]);

  const { chartData, totals, comparisons, ratios } = useMemo(() => {
    const now = new Date();
    let startDate = new Date();
    let prevStartDate = new Date();
    let prevEndDate = new Date();
    let label = '7 Hari Terakhir';

    if (dateRange === 'TODAY') {
      startDate.setHours(0, 0, 0, 0);
      prevStartDate.setDate(now.getDate() - 1);
      prevStartDate.setHours(0, 0, 0, 0);
      prevEndDate.setDate(now.getDate() - 1);
      prevEndDate.setHours(23, 59, 59, 999);
      label = 'Hari Ini';
    } else if (dateRange === '7_DAYS') {
      startDate.setDate(now.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      prevStartDate.setDate(now.getDate() - 13);
      prevStartDate.setHours(0, 0, 0, 0);
      prevEndDate.setDate(now.getDate() - 7);
      prevEndDate.setHours(23, 59, 59, 999);
      label = '7 Hari Terakhir';
    } else if (dateRange === '30_DAYS') {
      startDate.setDate(now.getDate() - 29);
      startDate.setHours(0, 0, 0, 0);
      prevStartDate.setDate(now.getDate() - 59);
      prevStartDate.setHours(0, 0, 0, 0);
      prevEndDate.setDate(now.getDate() - 30);
      prevEndDate.setHours(23, 59, 59, 999);
      label = '30 Hari Terakhir';
    } else if (dateRange === 'THIS_YEAR') {
      startDate = new Date(now.getFullYear(), 0, 1);
      prevStartDate = new Date(now.getFullYear() - 1, 0, 1);
      prevEndDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
      label = 'Tahun Ini';
    }

    const currentTxs = filteredTransactions.filter(t => new Date(t.timestamp) >= startDate);
    const prevTxs = filteredTransactions.filter(t => {
      const d = new Date(t.timestamp);
      return d >= prevStartDate && d <= prevEndDate;
    });

    const currentExps = (expenses || []).filter(e => new Date(e.date) >= startDate);
    const prevExps = (expenses || []).filter(e => {
      const d = new Date(e.date);
      return d >= prevStartDate && d <= prevEndDate;
    });

    const aggregate = (txs, exps) => {
      const acc = txs.reduce((a, t) => {
        a.omset += t.totalAmount;
        a.margin += t.marginContribution || 0;
        a.zakat += t.zakatContribution || 0;
        a.count += 1;
        return a;
      }, { omset: 0, margin: 0, zakat: 0, count: 0 });
      
      const totalExp = exps.reduce((a, e) => a + (Number(e.amount) || 0), 0);
      return { ...acc, expenses: totalExp, netProfit: acc.margin - totalExp };
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
      if (dateRange === 'THIS_YEAR') {
        key = d.toLocaleString('id-ID', { month: 'short' });
      } else {
        key = d.toLocaleString('id-ID', { day: '2-digit', month: 'short' });
      }
      
      if (!mapData.has(key)) {
        mapData.set(key, { name: key, omset: 0, margin: 0, zakat: 0 });
      }
      const existing = mapData.get(key);
      existing.omset += t.totalAmount;
      existing.margin += t.marginContribution || 0;
      existing.zakat += t.zakatContribution || 0;
    });

    let finalChartData = [];
    if (dateRange !== 'THIS_YEAR') {
      const daysCount = dateRange === 'TODAY' ? 1 : dateRange === '7_DAYS' ? 7 : 30;
      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const key = d.toLocaleString('id-ID', { day: '2-digit', month: 'short' });
        finalChartData.push(mapData.get(key) || { name: key, omset: 0, margin: 0, zakat: 0 });
      }
    } else {
      for (let i = 0; i < 12; i++) {
        const d = new Date(now.getFullYear(), i, 1);
        const key = d.toLocaleString('id-ID', { month: 'short' });
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
  }, [filteredTransactions, dateRange, expenses, transactions, products]);

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

  const renderGrowth = (value: number) => {
    if (value > 0) return <span className="bg-green-50 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded border border-green-100">+{value.toFixed(1)}%</span>;
    if (value < 0) return <span className="bg-red-50 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded border border-red-100">{value.toFixed(1)}%</span>;
    return <span className="bg-slate-50 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200">0%</span>;
  };

  return (
    <div className="space-y-6">
      {/* Date Filter Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Grafik Trend & Analitik
          </h1>
          <p className="text-xs text-gray-500 mt-1">Bandingkan performa omset, margin, dan zakat.</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as DateRange)}
            className="text-sm font-bold text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-green-500 outline-none"
          >
            <option value="TODAY">Hari Ini</option>
            <option value="7_DAYS">7 Hari Terakhir</option>
            <option value="30_DAYS">30 Hari Terakhir</option>
            <option value="THIS_YEAR">Tahun Ini</option>
          </select>
        </div>
      </div>

      {/* Visual Analytics Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
          <p className="text-gray-400 text-xs font-semibold">Omset {totals.label}</p>
          <div className="flex items-baseline justify-between mt-1">
            <h3 className="text-xl font-extrabold text-gray-800">Rp {totals.omset.toLocaleString('id-ID')}</h3>
            {renderGrowth(comparisons.omset)}
          </div>
          <p className="text-[10px] text-gray-400 mt-2 font-medium">Berdasar periode kalender berjalan</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
          <p className="text-gray-400 text-xs font-semibold">Sirkulasi Profit Bersih (Margin)</p>
          <div className="flex items-baseline justify-between mt-1">
            <h3 className="text-xl font-extrabold text-gray-800">Rp {totals.margin.toLocaleString('id-ID')}</h3>
            <div className="flex flex-col items-end gap-1">
              {renderGrowth(comparisons.margin)}
              <span className="text-green-700 text-[10px] font-bold font-mono">{(totals.omset > 0 ? (totals.margin/totals.omset) * 100 : 0).toFixed(1)}% Rate</span>
            </div>
          </div>
          <p className="text-[10px] text-gray-400 mt-2 font-medium">Margin berdasar transaksi rill kasir</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
          <p className="text-gray-400 text-xs font-semibold">Himpunan Zakat (Est. Penjualan)</p>
          <div className="flex items-baseline justify-between mt-1">
            <h3 className="text-xl font-extrabold text-green-800">Rp {totals.zakat.toLocaleString('id-ID')}</h3>
            {renderGrowth(comparisons.zakat)}
          </div>
          <p className="text-[10px] text-gray-400 mt-2 font-medium">Potensi Zakat perniagaan yang terkumpul</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
          <p className="text-gray-400 text-xs font-semibold">Rata-rata Transaksi Pembeli</p>
          <div className="flex items-baseline justify-between mt-1">
            <h3 className="text-xl font-extrabold text-gray-800">Rp {averageTxValue.toLocaleString('id-ID', {maximumFractionDigits: 0})}</h3>
            <span className="text-gray-400 text-xs font-medium font-mono">{totals.count} Struk</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-2 font-medium">Rata-rata nilai per belanja struk</p>
        </div>
      </div>

      {/* Main Charts area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Sales Omset & Profit Trend chart Area - Left (8 Cols) */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-bold text-gray-800 text-sm">Grafik Perkembangan Penjualan</h2>
              <p className="text-[11px] text-gray-400 mt-0.5">Analisa komparatif harian omset dan margin bersih KSA Mart</p>
            </div>
            
            <div className="flex items-center space-x-4 text-xs font-semibold">
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="text-gray-500">Omset</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span className="text-gray-500">Margin</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                <span className="text-gray-500">Zakat</span>
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorOmset" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
                  </linearGradient>
                  <linearGradient id="colorMargin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05}/>
                  </linearGradient>
                  <linearGradient id="colorZakat" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => [`Rp ${value.toLocaleString('id-ID')}`]}
                />
                <Area type="monotone" dataKey="omset" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorOmset)" name="Omset Dagang" />
                <Area type="monotone" dataKey="margin" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorMargin)" name="Margin Keuntungan" />
                <Area type="monotone" dataKey="zakat" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorZakat)" name="Zakat Terkumpul" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categories distribution panel - Right (4 Cols) */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="font-bold text-gray-800 text-sm">Distribusi Kategori Produk</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">Penjualan berdasarkan kelompok barang halalan</p>
          </div>

          <div className="h-44 w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
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
              <p className="text-[10px] text-slate-500 font-semibold font-mono">{categoryShare.length > 0 ? categoryShare[0].value : 0}%</p>
            </div>
          </div>

          {/* Table index indicators */}
          <div className="space-y-2 mt-4 text-xs font-semibold">
            {categoryShare.map((entry, idx) => (
              <div key={idx} className="flex items-center justify-between text-gray-600">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: entry.color }}></span>
                  <span className="text-gray-700">{entry.name}</span>
                </div>
                <span className="font-mono">{entry.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      
      {/* Financial Ratios Panel */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-bold text-gray-800 text-sm flex items-center gap-2">
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
          <div className="border border-gray-100 bg-gray-50/50 rounded-xl p-4 hover:border-indigo-200 transition-colors">
            <div className="flex items-center gap-1.5 text-gray-500 mb-2">
              <Percent className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Gross Margin (GPM)</span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-black text-gray-800">{ratios.gpm.toFixed(1)}%</span>
            </div>
            <p className="text-[10px] mt-2 text-gray-500">
              {ratios.gpm >= 20 ? <span className="text-green-600 font-bold flex items-center gap-1"><ShieldCheck className="w-3 h-3"/> Sangat Sehat (&gt;20%)</span> : <span className="text-amber-600 font-bold flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> Perlu Evaluasi HPP</span>}
            </p>
          </div>

          <div className="border border-gray-100 bg-gray-50/50 rounded-xl p-4 hover:border-indigo-200 transition-colors">
            <div className="flex items-center gap-1.5 text-gray-500 mb-2">
              <Target className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Net Margin (NPM)</span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-black text-gray-800">{ratios.npm.toFixed(1)}%</span>
            </div>
            <p className="text-[10px] mt-2 text-gray-500">
              {ratios.npm >= 10 ? <span className="text-green-600 font-bold flex items-center gap-1"><ShieldCheck className="w-3 h-3"/> Sangat Sehat (&gt;10%)</span> : <span className="text-amber-600 font-bold flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> Cek Beban Operasional</span>}
            </p>
          </div>

          <div className="border border-gray-100 bg-gray-50/50 rounded-xl p-4 hover:border-indigo-200 transition-colors">
            <div className="flex items-center gap-1.5 text-gray-500 mb-2">
              <LineChartIcon className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Rasio Operasional (BOPO)</span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-black text-gray-800">{ratios.bopo.toFixed(1)}%</span>
            </div>
            <p className="text-[10px] mt-2 text-gray-500">
              {ratios.bopo <= 70 ? <span className="text-green-600 font-bold flex items-center gap-1"><ShieldCheck className="w-3 h-3"/> Sangat Efisien (&lt;70%)</span> : <span className="text-red-600 font-bold flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> Kurang Efisien</span>}
            </p>
          </div>

          <div className="border border-gray-100 bg-gray-50/50 rounded-xl p-4 hover:border-indigo-200 transition-colors">
            <div className="flex items-center gap-1.5 text-gray-500 mb-2">
              <Activity className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Current Ratio (Lancar)</span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-black text-gray-800">{ratios.currentRatio.toFixed(2)}x</span>
            </div>
            <p className="text-[10px] mt-2 text-gray-500">
              {ratios.currentRatio >= 1.5 ? <span className="text-green-600 font-bold flex items-center gap-1"><ShieldCheck className="w-3 h-3"/> Likuiditas Aman (&gt;1.5x)</span> : <span className="text-amber-600 font-bold flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> Risiko Likuiditas</span>}
            </p>
          </div>

          <div className="border border-gray-100 bg-gray-50/50 rounded-xl p-4 hover:border-indigo-200 transition-colors">
            <div className="flex items-center gap-1.5 text-gray-500 mb-2">
              <PieChartIcon className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Rasio Solvabilitas (DER)</span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-black text-gray-800">{ratios.der.toFixed(2)}x</span>
            </div>
            <p className="text-[10px] mt-2 text-gray-500">
              {ratios.der <= 1.0 ? <span className="text-green-600 font-bold flex items-center gap-1"><ShieldCheck className="w-3 h-3"/> Modal Kuat (&lt;1.0x)</span> : <span className="text-red-600 font-bold flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> Utang Tinggi</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Bar graph comparing accumulated Zakat Funds */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div className="mb-4">
          <h2 className="font-bold text-gray-800 text-sm">Himpunan Dana Kebajikan (Zakat Perdagangan)</h2>
          <p className="text-[11px] text-gray-400 mt-0.5">Estimasi kontribusi dana zakat kemitraan per hari</p>
        </div>

        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                formatter={(value: any) => [`Rp ${value.toLocaleString('id-ID')}`]}
              />
              <Bar dataKey="zakat" fill="#10b981" radius={[4, 4, 0, 0]} name="Zakat Terkumpul (Rp)" barSize={25} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
