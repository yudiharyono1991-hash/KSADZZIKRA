import React, { useState, useRef } from 'react';
import { useBranchData } from '../hooks/useBranchData';
import { DollarSign, ArrowDownLeft, ArrowUpRight, Wallet, Download, Printer } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useReactToPrint } from 'react-to-print';
import PrintHeader from '../components/Print/PrintHeader';
import PrintFooter from '../components/Print/PrintFooter';

export default function ArusKasPage() {
  const { transactions, expenses, journalEntries, currentUser, activeBranchId, addLog, addNotification, branches, settings } = useBranchData();
  const reportRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const cashMovements: any[] = [];
  
  transactions.forEach(t => {
    // Exclude voided transactions from cash flow report
    if (t.isVoided) return;
    
    if (t.splitPayments && t.splitPayments.length > 0) {
      t.splitPayments.forEach((sp: any, i: number) => {
        cashMovements.push({
          id: `${t.id}_${i}`,
          date: t.timestamp,
          description: `Pendapatan Penjualan ${t.invoiceNo} (Split: ${sp.method})`,
          type: 'IN',
          amount: sp.amount - (i === 0 ? t.changeAmount : 0), // Adjust change on first payment
          method: sp.method
        });
      });
    } else if (t.paymentMethod !== 'KASBON') {
      cashMovements.push({
        id: t.id,
        date: t.timestamp,
        description: `Pendapatan Penjualan ${t.invoiceNo} (${t.paymentMethod})`,
        type: 'IN',
        amount: t.totalAmount,
        method: t.paymentMethod
      });
    }
  });

  const allMovements = [
    ...cashMovements,
    ...expenses.map(e => ({
      id: e.id,
      date: e.date,
      description: `Pengeluaran: ${e.description}`,
      type: 'OUT' as const,
      amount: e.amount,
      method: 'CASH'
    })),
    ...journalEntries
      .filter(je => je.account === 'KAS' && je.description.includes('Pelunasan piutang'))
      .map(je => ({
        id: je.id,
        date: je.date,
        description: je.description,
        type: 'IN' as const,
        amount: je.debit,
        method: 'CASH'
      }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalInTunai = allMovements.filter(m => m.type === 'IN' && m.method === 'CASH').reduce((sum, m) => sum + m.amount, 0);
  const totalInBank = allMovements.filter(m => m.type === 'IN' && m.method !== 'CASH').reduce((sum, m) => sum + m.amount, 0);
  const totalOut = allMovements.filter(m => m.type === 'OUT').reduce((sum, m) => sum + m.amount, 0);
  const netCash = totalInTunai + totalInBank - totalOut;

  const totalPages = Math.ceil(allMovements.length / itemsPerPage);
  const paginatedMovements = allMovements.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleExportExcel = () => {
    addLog('EXPORT_EXCEL', 'FINANCE', `Export Excel Laporan Arus Kas`);
    
    const excelData = allMovements.map((m, i) => ({
      'No': i + 1,
      'Tanggal': new Date(m.date).toLocaleString('id-ID'),
      'Keterangan': m.description,
      'Tipe': m.type === 'IN' ? (m.method === 'CASH' ? 'Masuk Tunai' : 'Masuk Non-Tunai') : 'Keluar',
      'Masuk (Rp)': m.type === 'IN' ? m.amount : 0,
      'Keluar (Rp)': m.type === 'OUT' ? m.amount : 0,
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const colWidths = [
      { wch: 5 },
      { wch: 20 },
      { wch: 40 },
      { wch: 20 },
      { wch: 15 },
      { wch: 15 },
    ];
    ws['!cols'] = colWidths;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Arus Kas");
    XLSX.writeFile(wb, `Laporan_Arus_Kas_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handlePrint = useReactToPrint({
    contentRef: reportRef,
    documentTitle: `Laporan_Arus_Kas_${new Date().toISOString().split('T')[0]}`,
    onAfterPrint: () => addLog('PRINT_REPORT', 'FINANCE', `Mencetak Laporan Arus Kas`)
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300 print:m-0 print:p-0">
      
      <PrintHeader title="Laporan Arus Kas" />

      <div className="print:hidden space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-green-100 text-green-800 rounded-xl">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-slate-200 tracking-tight">Laporan Arus Kas</h1>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">Pantau pergerakan uang masuk (Tunai & Non-Tunai) dan keluar.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              addLog('REPORT_APPROVAL', 'FINANCE', `Mengirim Laporan Arus Kas untuk persetujuan Owner.`);
              addNotification({
                title: 'Approval Laporan Arus Kas',
                message: `Laporan Arus Kas dari Cabang ${activeBranchId || 'Pusat'} menunggu persetujuan.`,
                type: 'APPROVAL',
                targetRole: ['OWNER', 'PENGURUS'],
                excludeUsernames: currentUser?.username ? [currentUser.username] : [],
                link: '/arus-kas'
              });
              alert('Laporan berhasil dikirim ke Owner/Pengurus untuk persetujuan!');
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-sm transition"
          >
            Kirim Laporan
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-sm transition"
          >
            <Download className="w-4 h-4" />
            <span>Excel</span>
          </button>
          <button
            onClick={() => handlePrint()}
            className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-sm transition flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Cetak PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Masuk (Tunai)</p>
            <p className="text-lg font-mono font-bold text-green-600">Rp {totalInTunai.toLocaleString('id-ID')}</p>
          </div>
          <div className="p-3 bg-green-50 rounded-full flex-shrink-0">
            <ArrowDownLeft className="w-5 h-5 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Masuk (Transfer/QRIS)</p>
            <p className="text-lg font-mono font-bold text-blue-600">Rp {totalInBank.toLocaleString('id-ID')}</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-full flex-shrink-0">
            <ArrowDownLeft className="w-5 h-5 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Kas Keluar</p>
            <p className="text-lg font-mono font-bold text-red-600">Rp {totalOut.toLocaleString('id-ID')}</p>
          </div>
          <div className="p-3 bg-red-50 rounded-full flex-shrink-0">
            <ArrowUpRight className="w-5 h-5 text-red-500" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Saldo Kas Kecil</p>
            <p className="text-lg font-mono font-bold text-amber-600">Rp {(settings?.pettyCashBalance || 0).toLocaleString('id-ID')}</p>
          </div>
          <div className="p-3 bg-amber-50 rounded-full flex-shrink-0">
            <Wallet className="w-5 h-5 text-amber-500" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Total Saldo Bersih</p>
            <p className="text-xl font-mono font-black text-slate-800 dark:text-slate-200">Rp {netCash.toLocaleString('id-ID')}</p>
          </div>
          <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full flex-shrink-0">
            <DollarSign className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
          <h3 className="font-bold text-slate-700 dark:text-slate-300">Rincian Pergerakan Kas</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-[11px] uppercase tracking-wider font-bold">
                <th className="p-4">Tanggal</th>
                <th className="p-4">Keterangan</th>
                <th className="p-4 text-center">Tipe</th>
                <th className="p-4 text-right">Nominal (Rp)</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {paginatedMovements.map((movement) => (
                <tr key={movement.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:bg-slate-800 transition-colors">
                  <td className="p-4 text-xs text-slate-500 dark:text-slate-400">
                    {new Date(movement.date).toLocaleString('id-ID')}
                  </td>
                  <td className="p-4 font-semibold text-slate-700 dark:text-slate-300">{movement.description}</td>
                  <td className="p-4 text-center">
                    <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider ${
                      movement.type === 'IN' 
                        ? (movement.method === 'CASH' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800') 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {movement.type === 'IN' ? <ArrowDownLeft className="w-3 h-3"/> : <ArrowUpRight className="w-3 h-3"/>}
                      <span>{movement.type === 'IN' ? (movement.method === 'CASH' ? 'MASUK TUNAI' : 'MASUK NON-TUNAI') : 'KELUAR'}</span>
                    </span>
                  </td>
                  <td className={`p-4 text-right font-mono font-bold whitespace-nowrap ${movement.type === 'IN' ? (movement.method === 'CASH' ? 'text-green-600' : 'text-blue-600') : 'text-red-600'}`}>
                    {movement.type === 'IN' ? '+' : '-'}{movement.amount.toLocaleString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {allMovements.length === 0 && (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
              Belum ada pergerakan kas.
            </div>
          )}
        </div>
        
        {/* Pagination UI */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="px-3 py-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded text-sm disabled:opacity-50"
            >
              Sebelumnya
            </button>
            <span className="text-sm font-semibold text-gray-600 dark:text-slate-400">Halaman {currentPage} dari {totalPages}</span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="px-3 py-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded text-sm disabled:opacity-50"
            >
              Selanjutnya
            </button>
          </div>
        )}
      </div>
      </div>
      {/* Printable Report Section - Hidden in UI */}
      <div style={{ display: 'none' }}>
        <div className="printable-a4 space-y-6 bg-white dark:bg-slate-900 p-8 text-black" ref={reportRef}>
          <PrintHeader title="Laporan Arus Kas" />
        
          <table className="w-full text-left border-collapse text-sm mb-8">
          <thead>
            <tr className="bg-gray-100 dark:bg-slate-800 border-y border-gray-300 dark:border-slate-600">
              <th className="py-2 px-2">Tanggal</th>
              <th className="py-2 px-2">Keterangan</th>
              <th className="py-2 px-2 text-center">Tipe</th>
              <th className="py-2 px-2 text-right">Nominal</th>
            </tr>
          </thead>
          <tbody>
            {allMovements.map((movement) => (
              <tr key={movement.id} className="border-b border-gray-200 dark:border-slate-700">
                <td className="py-1 px-2">{new Date(movement.date).toLocaleDateString('id-ID')}</td>
                <td className="py-1 px-2">{movement.description}</td>
                <td className="py-1 px-2 text-center">{movement.type === 'IN' ? 'MASUK' : 'KELUAR'}</td>
                <td className="py-1 px-2 text-right whitespace-nowrap">{movement.amount.toLocaleString('id-ID')}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-bold border-t-2 border-gray-800">
              <td colSpan={3} className="py-2 px-2 text-right">SALDO BERSIH:</td>
              <td className="py-2 px-2 text-right">Rp {netCash.toLocaleString('id-ID')}</td>
            </tr>
          </tfoot>
        </table>

        <PrintFooter />
        </div>
      </div>
    </div>
  );
}
