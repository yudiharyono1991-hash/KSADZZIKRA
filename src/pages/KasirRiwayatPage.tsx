import React, { useState } from 'react';
import { useBranchData } from '../hooks/useBranchData';
import { History, Search, Printer, CheckCircle, XOctagon, Download, Bluetooth, Calendar, FileText, CreditCard } from 'lucide-react';
import * as XLSX from 'xlsx';
import { printToBluetooth, printKasbonPaymentToBluetooth } from '../lib/bluetoothPrinter';

export default function KasirRiwayatPage() {
  const { transactions, currentUser, requestVoidTransaction, approveVoidTransaction, activeBranchId, branches, settings, customers, kasbonPayments, products } = useBranchData();
  const [activeTab, setActiveTab] = useState<'UMUM' | 'KASBON'>('UMUM');
  const [searchTerm, setSearchTerm] = useState('');
  const [txTypeFilter, setTxTypeFilter] = useState<'ALL' | 'FISIK' | 'PPOB'>('ALL');
  const [cashierFilter, setCashierFilter] = useState('ALL');
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [selectedKasbonPayment, setSelectedKasbonPayment] = useState<any>(null);
  const [txToVoid, setTxToVoid] = useState<any>(null);
  const [voidReason, setVoidReason] = useState('');
  const [waNumber, setWaNumber] = useState('');

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

  const uniqueCashiers = Array.from(new Set(myTransactions.map(tx => tx.cashierName))).filter(Boolean);

  const filteredTx = myTransactions.filter(tx => {
    const matchSearch = tx.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCashier = cashierFilter === 'ALL' || tx.cashierName === cashierFilter;
    let matchType = true;
    
    if (txTypeFilter === 'FISIK') {
      matchType = tx.items?.some((it: any) => {
        const p = products?.find((prod: any) => prod.id === it.productId);
        return p && !p.isPPOB;
      }) || false;
    } else if (txTypeFilter === 'PPOB') {
      matchType = tx.items?.some((it: any) => {
        const p = products?.find((prod: any) => prod.id === it.productId);
        return p && p.isPPOB;
      }) || false;
    }

    return matchSearch && matchType && matchCashier;
  });

  const totalPages = Math.ceil(filteredTx.length / itemsPerPage);
  const paginatedTx = filteredTx.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const kasbonHistory = [
    ...transactions.filter(tx => tx.paymentMethod === 'KASBON').map(tx => ({
      id: tx.id,
      date: tx.timestamp,
      type: 'PURCHASE',
      invoiceNo: tx.invoiceNo,
      customerName: tx.customerName || (tx.customerId ? customers.find(c => c.id === tx.customerId)?.name : undefined) || 'Umum',
      cashierName: tx.cashierName,
      amount: tx.totalAmount,
      originalTx: tx,
    })),
    ...kasbonPayments.map(kp => ({
      id: kp.id,
      date: kp.paymentDate,
      type: 'PAYMENT',
      invoiceNo: '-',
      customerName: kp.customerName,
      cashierName: kp.cashierName,
      amount: kp.amountPaid,
      originalRecord: kp,
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredKasbonHistory = kasbonHistory.filter(h => {
    const hDate = h.date.split('T')[0];
    const isDateMatch = (!startDate || hDate >= startDate) && (!endDate || hDate <= endDate);
    const searchMatch = h.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || h.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase());
    return isDateMatch && searchMatch;
  });

  const totalPagesKasbon = Math.ceil(filteredKasbonHistory.length / itemsPerPage);
  const paginatedKasbon = filteredKasbonHistory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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

  let totalOmsetFisik = 0;
  let totalOmsetPPOB = 0;

  filteredTx.forEach(tx => {
    if (tx.isVoided) return;
    tx.items?.forEach((item: any) => {
      const p = products?.find((prod: any) => prod.id === item.productId);
      const isPPOB = p ? p.isPPOB : false;
      const lineTotal = item.price * item.quantity;
      if (isPPOB) {
        totalOmsetPPOB += lineTotal;
      } else {
        totalOmsetFisik += lineTotal;
      }
    });
  });

  const cashierBreakdowns = uniqueCashiers.map(cashierName => {
    let fisik = 0;
    let ppob = 0;
    let total = 0;
    let transaksi = 0;
    let barang = 0;
    
    filteredTx.forEach(tx => {
      if (tx.cashierName === cashierName && !tx.isVoided) {
        total += tx.totalAmount;
        transaksi += 1;
        tx.items?.forEach((item: any) => {
          const p = products?.find((prod: any) => prod.id === item.productId);
          const isPPOB = p ? p.isPPOB : false;
          const qty = Number(item.quantity || 0);
          const lineTotal = item.price * qty;
          barang += qty;
          if (isPPOB) ppob += lineTotal;
          else fisik += lineTotal;
        });
      }
    });

    return { cashierName, fisik, ppob, total, transaksi, barang };
  }).filter(c => c.total > 0);

  const handleReprint = (tx: any) => {
    setSelectedTx(tx);
  };

  const handleBluetoothPrint = async () => {
    if (!selectedTx) return;
    const receiptStoreName = branches.find(b => b.id === activeBranchId)?.name || settings.storeName;
    const receiptStoreAddress = branches.find(b => b.id === activeBranchId)?.address || settings.storeAddress;
    const receiptStorePhone = branches.find(b => b.id === activeBranchId)?.phone || settings.storePhone;
      
    const device = (navigator as any).bluetooth;
    if (!device) {
      alert("Bluetooth Web API tidak didukung di browser ini.");
      return;
    }
    
    try {
      await printToBluetooth(selectedTx, receiptStoreName, receiptStoreAddress, receiptStorePhone);
    } catch (err: any) {
      alert("Gagal print: " + err.message);
    }
  };

  const handleSendWATx = () => {
    if (!selectedTx) return;
    if (!waNumber) {
      alert("Silakan masukkan nomor WhatsApp pelanggan terlebih dahulu.");
      return;
    }
    
    let formattedPhone = waNumber.replace(/[^0-9]/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '62' + formattedPhone.slice(1);
    }
    
    let itemsText = selectedTx.items.map((it: any) => 
      `- ${it.productName} x${it.quantity} (Rp ${it.price.toLocaleString('id-ID')}) = Rp ${(it.price * it.quantity).toLocaleString('id-ID')}`
    ).join('\n');

    const textMessage = `🕌 *${settings.storeName || 'KSA Mart'}* 🕌\n` +
      `${settings.storeAddress || ''}\n` +
      `Telp: ${settings.storePhone || ''}\n` +
      `===============================\n` +
      `📄 *STRUK PEMBELIAN*\n` +
      `No Invoice: ${selectedTx.invoiceNo}\n` +
      `Waktu: ${new Date(selectedTx.timestamp).toLocaleString('id-ID')}\n` +
      `Kasir: ${selectedTx.cashierName}\n` +
      `Pelanggan: ${selectedTx.customerName || 'Umum'}\n` +
      `Status: ${selectedTx.paymentMethod === 'KASBON' ? 'Belum Dibayar (Kasbon)' : selectedTx.paymentMethod}\n` +
      `===============================\n` +
      `${itemsText}\n` +
      `===============================\n` +
      `💰 *Total Belanja:* Rp ${selectedTx.totalAmount.toLocaleString('id-ID')}\n` +
      `💵 *Uang Diterima:* Rp ${selectedTx.amountPaid.toLocaleString('id-ID')}\n` +
      `💳 *Kembali:* Rp ${selectedTx.changeAmount.toLocaleString('id-ID')}\n` +
      `\nTerima kasih telah berbelanja!`;

    const encodedText = encodeURIComponent(textMessage);
    window.open(`https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedText}`, '_blank');
  };

  const handleSendWAKasbon = () => {
    if (!selectedKasbonPayment) return;
    if (!waNumber) {
      alert("Silakan masukkan nomor WhatsApp pelanggan terlebih dahulu.");
      return;
    }
    
    let formattedPhone = waNumber.replace(/[^0-9]/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '62' + formattedPhone.slice(1);
    }
    
    const rec = selectedKasbonPayment;
    const title = rec.isFullyPaid ? 'BUKTI KASBON LUNAS' : 'BUKTI PEMBAYARAN KASBON';
    const textMessage = `🕌 *${settings.storeName || 'KSA Mart'}* 🕌\n` +
      `${settings.storeAddress || ''}\n` +
      `Telp: ${settings.storePhone || ''}\n` +
      `===============================\n` +
      `📄 *${title}*\n` +
      `⏰ *Waktu:* ${new Date(rec.paymentDate).toLocaleString('id-ID')}\n` +
      `👤 *Pelanggan:* ${rec.customerName}\n` +
      `🧑‍💼 *Kasir:* ${rec.cashierName}\n` +
      `💳 *Metode:* ${rec.paymentMethod}\n` +
      `===============================\n` +
      `💰 *Dibayar:* Rp ${rec.amountPaid.toLocaleString('id-ID')}\n` +
      `💵 *Sisa Kasbon:* Rp ${rec.remainingDebt.toLocaleString('id-ID')}\n` +
      (rec.notes ? `📝 *Catatan:* ${rec.notes}\n` : '') +
      `===============================\n` +
      (rec.isFullyPaid ? `✅ *L U N A S*\n` : '') +
      `\nTerima kasih atas kepercayaannya.`;

    const encodedText = encodeURIComponent(textMessage);
    window.open(`https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedText}`, '_blank');
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

      <div className="flex border-b border-gray-200 dark:border-slate-700">
        <button 
          onClick={() => setActiveTab('UMUM')}
          className={`px-6 py-3 font-bold text-sm border-b-2 transition-colors ${activeTab === 'UMUM' ? 'border-green-600 text-green-700 dark:text-green-500' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
        >
          Semua Transaksi
        </button>
        <button 
          onClick={() => setActiveTab('KASBON')}
          className={`px-6 py-3 font-bold text-sm border-b-2 transition-colors ${activeTab === 'KASBON' ? 'border-green-600 text-green-700 dark:text-green-500' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
        >
          Riwayat Kasbon & Pelunasan
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full max-w-md flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={activeTab === 'KASBON' ? "Cari Pelanggan..." : "Cari No Invoice..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-sm"
              />
            </div>
            {activeTab === 'UMUM' && (
              <>
                <select
                  value={txTypeFilter}
                  onChange={(e) => setTxTypeFilter(e.target.value as 'ALL' | 'FISIK' | 'PPOB')}
                  className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 font-bold text-gray-700 dark:text-slate-300"
                >
                  <option value="ALL">Semua Tipe</option>
                  <option value="FISIK">Fisik</option>
                  <option value="PPOB">PPOB</option>
                </select>
                <select
                  value={cashierFilter}
                  onChange={(e) => setCashierFilter(e.target.value)}
                  className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 font-bold text-gray-700 dark:text-slate-300 max-w-[150px]"
                >
                  <option value="ALL">Semua Kasir</option>
                  {uniqueCashiers.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </>
            )}
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

        {activeTab === 'UMUM' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700">
            <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-gray-200 dark:border-slate-700">
              <p className="text-[10px] font-bold text-gray-500 uppercase">Total Transaksi</p>
              <p className="text-lg font-black text-gray-800 dark:text-slate-200">{filteredTx.length} Struk</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-gray-200 dark:border-slate-700">
              <p className="text-[10px] font-bold text-gray-500 uppercase">Total Barang</p>
              <p className="text-lg font-black text-blue-600">{totalBarang} Item</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-gray-200 dark:border-slate-700">
              <p className="text-[10px] font-bold text-gray-500 uppercase">Total Omset</p>
              <p className="text-lg font-black text-green-600">Rp {totalOmset.toLocaleString('id-ID')}</p>
              <div className="mt-1 pt-1 border-t border-gray-100 dark:border-slate-800 text-[10px] space-y-0.5">
                <div className="flex justify-between"><span className="text-gray-500">Fisik:</span><span className="font-bold text-gray-700 dark:text-slate-300">Rp {totalOmsetFisik.toLocaleString('id-ID')}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">PPOB:</span><span className="font-bold text-gray-700 dark:text-slate-300">Rp {totalOmsetPPOB.toLocaleString('id-ID')}</span></div>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-gray-200 dark:border-slate-700">
              <p className="text-[10px] font-bold text-gray-500 uppercase">Total Margin</p>
              <p className="text-lg font-black text-orange-600">Rp {totalMargin.toLocaleString('id-ID')}</p>
            </div>
          </div>
        )}

        {activeTab === 'UMUM' && cashierFilter === 'ALL' && cashierBreakdowns.length > 0 && (
          <div className="bg-slate-50 dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700 px-4 pb-4">
             <div className="bg-white dark:bg-slate-900 rounded-lg p-0 border border-gray-200 dark:border-slate-700 overflow-x-auto">
               <table className="w-full text-left text-[11px] sm:text-xs">
                 <thead className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-slate-400 font-bold uppercase">
                   <tr>
                     <th className="px-3 py-2 border-b">Nama Kasir</th>
                     <th className="px-3 py-2 border-b text-center">Transaksi</th>
                     <th className="px-3 py-2 border-b text-center">Barang</th>
                     <th className="px-3 py-2 border-b text-right">Fisik</th>
                     <th className="px-3 py-2 border-b text-right">PPOB</th>
                     <th className="px-3 py-2 border-b text-right">Total Omset</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                   {cashierBreakdowns.map(c => (
                     <tr key={c.cashierName} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                       <td className="px-3 py-2 font-bold text-slate-700 dark:text-slate-200">{c.cashierName}</td>
                       <td className="px-3 py-2 text-center text-slate-600 dark:text-slate-400">{c.transaksi} Struk</td>
                       <td className="px-3 py-2 text-center text-slate-600 dark:text-slate-400">{c.barang} Item</td>
                       <td className="px-3 py-2 text-right text-slate-600 dark:text-slate-400">Rp {c.fisik.toLocaleString('id-ID')}</td>
                       <td className="px-3 py-2 text-right text-slate-600 dark:text-slate-400">Rp {c.ppob.toLocaleString('id-ID')}</td>
                       <td className="px-3 py-2 text-right font-bold text-green-600 dark:text-green-500">Rp {c.total.toLocaleString('id-ID')}</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
        )}

        {activeTab === 'UMUM' ? (
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
                    {tx.customerName || (tx.customerId ? customers.find(c => c.id === tx.customerId)?.name : undefined) || 'Umum'}
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
                      onClick={() => {
                        setSelectedTx(tx);
                        const cust = tx.customerId ? customers.find(c => c.id === tx.customerId) : null;
                        setWaNumber(cust?.phone || '');
                      }}
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
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-slate-400 font-medium">
                <tr>
                  <th className="px-6 py-4">Waktu</th>
                  <th className="px-6 py-4">Tipe</th>
                  <th className="px-6 py-4">Pelanggan</th>
                  <th className="px-6 py-4 text-right">Nominal</th>
                  <th className="px-6 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedKasbon.map((item, idx) => (
                  <tr key={`${item.id}-${idx}`} className="hover:bg-gray-50 dark:bg-slate-800/50">
                    <td className="px-6 py-4 text-gray-600 dark:text-slate-400">
                      {new Date(item.date).toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-800 dark:text-slate-200">
                      {item.type === 'PURCHASE' ? (
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">PENGAMBILAN</span>
                      ) : (
                        <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs">PELUNASAN</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-800 dark:text-slate-200 font-medium">{item.customerName}</td>
                    <td className="px-6 py-4 text-right font-bold text-gray-700">Rp {item.amount.toLocaleString('id-ID')}</td>
                    <td className="px-6 py-4 text-center space-x-2">
                      <button
                        onClick={() => {
                          if (item.type === 'PURCHASE') {
                            setSelectedKasbonPayment(null);
                            setSelectedTx((item as any).originalTx);
                            const cust = (item as any).originalTx.customerId ? customers.find(c => c.id === (item as any).originalTx.customerId) : null;
                            setWaNumber(cust?.phone || '');
                          } else {
                            setSelectedTx(null);
                            setSelectedKasbonPayment((item as any).originalRecord);
                            const cust = customers.find(c => c.id === (item as any).originalRecord.customerId);
                            setWaNumber(cust?.phone || '');
                          }
                        }}
                        className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:bg-slate-800 rounded-lg transition-colors inline-block border border-blue-200 dark:border-slate-700 shadow-xs"
                      >
                        <span className="flex items-center gap-1 text-xs"><Printer className="w-4 h-4" /> Cetak</span>
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredKasbonHistory.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-slate-400">
                      <CreditCard className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                      Belum ada riwayat Kasbon / Pelunasan.
                    </td>
                  </tr>
                )}
              </tbody>
              {filteredKasbonHistory.length > 0 && (
                <tfoot className="bg-slate-50 dark:bg-slate-800 border-t border-gray-100 dark:border-slate-800 p-4">
                  <tr>
                    <td colSpan={5} className="p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">
                          Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredKasbonHistory.length)} dari {filteredKasbonHistory.length} riwayat
                        </span>
                        <div className="flex gap-2">
                          <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold disabled:opacity-50">Sebelumnya</button>
                          <button disabled={currentPage === totalPagesKasbon} onClick={() => setCurrentPage(p => Math.min(totalPagesKasbon, p + 1))} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold disabled:opacity-50">Selanjutnya</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
        
        {filteredTx.length > 0 && activeTab === 'UMUM' && (
          <div className="bg-slate-50 dark:bg-slate-800 border-t border-gray-100 dark:border-slate-800 p-4 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">
              Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredTx.length)} dari {filteredTx.length} transaksi
            </span>
            <div className="flex gap-2">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold disabled:opacity-50">Sebelumnya</button>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold disabled:opacity-50">Selanjutnya</button>
            </div>
          </div>
        )}
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
                <p><span className="text-slate-400">Pelanggan:</span> {selectedTx.customerName || (selectedTx.customerId ? customers.find(c => c.id === selectedTx.customerId)?.name : undefined) || 'Umum'}</p>
                <p><span className="text-slate-400">Status:</span> {selectedTx.paymentMethod === 'KASBON' ? 'Belum Dibayar' : selectedTx.paymentMethod}</p>
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
            <div className="p-4 bg-slate-50 dark:bg-slate-800 flex flex-col gap-2 no-print">
              <div className="flex gap-2">
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
              <div className="mt-2 border-t border-gray-200 dark:border-slate-700 pt-3 flex gap-2 items-center">
                <input
                  type="text"
                  value={waNumber}
                  onChange={(e) => setWaNumber(e.target.value)}
                  placeholder="No WA (misal: 0812...)"
                  className="flex-1 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-green-500"
                />
                <button
                  onClick={handleSendWATx}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap"
                >
                  Kirim WA
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedKasbonPayment && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            <div className="p-4 bg-green-50 border-b border-green-100 flex justify-between items-center no-print">
              <h3 className="font-extrabold text-green-800 text-sm flex items-center gap-2">
                <Printer className="w-5 h-5" /> Cetak Struk
              </h3>
              <button onClick={() => setSelectedKasbonPayment(null)} className="text-gray-500 hover:text-gray-700">Tutup</button>
            </div>
            
            <div className="p-6 bg-white flex-1 overflow-y-auto text-sm text-gray-800 dark:text-gray-800 print-area relative">
              <div className="text-center mb-6">
                <img src="/ksa_mart_logo.png" alt="KSA Mart Logo" className="w-12 h-12 object-contain mx-auto mb-1" />
                <h2 className="font-extrabold text-xl">{settings.storeName || 'KSA Mart'}</h2>
                <p className="text-xs text-gray-500">{settings.storeAddress || ''}</p>
                <p className="text-xs text-gray-500">Telp: {settings.storePhone || ''}</p>
                <p className="text-xs font-bold mt-1">(COPY / CETAK ULANG)</p>
              </div>

              <div className="border-t border-b border-dashed border-gray-300 py-3 mb-4 text-center">
                <p className="font-bold uppercase tracking-widest">{selectedKasbonPayment.isFullyPaid ? 'BUKTI KASBON LUNAS' : 'BUKTI PEMBAYARAN KASBON'}</p>
              </div>

              <div className="space-y-1 mb-4 text-xs">
                <p><span className="text-slate-400">Tanggal:</span> {new Date(selectedKasbonPayment.paymentDate).toLocaleString('id-ID')}</p>
                <p><span className="text-slate-400">Pelanggan:</span> {selectedKasbonPayment.customerName}</p>
                <p><span className="text-slate-400">Kasir:</span> {selectedKasbonPayment.cashierName}</p>
                <p><span className="text-slate-400">Metode:</span> {selectedKasbonPayment.paymentMethod}</p>
              </div>

              <div className="border-t border-dashed border-gray-300 py-3 mb-4 space-y-2 text-right">
                <div className="flex justify-between font-bold text-sm">
                  <span>Nominal Bayar:</span>
                  <span>Rp {selectedKasbonPayment.amountPaid.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-xs text-amber-700 font-bold border-t border-gray-200 pt-2">
                  <span>Sisa Kasbon:</span>
                  <span>Rp {selectedKasbonPayment.remainingDebt.toLocaleString('id-ID')}</span>
                </div>
              </div>

              {selectedKasbonPayment.isFullyPaid && (
                <div className="border-t border-green-900/20 pt-3 text-center text-green-800 bg-green-50 p-2.5 rounded-lg border border-green-100 mt-4">
                  <p className="font-extrabold uppercase tracking-widest text-lg">LUNAS</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800 flex flex-col gap-2 no-print">
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-2 bg-green-700 hover:bg-green-800 text-white font-bold text-xs rounded-lg text-center shadow-xs flex items-center justify-center gap-1"
                >
                  <Printer className="w-4 h-4" /> Cetak Biasa
                </button>
                <button
                  onClick={async () => {
                    try {
                      await printKasbonPaymentToBluetooth(
                        selectedKasbonPayment,
                        settings.storeName || 'KSA Mart',
                        settings.storeAddress || '',
                        settings.storePhone || ''
                      );
                    } catch (err: any) {
                      alert(err.message || 'Gagal terhubung ke printer Bluetooth.');
                    }
                  }}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg text-center shadow-xs flex items-center justify-center gap-1"
                >
                  <Bluetooth className="w-4 h-4" /> Print Bluetooth
                </button>
              </div>
              <div className="mt-2 border-t border-gray-200 dark:border-slate-700 pt-3 flex gap-2 items-center">
                <input
                  type="text"
                  value={waNumber}
                  onChange={(e) => setWaNumber(e.target.value)}
                  placeholder="No WA (misal: 0812...)"
                  className="flex-1 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-green-500"
                />
                <button
                  onClick={handleSendWAKasbon}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap"
                >
                  Kirim WA
                </button>
              </div>
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
