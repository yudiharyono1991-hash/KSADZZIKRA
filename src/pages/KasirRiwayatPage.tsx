import React, { useState } from 'react';
import { useBranchData } from '../hooks/useBranchData';
import { History, Search, Printer, CheckCircle, XOctagon, Download, Bluetooth, Calendar } from 'lucide-react';
import * as XLSX from 'xlsx';
import { printToBluetooth } from '../lib/bluetoothPrinter';

export default function KasirRiwayatPage() {
  const { transactions, currentUser, requestVoidTransaction, approveVoidTransaction, activeBranchId, branches, settings } = useBranchData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [txToVoid, setTxToVoid] = useState<any>(null);
  const [voidReason, setVoidReason] = useState('');

  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toLocaleDateString('en-CA');
  const currentDay = today.toLocaleDateString('en-CA');
  
  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(currentDay);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Ambil transaksi berdasarkan filter
  const myTransactions = transactions.filter(tx => {
    const txDate = tx.timestamp.split('T')[0];
    const isDateMatch = (!startDate || txDate >= startDate) && (!endDate || txDate <= endDate);

    // Kasir hanya lihat transaksinya sendiri; Manager/Admin Cabang lihat semua di cabangnya; Owner lihat semua
    const isCashier = currentUser?.role === 'CASHIER';
    const isBranchManager = currentUser?.role === 'MANAGER' || currentUser?.role === 'ADMIN';
    const isMyTx = isCashier ? tx.cashierName === currentUser?.name : true;
    const matchesBranch = !activeBranchId || tx.branchId === activeBranchId || !tx.branchId;
    return isDateMatch && isMyTx && matchesBranch;
  });

  const filteredTx = myTransactions.filter(tx => 
    tx.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredTx.length / itemsPerPage);
  const paginatedTx = filteredTx.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleExportExcel = () => {
    // We export filteredTx (all data matching filter, not just the paginated slice)
    const excelData = filteredTx.map((tx, index) => ({
      'No': index + 1,
      'Tanggal & Waktu': new Date(tx.timestamp).toLocaleString('id-ID'),
      'No Invoice': tx.invoiceNo,
      'Kasir': tx.cashierName,
      'Cabang': tx.branchId || 'Pusat',
      'Total Belanja': tx.totalAmount,
      'Ongkos Kirim': tx.shippingFee || 0,
      'Margin': tx.marginContribution,
      'Metode Bayar': tx.paymentMethod,
      'Status': tx.isVoided ? 'DIBATALKAN' : 'SUKSES'
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const colWidths = [
      { wch: 5 },  // No
      { wch: 20 }, // Tanggal
      { wch: 20 }, // Invoice
      { wch: 20 }, // Kasir
      { wch: 15 }, // Cabang
      { wch: 15 }, // Total
      { wch: 15 }, // Margin
      { wch: 15 }, // Metode
      { wch: 15 }  // Status
    ];
    ws['!cols'] = colWidths;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Riwayat Transaksi");
    XLSX.writeFile(wb, `Riwayat_Transaksi_${startDate}_sd_${endDate}.xlsx`);
  };

  const totalOmset = filteredTx.reduce((sum, tx) => sum + (tx.isVoided ? 0 : tx.totalAmount), 0);
  const totalMargin = filteredTx.reduce((sum, tx) => sum + (tx.isVoided ? 0 : tx.marginContribution || 0), 0);
  const totalBarang = filteredTx.reduce((sum, tx) => {
    if (tx.isVoided) return sum;
    return sum + (tx.items?.reduce((itemSum: number, item: any) => itemSum + Number(item.quantity || 0), 0) || 0);
  }, 0);

  const handleReprint = (tx: any) => {
    setSelectedTx(tx);
  };

  const handleBluetoothPrint = async () => {
    if (!selectedTx) return;
    try {
      const receiptStoreName = branches.find(b => b.id === activeBranchId)?.name || settings.storeName;
      const address = branches.find(b => b.id === activeBranchId)?.address || settings.storeAddress;
      const phone = branches.find(b => b.id === activeBranchId)?.phone || settings.storePhone;
      
      const zakatTitle = settings.charityTitle || 'Kewajiban Zakat Niaga';
      const zakatDesc = (settings.charityDescription || '').replace('{amount}', selectedTx.zakatContribution.toLocaleString('id-ID'));
      
      await printToBluetooth(selectedTx, receiptStoreName, address, `Telp: ${phone}`, zakatTitle, zakatDesc);
    } catch (err: any) {
      alert(err.message || 'Gagal terhubung ke printer Bluetooth.');
    }
  };

  const handleVoid = () => {
    if (!voidReason) {
      alert("Alasan pembatalan harus diisi!");
      return;
    }
    requestVoidTransaction(txToVoid.id, voidReason);
    setTxToVoid(null);
    setVoidReason('');
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-slate-200 flex items-center gap-2">
            <History className="w-6 h-6 text-green-600" />
            Riwayat Transaksi
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Daftar penjualan shift hari ini untuk pencetakan ulang.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari No Invoice..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-sm"
            />
          </div>
          <div className="w-full md:w-auto flex flex-col md:flex-row gap-2">
            <div className="flex items-center space-x-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 print:hidden">
              <Calendar className="w-4 h-4 text-slate-400" />
              <input 
                type="date" 
                value={startDate} 
                onChange={e => setStartDate(e.target.value)}
                className="bg-transparent text-sm font-bold text-slate-700 dark:text-slate-300 outline-none w-32"
              />
              <span className="text-slate-400 text-sm">s/d</span>
              <input 
                type="date" 
                value={endDate} 
                onChange={e => setEndDate(e.target.value)}
                className="bg-transparent text-sm font-bold text-slate-700 dark:text-slate-300 outline-none w-32"
              />
            </div>  
            <button
              onClick={handleExportExcel}
              className="flex items-center justify-center space-x-1 w-full md:w-auto bg-green-600 hover:bg-green-700 active:scale-95 active:bg-green-800 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-sm hover:shadow transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Excel</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-slate-400 font-medium">
              <tr>
                <th className="px-6 py-4">Waktu</th>
                <th className="px-6 py-4">No. Invoice</th>
                <th className="px-6 py-4">Kasir</th>
                <th className="px-6 py-4">Pelanggan</th>
                <th className="px-6 py-4">Metode</th>
                <th className="px-6 py-4 text-right">Total Belanja</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedTx.map(tx => (
                <tr key={tx.id} className="hover:bg-gray-50 dark:bg-slate-800/50">
                  <td className="px-6 py-4 text-gray-600 dark:text-slate-400">
                    {new Date(tx.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-800 dark:text-slate-200">{tx.invoiceNo}</td>
                  <td className="px-6 py-4 text-gray-600 dark:text-slate-400">{tx.cashierName}</td>
                  <td className="px-6 py-4 text-gray-800 dark:text-slate-200 font-medium">
                    {tx.customerName || 'Umum'}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                      {tx.paymentMethod}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-green-700">
                    Rp {tx.totalAmount.toLocaleString('id-ID')}
                  </td>
                  <td className="px-6 py-4 text-center space-x-2">
                    <button
                      onClick={() => handleReprint(tx)}
                      className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:bg-slate-800 rounded-lg transition-colors inline-block border border-blue-200 dark:border-slate-700 shadow-xs"
                      title="Lihat Detail Transaksi"
                    >
                      <span className="flex items-center gap-1 text-xs"><Printer className="w-4 h-4" /> Detail</span>
                    </button>
                    {!tx.isVoided && tx.voidStatus !== 'PENDING' && tx.voidStatus !== 'REJECTED' ? (
                      <button
                        onClick={() => { setTxToVoid(tx); setVoidReason(''); }}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-block border border-red-200 shadow-xs"
                        title="Ajukan Pembatalan (Void)"
                      >
                        <XOctagon className="w-4 h-4" />
                      </button>
                    ) : tx.voidStatus === 'PENDING' ? (
                      <div className="inline-flex flex-col gap-1 items-center">
                        <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-1 rounded font-bold uppercase">Pending Void</span>
                        {['MANAGER', 'OWNER', 'SUPERADMIN'].includes(currentUser?.role || '') && (
                          <div className="flex gap-1 mt-1">
                            <button onClick={() => approveVoidTransaction(tx.id, true)} className="text-[9px] bg-green-500 text-white px-2 py-1 rounded">Approve</button>
                            <button onClick={() => approveVoidTransaction(tx.id, false)} className="text-[9px] bg-red-500 text-white px-2 py-1 rounded">Reject</button>
                          </div>
                        )}
                      </div>
                    ) : tx.voidStatus === 'REJECTED' ? (
                      <div className="inline-flex flex-col gap-1 items-center">
                        <span className="text-[10px] bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 px-2 py-1 rounded font-bold uppercase">Void Ditolak</span>
                        <button
                          onClick={() => { setTxToVoid(tx); setVoidReason(''); }}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-block border border-red-200 shadow-xs mt-1"
                          title="Ajukan Pembatalan (Void) Ulang"
                        >
                          <XOctagon className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] bg-red-100 text-red-700 px-2 py-1 rounded font-bold uppercase">Voided</span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredTx.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-slate-400">
                    <History className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                    Belum ada transaksi di shift hari ini.
                  </td>
                </tr>
              )}
            </tbody>
            {filteredTx.length > 0 && (
              <tfoot className="bg-green-50/80 border-t border-green-100 font-bold sticky bottom-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-right text-green-900 uppercase text-xs tracking-wider whitespace-nowrap">
                    <div className="flex flex-col items-end">
                      <span>Total Transaksi ({filteredTx.filter(t => !t.isVoided).length} Struk)</span>
                      <span className="text-[10px] text-green-700 font-normal capitalize mt-0.5">{totalBarang} barang terjual</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <div className="flex flex-col items-end">
                      <span className="text-green-800 text-lg font-extrabold tracking-tight whitespace-nowrap">Rp {totalOmset.toLocaleString('id-ID')}</span>
                      <span className="text-[10px] text-amber-600 font-normal mt-0.5 whitespace-nowrap">Margin: Rp {totalMargin.toLocaleString('id-ID')}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        
        {/* Table Footer with Pagination */}
        <div className="bg-gray-100 dark:bg-slate-800/50 p-4 border-t border-gray-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4 rounded-b-xl">
          <div className="flex items-center gap-2">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="px-3 py-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded text-sm disabled:opacity-50"
            >
              Sebelumnya
            </button>
            <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">Halaman {currentPage} dari {totalPages || 1}</span>
            <button 
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="px-3 py-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded text-sm disabled:opacity-50"
            >
              Selanjutnya
            </button>
          </div>
          <span className="text-sm font-bold text-gray-800 dark:text-slate-200">Menampilkan {paginatedTx.length} dari {filteredTx.length} transaksi</span>
        </div>
      </div>

      {/* Modern Shariah Print Receipt Popup card for REPRINT */}
      {selectedTx && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Receipt headers */}
            <div className="p-6 text-center border-b border-gray-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 no-print">
              <CheckCircle className="w-12 h-12 text-slate-400 mx-auto mb-2" />
              <h3 className="font-extrabold text-gray-800 dark:text-slate-200 text-md">Cetak Ulang Struk</h3>
            </div>

            {/* Print CSS Injection */}
            <style>{`
            @media print {
              @page { margin: 0; padding: 0; }
              body * { visibility: hidden; }
              .printable-thermal, .printable-thermal * { visibility: visible; }
              .printable-thermal { 
                position: absolute; 
                left: 0; top: 0; 
                width: 58mm !important; 
                max-width: 58mm !important;
                padding: 0 !important; 
                margin: 0 !important; 
                border: none !important; 
                max-height: none !important; 
                overflow: visible !important; 
                font-size: 8pt !important; 
                line-height: 1.1 !important;
                color: black !important;
              }
              .no-print { display: none !important; }
            }
            `}</style>

            {/* Simulated Thermic strip content */}
            <div id="printable-receipt" className="printable-thermal p-1 space-y-0.5 text-xs font-mono text-gray-700 dark:text-slate-300 border-b border-dashed border-gray-200 dark:border-slate-700 max-h-96 overflow-y-auto">
              <div className="text-center space-y-0.5 border-b border-gray-100 dark:border-slate-800 pb-2 flex flex-col items-center">
                <img src="/ksa_mart_logo.png" alt="KSA Mart Logo" className="w-12 h-12 object-contain mb-1" />
                <p className="font-bold text-gray-800 dark:text-slate-200 text-sm">{branches.find(b => b.id === activeBranchId)?.name || settings.storeName}</p>
                <p className="text-slate-400 text-[10px] uppercase">{branches.find(b => b.id === activeBranchId)?.address || settings.storeAddress}</p>
                <p className="text-slate-400">Telp: {branches.find(b => b.id === activeBranchId)?.phone || settings.storePhone}</p>
                <p className="text-xs font-bold mt-1">(COPY / CETAK ULANG)</p>
              </div>

              <div className="space-y-1">
                <p><span className="text-slate-400">No Invoice:</span> {selectedTx.invoiceNo}</p>
                <p><span className="text-slate-400">Waktu:</span> {new Date(selectedTx.timestamp).toLocaleString('id-ID')}</p>
                <p><span className="text-slate-400">Kasir:</span> {selectedTx.cashierName}</p>
                <p><span className="text-slate-400">Pelanggan:</span> {selectedTx.customerName || 'Umum'}</p>
                <p><span className="text-slate-400">Metode:</span> {selectedTx.paymentMethod}</p>
              </div>

              <div className="border-t border-b border-gray-100 dark:border-slate-800 py-2 space-y-2">
                {selectedTx.items.map((it: any, index: number) => (
                  <div key={index} className="flex justify-between">
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-slate-200">{it.productName}</p>
                      <p className="text-slate-400 text-[10px]">{it.quantity} x Rp {it.price.toLocaleString('id-ID')}</p>
                    </div>
                    <span>Rp {(it.price * it.quantity).toLocaleString('id-ID')}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 text-right">
                <div className="flex justify-between font-bold">
                  <span>Total Belanja:</span>
                  <span>Rp {selectedTx.totalAmount.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Uang Diterima:</span>
                  <span>Rp {selectedTx.amountPaid.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between font-bold text-green-700 border-t border-gray-100 dark:border-slate-800 pt-1.5">
                  <span>Uang Kembali:</span>
                  <span>Rp {selectedTx.changeAmount.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div className="border-t border-green-900/20 pt-3 text-center text-[10px] text-green-800 bg-green-50 p-2.5 rounded-lg border border-green-100 leading-normal">
                <p className="font-bold uppercase tracking-wider mb-1">Misi Berkah Beramal</p>
                <p>Zakat Kontribusi Sebesar <b>Rp {selectedTx.zakatContribution.toLocaleString('id-ID')}</b> dari transaksi ini dicadangkan untuk kaum Dhuafa.</p>
              </div>
            </div>

            {/* Modal footer printers */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800 flex gap-2 no-print">
              <button
                onClick={() => setSelectedTx(null)}
                className="flex-1 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-700 dark:text-slate-300 font-semibold text-xs text-center"
              >
                Tutup
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 bg-green-700 hover:bg-green-800 text-white font-bold text-xs rounded-lg text-center shadow-xs flex items-center justify-center gap-1"
              >
                <Printer className="w-4 h-4" /> Cetak Biasa
              </button>
              <button
                onClick={handleBluetoothPrint}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg text-center shadow-xs flex items-center justify-center gap-1"
              >
                <Bluetooth className="w-4 h-4" /> Print Bluetooth
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Void Modal */}
      {txToVoid && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 text-center border-b border-gray-100 dark:border-slate-800 bg-red-50">
              <XOctagon className="w-12 h-12 text-red-700 mx-auto mb-2" />
              <h3 className="font-extrabold text-gray-800 dark:text-slate-200 text-md">Ajukan Batal Transaksi</h3>
              <p className="text-xs text-red-600 mt-1">Pengajuan akan dikirim ke Manager untuk persetujuan (Approval).</p>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm font-bold text-gray-800 dark:text-slate-200">No Invoice: {txToVoid.invoiceNo}</p>
              <div>
                <label className="text-xs font-bold text-gray-600 dark:text-slate-400 uppercase mb-1 block">Alasan Batal</label>
                <input
                  type="text"
                  className="w-full border border-gray-200 dark:border-slate-700 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Misal: Salah input / Customer batal beli"
                  value={voidReason}
                  onChange={e => setVoidReason(e.target.value)}
                />
              </div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800 flex gap-2">
              <button
                onClick={() => setTxToVoid(null)}
                className="flex-1 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-700 dark:text-slate-300 font-semibold text-xs text-center"
              >
                Kembali
              </button>
              <button
                onClick={handleVoid}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg text-center shadow-xs"
              >
                Ajukan Void
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
