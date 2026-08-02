import React, { useState, useMemo } from 'react';
import { useBranchData } from '../hooks/useBranchData';
import { FileDown, Search, FileUp, ChevronDown, ChevronRight, ChevronLeft, User, Calendar, DollarSign, Wallet, FileText, Printer, X, CheckCircle, Bluetooth, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import { useAppStore } from '../store';
import { printKasbonCardToBluetooth } from '../lib/bluetoothPrinter';
import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';

export default function KasbonRekapPage() {
  const { settings, currentUser } = useAppStore();
  const { customers, transactions, kasbonPayments } = useBranchData();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'BELUM_LUNAS' | 'LUNAS'>('ALL');
  const [dateFilterType, setDateFilterType] = useState<'ALL' | 'THIS_MONTH' | 'CUSTOM'>('ALL');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [receiptCustomer, setReceiptCustomer] = useState<any | null>(null);
  const [waNumber, setWaNumber] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [isDownloading, setIsDownloading] = useState(false);

  // Group kasbon data by customer
  const customersWithKasbon = useMemo(() => {
    return customers.map(customer => {
      let unallocatedPayment = (kasbonPayments || [])
        .filter(kp => kp.customerId === customer.id && (!kp.targetInvoiceNos || kp.targetInvoiceNos.length === 0))
        .reduce((sum, kp) => sum + kp.amountPaid, 0);

      const debits = (transactions || [])
        .filter(tx => tx.customerId === customer.id && tx.paymentMethod === 'KASBON')
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .map(tx => {
          let isPaid = (kasbonPayments || []).some(kp => kp.customerId === customer.id && kp.targetInvoiceNos?.includes(tx.invoiceNo));
          
          if (!isPaid && unallocatedPayment > 0) {
             if (unallocatedPayment >= tx.totalAmount) {
                 unallocatedPayment -= tx.totalAmount;
                 isPaid = true;
             } else {
                 unallocatedPayment -= tx.totalAmount;
                 if (unallocatedPayment >= 0) isPaid = true;
             }
          }
          if (customer.debtAmount <= 0) isPaid = true;

          return {
            date: new Date(tx.timestamp),
            type: 'PEMBELIAN',
            ref: tx.invoiceNo,
            amount: tx.totalAmount,
            cashier: tx.cashierName,
            isPaid
          };
        });

      const credits = (kasbonPayments || [])
        .filter(kp => kp.customerId === customer.id)
        .map(kp => ({
          date: new Date(kp.paymentDate),
          type: 'PELUNASAN',
          ref: kp.id,
          amount: kp.amountPaid,
          cashier: kp.cashierName,
          note: kp.notes,
          targetInvoiceNos: kp.targetInvoiceNos,
          paymentMethod: kp.paymentMethod
        }));

      const history = [...debits, ...credits].sort((a, b) => a.date.getTime() - b.date.getTime());
      
      let runningBalance = 0;
      const detailedHistory = history.map(item => {
        if (item.type === 'PEMBELIAN') {
          runningBalance += item.amount;
        } else {
          runningBalance -= item.amount;
        }
        return { ...item, balance: Math.max(0, runningBalance) };
      }).sort((a, b) => b.date.getTime() - a.date.getTime()); // Sort newest first for display

      return {
        ...customer,
        history: detailedHistory,
        hasHistory: detailedHistory.length > 0
      };
    }).filter(c => c.hasHistory || c.debtAmount > 0);
  }, [customers, transactions, kasbonPayments]);

  const filteredCustomers = useMemo(() => {
    let result = customersWithKasbon;

    // Filter by Status
    if (statusFilter === 'BELUM_LUNAS') {
      result = result.filter(c => c.debtAmount > 0);
    } else if (statusFilter === 'LUNAS') {
      result = result.filter(c => c.debtAmount === 0);
    }

    // Filter by Date Range (checks if there's any activity in the range)
    if (dateRange.startDate) {
      const start = new Date(dateRange.startDate).setHours(0, 0, 0, 0);
      result = result.filter(c => c.history.some(h => new Date(h.date).getTime() >= start));
    }
    if (dateRange.endDate) {
      const end = new Date(dateRange.endDate).setHours(23, 59, 59, 999);
      result = result.filter(c => c.history.some(h => new Date(h.date).getTime() <= end));
    }

    // Filter by Search Query
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.name.toLowerCase().includes(lowerQuery) ||
        (c.phone && c.phone.includes(searchQuery))
      );
    }

    return result;
  }, [customersWithKasbon, searchQuery, statusFilter, dateRange]);

  // Reset page when filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, dateRange]);

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPiutang = filteredCustomers.reduce((sum, c) => sum + (c.debtAmount || 0), 0);

  const handleExportExcel = () => {
    const data: any[] = [];
    
    filteredCustomers.forEach(customer => {
      if (customer.history.length === 0) {
        data.push({
          "Nama Pelanggan": customer.name,
          "No. Telepon": customer.phone || '-',
          "Tanggal": "",
          "Tipe": "Belum ada transaksi",
          "Referensi": "",
          "Jumlah (Rp)": "",
          "Saldo Setelah Transaksi (Rp)": customer.debtAmount,
          "Kasir": "",
          "Keterangan": ""
        });
      } else {
        customer.history.forEach((h: any) => {
          data.push({
            "Nama Pelanggan": customer.name,
            "No. Telepon": customer.phone || '-',
            "Tanggal": format(h.date, 'dd/MM/yyyy HH:mm'),
            "Tipe": h.type === 'PEMBELIAN' ? 'KASBON BARU' : 'PELUNASAN',
            "Referensi": h.ref,
            "Jumlah (Rp)": h.amount,
            "Saldo Setelah Transaksi (Rp)": h.balance,
            "Kasir": h.cashier || '-',
            "Keterangan": h.note || '-'
          });
        });
      }
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rekap Kasbon");
    
    // Auto-size columns
    const colWidths = [
      { wch: 20 }, { wch: 15 }, { wch: 18 }, { wch: 15 }, 
      { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 20 }
    ];
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, `Rekap_Kasbon_${format(new Date(), 'dd-MM-yyyy')}.xlsx`);
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { addCustomer, updateCustomer } = useAppStore();

  const handleImport = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        if (!data) return;
        
        // Use XLSX to parse the file
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert sheet to JSON array (array of arrays to handle column indices easily)
        const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (rows.length <= 1) {
          alert('File Excel kosong atau tidak valid.');
          return;
        }

        let importedCount = 0;
        // Skip header line (index 0)
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length < 2) continue;

          const name = String(row[0]).trim();
          const phone = String(row[1] || '').trim();
          
          let rawDebt = row.length >= 3 ? String(row[2]) : '0';
          
          // Check if it's our own Export format (which has "Tipe" at col index 3 and "Saldo" at index 6)
          if (row.length >= 7) {
            const tipe = String(row[3]);
            if (tipe === 'Belum ada transaksi') {
              rawDebt = String(row[6]);
            } else if (tipe !== 'Belum ada transaksi') {
               // Skip detailed transaction rows to avoid duplicating or overwriting wrongly
               continue; 
            }
          }

          const debtAmount = parseInt(rawDebt.replace(/\D/g, ''), 10) || 0;
          
          if (name && debtAmount > 0) {
            const existing = customers.find(c => c.name.toLowerCase() === name.toLowerCase());
            if (existing) {
              updateCustomer(existing.id, { debtAmount });
              importedCount++;
            } else {
              addCustomer({
                tenantId: settings.tenantId || 'tenant_default',
                name,
                phone,
                points: 0,
                debtAmount,
                branchId: settings.tenantId
              });
              importedCount++;
            }
          }
        }
        
        alert(`Berhasil mengimpor/memperbarui data kasbon untuk ${importedCount} pelanggan!`);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (err: any) {
        alert('Gagal memproses file Excel: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const toggleExpand = (customerId: string) => {
    setExpandedCustomer(prev => prev === customerId ? null : customerId);
  };

  const handleBluetoothPrint = async () => {
    if (!receiptCustomer) return;
    try {
      await printKasbonCardToBluetooth(
        receiptCustomer,
        settings.storeName || 'KSA Mart',
        settings.storeAddress || '',
        settings.storePhone || '',
        currentUser?.name || 'Sistem'
      );
    } catch (err: any) {
      alert(err.message || 'Gagal terhubung ke printer Bluetooth.');
    }
  };

  const handleSendWA = () => {
    if (!receiptCustomer) return;
    if (!waNumber) {
      alert("Silakan masukkan nomor telepon / WhatsApp terlebih dahulu.");
      return;
    }
    
    let text = `*KARTU KASBON PELANGGAN*\n\n`;
    text += `Toko: ${settings.storeName || 'KSA Mart'}\n`;
    text += `Nama: ${receiptCustomer.name}\n`;
    text += `Tanggal: ${format(new Date(), 'dd/MM/yyyy HH:mm')}\n\n`;
    text += `*Riwayat Transaksi:*\n`;
    
    receiptCustomer.history.forEach((h: any) => {
      const tgl = format(h.date, 'dd/MM/yy');
      const sign = h.type === 'PEMBELIAN' ? '+' : '-';
      const label = h.type === 'PEMBELIAN' ? 'Kasbon Baru' : `Pelunasan${h.paymentMethod ? ` (${h.paymentMethod})` : ''}`;
      text += `[${tgl}] ${label}\nRp ${h.amount.toLocaleString('id-ID')} (${sign})\n`;
    });
    
    text += `\n*SISA KASBON: Rp ${receiptCustomer.debtAmount.toLocaleString('id-ID')}*\n`;
    if (receiptCustomer.debtAmount === 0) {
      text += `*Status: L U N A S*\n`;
    }
    text += `\nKasir: ${currentUser?.name || 'Sistem'}\n`;
    text += `Terima kasih atas kepercayaan Anda berbelanja di KSA Mart.`;

    const encoded = encodeURIComponent(text);
    const num = waNumber.replace(/^0/, '62');
    window.open(`https://wa.me/${num}?text=${encoded}`, '_blank');
  };

  const handleDownloadJPG = async () => {
    const el = document.getElementById('printable-kartu-kasbon');
    if (!el || !receiptCustomer) return;
    
    const originalStyle = el.style.cssText;
    
    try {
      el.style.width = '350px';
      el.style.padding = '16px';
      el.style.backgroundColor = '#ffffff';
      el.style.maxHeight = 'none';
      el.style.overflow = 'visible';
      
      const fullHeight = el.scrollHeight;

      setIsDownloading(true);
      const dataUrl = await htmlToImage.toJpeg(el, {
        quality: 0.95,
        backgroundColor: '#ffffff',
        pixelRatio: 1.5,
        height: fullHeight
      });
      
      const link = document.createElement('a');
      link.download = `Kartu-Kasbon-${receiptCustomer.name.replace(/\\s+/g, '-')}.jpg`;
      link.href = dataUrl;
      link.click();
    } catch (err: any) {
      alert("Gagal membuat JPG: " + err.message);
    } finally {
      el.style.cssText = originalStyle;
      setIsDownloading(false);
    }
  };

  const handleDownloadPDF = async () => {
    const el = document.getElementById('printable-kartu-kasbon');
    if (!el || !receiptCustomer) return;
    
    const originalStyle = el.style.cssText;
    
    try {
      el.style.width = '350px';
      el.style.padding = '16px';
      el.style.backgroundColor = '#ffffff';
      el.style.maxHeight = 'none';
      el.style.overflow = 'visible';
      
      const fullHeight = el.scrollHeight;

      setIsDownloading(true);
      const dataUrl = await htmlToImage.toJpeg(el, {
        quality: 0.95,
        backgroundColor: '#ffffff',
        pixelRatio: 1.5,
        height: fullHeight
      });
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [350, fullHeight]
      });
      
      pdf.addImage(dataUrl, 'JPEG', 0, 0, 350, fullHeight);
      pdf.save(`Kartu-Kasbon-${receiptCustomer.name.replace(/\\s+/g, '-')}.pdf`);
    } catch (err: any) {
      alert("Gagal membuat PDF: " + err.message);
    } finally {
      el.style.cssText = originalStyle;
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6 bg-slate-50 dark:bg-slate-900 p-4 md:p-6 pb-24 md:pb-6">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Wallet className="w-6 h-6 text-rose-500" />
            Master Kasbon Pelanggan
          </h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
            Pantau dan kelola riwayat pengambilan dan pelunasan kasbon pelanggan.
          </p>
        </div>
        
        <div className="flex gap-2">
          <input 
            type="file" 
            accept=".xlsx, .xls, .csv" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
          />
          <button 
            onClick={handleImport}
            className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 font-medium text-sm transition-colors"
          >
            <FileUp className="w-4 h-4" />
            <span>Import</span>
          </button>
          <button 
            onClick={handleExportExcel}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl font-medium text-sm transition-colors shadow-sm"
          >
            <FileDown className="w-4 h-4" />
            <span>Export Laporan</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center text-rose-600 dark:text-rose-400">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Piutang Berjalan</p>
            <p className="text-xl font-bold text-slate-800 dark:text-slate-100">Rp {totalPiutang.toLocaleString('id-ID')}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400">
            <User className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Pelanggan Aktif Kasbon</p>
            <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{filteredCustomers.length} Orang</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row gap-3 justify-between items-center bg-slate-50 dark:bg-slate-800">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Cari nama atau telepon pelanggan..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-sm dark:text-white transition-shadow"
            />
          </div>
          <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3 items-center">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full sm:w-auto px-4 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-rose-500"
            >
              <option value="ALL">Semua Status</option>
              <option value="BELUM_LUNAS">Belum Lunas (Ada Saldo)</option>
              <option value="LUNAS">Lunas (Selesai)</option>
            </select>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={dateFilterType}
                onChange={(e) => {
                  const val = e.target.value as any;
                  setDateFilterType(val);
                  if (val === 'ALL') {
                    setDateRange({ startDate: '', endDate: '' });
                  } else if (val === 'THIS_MONTH') {
                    const today = new Date();
                    setDateRange({ 
                      startDate: new Date(today.getFullYear(), today.getMonth(), 1).toLocaleDateString('en-CA'), 
                      endDate: today.toLocaleDateString('en-CA') 
                    });
                  }
                }}
                className="w-full sm:w-auto px-4 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-rose-500"
              >
                <option value="ALL">Semua Waktu</option>
                <option value="THIS_MONTH">Bulan Ini</option>
                <option value="CUSTOM">Pilih Manual...</option>
              </select>
              
              {dateFilterType === 'CUSTOM' && (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <input 
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full sm:w-auto px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-rose-500"
                  />
                  <span className="text-slate-400">-</span>
                  <input 
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full sm:w-auto px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          {filteredCustomers.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center h-full">
              <FileText className="w-12 h-12 mb-3 text-slate-300 dark:text-slate-600" />
              <p className="font-medium text-lg">Tidak ada data kasbon</p>
              <p className="text-sm">Tidak ditemukan pelanggan yang memiliki riwayat kasbon.</p>
            </div>
          ) : (
            <div className="min-w-[600px] sm:min-w-[800px]">
              <div className="grid grid-cols-12 gap-2 sm:gap-4 p-2 sm:p-4 font-semibold text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10">
                <div className="col-span-1"></div>
                <div className="col-span-3">Nama Pelanggan</div>
                <div className="col-span-2">No. Telepon</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Total Transaksi</div>
                <div className="col-span-2 text-right">Sisa Kasbon</div>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {paginatedCustomers.map((customer) => {
                  const isExpanded = expandedCustomer === customer.id;
                  
                  return (
                    <React.Fragment key={customer.id}>
                      {/* Customer Row */}
                      <div 
                        onClick={() => toggleExpand(customer.id)}
                        className={`grid grid-cols-12 gap-2 sm:gap-4 p-2 sm:p-4 items-center cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${isExpanded ? 'bg-slate-50 dark:bg-slate-800/50' : ''}`}
                      >
                        <div className="col-span-1 flex justify-center text-slate-400">
                          {isExpanded ? <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" /> : <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />}
                        </div>
                        <div className="col-span-3 font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-base">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center text-rose-600 dark:text-rose-400 font-bold text-[10px] sm:text-xs uppercase shrink-0">
                            {customer.name.substring(0, 2)}
                          </div>
                          <span className="truncate">{customer.name}</span>
                        </div>
                        <div className="col-span-2 text-[10px] sm:text-sm text-slate-600 dark:text-slate-400">
                          {customer.phone || '-'}
                        </div>
                        <div className="col-span-2 text-[10px] sm:text-sm">
                          {customer.debtAmount > 0 
                            ? <span className="inline-flex items-center px-1.5 py-0.5 sm:px-2 rounded text-[9px] sm:text-xs font-medium bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400">Belum Lunas</span>
                            : (
                                <div className="flex flex-col gap-0.5">
                                  <span className="inline-flex items-center px-1.5 py-0.5 sm:px-2 rounded text-[9px] sm:text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 w-fit">Lunas</span>
                                  {customer.history.find((h: any) => h.type === 'PELUNASAN') && (
                                    <span className="text-[8px] sm:text-[10px] text-slate-500 whitespace-nowrap">
                                      {format(customer.history.find((h: any) => h.type === 'PELUNASAN').date, 'dd/MM/yy')} | Ref: {customer.history.find((h: any) => h.type === 'PELUNASAN').ref.substring(0,8)}...
                                    </span>
                                  )}
                                </div>
                            )
                          }
                        </div>
                        <div className="col-span-2 text-[10px] sm:text-sm text-slate-600 dark:text-slate-400">
                          {customer.history.length} Riwayat
                        </div>
                        <div className="col-span-2 text-right font-bold text-[11px] sm:text-base text-rose-600 dark:text-rose-400">
                          Rp {customer.debtAmount.toLocaleString('id-ID')}
                        </div>
                      </div>

                      {/* Expanded History Details */}
                      {isExpanded && (
                        <div className="col-span-12 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 p-3 sm:p-6">
                          <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <h4 className="font-semibold text-[11px] sm:text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2">
                              <Calendar className="w-3 h-3 sm:w-4 sm:h-4" /> Detail Riwayat Kasbon & Pelunasan
                            </h4>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setReceiptCustomer(customer);
                                setWaNumber(customer.phone || '');
                              }}
                              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors no-print"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              Cetak Kartu
                            </button>
                          </div>
                          
                          {customer.history.length === 0 ? (
                            <p className="text-[10px] sm:text-sm text-slate-500 italic">Belum ada riwayat transaksi kasbon yang tercatat untuk pelanggan ini.</p>
                          ) : (
                            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-x-auto">
                              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                                <thead className="bg-slate-100 dark:bg-slate-800">
                                  <tr>
                                    <th scope="col" className="px-2 py-2 sm:px-4 sm:py-3 text-left text-[9px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tanggal</th>
                                    <th scope="col" className="px-2 py-2 sm:px-4 sm:py-3 text-left text-[9px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tipe</th>
                                    <th scope="col" className="px-2 py-2 sm:px-4 sm:py-3 text-left text-[9px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ref / Kasir</th>
                                    <th scope="col" className="px-2 py-2 sm:px-4 sm:py-3 text-right text-[9px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nominal</th>
                                    <th scope="col" className="px-2 py-2 sm:px-4 sm:py-3 text-right text-[9px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Saldo</th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
                                  {customer.history.map((h, idx) => (
                                    <tr key={`${h.ref}-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                      <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-[10px] sm:text-sm text-slate-700 dark:text-slate-300">
                                        {format(h.date, 'dd MMM yy HH:mm', { locale: id })}
                                      </td>
                                      <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap font-medium">
                                        <span className={`inline-flex items-center px-1.5 py-0.5 sm:px-2 rounded text-[9px] sm:text-xs font-medium ${
                                          h.type === 'PEMBELIAN' 
                                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400' 
                                            : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                        }`}>
                                          {h.type === 'PEMBELIAN' 
                                            ? `KASBON BARU ${h.isPaid ? '(Lunas)' : '(Belum Dilunasi)'}` 
                                            : `PELUNASAN ${h.targetInvoiceNos?.length ? `(Inv: ${h.targetInvoiceNos.join(', ')})` : ''}`}
                                        </span>
                                      </td>
                                      <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-[10px] sm:text-sm text-slate-600 dark:text-slate-400">
                                        <div className="font-medium text-slate-700 dark:text-slate-300">{h.ref}</div>
                                        <div className="text-[9px] sm:text-xs">{h.cashier || 'Sistem'}</div>
                                      </td>
                                      <td className={`px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-[10px] sm:text-sm text-right font-bold ${
                                        h.type === 'PEMBELIAN' ? 'text-rose-600 dark:text-rose-400' : 'text-green-600 dark:text-green-400'
                                      }`}>
                                        {h.type === 'PEMBELIAN' ? '+' : '-'} Rp {h.amount.toLocaleString('id-ID')}
                                      </td>
                                      <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-[10px] sm:text-sm text-right font-bold text-slate-800 dark:text-slate-200">
                                        Rp {h.balance.toLocaleString('id-ID')}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Table Footer / Pagination Controls */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between bg-slate-50 dark:bg-slate-800 gap-4">
          
          {/* Grand Totals */}
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 w-full sm:w-auto bg-white dark:bg-slate-900 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="text-center sm:text-left">
              <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider">Total Pelanggan</p>
              <p className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-200">{filteredCustomers.length} Orang</p>
            </div>
            <div className="hidden sm:block w-px h-8 bg-slate-200 dark:bg-slate-700"></div>
            <div className="text-center sm:text-left">
              <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider">Total Sisa Kasbon</p>
              <p className="text-sm sm:text-base font-black text-rose-600 dark:text-rose-400">Rp {totalPiutang.toLocaleString('id-ID')}</p>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Menampilkan <span className="font-bold text-slate-700 dark:text-slate-300">{((currentPage - 1) * itemsPerPage) + 1}</span> - <span className="font-bold text-slate-700 dark:text-slate-300">{Math.min(currentPage * itemsPerPage, filteredCustomers.length)}</span> dari <span className="font-bold text-slate-700 dark:text-slate-300">{filteredCustomers.length}</span>
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 px-1 sm:px-2">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {receiptCustomer && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
          <style dangerouslySetInnerHTML={{__html: `
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
          `}} />
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Receipt headers */}
            <div className="p-4 text-center border-b border-gray-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 no-print">
              <h3 className="font-bold text-gray-800 dark:text-slate-200 text-sm">Pratinjau Kartu Kasbon</h3>
              <p className="text-xs text-gray-400 mt-0.5">Format cetak printer kasir (58mm)</p>
            </div>

            {/* Simulated Thermic strip content */}
            <div id="printable-kartu-kasbon" className="printable-area printable-thermal p-1 space-y-0.5 text-[10px] font-mono text-gray-700 dark:text-slate-300 border-b border-dashed border-gray-200 dark:border-slate-700 max-h-96 overflow-y-auto bg-white">
              <div className="text-center space-y-0.5 border-b border-gray-100 dark:border-slate-800 pb-2">
                <p className="font-bold text-gray-800 dark:text-slate-200 text-[11px]">{settings.storeName || 'KSA Mart'}</p>
                <p className="text-slate-400 uppercase">{settings.storeAddress || 'Alamat Belum Diatur'}</p>
                <p className="text-slate-400">Telp: {settings.storePhone || '-'}</p>
              </div>

              <div className="text-center py-2 font-bold uppercase border-b border-dashed border-gray-200 dark:border-slate-700 text-[11px]">
                KARTU KASBON PELANGGAN
              </div>

              <div className="py-2 space-y-0.5">
                <div className="flex justify-between">
                  <span>Nama</span>
                  <span>{receiptCustomer.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Telp</span>
                  <span>{receiptCustomer.phone || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tgl Cetak</span>
                  <span>{format(new Date(), 'dd/MM/yyyy HH:mm')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kasir</span>
                  <span>{currentUser?.name || 'Sistem'}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-gray-200 dark:border-slate-700 py-1">
                <div className="grid grid-cols-[1fr_1fr_1fr] font-bold mb-1">
                  <span className="text-left">TGL</span>
                  <span className="text-center">REF</span>
                  <span className="text-right">NOMINAL</span>
                </div>
                {receiptCustomer.history.map((h: any, i: number) => (
                  <div key={i} className="mb-2">
                    <div className="grid grid-cols-[1fr_1fr_1fr] text-[9px] gap-1 items-start">
                      <div className="flex flex-col text-left">
                        <span>{format(h.date, 'dd/MM/yy')}</span>
                        <span className="leading-tight mt-0.5">{h.type === 'PEMBELIAN' ? `KASBON ${h.isPaid ? '(Lunas)' : '(Belum Lunas)'}` : `PELUNASAN`}</span>
                      </div>
                      <div className="flex flex-col text-center">
                        <span className="truncate max-w-[80px] mx-auto">{h.ref}</span>
                      </div>
                      <div className="flex flex-col text-right">
                        <span>{h.type === 'PEMBELIAN' ? '+' : '-'} {h.amount.toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-solid border-gray-200 dark:border-slate-700 pt-2 pb-4">
                <div className="flex justify-between font-bold text-[11px]">
                  <span>SISA KASBON</span>
                  <div className="flex items-center gap-1.5">
                    {receiptCustomer.debtAmount === 0 && (
                      <span className="bg-emerald-100 text-emerald-700 px-1 py-0.5 rounded text-[8px] font-black border border-emerald-200">LUNAS</span>
                    )}
                    <span>Rp {receiptCustomer.debtAmount.toLocaleString('id-ID')}</span>
                  </div>
                </div>
                <p className="text-center text-[8px] text-slate-400 mt-4 leading-tight">
                  Simpan struk ini sebagai bukti
                  <br />transaksi kasbon Anda yang sah.
                </p>
              </div>
            </div>

            <div className="px-4 pt-4 bg-slate-50 dark:bg-slate-800/80 no-print">
              <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                No. WhatsApp (Gunakan awalan 08 atau 62)
              </label>
              <input
                type="text"
                value={waNumber}
                onChange={(e) => setWaNumber(e.target.value)}
                placeholder="Contoh: 08123456789"
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded focus:ring-2 focus:ring-rose-500 outline-none"
              />
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 no-print flex flex-col gap-2">
              <div className="flex gap-2">
                <button
                  onClick={() => setReceiptCustomer(null)}
                  className="flex-1 py-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-300 font-semibold text-xs rounded-lg text-center transition-colors"
                >
                  Tutup
                </button>
                <button
                  onClick={handleSendWA}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg text-center shadow-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> WA Teks
                </button>
                <button
                  onClick={handleDownloadJPG}
                  disabled={isDownloading}
                  className={`flex-1 py-2 ${isDownloading ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'} text-white font-bold text-xs rounded-lg text-center shadow-xs flex items-center justify-center gap-1.5`}
                >
                  <FileDown className="w-3.5 h-3.5" /> {isDownloading ? 'Memproses...' : 'Unduh JPG'}
                </button>
                <button
                  onClick={handleDownloadPDF}
                  disabled={isDownloading}
                  className={`flex-1 py-2 ${isDownloading ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'} text-white font-bold text-xs rounded-lg text-center shadow-xs flex items-center justify-center gap-1.5`}
                >
                  <FileText className="w-3.5 h-3.5" /> {isDownloading ? 'Memproses...' : 'Unduh PDF'}
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg text-center shadow-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" /> Cetak Kabel
                </button>
                <button
                  onClick={handleBluetoothPrint}
                  className="flex-1 py-2 bg-green-700 hover:bg-green-800 text-white font-bold text-xs rounded-lg text-center shadow-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Bluetooth className="w-3.5 h-3.5" /> Cetak BT
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
