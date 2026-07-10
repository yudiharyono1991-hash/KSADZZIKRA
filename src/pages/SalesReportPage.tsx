import React, { useState, useMemo, useRef } from 'react';
import { useBranchData } from '../hooks/useBranchData';
import * as XLSX from 'xlsx';
import html2pdf from 'html2pdf.js';
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
  const { transactions, currentUser, addLog, addNotification } = useBranchData();
  const { activeBranchId } = useBranchData();
  const [searchQuery, setSearchQuery] = useState('');
  const reportRef = useRef<HTMLDivElement>(null);
  
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

  const handleExportExcel = () => {
    addLog('EXPORT_EXCEL', 'SYSTEM', `Export Excel Laporan Penjualan periode ${startDate} sd ${endDate}`);
    
    const excelData = aggregatedData.map((item, index) => {
      const avgCost = (item.omset - item.profit) / item.qty;
      const avgSell = item.omset / item.qty;
      const marginPct = avgCost > 0 ? (((avgSell - avgCost) / avgCost) * 100).toFixed(1) : '0';
      return {
        'No': index + 1,
        'Nama Produk': item.productName,
        'Qty Terjual': item.qty,
        'Harga Pokok (Avg)': Math.round(avgCost),
        'Harga Jual (Avg)': Math.round(avgSell),
        'Margin (%)': `${marginPct}%`,
        'Omset Penjualan': item.omset,
        'Estimasi Profit': item.profit,
        'Zakat Terkumpul': item.zakat
      };
    });
    
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Penjualan");
    XLSX.writeFile(wb, `Laporan_Penjualan_${startDate}_sd_${endDate}.xlsx`);
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
            <TrendingUp className="w-5 h-5 text-green-600" />
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
          <div className="flex gap-2">
            <button
              onClick={() => {
                addLog('REPORT_APPROVAL', 'FINANCE', `Mengirim Laporan Penjualan periode ${startDate} sd ${endDate} untuk persetujuan Owner.`);
                addNotification({
                  title: 'Approval Laporan Penjualan',
                  message: `Laporan Penjualan periode ${startDate} sd ${endDate} dari Cabang ${activeBranchId || 'Pusat'} menunggu persetujuan.`,
                  type: 'APPROVAL',
                  targetRole: ['OWNER', 'PENGURUS'],
                  excludeUsernames: currentUser?.username ? [currentUser.username] : [],
                  link: '/laporan-penjualan'
                });
                alert('Laporan berhasil dikirim ke Owner/Pengurus untuk persetujuan!');
              }}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition font-semibold"
            >
              <span>Kirim Laporan</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition font-semibold"
            >
              <Download className="w-5 h-5" />
              <span>Excel</span>
            </button>

            <button
              onClick={handlePrintReport}
              className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg transition font-semibold"
            >
              <Printer className="w-5 h-5" />
              <span>Cetak / PDF</span>
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
          <p className="text-xl font-extrabold text-green-800">Rp {grandTotal.omset.toLocaleString('id-ID')}</p>
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
                      <td className="py-3 px-5 font-bold text-gray-900">{item.productName} <span className="text-[9px] font-normal text-green-600 block">(Akad Jual Beli)</span></td>
                      <td className="py-3 px-3 text-center text-green-700 font-bold bg-green-50/30">
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
                  <td className="py-3 px-3 text-center text-green-700">{grandTotal.qty}</td>
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
      <div className="printable-area printable-a4 space-y-6" ref={reportRef}>
        <div className="text-center border-b-2 border-gray-800 pb-4">
          <h1 className="text-2xl font-black uppercase tracking-widest text-gray-900">KSA Mart</h1>
          <p className="text-sm font-semibold text-gray-600 mt-1">LAPORAN PENJUALAN DAN KEUANGAN (BERDASARKAN AKAD SYARIAH)</p>
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
                  <td className="py-1.5 px-2 border border-gray-200 font-semibold">{item.productName} <span className="text-[9px] font-normal text-gray-500">(Akad Jual Beli)</span></td>
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
        
        <div className="mt-8 pt-8 flex justify-between items-end border-t-2 border-gray-300">
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
