import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useBranchData } from '../hooks/useBranchData';
import { useAppStore } from '../store';
import { Users, Plus, Search, Trash2, Edit, CreditCard, Download, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function CustomerManagementPage() {
  const { customers, addCustomer, updateCustomer, deleteCustomer, currentUser, addJournalEntry, settings, users, updateUser, transactions } = useBranchData();
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
  
  const [payoffModal, setPayoffModal] = useState<{isOpen: boolean, customerId: string, customerName: string, debtAmount: number, payAmount: number, paymentMethod: 'CASH' | 'QRIS_SHARIAH' | 'TRANSFER_BSI', notes: string}>({
    isOpen: false, customerId: '', customerName: '', debtAmount: 0, payAmount: 0, paymentMethod: 'CASH', notes: ''
  });

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [totalPointsEarned, setTotalPointsEarned] = useState(0);
  const [totalPointsRedeemed, setTotalPointsRedeemed] = useState(0);
  const [points, setPoints] = useState(0);
  const [lastPointsUpdate, setLastPointsUpdate] = useState(new Date().toLocaleDateString('en-CA'));
  const [debtAmount, setDebtAmount] = useState(0);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'SEMUA' | 'PUNYA_AKUN' | 'BELUM_ADA' | 'KASBON' | 'POIN_TERPAKAI'>('SEMUA');
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

    return {
      ...c,
      totalPointsEarned: earned,
      totalPointsRedeemed: redeemed,
    };
  });

  const filtered = enrichedCustomers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone.includes(searchTerm);
    const linkedUser = users.find(u => u.role === 'PELANGGAN' && u.username === c.phone);
    if (filterType === 'PUNYA_AKUN') return matchesSearch && linkedUser;
    if (filterType === 'BELUM_ADA') return matchesSearch && !linkedUser;
    if (filterType === 'KASBON') return matchesSearch && (c.debtAmount || 0) > 0;
    if (filterType === 'POIN_TERPAKAI') return matchesSearch && (c.totalPointsRedeemed || 0) > 0;
    return matchesSearch;
  });
  
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentCustomers = filtered.slice(startIndex, startIndex + itemsPerPage);

  const totalPointsEarnedSum = filtered.reduce((sum, c) => sum + (c.totalPointsEarned || c.points), 0);
  const totalPointsRedeemedSum = filtered.reduce((sum, c) => sum + (c.totalPointsRedeemed || 0), 0);
  const totalRemainingPointsSum = filtered.reduce((sum, c) => sum + (c.points || 0), 0);
  const totalValueSum = filtered.reduce((sum, c) => sum + ((c.points || 0) * (settings?.pointRedemptionValue || 10)), 0);
  const totalDebtSum = filtered.reduce((sum, c) => sum + (c.debtAmount || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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

    updateCustomer(customerId, { debtAmount: debtAmount - payAmount });

    const now = new Date().toISOString();
    
    // Tentukan akun tujuan berdasarkan metode pembayaran
    const getAccountForMethod = (method: string) => {
      if (method === 'QRIS_SHARIAH') return '1-1020';
      if (method === 'TRANSFER_BSI') return '1-1010';
      return '1-1000';
    };

    const targetAccount = getAccountForMethod(paymentMethod);

    addJournalEntry({
      tenantId: currentUser?.tenantId || 'tenant_default',
      date: now,
      account: targetAccount,
      description: `[Auto] Pelunasan piutang (kasbon) dari pelanggan: ${customerName} via ${paymentMethod}${payoffModal.notes ? ' - ' + payoffModal.notes : ''}`,
      debit: payAmount,
      credit: 0,
      referenceId: customerId,
      referenceType: 'MANUAL',
      createdBy: currentUser?.name,
      branchId: currentUser?.branchId
    });
    
    addJournalEntry({
      tenantId: currentUser?.tenantId || 'tenant_default',
      date: now,
      account: '1-1030', // Piutang Kasbon Pelanggan
      description: `[Auto] Pengurangan piutang pelanggan: ${customerName}${payoffModal.notes ? ' - ' + payoffModal.notes : ''}`,
      debit: 0,
      credit: payAmount,
      referenceId: customerId,
      referenceType: 'MANUAL',
      createdBy: currentUser?.name,
      branchId: currentUser?.branchId
    });

    alert(`Pelunasan berhasil diproses. Sisa piutang: Rp ${debtAmount - payAmount}`);
    setPayoffModal({ isOpen: false, customerId: '', customerName: '', debtAmount: 0, payAmount: 0, paymentMethod: 'CASH' });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => { resetForm(); setIsAdding(!isAdding); }}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md transition-all"
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
          }} className="ml-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 px-3 py-2 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-800 flex items-center gap-2">
            <Download className="w-4 h-4" /> Unduh Template
          </button>
          <label className="ml-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 px-3 py-2 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-800 flex items-center gap-2 cursor-pointer">
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
                  for (let i = 1; i < rows.length; i++) {
                    const row = rows[i]; if (!row || row.length === 0) { setImportProgress(p => ({ ...p, done: p.done + 1 })); continue; }
                    const nameVal = String(row[idxName] || '').trim(); if (!nameVal) { setImportProgress(p => ({ ...p, done: p.done + 1 })); continue; }
                    const phoneVal = idxPhone !== -1 ? String(row[idxPhone] || '').trim() : '';

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
                  
                  alert('Akun pelanggan berhasil dibuat!');
                  setCreateAccountModal({isOpen: false, customerId: '', customerName: '', phone: '', initialPwd: ''});
                }} className="px-3 py-1.5 text-xs font-bold bg-green-600 text-white hover:bg-green-700 rounded-lg">Buat Akun</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
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
          </select>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-[10px] sm:text-xs">
            <thead className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-slate-400 font-medium whitespace-nowrap">
              <tr>
                <th className="px-1 py-2 sm:px-2 sm:py-3 align-middle text-center">No</th>
                <th className="px-1 py-2 sm:px-2 sm:py-3 align-middle">ID</th>
                <th className="px-1 py-2 sm:px-2 sm:py-3 align-middle">Phone</th>
                <th className="px-1 py-2 sm:px-2 sm:py-3 align-middle min-w-[120px]">Name</th>
                <th className="px-1 py-2 sm:px-2 sm:py-3 text-center align-middle">Akses Login</th>
                <th className="px-1 py-2 sm:px-2 sm:py-3 text-right align-middle">Piutang (Kasbon)</th>
                <th className="px-1 py-2 sm:px-2 sm:py-3 text-center align-middle">Tot. Poin</th>
                <th className="px-1 py-2 sm:px-2 sm:py-3 text-center align-middle">Terpakai</th>
                <th className="px-1 py-2 sm:px-2 sm:py-3 text-center align-middle">Sisa</th>
                <th className="px-1 py-2 sm:px-2 sm:py-3 align-middle hidden sm:table-cell">Tgl Update</th>
                <th className="px-1 py-2 sm:px-2 sm:py-3 text-right align-middle">Nilai (Rp)</th>
                <th className="px-1 py-2 sm:px-2 sm:py-3 text-center align-middle">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 whitespace-nowrap">
              {currentCustomers.map((c, index) => {
                const totalPoint = c.totalPointsEarned || c.points;
                const pointTerpakai = c.totalPointsRedeemed || 0;
                const sisaPoint = c.points;
                const updateDate = c.lastPointsUpdate || c.createdAt.split('T')[0];
                const nilaiRp = sisaPoint * (settings?.pointRedemptionValue || 10);

                return (
                  <tr key={c.id} className="hover:bg-gray-50 dark:bg-slate-800">
                    <td className="px-1 py-2 sm:px-2 sm:py-3 text-center text-gray-600 dark:text-slate-400 align-middle">{startIndex + index + 1}</td>
                    <td className="px-1 py-2 sm:px-2 sm:py-3 text-gray-500 dark:text-slate-400 font-mono text-[9px] sm:text-[10px] align-middle">{c.id.substring(0, 8)}</td>
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
                        <button onClick={() => setPayoffModal({ isOpen: true, customerId: c.id, customerName: c.name, debtAmount: c.debtAmount || 0, payAmount: c.debtAmount || 0, paymentMethod: 'CASH', notes: '' })} className="p-1 text-green-600 hover:bg-green-50 rounded-lg" title="Lunasi Kasbon">
                          <CreditCard className="w-3.5 h-3.5" />
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

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">Metode Pembayaran</label>
                <select
                  value={payoffModal.paymentMethod}
                  onChange={(e) => setPayoffModal({ ...payoffModal, paymentMethod: e.target.value as any })}
                  className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500"
                >
                  <option value="CASH">Tunai (Cash)</option>
                  <option value="TRANSFER_BSI">Transfer BSI</option>
                  <option value="QRIS_SHARIAH">QRIS Syariah</option>
                </select>
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
    </div>
  );
}
