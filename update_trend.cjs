const fs = require('fs');

const path = 'src/pages/TrendPage.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Update imports
content = content.replace(
  /Calendar\n\} from 'lucide-react';/,
  `Calendar,\n  Activity,\n  Target,\n  ShieldCheck,\n  AlertTriangle,\n  LineChart as LineChartIcon,\n  PieChart as PieChartIcon\n} from 'lucide-react';`
);

// 2. Update useAppStore destructuring
content = content.replace(
  /const \{ transactions, activeBranchId \} = useAppStore\(\);/,
  `const { transactions, activeBranchId, expenses, products, receivablesVal, accountsPayables, equityCapitalInput } = useAppStore();`
);

// 3. Update useMemo for chartData
content = content.replace(
  /const \{ chartData, totals, comparisons \} = useMemo\(\(\) => \{[\s\S]*?\}, \[filteredTransactions, dateRange\]\);/,
  `const { chartData, totals, comparisons, ratios } = useMemo(() => {
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
    const allTimeRevenue = (transactions || []).reduce((sum, tx) => sum + (Number(tx.totalAmount) || 0), 0);
    const allTimeExpenses = (expenses || []).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const initialCapital = 15000000;
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
  }, [filteredTransactions, dateRange, expenses, transactions, products, receivablesVal, accountsPayables, equityCapitalInput]);`
);

// 4. Inject Rasio Keuangan UI before the Bar Chart
const rasioUI = `
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
`;

content = content.replace(
  /\{\/\* Bar graph comparing accumulated Zakat Funds \*\/\}/,
  rasioUI + '\n      {/* Bar graph comparing accumulated Zakat Funds */}'
);

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully updated TrendPage.tsx');
