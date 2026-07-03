import React, { useState } from 'react';
import { useAppStore } from '../store';
import { History, Search, Printer, CheckCircle, XOctagon } from 'lucide-react';

export default function KasirRiwayatPage() {
  const { transactions, currentUser, voidTransaction, activeBranchId } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [txToVoid, setTxToVoid] = useState<any>(null);
  const [voidReason, setVoidReason] = useState('');

  // Ambil transaksi HARI INI dan KASIR INI saja
  const today = new Date().toISOString().split('T')[0];
  const myTransactions = transactions.filter(tx => {
    // Check if tx is today and by this cashier
    // If Admin/Owner, maybe they can see all, but for now we filter by current user's name
    // unless they want to see all. Let's show all for Admin/Owner, and filter for Cashier.
    const isToday = tx.timestamp.startsWith(today);
    const isMyTx = currentUser?.role === 'CASHIER' ? tx.cashierName === currentUser?.name : true;
    const matchesBranch = !activeBranchId || tx.branchId === activeBranchId || !tx.branchId;
    return isToday && isMyTx && matchesBranch;
  });

  const filteredTx = myTransactions.filter(tx => 
    tx.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleReprint = (tx: any) => {
    setSelectedTx(tx);
    // Beri waktu render modal sebelum panggil print
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const handleVoid = () => {
    if (!voidReason) {
      alert("Alasan pembatalan harus diisi!");
      return;
    }
    voidTransaction(txToVoid.id, voidReason);
    setTxToVoid(null);
    setVoidReason('');
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <History className="w-6 h-6 text-green-600" />
            Riwayat Transaksi
          </h1>
          <p className="text-sm text-gray-500 mt-1">Daftar penjualan shift hari ini untuk pencetakan ulang.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari No Invoice..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/50 text-gray-500 font-medium">
              <tr>
                <th className="px-6 py-4">Waktu</th>
                <th className="px-6 py-4">No. Invoice</th>
                <th className="px-6 py-4">Kasir</th>
                <th className="px-6 py-4">Metode</th>
                <th className="px-6 py-4 text-right">Total Belanja</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTx.map(tx => (
                <tr key={tx.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 text-gray-600">
                    {new Date(tx.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-800">{tx.invoiceNo}</td>
                  <td className="px-6 py-4 text-gray-600">{tx.cashierName}</td>
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
                      className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors inline-block border border-slate-200 shadow-xs"
                      title="Cetak Ulang Struk"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    {!tx.isVoided ? (
                      <button
                        onClick={() => { setTxToVoid(tx); setVoidReason(''); }}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-block border border-red-200 shadow-xs"
                        title="Batalkan (Void)"
                      >
                        <XOctagon className="w-4 h-4" />
                      </button>
                    ) : (
                      <span className="text-[10px] bg-red-100 text-red-700 px-2 py-1 rounded font-bold uppercase">Voided</span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredTx.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <History className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                    Belum ada transaksi di shift hari ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modern Shariah Print Receipt Popup card for REPRINT */}
      {selectedTx && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Receipt headers */}
            <div className="p-6 text-center border-b border-gray-100 bg-slate-50">
              <CheckCircle className="w-12 h-12 text-slate-400 mx-auto mb-2" />
              <h3 className="font-extrabold text-gray-800 text-md">Cetak Ulang Struk</h3>
            </div>

            {/* Simulated Thermic strip content */}
            <div id="printable-receipt" className="p-6 space-y-4 text-xs font-mono text-gray-700 border-b border-dashed border-gray-200 max-h-96 overflow-y-auto">
              <div className="text-center space-y-0.5 border-b border-gray-100 pb-3">
                <p className="font-bold text-gray-800 text-sm">Toko KSA Mart</p>
                <p className="text-slate-400 text-[10px] uppercase">{activeBranchId ? `Cabang ${activeBranchId}` : 'Kantor Pusat'}, Indonesia</p>
                <p className="text-slate-400">Telp: 082210027952</p>
                <p className="text-xs font-bold mt-1">(COPY / CETAK ULANG)</p>
              </div>

              <div className="space-y-1">
                <p><span className="text-slate-400">No Invoice:</span> {selectedTx.invoiceNo}</p>
                <p><span className="text-slate-400">Waktu:</span> {new Date(selectedTx.timestamp).toLocaleString('id-ID')}</p>
                <p><span className="text-slate-400">Kasir:</span> {selectedTx.cashierName}</p>
                <p><span className="text-slate-400">Metode:</span> {selectedTx.paymentMethod}</p>
              </div>

              <div className="border-t border-b border-gray-100 py-2 space-y-2">
                {selectedTx.items.map((it: any, index: number) => (
                  <div key={index} className="flex justify-between">
                    <div>
                      <p className="font-semibold text-gray-800">{it.productName}</p>
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
                <div className="flex justify-between font-bold text-green-700 border-t border-gray-100 pt-1.5">
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
            <div className="p-4 bg-slate-50 flex gap-2 no-print">
              <button
                onClick={() => setSelectedTx(null)}
                className="flex-1 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 font-semibold text-xs text-center"
              >
                Tutup
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 bg-green-700 hover:bg-green-800 text-white font-bold text-xs rounded-lg text-center shadow-xs"
              >
                Cetak Struk
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Void Modal */}
      {txToVoid && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 text-center border-b border-gray-100 bg-red-50">
              <XOctagon className="w-12 h-12 text-red-500 mx-auto mb-2" />
              <h3 className="font-extrabold text-gray-800 text-md">Batalkan Transaksi</h3>
              <p className="text-xs text-red-600 mt-1">Aksi ini akan mengembalikan stok & membuat jurnal balik pembatalan.</p>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm font-bold text-gray-800">No Invoice: {txToVoid.invoiceNo}</p>
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase mb-1 block">Alasan Batal</label>
                <input
                  type="text"
                  className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Misal: Salah input / Customer batal beli"
                  value={voidReason}
                  onChange={e => setVoidReason(e.target.value)}
                />
              </div>
            </div>
            <div className="p-4 bg-slate-50 flex gap-2">
              <button
                onClick={() => setTxToVoid(null)}
                className="flex-1 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 font-semibold text-xs text-center"
              >
                Kembali
              </button>
              <button
                onClick={handleVoid}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg text-center shadow-xs"
              >
                Konfirmasi Void
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
