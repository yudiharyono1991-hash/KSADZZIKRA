import React, { useState } from 'react';
import { useAppStore } from '../store';
import { 
  Calculator, 
  HelpCircle, 
  Save, 
  History, 
  CheckCircle, 
  XCircle,
  Coins,
  BadgeAlert,
  Send,
  Heart,
  Leaf,
  Scale,
  Sparkles,
  Info
} from 'lucide-react';

export default function ZakatPage() {
  const { 
    products, 
    transactions, 
    zakatRecords, 
    addZakatRecord, 
    zakatDistributions, 
    addZakatDistribution,
    currentUser,
    expenses,
    journalEntries
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'CALCULATOR' | 'DISTRIBUTION'>('CALCULATOR');

  // ================= TAB 1: CALCULATOR STATE & LOGIC =================
  const [goldPrice, setGoldPrice] = useState('1450000'); // default 1.45m/g
  
  const initialStoreCapital = (() => {
    const saved = localStorage.getItem('ksa_neraca_initial_capital');
    return saved ? Number(saved) : 0;
  })();
  const savedReceivables = (() => {
    const saved = localStorage.getItem('ksa_neraca_receivables');
    return saved ? Number(saved) : 0;
  })();
  const savedPayables = (() => {
    const saved = localStorage.getItem('ksa_neraca_payables');
    return saved ? Number(saved) : 0;
  })();

  const allTimeRevenue = (transactions || []).reduce((sum, tx) => sum + (Number(tx.totalAmount) || 0), 0);
  const allTimeExpenses = (expenses || []).reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
  const liveCash = initialStoreCapital + allTimeRevenue - allTimeExpenses;
  const livePhysicalInventory = products.reduce((sum, p) => p.isPPOB ? sum : sum + (p.costPrice * p.stock), 0);
  
  // Calculate Radar Balance (Akun 1-1050)
  const radarBalance = (journalEntries || []).reduce((sum, entry) => {
    if (entry && entry.account && typeof entry.account === 'string' && entry.account.startsWith('1-1050')) {
      return sum + (entry.debit || 0) - (entry.credit || 0);
    }
    return sum;
  }, 0);
  
  const liveInventory = livePhysicalInventory + radarBalance;
  
  const [cashAsset, setCashAsset] = useState(liveCash.toString());
  const [inventoryAsset, setInventoryAsset] = useState(liveInventory.toString());
  const [receivableAsset, setReceivableAsset] = useState(savedReceivables.toString());
  const [liabilityAsset, setLiabilityAsset] = useState(savedPayables.toString());
  const [customNotes, setCustomNotes] = useState('');

  const goldPriceNum = Number(goldPrice);
  const nisabValue = 85 * goldPriceNum;
  
  const cashVal = Number(cashAsset);
  const inventoryVal = Number(inventoryAsset);
  const receivableVal = Number(receivableAsset);
  const liabilityVal = Number(liabilityAsset);
  
  const netWealth = (cashVal + inventoryVal + receivableVal) - liabilityVal;
  const isEligible = netWealth >= nisabValue;
  const zakatDue = isEligible ? Math.round(netWealth * 0.025) : 0;

  const handleSaveRecord = () => {
    addZakatRecord({
      tenantId: currentUser?.tenantId || 'tenant_default',
      goldPricePerGram: goldPriceNum,
      nisabValue,
      liquidAssets: cashVal,
      inventoryValue: inventoryVal,
      receivables: receivableVal,
      liabilities: liabilityVal,
      netWealth,
      isZakatRequired: isEligible,
      zakatDue,
      notes: customNotes || 'Kalkulasi Harian Mandiri - DSN MUI'
    });
    setCustomNotes('');
    alert("Sukses: Hasil kalkulasi zakat maal perdagangan berhasil disimpan dalam sistem.");
  };

  // ================= TAB 2: DISTRIBUTION STATE & LOGIC =================
  const [distAmount, setDistAmount] = useState('');
  const [distRecipient, setDistRecipient] = useState('');
  const [distEsgCategory, setDistEsgCategory] = useState<'ENVIRONMENTAL' | 'SOCIAL' | 'GOVERNANCE'>('SOCIAL');
  const [distDesc, setDistDesc] = useState('');

  // Total funds pool
  const totalZakatFromSales = transactions.reduce((sum, tx) => sum + tx.zakatContribution, 0);
  const totalZakatFromCalculations = zakatRecords.reduce((sum, zk) => sum + zk.zakatDue, 0);
  const totalZakatPool = totalZakatFromSales + totalZakatFromCalculations;
  const totalZakatDisbursed = zakatDistributions.reduce((sum, dist) => sum + dist.amount, 0);
  const remainingZakatPool = totalZakatPool - totalZakatDisbursed;

  const handleSaveDistribution = (e: React.FormEvent) => {
    e.preventDefault();
    const nominal = Number(distAmount);
    
    if (nominal <= 0) {
      alert("Masukkan nominal penyaluran yang valid.");
      return;
    }
    if (!distRecipient) {
      alert("Harap isi penerima zakat/asnaf.");
      return;
    }

    addZakatDistribution({
      tenantId: currentUser?.tenantId || 'tenant_default',
      amount: nominal,
      recipient: distRecipient,
      esgCategory: distEsgCategory,
      description: distDesc || 'Penyaluran Zakat Berkah'
    });

    setDistAmount('');
    setDistRecipient('');
    setDistDesc('');
    alert("Sukses: Penyaluran zakat perdagangan dan rincian ESG berhasil dicatatkan.");
  };

  return (
    <div className="space-y-6">
      
      {/* Title Header with tabs selector matching screenshots */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-200 dark:border-slate-700/85 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-extrabold text-gray-800 dark:text-slate-200 text-sm">Amanah Himpunan Zakat & ESG Dashboard</h2>
          <p className="text-[11px] text-gray-400 mt-0.5">Pengelolan zakat maal perdagangan terintegrasi DSN MUI & 1.0 2026 ESG Compliance</p>
        </div>

        {/* Tab switcher buttons matching screenshots */}
        <div className="bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-gray-200 dark:border-slate-700 flex space-x-1">
          <button
            onClick={() => setActiveTab('CALCULATOR')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
              activeTab === 'CALCULATOR'
                ? 'bg-green-700 text-white shadow-xs'
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:text-white'
            }`}
          >
            Kalkulator Zakat
          </button>
          <button
            onClick={() => setActiveTab('DISTRIBUTION')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
              activeTab === 'DISTRIBUTION'
                ? 'bg-green-700 text-white shadow-xs'
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:text-white'
            }`}
          >
            Penyaluran & ESG ({zakatDistributions.length})
          </button>
        </div>
      </div>

      {/* CORE ACTIVE TABS VIEW */}
      {activeTab === 'CALCULATOR' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
          
          {/* Zakat Calculator Engine - Left (7 Cols) */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xs space-y-5">
            <div className="border-b border-gray-100 dark:border-slate-800 pb-3 flex items-center justify-between">
              <h3 className="font-extrabold text-gray-800 dark:text-slate-200 text-sm flex items-center space-x-2">
                <Calculator className="w-5 h-5 text-green-700" />
                <span>Kalkulator Zakat Mal Perniagaan (DSN-MUI)</span>
              </h3>
              <span className="bg-amber-150 text-amber-900 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">Muzakki Usaha</span>
            </div>

            {/* Inputs */}
            <div className="space-y-4 text-xs font-semibold text-gray-600 dark:text-slate-400">
              
              {/* Gold Pricing standard */}
              <div className="grid grid-cols-2 gap-4 col-span-2">
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-gray-700 dark:text-slate-300 block">Acuan Harga Emas Standar (MUI/Realtime)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-gray-400 font-bold">Rp</span>
                    <input
                      type="number"
                      className="w-full border border-gray-200 dark:border-slate-700 rounded-lg py-2 pl-8 pr-3 font-mono font-bold focus:ring-1 focus:ring-green-650"
                      value={goldPrice}
                      onChange={(e) => setGoldPrice(e.target.value)}
                    />
                  </div>
                </div>

                <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-[10px] leading-snug text-amber-800 flex flex-col justify-center">
                  <p className="font-bold">Nisab Zakat Perdagangan (85g Emas):</p>
                  <p className="text-sm font-extrabold text-amber-950 mt-1">Rp {nisabValue.toLocaleString('id-ID')}</p>
                </div>
              </div>

              <hr className="border-gray-100 dark:border-slate-800" />

              <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-2">Aset Lancar Perdagangan (Aktiva)</p>

              <div className="grid grid-cols-2 gap-4">
                {/* Cash asset */}
                <div className="space-y-1">
                  <label className="text-gray-700 dark:text-slate-300">1. Kas Usaha & Saldo Bank Syariah</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-gray-300">Rp</span>
                    <input
                      type="number"
                      className="w-full border border-gray-200 dark:border-slate-700 rounded-lg py-2 pl-8 pr-3 font-mono"
                      value={cashAsset}
                      onChange={(e) => setCashAsset(e.target.value)}
                    />
                  </div>
                </div>

                {/* Inventory asset */}
                <div className="space-y-1">
                  <label className="text-gray-700 dark:text-slate-300">2. Persediaan Barang Dagang (Harga Beli Rill/Modal)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-gray-300">Rp</span>
                    <input
                      type="number"
                      className="w-full border border-gray-200 dark:border-slate-700 rounded-lg py-2 pl-8 pr-3 font-mono"
                      value={inventoryAsset}
                      onChange={(e) => setInventoryAsset(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Receivables asset */}
                <div className="space-y-1">
                  <label className="text-gray-700 dark:text-slate-300">3. Piutang Dagang Lancar</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-gray-300">Rp</span>
                    <input
                      type="number"
                      className="w-full border border-gray-200 dark:border-slate-700 rounded-lg py-2 pl-8 pr-3 font-mono"
                      value={receivableAsset}
                      onChange={(e) => setReceivableAsset(e.target.value)}
                    />
                  </div>
                </div>

                {/* Liabilities */}
                <div className="space-y-1">
                  <label className="text-gray-700 dark:text-slate-300 text-red-700">4. Hutang Jatuh Tempo Kewajiban Dagang (-)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-red-300">Rp</span>
                    <input
                      type="number"
                      className="w-full border border-gray-200 dark:border-slate-700 rounded-lg py-2 pl-8 pr-3 text-red-650 bg-red-50/20 font-mono"
                      value={liabilityAsset}
                      onChange={(e) => setLiabilityAsset(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-gray-750">Catatan Tambahan (Keterangan Audit)</label>
                <input
                  type="text"
                  className="w-full border border-gray-200 dark:border-slate-700 rounded-lg py-2 px-3 font-medium text-xs text-gray-850"
                  placeholder="Contoh: Perhitungan Zakat Maal Akhir Tahun Buku 2026..."
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                />
              </div>

              <div className="pt-3">
                <button
                  onClick={handleSaveRecord}
                  className="w-full bg-green-700 hover:bg-green-800 text-white font-extrabold text-xs py-3.5 rounded-xl flex items-center justify-center space-x-1.5 shadow-md shadow-green-950/20 uppercase tracking-widest active:scale-98 transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Histori Zakat Maal</span>
                </button>
              </div>
            </div>
          </div>

          {/* Output Results panel - Right (5 Cols) */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <h3 className="font-extrabold text-gray-800 dark:text-slate-200 text-sm">Hasil Rekapitulasi Zakat Usaha</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">Analisa kelayakan haul atas himpunan total harta dagang</p>
              </div>

              {/* Core Results Block */}
              <div className="space-y-3 font-medium text-xs text-gray-650 bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-gray-150">
                <div className="flex justify-between">
                  <span>Total Harta Dagang Lancar :</span>
                  <span className="font-bold text-gray-900 dark:text-white font-mono">Rp {(cashVal + inventoryVal + receivableVal).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 dark:border-slate-800 pb-2">
                  <span>Hutang / Kewajiban Usaha :</span>
                  <span className="text-red-650 font-bold font-mono">- Rp {liabilityVal.toLocaleString('id-ID')}</span>
                </div>
                
                <div className="flex justify-between font-black text-sm text-gray-800 dark:text-slate-200">
                  <span>HARTA PERNIAGAAN NETTO</span>
                  <span className="font-mono text-green-900">Rp {netWealth.toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* Limit / Threshold Indicator alerts */}
              {isEligible ? (
                <div className="bg-green-50 text-green-800 p-4 rounded-xl border border-green-250 flex items-start space-x-2.5">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="text-[11px] leading-relaxed">
                    <p className="font-bold">Status: Wajib Mengeluarkan Zakat</p>
                    <p className="text-green-700/90 mt-0.5">
                      Harta perniagaan bersih mencapai nishab (<b>Rp {nisabValue.toLocaleString('id-ID')}</b>). Kadar zakat yang wajib ditunaikan adalah sebesar 2.5% dari harta bersih perniagaan.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 p-4 rounded-xl border border-gray-200 dark:border-slate-700 flex items-start space-x-2.5">
                  <XCircle className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="text-[11px] leading-relaxed">
                    <p className="font-bold">Status: Belum Wajib Zakat (Hanya Infaq)</p>
                    <p className="text-gray-400 mt-0.5">
                      Harta perniagaan bersih belum melampaui batas nisab standar 85 gram emas (<b>Rp {nisabValue.toLocaleString('id-ID')}</b>). Sangat dianjurkan memberikan sedekah/infaq sukarela sebagai kemaslahatan.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Zakat amount visualization */}
            <div className="pt-6 border-t border-gray-150 mt-6 lg:mt-0 font-sans">
              <div className="p-4 bg-green-950 text-white rounded-xl text-center shadow-lg shadow-green-950/15">
                <p className="text-[9px] text-green-400 uppercase tracking-widest font-black">Kewajiban Zakat yang Dibayar (2.5%)</p>
                <p className="text-2xl font-black text-amber-300 mt-1 font-mono">Rp {zakatDue.toLocaleString('id-ID')}</p>
              </div>
            </div>
          </div>

          {/* Historical Calculations Table */}
          <div className="lg:col-span-12 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex items-center space-x-2">
              <History className="w-4 h-4 text-green-700" />
              <h4 className="font-bold text-gray-800 dark:text-slate-200 text-xs">Arsip Histori Perhitungan Zakat Maal</h4>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#f8fafc] uppercase tracking-widest text-[9px] text-gray-500 dark:text-slate-400 font-bold border-b border-gray-150">
                  <tr>
                    <th className="py-3.5 px-5">Tanggal Kalkulasi</th>
                    <th className="py-3.5 px-5 text-right">Emas Standar</th>
                    <th className="py-3.5 px-5 text-right">Harta Bersih</th>
                    <th className="py-3.5 px-5 text-center">Wajib Zakat</th>
                    <th className="py-3.5 px-5 text-right">Zakat Dibayarkan</th>
                    <th className="py-3.5 px-5">Catatan Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-650 font-bold leading-normal">
                  {zakatRecords.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-gray-400">Belum ada rincian terekam.</td>
                    </tr>
                  ) : (
                    zakatRecords.map((zk) => (
                      <tr key={zk.id} className="hover:bg-slate-50 dark:bg-slate-800/50">
                        <td className="py-3 px-5 text-gray-500 dark:text-slate-400 font-semibold">{new Date(zk.timestamp).toLocaleString('id-ID')}</td>
                        <td className="py-3 px-5 text-right font-mono">Rp {zk.goldPricePerGram.toLocaleString('id-ID')}/g</td>
                        <td className="py-3 px-5 text-right font-mono text-gray-900 dark:text-white">Rp {zk.netWealth.toLocaleString('id-ID')}</td>
                        <td className="py-3 px-5 text-center">
                          {zk.isZakatRequired ? (
                            <span className="bg-green-50 text-green-800 text-[9px] px-2 py-0.5 rounded-full font-black border border-green-100 uppercase">Wajib</span>
                          ) : (
                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[9px] px-2 py-0.5 rounded-full font-black uppercase">Infaq</span>
                          )}
                        </td>
                        <td className="py-3 px-5 text-right font-mono text-green-800">Rp {zk.zakatDue.toLocaleString('id-ID')}</td>
                        <td className="py-3 px-5 text-gray-550 font-medium truncate max-w-xs">{zk.notes}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        // ================= TAB 2: ESG & DISTRIBUTION SYSTEM =================
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
          
          {/* Funds Status Boxes */}
          <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-4 gap-4 select-none">
            
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-200 dark:border-slate-700/80 shadow-xs">
              <p className="text-gray-400 text-[10px] uppercase tracking-wider font-extrabold font-sans">Cadangan Zakat POS (2.5% Margin)</p>
              <h3 className="text-xl font-extrabold text-green-800 mt-1 font-mono">Rp {totalZakatFromSales.toLocaleString('id-ID')}</h3>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-200 dark:border-slate-700/80 shadow-xs">
              <p className="text-gray-400 text-[10px] uppercase tracking-wider font-extrabold font-sans">Total Zakat Maal Himpunan</p>
              <h3 className="text-xl font-extrabold text-gray-800 dark:text-slate-200 mt-1 font-mono">Rp {totalZakatFromCalculations.toLocaleString('id-ID')}</h3>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-200 dark:border-slate-700/80 shadow-xs">
              <p className="text-gray-400 text-[10px] uppercase tracking-wider font-extrabold font-sans">TOTAL DANA TERKUMPUL</p>
              <h3 className="text-xl font-extrabold text-amber-600 mt-1 font-mono">Rp {totalZakatPool.toLocaleString('id-ID')}</h3>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-200 dark:border-slate-700/80 shadow-xs">
              <p className="text-gray-400 text-[10px] uppercase tracking-wider font-extrabold font-sans">SALDO ZAKAT SIAP SALUR</p>
              <h3 className="text-xl font-black text-green-950 mt-1 font-mono">Rp {remainingZakatPool.toLocaleString('id-ID')}</h3>
            </div>
          </div>

          {/* Form to Log Zakat Log & ESG Allocations */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xs space-y-4">
            <div className="border-b border-gray-100 dark:border-slate-800 pb-3 flex items-center space-x-2">
              <Send className="w-5 h-5 text-green-800" />
              <div>
                <h3 className="font-extrabold text-gray-800 dark:text-slate-200 text-sm">Penyaluran & ESG Impact</h3>
                <p className="text-[10px] text-gray-400 mt-0.5">Catatkan update dana zakat yang sukses disalurkan</p>
              </div>
            </div>

            <form onSubmit={handleSaveDistribution} className="space-y-4 text-xs font-semibold text-gray-600 dark:text-slate-400">
              
              {/* Nominal Amount */}
              <div className="space-y-1">
                <label className="text-gray-750">Nominal yang Disalurkan (Rp)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-gray-400 font-bold">Rp</span>
                  <input
                    type="number"
                    required
                    value={distAmount}
                    onChange={(e) => setDistAmount(e.target.value)}
                    placeholder="Contoh: 1500000"
                    className="w-full border border-gray-200 dark:border-slate-700 rounded-lg py-2 pl-8 pr-3 font-mono text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Recipient Asnaf info */}
              <div className="space-y-1">
                <label className="text-gray-755">Asnaf Penerima Manfaat</label>
                <input
                  type="text"
                  required
                  value={distRecipient}
                  onChange={(e) => setDistRecipient(e.target.value)}
                  placeholder="Contoh: Fakir Miskin Dusun Tazkia / Gharimin Kecil"
                  className="w-full border border-gray-200 dark:border-slate-700 rounded-lg py-2 px-3 text-xs text-gray-850"
                />
              </div>

              {/* ESG Category Alignment 2026 */}
              <div className="space-y-1">
                <label className="text-gray-755 flex items-center space-x-1">
                  <span>Klasifikasi ESG Syariah 2026</span>
                  <HelpCircle className="w-3.5 h-3.5 text-gray-400 cursor-help" title="ESG (Environmental, Social, Governance) standard alignment for Islamic Social Finance" />
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDistEsgCategory('ENVIRONMENTAL')}
                    className={`p-2.5 rounded-lg border text-center flex flex-col items-center justify-center space-y-1 transition-all ${
                      distEsgCategory === 'ENVIRONMENTAL'
                        ? 'border-green-600 bg-green-50 text-green-800'
                        : 'border-gray-200 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-800 text-gray-600 dark:text-slate-400'
                    }`}
                  >
                    <Leaf className="w-4 h-4 text-green-600" />
                    <span className="text-[9px] font-black uppercase">Environment (E)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDistEsgCategory('SOCIAL')}
                    className={`p-2.5 rounded-lg border text-center flex flex-col items-center justify-center space-y-1 transition-all ${
                      distEsgCategory === 'SOCIAL'
                        ? 'border-green-600 bg-green-50 text-green-800'
                        : 'border-gray-200 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-800 text-gray-600 dark:text-slate-400'
                    }`}
                  >
                    <Heart className="w-4 h-4 text-amber-500" />
                    <span className="text-[9px] font-black uppercase">Social (S)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDistEsgCategory('GOVERNANCE')}
                    className={`p-2.5 rounded-lg border text-center flex flex-col items-center justify-center space-y-1 transition-all ${
                      distEsgCategory === 'GOVERNANCE'
                        ? 'border-green-600 bg-green-50 text-green-800'
                        : 'border-gray-200 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-800 text-gray-600 dark:text-slate-400'
                    }`}
                  >
                    <Scale className="w-4 h-4 text-blue-600" />
                    <span className="text-[9px] font-black uppercase">Governance (G)</span>
                  </button>
                </div>
              </div>

              {/* Description Keterangan */}
              <div className="space-y-1">
                <label className="text-gray-755">Rincian Kegiatan Penyaluran</label>
                <textarea
                  value={distDesc}
                  onChange={(e) => setDistDesc(e.target.value)}
                  placeholder="Contoh: Pembelian rami bag ramah lingkungan untuk pembagian sembako dhuafa..."
                  rows={2}
                  className="w-full border border-gray-200 dark:border-slate-700 rounded-lg py-1.5 px-3 text-xs text-gray-850 font-semibold"
                />
              </div>

              {/* Distribute Button */}
              <button
                type="submit"
                className="w-full bg-green-700 hover:bg-green-800 text-white font-extrabold text-xs py-3 rounded-lg flex items-center justify-center space-x-1 shadow-xs uppercase tracking-wider"
              >
                <span>Catatkan Penyaluran Zakat</span>
              </button>
            </form>
          </div>

          {/* Table of Distributions - Right (7 Cols) */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xs overflow-hidden flex flex-col justify-between">
            <div>
              <div className="p-4 border-b border-gray-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
                <h4 className="font-extrabold text-gray-800 dark:text-slate-200 text-xs">Penyaluran & Stewardship Program Log</h4>
                <span className="text-[10px] text-gray-400 font-mono">Versi 1.0 ESG 2026</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#f8fafc] uppercase tracking-widest text-[9px] text-gray-500 dark:text-slate-400 font-bold border-b border-gray-150">
                    <tr>
                      <th className="py-3 px-4">Penerima & Agenda</th>
                      <th className="py-3 px-4 text-center">ESG Tag</th>
                      <th className="py-3 px-4 text-right">Nominal Salur</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-650 font-bold leading-normal">
                    {zakatDistributions.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="text-center py-10 text-gray-400">Belum ada data penyaluran terekam harian.</td>
                      </tr>
                    ) : (
                      zakatDistributions.map((dist) => {
                        return (
                          <tr key={dist.id} className="hover:bg-slate-50 dark:bg-slate-800/50">
                            <td className="py-3 px-4">
                              <p className="text-gray-900 dark:text-white font-extrabold">{dist.recipient}</p>
                              <p className="text-gray-450 text-[10px] font-medium leading-relaxed mt-0.5">{dist.description}</p>
                              <span className="text-[8px] text-gray-400 font-light block">{new Date(dist.timestamp).toLocaleDateString('id-ID')}</span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              {dist.esgCategory === 'ENVIRONMENTAL' ? (
                                <span className="bg-green-50 text-green-800 text-[8px] font-black px-2 py-0.5 rounded border border-green-100 uppercase tracking-widest flex items-center justify-center w-24 mx-auto gap-1">
                                  <Leaf className="w-2.5 h-2.5" />
                                  <span>Eco Friendly</span>
                                </span>
                              ) : dist.esgCategory === 'SOCIAL' ? (
                                <span className="bg-amber-50 text-amber-800 text-[8px] font-black px-2 py-0.5 rounded border border-amber-100 uppercase tracking-widest flex items-center justify-center w-24 mx-auto gap-1">
                                  <Heart className="w-2.5 h-2.5" />
                                  <span>Social Aid</span>
                                </span>
                              ) : (
                                <span className="bg-blue-50 text-blue-800 text-[8px] font-black px-2 py-0.5 rounded border border-blue-100 uppercase tracking-widest flex items-center justify-center w-24 mx-auto gap-1">
                                  <Scale className="w-2.5 h-2.5" />
                                  <span>Governance</span>
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-green-800 text-xs">
                              Rp {dist.amount.toLocaleString('id-ID')}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Visual bottom banner ESG Info */}
            <div className="m-4 mt-8 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-150 rounded-xl flex items-start space-x-2.5">
              <Sparkles className="w-4.5 h-4.5 text-green-700 flex-shrink-0 mt-0.5" />
              <div className="text-[10px] leading-relaxed text-gray-550">
                <p className="font-bold text-gray-800 dark:text-slate-200">Framework Syariah ESG Integration 2026</p>
                <p className="font-medium">
                  Setiap penyaluran zakat diklasifikasikan ke dalam 3 rukun kemaslahatan: <b>Ecological Stewardship</b> (Environment), <b>Social Harmony</b> (Social), dan <b>Shariah Auditable Integrity</b> (Governance) berdasarkan standard ESG modern 1.0 2026.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
