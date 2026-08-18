import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useBranchData } from '../hooks/useBranchData';
import { useAppStore } from '../store';
import { Users, Plus, Search, Trash2, Edit, CreditCard, Download, Upload, Printer, Bluetooth, MessageCircle, ClipboardList, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { printKasbonPaymentToBluetooth } from '../lib/bluetoothPrinter';

export default function CustomerManagementPage() {
  const { customers, addCustomer, updateCustomer, deleteCustomer, currentUser, addJournalEntry, settings, users, updateUser, transactions, addKasbonPayment, kasbonPayments, coaList } = useBranchData();
  const location = useLocation();
  const navigate = useNavigate();
  const [isAdding, setIsAdding] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ done: 0, total: 0 });
  const registerUser = useAppStore(state => state.registerUser);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [customId, setCustomId] = useState('');

  const [resetPwdModal, setResetPwdModal] = useState<{isOpen: boolean, userId: string, userName: string, newPwd: ''}>({
    isOpen: false, userId: '', userName: '', newPwd: ''
  });
  
  const [createAccountModal, setCreateAccountModal] = useState<{isOpen: boolean, customerId: string, customerName: string, phone: string, initialPwd: ''}>({
    isOpen: false, customerId: '', customerName: '', phone: '', initialPwd: ''
  });
  
  const [payoffModal, setPayoffModal] = useState<{ isOpen: boolean, customerId: string, customerName: string, debtAmount: number, payAmount: number, paymentMethod: string, notes?: string, selectedInvoices: string[], debitAccountId?: string, creditAccountId?: string }>({
    isOpen: false, customerId: '', customerName: '', debtAmount: 0, payAmount: 0, paymentMethod: 'CASH', selectedInvoices: [], debitAccountId: '', creditAccountId: ''
  });

  const [receiptModal, setReceiptModal] = useState<{ isOpen: boolean, record: import('../types').KasbonPaymentRecord | null }>({
    isOpen: false, record: null
  });

  const [kasbonHistoryModal, setKasbonHistoryModal] = useState<{isOpen: boolean, customerId: string, customerName: string}>({
    isOpen: false, customerId: '', customerName: ''
  });

  const [waNumber, setWaNumber] = useState('');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [totalPointsEarned, setTotalPointsEarned] = useState(0);
  const [totalPointsRedeemed, setTotalPointsRedeemed] = useState(0);
  const [points, setPoints] = useState(0);
  const [lastPointsUpdate, setLastPointsUpdate] = useState(new Date().toLocaleDateString('en-CA'));
  const [debtAmount, setDebtAmount] = useState(0);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'SEMUA' | 'PUNYA_AKUN' | 'BELUM_ADA' | 'KASBON' | 'POIN_TERPAKAI' | 'PERNAH_BELANJA'>('SEMUA');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  if (!['ADMIN', 'OWNER', 'SUPERADMIN', 'MANAGER', 'PENGURUS'].includes(currentUser?.role || '')) {
    return <div className="p-6 text-red-700">Akses Ditolak. Khusus Admin/Owner.</div>;
  }

  // Calculate actual historical points if missing from backend
  // Calculate actual historical points if missing from backend
  const enrichedCustomers = customers.map(c => {
    const customerTxs = transactions.filter(tx => tx.customerId === c.id);
    const redeemed = Math.max(c.totalPointsRedeemed || 0, customerTxs.reduce((sum, tx) => sum + (Number(tx.pointsRedeemed) || 0), 0));
    const earnedTx = customerTxs.reduce((sum, tx) => sum + (Number(tx.pointsEarned) || 0), 0);
    
    // Logika matematika murni: Total Poin yang pernah didapat = Sisa Saat Ini + Total Terpakai
    const earnedLogic = (Number(c.points) || 0) + redeemed;
    const earned = Math.max(c.totalPointsEarned || 0, earnedTx, earnedLogic);
    
    const totalSpending = customerTxs.reduce((sum, tx) => sum + (tx.isVoided ? 0 : tx.totalAmount), 0);
    const lastTransactionDate = customerTxs.length > 0 
      ? new Date(Math.max(...customerTxs.map(tx => new Date(tx.timestamp).getTime())))
      : new Date(c.createdAt || 0);

    return {
      ...c,
      totalPointsEarned: earned,
      totalPointsRedeemed: redeemed,
      totalSpending,
      lastTransactionDate
    };
  });

  const filtered = enrichedCustomers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone.includes(searchTerm);
    const linkedUser = users.find(u => u.role === 'PELANGGAN' && u.username === c.phone);
    if (filterType === 'PUNYA_AKUN') return matchesSearch && linkedUser;
    if (filterType === 'BELUM_ADA') return matchesSearch && !linkedUser;
    if (filterType === 'KASBON') return matchesSearch && (c.debtAmount || 0) > 0;
    if (filterType === 'POIN_TERPAKAI') return matchesSearch && (c.totalPointsRedeemed || 0) > 0;
    if (filterType === 'PERNAH_BELANJA') return matchesSearch && (c.totalSpending || 0) > 0;
    return matchesSearch;
  }).sort((a, b) => {
    return b.lastTransactionDate.getTime() - a.lastTransactionDate.getTime();
  });
  
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentCustomers = filtered.slice(startIndex, startIndex + itemsPerPage);

  const totalPointsEarnedSum = filtered.reduce((sum, c) => sum + (c.totalPointsEarned || c.points), 0);
  const totalPointsRedeemedSum = filtered.reduce((sum, c) => sum + (c.totalPointsRedeemed || 0), 0);
  const totalRemainingPointsSum = filtered.reduce((sum, c) => sum + (c.points || 0), 0);
  const totalValueSum = filtered.reduce((sum, c) => sum + ((c.points || 0) * (settings?.pointRedemptionValue || 10)), 0);
  const totalDebtSum = filtered.reduce((sum, c) => sum + (c.debtAmount || 0), 0);
  const totalSpendingSum = filtered.reduce((sum, c) => sum + (c.totalSpending || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone) {
      const isDuplicate = customers.some(c => c.phone === phone && c.id !== editingId);
      if (isDuplicate) {
        alert('Nomor HP ini sudah digunakan oleh akun pelanggan lain!');
        return;
      }
    }
    
    if (editingId) {
      updateCustomer(editingId, { id: customId || editingId, name, phone, points, totalPointsEarned, totalPointsRedeemed, lastPointsUpdate, debtAmount });
      if (customId && customId !== editingId) setEditingId(customId);
    } else {
      addCustomer({ id: customId || undefined, tenantId: currentUser?.tenantId || 'tenant_default', name, phone, points, totalPointsEarned, totalPointsRedeemed, lastPointsUpdate, debtAmount, branchId: currentUser?.branchId });
    }
    resetForm();
  };

  const resetForm = () => {
    setCustomId('');
    setName('');
    setPhone('');
    setTotalPointsEarned(0);
    setTotalPointsRedeemed(0);
    setPoints(0);
    setLastPointsUpdate(new Date().toLocaleDateString('en-CA'));
    setDebtAmount(0);
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEdit = (c: any) => {
    try {
      setCustomId(c.id || '');
      setName(c.name || '');
      setPhone(c.phone || '');
      setTotalPointsEarned(Number(c.totalPointsEarned) || Number(c.points) || 0);
      setTotalPointsRedeemed(Number(c.totalPointsRedeemed) || 0);
      setPoints(Number(c.points) || 0);
      setLastPointsUpdate(c.lastPointsUpdate || (c.createdAt ? String(c.createdAt).split('T')[0] : new Date().toLocaleDateString('en-CA')));
      setDebtAmount(Number(c.debtAmount) || 0);
      setEditingId(c.id);
      setIsAdding(true);
      
      setTimeout(() => {
        const formEl = document.getElementById('form-pelanggan');
        if (formEl) {
          formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          const mainContainer = document.getElementById('main-scroll-container');
          if (mainContainer) mainContainer.scrollTo({ top: 0, behavior: 'smooth' });
          else window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 100);
    } catch (err: any) {
      alert('Gagal edit: ' + err.message);
    }
  };

  useEffect(() => {
    if (location.state?.selectedCustomerId && customers.length > 0) {
      const targetId = location.state.selectedCustomerId;
      const customer = customers.find((c: any) => c.id === targetId);
      if (customer) {
        setSearchTerm(customer.name); // Filter the list to easily see the customer
        
        // Clear the state properly using React Router
        navigate(location.pathname, { replace: true, state: {} });
      }
    }
  }, [location.state, customers]);

  const handleProcessPayoff = () => {
    const { customerId, customerName, debtAmount, payAmount, paymentMethod } = payoffModal;
    if (payAmount <= 0) return;
    if (payAmount > debtAmount) {
      alert('Nominal pelunasan tidak boleh lebih besar dari total piutang!');
      return;
    }

    const newDebt = debtAmount - payAmount;
    updateCustomer(customerId, { debtAmount: newDebt });

    const getAccountForMethod = (method: string) => {
      if (method === 'QRIS_SHARIAH') return '1-1020';
      if (method === 'TRANSFER_BSI') return '1103';
      return '1101';
    };

    let targetAccount = getAccountForMethod(paymentMethod);
    if (payoffModal.debitAccountId) {
      targetAccount = payoffModal.debitAccountId.split(' - ')[0].trim();
    }

    let targetCreditAccount = '1-1030';
    if (payoffModal.creditAccountId) {
      targetCreditAccount = payoffModal.creditAccountId.split(' - ')[0].trim();
    }

    const { addJournalEntries } = useAppStore.getState();
    const dateStr = new Date().toISOString();
    const tenantIdStr = currentUser?.tenantId || 'tenant_default';

    addJournalEntries([
      {
        tenantId: tenantIdStr,
        date: dateStr,
        account: targetAccount,
        description: `[Auto] Pelunasan piutang (kasbon) dari pelanggan: ${customerName} via ${paymentMethod}${payoffModal.notes ? ' - ' + payoffModal.notes : ''}`,
        debit: payAmount,
        credit: 0,
        referenceId: customerId,
        referenceType: 'MANUAL',
        createdBy: currentUser?.name || 'System',
        branchId: currentUser?.branchId
      },
      {
        tenantId: tenantIdStr,
        date: dateStr,
        account: targetCreditAccount, // Piutang Kasbon Pelanggan
        description: `[Auto] Pengurangan piutang pelanggan: ${customerName}${payoffModal.notes ? ' - ' + payoffModal.notes : ''}`,
        debit: 0,
        credit: payAmount,
        referenceId: customerId,
        referenceType: 'MANUAL',
        createdBy: currentUser?.name || 'System',
        branchId: currentUser?.branchId
      }
    ]);

    const newPaymentRecord = {
      tenantId: tenantIdStr,
      customerId,
      customerName,
      amountPaid: payAmount,
      remainingDebt: newDebt,
      paymentMethod,
      cashierName: currentUser?.name || 'Kasir',
      isFullyPaid: newDebt <= 0,
      notes: payoffModal.notes,
      targetInvoiceNos: payoffModal.selectedInvoices
    };
    addKasbonPayment(newPaymentRecord);
    
    // Find customer to prefill WA
    const cust = customers.find(c => c.id === customerId);
    if (cust && cust.phone) setWaNumber(cust.phone);
    else setWaNumber('');

    setPayoffModal({ isOpen: false, customerId: '', customerName: '', debtAmount: 0, payAmount: 0, paymentMethod: 'CASH', selectedInvoices: [], debitAccountId: '', creditAccountId: '' });
    setReceiptModal({ isOpen: true, record: { ...newPaymentRecord, id: `kp_${Date.now()}`, paymentDate: dateStr } });
  };

  const handleBluetoothPrint = async () => {
    if (!receiptModal.record) return;
    try {
      await printKasbonPaymentToBluetooth(
        receiptModal.record,
        settings.storeName || 'KSA Mart',
        settings.storeAddress || '',
        settings.storePhone || ''
      );
    } catch (err: any) {
      alert(err.message || 'Gagal terhubung ke printer Bluetooth.');
    }
  };

  const handleSendWA = () => {
    if (!receiptModal.record) return;
    if (!waNumber) {
      alert("Silakan masukkan nomor WhatsApp pelanggan terlebih dahulu.");
      return;
    }
    
    let formattedPhone = waNumber.replace(/[^0-9]/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '62' + formattedPhone.slice(1);
    }
    
    const rec = receiptModal.record;
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
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedText}`;
    window.open(whatsappUrl, '_blank');
  };

  const getKasbonHistory = (customerId: string) => {
    const debitsRaw = transactions
      .filter(tx => tx.customerId === customerId && tx.paymentMethod === 'KASBON' && !tx.isVoided)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const explicitPaidInvoiceNos = new Set<string>();
    (kasbonPayments || []).forEach(p => {
      if (p.customerId === customerId && p.targetInvoiceNos) {
        p.targetInvoiceNos.forEach(id => explicitPaidInvoiceNos.add(id));
      }
    });

    let totalDebits = 0;
    let explicitPaidAmount = 0;
    debitsRaw.forEach(tx => {
       totalDebits += tx.totalAmount;
       if (explicitPaidInvoiceNos.has(tx.invoiceNo)) {
          explicitPaidAmount += tx.totalAmount;
       }
    });

    const cust = customers.find(c => c.id === customerId);
    const debtAmount = cust ? (cust.debtAmount || 0) : 0;
    let totalPaid = totalDebits - debtAmount;
    let unallocatedPayment = totalPaid - explicitPaidAmount;

    const paidInvoices = new Set<string>(explicitPaidInvoiceNos);
    
    debitsRaw.forEach(tx => {
        if (!paidInvoices.has(tx.invoiceNo)) {
            if (unallocatedPayment >= tx.totalAmount - 0.01) {
                unallocatedPayment -= tx.totalAmount;
                paidInvoices.add(tx.invoiceNo);
            } else if (unallocatedPayment > 0) {
                unallocatedPayment = 0; // partially paid, not lunas
            }
        }
    });

    const debits = debitsRaw.map(tx => ({
        date: new Date(tx.timestamp),
        type: 'PEMBELIAN',
        isLunas: paidInvoices.has(tx.invoiceNo),
        ref: tx.id,
        invoiceNo: tx.invoiceNo,
        amount: tx.totalAmount,
        cashier: tx.cashierName
    }));
      
    const credits = (kasbonPayments || [])
      .filter(kp => kp.customerId === customerId)
      .map(kp => ({
        date: new Date(kp.paymentDate),
        type: 'PELUNASAN',
        isLunas: false,
        ref: kp.id,
        amount: kp.amountPaid,
        cashier: kp.cashierName
      }));
      
    const history = [...debits, ...credits].sort((a, b) => a.date.getTime() - b.date.getTime());
    
    let runningBalance = 0;
    return history.map(item => {
      if (item.type === 'PEMBELIAN') {
        runningBalance += item.amount;
      } else {
        runningBalance -= item.amount;
      }
      return { ...item, balance: Math.max(0, runningBalance) };
    });
  };

  return (
    <div className="p-3 md:p-6 max-w-5xl mx-auto space-y-4 md:space-y-6 w-full min-w-0 pb-10">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 text-blue-800 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-slate-200">Master Pelanggan (CRM)</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">Kelola data pelanggan, loyalitas, dan catatan piutang/kasbon.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto w-full hide-scrollbar pb-1" style={{ WebkitOverflowScrolling: 'touch' }}>
          <button
            onClick={() => { resetForm(); setIsAdding(!isAdding); }}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md transition-all flex-shrink-0 whitespace-nowrap"
          >
            {isAdding ? 'Batal' : <><Plus className="w-4 h-4" /> Pelanggan Baru</>}
          </button>
          <button onClick={() => {
            const headers = ['id', 'phone', 'name', 'Total Point', 'point terpakai', 'Sisa Point', 'tanggal update', 'Nilai (Rp)', 'Aksi'];
            const sample = ['1', '', 'Aan Andriani', 2732, 0, 2732, '2026-06-01', 13660, ''];
            const ws = XLSX.utils.aoa_to_sheet([headers, sample]);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Template Master Pelanggan');
            XLSX.writeFile(wb, 'template_master_pelanggan_ksa_mart.xlsx');
          }} className="ml-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 px-3 py-2 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-800 flex items-center gap-2 flex-shrink-0 whitespace-nowrap">
            <Download className="w-4 h-4" /> Unduh Template
          </button>
          <label className="ml-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 px-3 py-2 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-800 flex items-center gap-2 cursor-pointer flex-shrink-0 whitespace-nowrap">
            <Upload className="w-4 h-4" /> Import
            <input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => {
              const file = e.target.files?.[0]; if (!file) return;
              if (settings?.uploadPassword) {
                const allowedRoles: string[] = settings.uploadPasswordRoles || [];
                const skipPrompt = allowedRoles.includes(currentUser?.role || '') || currentUser?.role === 'OWNER';
                if (!skipPrompt) {
                  const pw = prompt('Masukkan sandi import:');
                  if (pw !== settings.uploadPassword) { alert('Sandi import salah. Proses dibatalkan.'); e.target.value = ''; return; }
                }
              }
              const reader = new FileReader();
              reader.onload = (ev) => {
                try {
                  const data = new Uint8Array(ev.target?.result as ArrayBuffer);
                  const workbook = XLSX.read(data, { type: 'array' });
                  const sheetName = workbook.SheetNames[0];
                  const worksheet = workbook.Sheets[sheetName];
                  const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
                  if (rows.length <= 1) { alert('File kosong atau tidak memiliki data.'); e.target.value = ''; return; }
                  setIsImporting(true);
                  setImportProgress({ done: 0, total: rows.length - 1 });
                  const headers = rows[0].map(h => String(h || '').trim().toLowerCase());
                  const idxName = headers.findIndex(h => ['name', 'nama pelanggan', 'nama akun', 'customer name'].includes(h));
                  const idxPhone = headers.findIndex(h => ['phone', 'no whatsapp', 'whatsapp', 'no hp'].includes(h));
                  const idxTotalPoint = headers.findIndex(h => ['total point', 'total poin', 'total points'].includes(h));
                  const idxUsedPoint = headers.findIndex(h => ['point terpakai', 'poin terpakai'].includes(h));
                  const idxRemainingPoint = headers.findIndex(h => ['sisa point', 'sisa poin', 'remaining points'].includes(h));
                  const idxDebt = headers.findIndex(h => ['debtamount', 'piutang (rp)', 'kasbon', 'piutang', 'debt'].includes(h));
                  const idxBranch = headers.findIndex(h => ['branchid', 'cabang'].includes(h));
                  if (idxName === -1) { alert('Template salah. Pastikan ada kolom name / Nama Pelanggan.'); setIsImporting(false); e.target.value = ''; return; }
                  let imported = 0;
                  const existingPhones = new Set(customers.filter(c => c.phone).map(c => c.phone));
                  
                  for (let i = 1; i < rows.length; i++) {
                    const row = rows[i]; if (!row || row.length === 0) { setImportProgress(p => ({ ...p, done: p.done + 1 })); continue; }
                    const nameVal = String(row[idxName] || '').trim(); if (!nameVal) { setImportProgress(p => ({ ...p, done: p.done + 1 })); continue; }
                    const phoneVal = idxPhone !== -1 ? String(row[idxPhone] || '').trim() : '';

                    if (phoneVal && existingPhones.has(phoneVal)) {
                      setImportProgress(p => ({ ...p, done: p.done + 1 }));
                      continue; // Skip duplicate phone
                    }
                    if (phoneVal) existingPhones.add(phoneVal);

                    const totalPt = idxTotalPoint !== -1 ? Number(row[idxTotalPoint]) || 0 : 0;
                    const usedPt = idxUsedPoint !== -1 ? Number(row[idxUsedPoint]) || 0 : 0;
                    const remainingPt = idxRemainingPoint !== -1 ? Number(row[idxRemainingPoint]) || 0 : 0;

                    const pointsVal = remainingPt > 0 ? remainingPt : Math.max(0, totalPt - usedPt);
                    const debtVal = idxDebt !== -1 ? Number(row[idxDebt]) || 0 : 0;
                    const branchVal = idxBranch !== -1 ? String(row[idxBranch] || '').trim() : currentUser?.branchId;
                    addCustomer({
                      tenantId: currentUser?.tenantId || 'tenant_default',
                      name: nameVal,
                      phone: phoneVal,
                      points: pointsVal,
                      debtAmount: debtVal,
                      branchId: branchVal || currentUser?.branchId
                    });
                    imported++;
                    setImportProgress(p => ({ ...p, done: p.done + 1 }));
                  }
                  alert(`Berhasil mengimpor ${imported} pelanggan.`);
                } catch (err: any) { console.error(err); alert('Gagal mengimpor file: ' + (err.message || err)); }
                setIsImporting(false);
                e.target.value = '';
              };
              reader.readAsArrayBuffer(file);
            }} style={{ display: 'none' }} />
          </label>
        </div>
      </div>
      {isImporting && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
          Mengimpor data pelanggan... Progres: {importProgress.done}/{importProgress.total}
        </div>
      )}

      {isAdding && (
        <div id="form-pelanggan" className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 mb-6 animate-in fade-in slide-in-from-top-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">{editingId ? 'Edit Pelanggan' : 'Tambah Pelanggan Baru'}</h2>
            <button onClick={() => { resetForm(); setIsAdding(false); }} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold">
              Tutup Form
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-slate-400 mb-1">id</label>
              <input type="text" value={customId} onChange={e => setCustomId(e.target.value)} placeholder="(Otomatis)" className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-slate-400 mb-1">phone</label>
              <input type="text" required value={phone} onChange={e => setPhone(e.target.value)} className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-slate-400 mb-1">name</label>
              <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-slate-400 mb-1">Total Point</label>
                <input type="number" min={0} value={totalPointsEarned} onChange={e => {
                  const val = Number(e.target.value) || 0;
                  setTotalPointsEarned(val);
                  setPoints(Math.max(0, val - totalPointsRedeemed));
                }} className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-slate-400 mb-1">point terpakai</label>
                <input type="number" min={0} value={totalPointsRedeemed} onChange={e => {
                  const val = Number(e.target.value) || 0;
                  setTotalPointsRedeemed(val);
                  setPoints(Math.max(0, totalPointsEarned - val));
                }} className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-slate-400 mb-1">Sisa Point</label>
                <input type="number" min={0} value={points} onChange={e => setPoints(Number(e.target.value) || 0)} className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold text-center" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-slate-400 mb-1">tanggal update</label>
                <input type="date" required value={lastPointsUpdate} onChange={e => setLastPointsUpdate(e.target.value)} className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-center" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-slate-400 mb-1">Nilai (Rp)</label>
                <input type="number" min={0} value={points * (settings?.pointRedemptionValue || 10)} onChange={e => setPoints(Math.floor((Number(e.target.value) || 0) / (settings?.pointRedemptionValue || 10)))} className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-right font-bold text-green-700" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-red-600 dark:text-red-400 mb-1">Piutang / Kasbon (Rp)</label>
              <input type="number" min={0} value={debtAmount} onChange={e => setDebtAmount(Number(e.target.value) || 0)} className="w-full border border-red-200 dark:border-red-900/50 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 outline-none font-bold text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-900/10" />
            </div>
            {editingId && (
              <div className="pt-2 border-t border-gray-100 dark:border-slate-800">
                {users.find(u => u.role === 'PELANGGAN' && u.username === phone) ? (
                  <button type="button" onClick={() => setResetPwdModal({ isOpen: true, userId: users.find(u => u.role === 'PELANGGAN' && u.username === phone)!.id, userName: name, newPwd: '' as any })} className="w-full bg-amber-100 text-amber-700 font-bold py-2 rounded-lg text-sm border border-amber-200 hover:bg-amber-200">Ubah Sandi Login</button>
                ) : (
                  <button type="button" onClick={() => setCreateAccountModal({ isOpen: true, customerId: editingId, customerName: name, phone: phone, initialPwd: '' as any })} className="w-full bg-blue-100 text-blue-700 font-bold py-2 rounded-lg text-sm border border-blue-200 hover:bg-blue-200">Buatkan Akun Login</button>
                )}
              </div>
            )}
            <button type="submit" className="w-full bg-green-600 text-white font-bold py-2 rounded-lg mt-2">Simpan Data</button>
          </form>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetPwdModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="p-4 border-b border-gray-100 dark:border-slate-800">
              <h3 className="font-bold text-gray-800 dark:text-slate-200">Reset Sandi Pelanggan</h3>
              <p className="text-[10px] text-gray-500">{resetPwdModal.userName}</p>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">Sandi Baru</label>
                <input 
                  type="text" 
                  value={resetPwdModal.newPwd} 
                  onChange={e => setResetPwdModal(prev => ({...prev, newPwd: e.target.value as any}))} 
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                  placeholder="Ketik sandi baru..." 
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setResetPwdModal({isOpen: false, userId: '', userName: '', newPwd: ''})} className="px-3 py-1.5 text-xs font-bold text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg">Batal</button>
                <button onClick={() => {
                  if(!resetPwdModal.newPwd) return alert('Sandi tidak boleh kosong');
                  updateUser(resetPwdModal.userId, { password: resetPwdModal.newPwd });
                  
                  // Construct WhatsApp message
                  const targetUser = users.find(u => u.id === resetPwdModal.userId);
                  const phone = targetUser?.phone || targetUser?.username || '';
                  
                  let waNumber = phone.replace(/\D/g, '');
                  if (waNumber.startsWith('0')) waNumber = '62' + waNumber.substring(1);
                  
                  if (waNumber) {
                    const message = `Halo *${resetPwdModal.userName}*,\n\nSandi akun KSA Mart Anda berhasil direset oleh Admin.\n\nSandi Baru Anda: *${resetPwdModal.newPwd}*\n\nSilakan login kembali dan simpan pesan ini baik-baik. Terima kasih!`;
                    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`, '_blank');
                  }
                  
                  alert('Sandi berhasil direset!');
                  setResetPwdModal({isOpen: false, userId: '', userName: '', newPwd: ''});
                }} className="px-3 py-1.5 text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 rounded-lg">Simpan Sandi Baru</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Account Modal */}
      {createAccountModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="p-4 border-b border-gray-100 dark:border-slate-800">
              <h3 className="font-bold text-gray-800 dark:text-slate-200">Buatkan Akun Pelanggan</h3>
              <p className="text-[10px] text-gray-500">{createAccountModal.customerName}</p>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">Nomor Handphone (Username)</label>
                <input 
                  type="text" 
                  value={createAccountModal.phone} 
                  onChange={e => setCreateAccountModal(prev => ({...prev, phone: e.target.value}))} 
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                  placeholder="Contoh: 08123..." 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">Sandi Awal (Sementara)</label>
                <input 
                  type="text" 
                  value={createAccountModal.initialPwd} 
                  onChange={e => setCreateAccountModal(prev => ({...prev, initialPwd: e.target.value as any}))} 
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                  placeholder="Ketik sandi awal..." 
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setCreateAccountModal({isOpen: false, customerId: '', customerName: '', phone: '', initialPwd: ''})} className="px-3 py-1.5 text-xs font-bold text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg">Batal</button>
                <button onClick={() => {
                  if(!createAccountModal.phone) return alert('Nomor HP wajib diisi');
                  if(!createAccountModal.initialPwd) return alert('Sandi tidak boleh kosong');
                  
                  // Check if phone already registered
                  const existingUser = users.find(u => u.username === createAccountModal.phone);
                  if (existingUser) return alert('Nomor HP sudah terdaftar sebagai pengguna lain!');

                  // Update phone in customer data if changed
                  if (createAccountModal.phone !== customers.find(c => c.id === createAccountModal.customerId)?.phone) {
                    updateCustomer(createAccountModal.customerId, { phone: createAccountModal.phone });
                  }

                  // Create user
                  registerUser({
                    name: createAccountModal.customerName,
                    username: createAccountModal.phone,
                    password: createAccountModal.initialPwd,
                    role: 'PELANGGAN',
                    branchId: currentUser?.branchId,
                    tenantId: currentUser?.tenantId
                  });
                  
                  let waNumber = createAccountModal.phone.replace(/\D/g, '');
                  if (waNumber.startsWith('0')) waNumber = '62' + waNumber.substring(1);
                  
                  if (waNumber) {
                    const message = `Halo *${createAccountModal.customerName}*,\n\nAkun Member KSA Mart Anda telah berhasil dibuat oleh Admin.\n\nUsername: *${createAccountModal.phone}*\nSandi: *${createAccountModal.initialPwd}*\n\nSilakan gunakan kredensial ini untuk login ke Portal Pelanggan KSA Mart. Terima kasih!`;
                    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`, '_blank');
                  }
                  
                  alert('Akun pelanggan berhasil dibuat!');
                  setCreateAccountModal({isOpen: false, customerId: '', customerName: '', phone: '', initialPwd: ''});
                }} className="px-3 py-1.5 text-xs font-bold bg-green-600 text-white hover:bg-green-700 rounded-lg">Buat Akun</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden w-full min-w-0">
        <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Cari pelanggan (nama/hp)..." 
              value={searchTerm} 
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset page on search
              }} 
              className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm outline-none" 
            />
          </div>
          <select 
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value as any); setCurrentPage(1); }}
            className="w-full sm:w-auto bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 dark:text-slate-300 font-bold"
          >
            <option value="SEMUA">Semua Pelanggan</option>
            <option value="PUNYA_AKUN">Punya Akun Login</option>
            <option value="BELUM_ADA">Belum Ada Akun</option>
            <option value="KASBON">Punya Kasbon</option>
            <option value="POIN_TERPAKAI">Poin Terpakai</option>
            <option value="PERNAH_BELANJA">Pernah Belanja</option>
          </select>
        </div>

        <div className="overflow-x-auto w-full hide-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
          <table className="w-full text-left text-[10px] sm:text-xs min-w-[1000px]">
            <thead className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-slate-400 font-medium whitespace-nowrap">
              <tr>
                <th className="px-1 py-2 sm:px-2 sm:py-3 align-middle text-center">No</th>
                <th className="px-1 py-2 sm:px-2 sm:py-3 align-middle">ID</th>
                <th className="px-1 py-2 sm:px-2 sm:py-3 align-middle">Phone</th>
                <th className="px-1 py-2 sm:px-2 sm:py-3 align-middle min-w-[120px]">Name</th>
                <th className="px-1 py-2 sm:px-2 sm:py-3 text-center align-middle">Akses Login</th>
                <th className="px-1 py-2 sm:px-2 sm:py-3 text-right align-middle">Total Belanja</th>
                <th className="px-1 py-2 sm:px-2 sm:py-3 text-right align-middle">Piutang (Kasbon)</th>
                <th className="px-1 py-2 sm:px-2 sm:py-3 text-center align-middle">Tot. Poin</th>
                <th className="px-1 py-2 sm:px-2 sm:py-3 text-center align-middle">Terpakai</th>
                <th className="px-1 py-2 sm:px-2 sm:py-3 text-center align-middle">Sisa</th>
                <th className="px-1 py-2 sm:px-2 sm:py-3 align-middle hidden sm:table-cell">Tgl Update Belanja</th>
                <th className="px-1 py-2 sm:px-2 sm:py-3 text-right align-middle">Nilai (Rp)</th>
                <th className="px-1 py-2 sm:px-2 sm:py-3 text-center align-middle">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 whitespace-nowrap">
              {currentCustomers.map((c, index) => {
                const totalPoint = c.totalPointsEarned || c.points;
                const pointTerpakai = c.totalPointsRedeemed || 0;
                const sisaPoint = c.points;
                const updateDate = c.lastTransactionDate && c.lastTransactionDate.getFullYear() > 2000
                  ? c.lastTransactionDate.toLocaleDateString('en-CA')
                  : (c.lastPointsUpdate || (c.createdAt ? String(c.createdAt).split('T')[0] : '-'));
                const nilaiRp = sisaPoint * (settings?.pointRedemptionValue || 10);

                return (
                  <tr key={c.id} className="hover:bg-gray-50 dark:bg-slate-800">
                    <td className="px-1 py-2 sm:px-2 sm:py-3 text-center text-gray-600 dark:text-slate-400 align-middle">{startIndex + index + 1}</td>
                    <td className="px-1 py-2 sm:px-2 sm:py-3 text-gray-500 dark:text-slate-400 font-mono text-[9px] sm:text-[10px] align-middle">{c.id.length > 12 ? c.id.slice(-8) : c.id.substring(0, 8)}</td>
                    <td className="px-1 py-2 sm:px-2 sm:py-3 text-gray-600 dark:text-slate-400 align-middle text-[9px] sm:text-[10px]">{c.phone}</td>
                    <td className="px-1 py-2 sm:px-2 sm:py-3 font-bold text-gray-800 dark:text-slate-200 align-middle whitespace-normal break-words leading-tight">{c.name}</td>
                    <td className="px-1 py-2 sm:px-2 sm:py-3 text-center align-middle">
                      {(() => {
                        const linkedUser = users.find(u => u.role === 'PELANGGAN' && u.username === c.phone);
                        if (linkedUser) {
                          return (
                            <div className="flex flex-col items-center gap-0.5 cursor-pointer group" onClick={() => setResetPwdModal({ isOpen: true, userId: linkedUser.id, userName: c.name, newPwd: '' })} title="Klik untuk Reset Sandi">
                              <span className="bg-green-100 text-green-700 text-[8px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap">Punya Akun</span>
                              <span className="text-[8px] text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity">Reset Sandi?</span>
                            </div>
                          );
                        }
                        return (
                          <div className="flex flex-col items-center gap-0.5 cursor-pointer group" onClick={() => setCreateAccountModal({ isOpen: true, customerId: c.id, customerName: c.name, phone: c.phone, initialPwd: '' })} title="Klik untuk Buatkan Akun">
                            <span className="bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 text-[8px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap">Belum Ada</span>
                            <span className="text-[8px] text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">Buat Akun?</span>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-1 py-2 sm:px-2 sm:py-3 text-right text-blue-600 dark:text-blue-400 font-bold align-middle">
                      Rp {Number(c.totalSpending || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="px-1 py-2 sm:px-2 sm:py-3 text-right text-red-600 dark:text-red-400 font-bold align-middle">
                      Rp {Number(c.debtAmount || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="px-1 py-2 sm:px-2 sm:py-3 text-center align-middle">{totalPoint}</td>
                    <td className="px-1 py-2 sm:px-2 sm:py-3 text-center align-middle">{pointTerpakai}</td>
                    <td className="px-1 py-2 sm:px-2 sm:py-3 text-center align-middle">
                      <button onClick={() => {
                        const val = prompt(`Ubah poin untuk ${c.name}:`, String(c.points));
                        if (val === null) return;
                        const n = Number(val);
                        if (isNaN(n)) { alert('Masukkan angka valid'); return; }
                        updateCustomer(c.id, { points: n });
                      }} className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-amber-100 text-amber-800 font-bold rounded-full text-[9px] sm:text-[10px] hover:opacity-80">
                        {sisaPoint}
                      </button>
                    </td>
                    <td className="px-1 py-2 sm:px-2 sm:py-3 text-gray-500 dark:text-slate-400 text-[9px] align-middle hidden sm:table-cell">{updateDate}</td>
                    <td className="px-1 py-2 sm:px-2 sm:py-3 text-right font-bold text-green-700 align-middle">Rp {nilaiRp.toLocaleString('id-ID')}</td>
                    <td className="px-1 py-2 sm:px-2 sm:py-3 text-center space-x-1 align-middle">
                      {c.debtAmount > 0 && (
                        <button onClick={() => setPayoffModal({ isOpen: true, customerId: c.id, customerName: c.name, debtAmount: c.debtAmount || 0, payAmount: 0, paymentMethod: 'CASH', notes: '', selectedInvoices: [] })} className="p-1 text-green-600 hover:bg-green-50 rounded-lg" title="Lunasi Kasbon">
                          <CreditCard className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {(c.debtAmount > 0 || transactions.some(tx => tx.customerId === c.id && tx.paymentMethod === 'KASBON')) && (
                        <button onClick={() => setKasbonHistoryModal({isOpen: true, customerId: c.id, customerName: c.name})} className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg" title="Buku Riwayat Kasbon">
                          <ClipboardList className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button onClick={() => handleEdit(c)} className="p-1 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-800 rounded-lg" title="Edit">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deleteCustomer(c.id)} className="p-1 text-red-600 hover:bg-red-50 rounded-lg" title="Hapus">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {currentCustomers.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-gray-400">Tidak ada data pelanggan ditemukan.</td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-gray-100 dark:bg-slate-800 font-bold text-gray-800 dark:text-slate-200 border-t border-gray-200 dark:border-slate-700 whitespace-nowrap text-[10px] sm:text-xs">
              <tr>
                <td colSpan={5} className="px-1 py-2 sm:px-2 sm:py-3 text-right align-middle pr-4">TOTAL</td>
                <td className="px-1 py-2 sm:px-2 sm:py-3 text-right text-blue-600 dark:text-blue-400 align-middle">Rp {totalSpendingSum.toLocaleString('id-ID')}</td>
                <td className="px-1 py-2 sm:px-2 sm:py-3 text-right text-red-600 dark:text-red-400 align-middle">Rp {totalDebtSum.toLocaleString('id-ID')}</td>
                <td className="px-1 py-2 sm:px-2 sm:py-3 text-center align-middle">{totalPointsEarnedSum.toLocaleString('id-ID')}</td>
                <td className="px-1 py-2 sm:px-2 sm:py-3 text-center align-middle">{totalPointsRedeemedSum.toLocaleString('id-ID')}</td>
                <td className="px-1 py-2 sm:px-2 sm:py-3 text-center align-middle">{totalRemainingPointsSum.toLocaleString('id-ID')}</td>
                <td className="px-1 py-2 sm:px-2 sm:py-3 align-middle hidden sm:table-cell"></td>
                <td className="px-2 py-3 text-right text-green-700 align-middle">Rp {totalValueSum.toLocaleString('id-ID')}</td>
                <td className="px-2 py-3 align-middle"></td>
              </tr>
            </tfoot>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-gray-500 dark:text-slate-400">
              Menampilkan {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filtered.length)} dari {filtered.length} pelanggan
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-3 py-1 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 rounded-lg text-xs hover:bg-gray-200 disabled:opacity-50"
              >
                Sebelumnya
              </button>
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = currentPage;
                  if (currentPage < 3) pageNum = i + 1;
                  else if (currentPage > totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = currentPage - 2 + i;
                  
                  if (pageNum < 1 || pageNum > totalPages) return null;
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                        currentPage === pageNum ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 rounded-lg text-xs hover:bg-gray-200 disabled:opacity-50"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {payoffModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 shadow-xl border border-gray-100 dark:border-slate-800">
            <h3 className="text-lg font-bold text-gray-800 dark:text-slate-200 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              Lunasi Kasbon Pelanggan
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Nama Pelanggan</label>
                <div className="font-bold text-gray-800 dark:text-slate-200">{payoffModal.customerName}</div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Total Piutang (Kasbon)</label>
                <div className="font-bold text-red-600 text-lg">Rp {payoffModal.debtAmount.toLocaleString('id-ID')}</div>
              </div>

              {/* Invoice Selection */}
              {(() => {
                const debitsRaw = transactions
                  .filter(t => t.customerId === payoffModal.customerId && t.paymentMethod === 'KASBON' && !t.isVoided)
                  .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()); // sort oldest first for FIFO

                const explicitPaidInvoiceNos = new Set<string>();
                kasbonPayments.forEach(p => {
                  if (p.customerId === payoffModal.customerId && p.targetInvoiceNos) {
                    p.targetInvoiceNos.forEach(id => explicitPaidInvoiceNos.add(id));
                  }
                });

                let totalDebits = 0;
                let explicitPaidAmount = 0;
                debitsRaw.forEach(tx => {
                   totalDebits += tx.totalAmount;
                   if (explicitPaidInvoiceNos.has(tx.invoiceNo)) {
                      explicitPaidAmount += tx.totalAmount;
                   }
                });

                let totalPaid = totalDebits - (payoffModal.debtAmount || 0);
                let unallocatedPayment = totalPaid - explicitPaidAmount;

                let unpaidInvoices = debitsRaw.filter(tx => !explicitPaidInvoiceNos.has(tx.invoiceNo));
                
                if (unallocatedPayment > 0) {
                   unpaidInvoices = unpaidInvoices.filter(tx => {
                       if (unallocatedPayment >= tx.totalAmount - 0.01) {
                           unallocatedPayment -= tx.totalAmount;
                           return false;
                       } else {
                           unallocatedPayment -= tx.totalAmount;
                           if (unallocatedPayment >= -0.01) return false;
                       }
                       return true;
                   });
                }
                
                if ((payoffModal.debtAmount || 0) <= 0) unpaidInvoices = [];

                // sort back to newest first for display
                unpaidInvoices.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

                if (unpaidInvoices.length === 0) return null;

                return (
                  <div className="border border-gray-200 dark:border-slate-700 rounded-xl p-3 bg-gray-50 dark:bg-slate-800 max-h-48 overflow-y-auto">
                    <div className="mb-2">
                      <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-0.5">Pilih Struk Kasbon yang Dilunasi (Opsional)</label>
                      <p className="text-[10px] text-gray-500 italic leading-tight">
                        *Jika struk kasbon lama tidak muncul di sini, Anda tetap bisa melunasinya dengan langsung mengetik nominal uang pada kotak di bawah.
                      </p>
                    </div>
                    <div className="space-y-2">
                      {unpaidInvoices.map(inv => (
                        <label key={inv.id} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
                          <input 
                            type="checkbox" 
                            className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                            checked={payoffModal.selectedInvoices.includes(inv.invoiceNo)}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              const amount = inv.totalAmount;
                              setPayoffModal(prev => {
                                let newSelected = [...prev.selectedInvoices];
                                let newPayAmount = prev.payAmount;

                                if (checked) {
                                  newSelected.push(inv.invoiceNo);
                                  newPayAmount += amount;
                                } else {
                                  newSelected = newSelected.filter(id => id !== inv.invoiceNo);
                                  newPayAmount -= amount;
                                }
                                
                                // Cegah payAmount > debtAmount akibat pembulatan
                                if (newPayAmount > prev.debtAmount) newPayAmount = prev.debtAmount;

                                return { ...prev, selectedInvoices: newSelected, payAmount: newPayAmount };
                              });
                            }}
                          />
                          <div className="flex-1">
                            <div className="text-xs font-bold text-gray-800 dark:text-slate-200">{inv.invoiceNo}</div>
                            <div className="text-[10px] text-gray-500">{new Date(inv.timestamp).toLocaleDateString('id-ID')}</div>
                          </div>
                          <div className="text-sm font-bold text-red-600">Rp {inv.totalAmount.toLocaleString('id-ID')}</div>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-gray-700 dark:text-slate-300 mb-1 uppercase">Akun Kas Penerima (Debit)</label>
                  <input
                    list="debit-options"
                    value={payoffModal.debitAccountId || ''}
                    onChange={(e) => setPayoffModal({ ...payoffModal, debitAccountId: e.target.value })}
                    placeholder="Pilih Akun Kas/Bank"
                    className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <datalist id="debit-options">
                    {coaList?.filter((c: any) => c.isActive && c.name.toLowerCase().includes('kas') || c.name.toLowerCase().includes('bank')).map((c: any) => (
                      <option key={c.id} value={`${c.code} - ${c.name}`} />
                    ))}
                  </datalist>
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-gray-700 dark:text-slate-300 mb-1 uppercase">Akun Piutang Kasbon (Kredit)</label>
                  <input
                    list="credit-options"
                    value={payoffModal.creditAccountId || ''}
                    onChange={(e) => setPayoffModal({ ...payoffModal, creditAccountId: e.target.value })}
                    placeholder="Pilih Akun Piutang"
                    className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <datalist id="credit-options">
                    {coaList?.filter((c: any) => c.isActive && c.name.toLowerCase().includes('piutang')).map((c: any) => (
                      <option key={c.id} value={`${c.code} - ${c.name}`} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">Nominal Pelunasan (Rp)</label>
                <input
                  type="number"
                  value={payoffModal.payAmount}
                  onChange={(e) => setPayoffModal({ ...payoffModal, payAmount: Number(e.target.value) })}
                  className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 text-xl font-bold"
                  min="0"
                  max={payoffModal.debtAmount}
                />
              </div>

              <div className="mb-6">
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">Keterangan (Opsional)</label>
                <textarea 
                  className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-3 text-sm bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500"
                  placeholder="Misal: Potong Gaji Bulan Juli"
                  rows={2}
                  value={payoffModal.notes}
                  onChange={(e) => setPayoffModal(prev => ({...prev, notes: e.target.value}))}
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setPayoffModal({ ...payoffModal, isOpen: false })}
                  className="px-4 py-2 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl font-bold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleProcessPayoff}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-md"
                >
                  Proses Pelunasan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {receiptModal.isOpen && receiptModal.record && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            <div className="p-4 bg-green-50 border-b border-green-100 flex justify-between items-center no-print">
              <h3 className="font-extrabold text-green-800 text-sm flex items-center gap-2">
                <Printer className="w-5 h-5" /> Cetak Struk
              </h3>
              <button onClick={() => setReceiptModal({ isOpen: false, record: null })} className="text-gray-500 hover:text-gray-700">Tutup</button>
            </div>
            
            <div className="p-6 bg-white flex-1 overflow-y-auto text-sm text-gray-800 dark:text-gray-800 print-area relative" id="print-area">
              <div className="text-center mb-6">
                <h2 className="font-extrabold text-xl">{settings.storeName || 'KSA Mart'}</h2>
                <p className="text-xs text-gray-500">{settings.storeAddress || ''}</p>
                <p className="text-xs text-gray-500">Telp: {settings.storePhone || ''}</p>
              </div>

              <div className="border-t border-b border-dashed border-gray-300 py-3 mb-4 text-center">
                <p className="font-bold uppercase tracking-widest">{receiptModal.record.isFullyPaid ? 'BUKTI KASBON LUNAS' : 'BUKTI PEMBAYARAN KASBON'}</p>
              </div>

              <div className="space-y-1 mb-4 text-xs">
                <p><span className="text-slate-400">Tanggal:</span> {new Date(receiptModal.record.paymentDate).toLocaleString('id-ID')}</p>
                <p><span className="text-slate-400">Pelanggan:</span> {receiptModal.record.customerName}</p>
                <p><span className="text-slate-400">Kasir:</span> {receiptModal.record.cashierName}</p>
                <p><span className="text-slate-400">Metode:</span> {receiptModal.record.paymentMethod}</p>
              </div>

              <div className="border-t border-dashed border-gray-300 py-3 mb-4 space-y-2 text-right">
                <div className="flex justify-between font-bold text-sm">
                  <span>Nominal Bayar:</span>
                  <span>Rp {receiptModal.record.amountPaid.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-xs text-amber-700 font-bold border-t border-gray-200 pt-2">
                  <span>Sisa Kasbon:</span>
                  <span>Rp {receiptModal.record.remainingDebt.toLocaleString('id-ID')}</span>
                </div>
              </div>

              {receiptModal.record.isFullyPaid && (
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
                  onClick={handleBluetoothPrint}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg text-center shadow-xs flex items-center justify-center gap-1"
                >
                  <Bluetooth className="w-4 h-4" /> Print Bluetooth
                </button>
              </div>
              <div className="mt-2 border-t border-gray-200 dark:border-slate-700 pt-3">
                <p className="text-xs font-bold text-gray-600 dark:text-slate-400 mb-2 flex items-center gap-1">
                  <MessageCircle className="w-4 h-4" /> Kirim Struk via WhatsApp
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={waNumber}
                    onChange={(e) => setWaNumber(e.target.value)}
                    placeholder="No WA (misal: 0812...)"
                    className="flex-1 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-green-500"
                  />
                  <button
                    onClick={handleSendWA}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap"
                  >
                    Kirim WA
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Kasbon History Modal */}
      {kasbonHistoryModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-blue-50 dark:bg-blue-900/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300 rounded-lg">
                  <ClipboardList className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800 dark:text-slate-200">Buku Riwayat Kasbon</h2>
                  <p className="text-sm text-gray-500 dark:text-slate-400">Pelanggan: {kasbonHistoryModal.customerName}</p>
                </div>
              </div>
              <button onClick={() => setKasbonHistoryModal({ isOpen: false, customerId: '', customerName: '' })} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50 dark:bg-slate-900/50">
              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left text-xs min-w-max">
                    <thead className="bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 font-bold border-b border-gray-200 dark:border-slate-700 whitespace-nowrap">
                      <tr>
                        <th className="px-3 py-2">Tanggal & Waktu</th>
                        <th className="px-3 py-2">Ref ID</th>
                        <th className="px-3 py-2">Keterangan</th>
                        <th className="px-3 py-2 text-right">Debit (Penambahan)</th>
                        <th className="px-3 py-2 text-right">Kredit (Pelunasan)</th>
                        <th className="px-3 py-2 text-right text-blue-600 dark:text-blue-400">Saldo Akhir</th>
                        <th className="px-3 py-2">Kasir</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                      {getKasbonHistory(kasbonHistoryModal.customerId).map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-3 py-2 text-gray-600 dark:text-slate-400 whitespace-nowrap">{item.date.toLocaleString('id-ID')}</td>
                          <td className="px-3 py-2 text-[10px] font-mono text-gray-400 whitespace-nowrap">{item.ref.substring(0, 8)}</td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                              item.type === 'PEMBELIAN' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {item.type === 'PEMBELIAN' ? (item.isLunas ? 'Kasbon (Lunas)' : 'Kasbon (Belum Lunas)') : 'Pelunasan Kasbon'}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right font-semibold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                            {item.type === 'PEMBELIAN' ? `Rp ${item.amount.toLocaleString('id-ID')}` : '-'}
                          </td>
                          <td className="px-3 py-2 text-right font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                            {item.type === 'PELUNASAN' ? `Rp ${item.amount.toLocaleString('id-ID')}` : '-'}
                          </td>
                          <td className="px-3 py-2 text-right font-bold text-blue-700 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10 whitespace-nowrap">
                            Rp {item.balance.toLocaleString('id-ID')}
                          </td>
                          <td className="px-3 py-2 text-gray-500 dark:text-slate-400 text-[10px] whitespace-nowrap">{item.cashier}</td>
                        </tr>
                      ))}
                      {getKasbonHistory(kasbonHistoryModal.customerId).length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-3 py-8 text-center text-gray-400 italic">Belum ada riwayat kasbon untuk pelanggan ini.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
