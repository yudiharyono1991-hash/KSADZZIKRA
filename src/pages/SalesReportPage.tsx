import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store';
import { 
  FileText, 
  Search, 
  Calendar, 
  Download,
  Package,
  TrendingUp,
  Printer
} from 'lucide-react';

export default function SalesReportPage() {
  const { transactions, activeBranchId, currentUser, addLog } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Date filters defaulting to current month
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const currentDay = today.toISOString().split('T')[0];
  
  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(currentDay);

  // Filter and Aggregate Data
  const { aggregatedData, grandTotal } = useMemo(() => {
    const validTxs = transactions.filter(tx => {
      if (tx.isVoided) return false;
      if (activeBranchId && tx.branchId !== activeBranchId) return false;
      
      const txDate = tx.timestamp.split('T')[0];
      if (startDate && txDate < startDate) return false;
      if (endDate && txDate > endDate) return false;
      
      return true;
    });

    const itemMap = new Map();
    let totalQty = 0;
    let totalOmset = 0;
    let totalProfit = 0;
    let totalZakat = 0;

    validTxs.forEach(tx => {
      tx.items.forEach(item => {
        if (!itemMap.has(item.productId)) {
          itemMap.set(item.productId, {
            productId: item.productId,
            productName: item.productName,
            qty: 0,
            omset: 0,
            profit: 0,
            zakat: 0
          });
        }
        const existing = itemMap.get(item.productId);
        existing.qty += item.quantity;
        
        const itemOmset = item.price * item.quantity;
        const itemCost = item.costPrice * item.quantity;
        const itemProfit = itemOmset - itemCost;
        const itemZakat = itemProfit > 0 ? itemProfit * 0.025 : 0;

        existing.omset += itemOmset;
        existing.profit += itemProfit;
        existing.zakat += itemZakat;

        totalQty += item.quantity;
        totalOmset += itemOmset;
        totalProfit += itemProfit;
        totalZakat += itemZakat;
      });
    });

    // Filter by search query
    const resultArr = Array.from(itemMap.values()).filter(item => 
      item.productName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort by quantity sold descending
    resultArr.sort((a, b) => b.qty - a.qty);

    return { 
      aggregatedData: resultArr, 
      grandTotal: { qty: totalQty, omset: totalOmset, profit: totalProfit, zakat: totalZakat } 
    };
  }, [transactions, activeBranchId, startDate, endDate, searchQuery]);

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Nama Produk,Qty Terjual,Harga Pokok (Avg),Harga Jual (Avg),Margin (%),Omset Penjualan,Estimasi Profit,Zakat Terkumpul\n";
    
    aggregatedData.forEach(item => {
      // Hitung rata-rata
      const avgCost = (item.omset - item.profit) / item.qty;
      const avgSell = item.omset / item.qty;
      const marginPct = avgCost > 0 ? (((avgSell - avgCost) / avgCost) * 100).toFixed(1) : '0';

      // Escape commas in names
      const name = `"${item.productName.replace(/"/g, '""')}"`;
      csvContent += `${name},${item.qty},${Math.round(avgCost)},${Math.round(avgSell)},${marginPct}%,${item.omset},${item.profit},${item.zakat}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Penjualan_${startDate}_sd_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handlePrintReport = () => {
    addLog('PRINT_REPORT', 'SYSTEM', `Mencetak Laporan Penjualan periode ${startDate} sd ${endDate}`);
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters Header */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="font-bold text-gray-800 text-sm flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            Rekapitulasi Penjualan Barang
          </h2>
          <p className="text-[11px] text-gray-400 mt-0.5">Analisa item terjual, omset, dan profit berdasarkan rentang tanggal</p>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1">
            <Calendar className="w-4 h-4 text-slate-400 ml-2" />
            <input 
              type="date" 
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 outline-none p-1 cursor-pointer"
            />
            <span className="text-slate-400 text-xs">-</span>
            <input 
              type="date" 
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 outline-none p-1 cursor-pointer"
            />
          </div>

          <div className="relative w-full md:w-56">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="w-4 h-4 text-gray-400" />
            </span>
            <input
              type="text"
              className="w-full pl-9 pr-4 py-1.5 border border-gray-200 rounded-lg text-xs"
              placeholder="Cari nama barang..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <button 
              onClick={handleExportCSV}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>CSV</span>
            </button>
            <button 
              onClick={handlePrintReport}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Kertas</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <Package className="w-4 h-4" />
            <p className="text-[10px] uppercase font-bold tracking-wider">Total Barang Terjual</p>
          </div>
          <p className="text-xl font-extrabold text-gray-800">{grandTotal.qty} Item</p>
        </div>
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
          <p className="text-[10px] uppercase font-bold tracking-wider text-gray-500 mb-1">Total Omset</p>
          <p className="text-xl font-extrabold text-emerald-800">Rp {grandTotal.omset.toLocaleString('id-ID')}</p>
        </div>
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
          <p className="text-[10px] uppercase font-bold tracking-wider text-gray-500 mb-1">Total Margin (Profit)</p>
          <p className="text-xl font-extrabold text-blue-700">Rp {grandTotal.profit.toLocaleString('id-ID')}</p>
        </div>
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
          <p className="text-[10px] uppercase font-bold tracking-wider text-gray-500 mb-1">Total Zakat (2.5%)</p>
          <p className="text-xl font-extrabold text-amber-600">Rp {grandTotal.zakat.toLocaleString('id-ID')}</p>
        </div>
      </div>

      {/* Aggregated Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 uppercase tracking-widest text-[10px] text-gray-500 font-bold border-b border-gray-200">
              <tr>
                <th className="py-3.5 px-5">Nama Barang</th>
                <th className="py-3.5 px-3 text-center">Qty</th>
                <th className="py-3.5 px-3 text-right">Harga Pokok</th>
                <th className="py-3.5 px-3 text-right">Harga Jual</th>
                <th className="py-3.5 px-3 text-center">Margin</th>
                <th className="py-3.5 px-4 text-right">Omset</th>
                <th className="py-3.5 px-4 text-right">Profit</th>
                <th className="py-3.5 px-4 text-right">Zakat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
              {aggregatedData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400">
                    Tidak ada data penjualan pada rentang tanggal tersebut.
                  </td>
                </tr>
              ) : (
                aggregatedData.map((item) => {
                  const avgCost = (item.omset - item.profit) / item.qty;
                  const avgSell = item.omset / item.qty;
                  const marginPct = avgCost > 0 ? (((avgSell - avgCost) / avgCost) * 100).toFixed(1) : '0';

                  return (
                    <tr key={item.productId} className="hover:bg-slate-50/50">
                      <td className="py-3 px-5 font-bold text-gray-900">{item.productName} <span className="text-[9px] font-normal text-emerald-600 block">(Akad Murabahah)</span></td>
                      <td className="py-3 px-3 text-center text-emerald-700 font-bold bg-emerald-50/30">
                        {item.qty}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-gray-500">
                        Rp {Math.round(avgCost).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-gray-700 font-semibold">
                        Rp {Math.round(avgSell).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-blue-600">
                        {marginPct}%
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-gray-800">
                        Rp {item.omset.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-blue-700 font-bold">
                        Rp {item.profit.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-amber-600">
                        Rp {item.zakat.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {aggregatedData.length > 0 && (
              <tfoot className="bg-slate-50 font-bold text-gray-800 border-t-2 border-gray-200">
                <tr>
                  <td className="py-3 px-5 text-right uppercase text-[10px] tracking-widest">Grand Total:</td>
                  <td className="py-3 px-3 text-center text-emerald-700">{grandTotal.qty}</td>
                  <td className="py-3 px-3"></td>
                  <td className="py-3 px-3"></td>
                  <td className="py-3 px-3"></td>
                  <td className="py-3 px-4 text-right">Rp {grandTotal.omset.toLocaleString('id-ID')}</td>
                  <td className="py-3 px-4 text-right text-blue-700">Rp {grandTotal.profit.toLocaleString('id-ID')}</td>
                  <td className="py-3 px-4 text-right text-amber-600">Rp {grandTotal.zakat.toLocaleString('id-ID')}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Printable Area - A4 Report */}
      <div className="printable-area printable-a4 space-y-6">
        <div className="text-center border-b-2 border-gray-800 pb-4">
          <h1 className="text-2xl font-black uppercase tracking-widest text-gray-900">Berkah Amanah Mart</h1>
          <p className="text-sm font-semibold text-gray-600 mt-1">LAPORAN PENJUALAN DAN KEUANGAN (MURABAHAH)</p>
          <p className="text-xs text-gray-500 mt-1">Periode: {startDate} s/d {endDate}</p>
        </div>
        
        <div className="flex justify-between items-end text-xs font-semibold text-gray-700">
          <div>
            <p>Cabang: {activeBranchId || 'Semua Cabang'}</p>
            <p>Dicetak Oleh: {currentUser?.name || 'Sistem'}</p>
          </div>
          <div>
            <p>Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 py-4 border-y border-gray-200">
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold">Total Barang</p>
            <p className="text-lg font-black">{grandTotal.qty} Item</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold">Total Omset</p>
            <p className="text-lg font-black">Rp {grandTotal.omset.toLocaleString('id-ID')}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold">Total Margin (Profit)</p>
            <p className="text-lg font-black">Rp {grandTotal.profit.toLocaleString('id-ID')}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold">Zakat Disalurkan (2.5%)</p>
            <p className="text-lg font-black">Rp {grandTotal.zakat.toLocaleString('id-ID')}</p>
          </div>
        </div>

        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-gray-100 uppercase font-bold text-gray-800 border-b-2 border-gray-300">
            <tr>
              <th className="py-2 px-2 border border-gray-300">No</th>
              <th className="py-2 px-2 border border-gray-300">Nama Barang</th>
              <th className="py-2 px-2 border border-gray-300 text-center">Qty</th>
              <th className="py-2 px-2 border border-gray-300 text-right">Harga Pokok (Avg)</th>
              <th className="py-2 px-2 border border-gray-300 text-right">Harga Jual (Avg)</th>
              <th className="py-2 px-2 border border-gray-300 text-right">Omset</th>
              <th className="py-2 px-2 border border-gray-300 text-right">Profit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {aggregatedData.map((item, index) => {
              const avgCost = (item.omset - item.profit) / item.qty;
              const avgSell = item.omset / item.qty;
              return (
                <tr key={item.productId}>
                  <td className="py-1.5 px-2 border border-gray-200">{index + 1}</td>
                  <td className="py-1.5 px-2 border border-gray-200 font-semibold">{item.productName} <span className="text-[9px] font-normal text-gray-500">(Akad Murabahah)</span></td>
                  <td className="py-1.5 px-2 border border-gray-200 text-center">{item.qty}</td>
                  <td className="py-1.5 px-2 border border-gray-200 text-right">Rp {Math.round(avgCost).toLocaleString('id-ID')}</td>
                  <td className="py-1.5 px-2 border border-gray-200 text-right">Rp {Math.round(avgSell).toLocaleString('id-ID')}</td>
                  <td className="py-1.5 px-2 border border-gray-200 text-right">Rp {item.omset.toLocaleString('id-ID')}</td>
                  <td className="py-1.5 px-2 border border-gray-200 text-right font-bold">Rp {item.profit.toLocaleString('id-ID')}</td>
                </tr>
              );
            })}
          </tbody>
          {aggregatedData.length > 0 && (
            <tfoot className="bg-gray-100 font-bold border-t-2 border-gray-300">
              <tr>
                <td colSpan={2} className="py-2 px-2 border border-gray-300 text-right uppercase text-[10px]">Grand Total:</td>
                <td className="py-2 px-2 border border-gray-300 text-center">{grandTotal.qty}</td>
                <td className="py-2 px-2 border border-gray-300"></td>
                <td className="py-2 px-2 border border-gray-300"></td>
                <td className="py-2 px-2 border border-gray-300 text-right">Rp {grandTotal.omset.toLocaleString('id-ID')}</td>
                <td className="py-2 px-2 border border-gray-300 text-right">Rp {grandTotal.profit.toLocaleString('id-ID')}</td>
              </tr>
            </tfoot>
          )}
        </table>
        
        <div className="mt-8 pt-8 flex justify-between items-end">
          <div className="text-center w-48">
            <p className="text-xs font-semibold mb-12">Dibuat Oleh,</p>
            <p className="text-xs border-b border-gray-800 pb-1 font-bold">
              {currentUser?.role === 'OWNER' ? 'Administrator' : (currentUser?.name || 'Admin')}
            </p>
            <p className="text-[10px] text-gray-500 mt-1 uppercase">
              {currentUser?.role === 'OWNER' ? 'ADMIN TOKO' : currentUser?.role || 'SYSTEM'}
            </p>
          </div>

          <div className="text-center w-56">
            <p className="text-[11px] text-gray-600 mb-4">{activeBranchId ? `Cabang ${activeBranchId}` : 'Kantor Pusat'}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p className="text-xs font-semibold mb-12">Mengetahui / Menyetujui,</p>
            <p className="text-xs border-b border-gray-800 pb-1 font-bold">Yudi Hariyono</p>
            <p className="text-[10px] text-gray-500 mt-1 uppercase">Pemilik Toko</p>
          </div>
        </div>
      </div>
    </div>
  );
}
