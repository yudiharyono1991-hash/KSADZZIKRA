import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Shield, UserCog, Trash2, Edit, Check, X, ShieldAlert, Clock, CheckCircle, UserX, Users, Store, RefreshCw, UserPlus, Plus } from 'lucide-react';
import { UserRole } from '../types';

type Tab = 'STAFF' | 'PELANGGAN' | 'PENDING';

export default function AdminManagementPage() {
  const { users, currentUser, updateUser, deleteUser, approveUser, rejectUser, branches, initializeStore, isLoading, addJournalEntry, customers } = useAppStore();
  const [activeTab, setActiveTab] = useState<Tab>('STAFF');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('CASHIER');
  const [editName, setEditName] = useState<string>('');
  const [editBranch, setEditBranch] = useState<string>('');
  const [editUsername, setEditUsername] = useState<string>('');
  const [editPassword, setEditPassword] = useState<string>('');
  const [editJobTitle, setEditJobTitle] = useState<string>('');
  const [editEmployeeId, setEditEmployeeId] = useState<string>('');
  
  // Add User State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('CASHIER');
  const [newJobTitle, setNewJobTitle] = useState('');
  const [newBranch, setNewBranch] = useState('');
  const [newEmployeeId, setNewEmployeeId] = useState('');

  const [payoffModal, setPayoffModal] = useState<{isOpen: boolean, userId: string, userName: string, debtAmount: number, payAmount: number, isAddingDebt: boolean, paymentMethod: 'CASH' | 'QRIS_SHARIAH' | 'TRANSFER_BSI'}>({
    isOpen: false, userId: '', userName: '', debtAmount: 0, payAmount: 0, isAddingDebt: false, paymentMethod: 'CASH'
  });

  const handleProcessPayoff = () => {
    const { userId, userName, debtAmount, payAmount, isAddingDebt, paymentMethod } = payoffModal;
    if (payAmount <= 0) return;
    if (!isAddingDebt && payAmount > debtAmount) {
      alert('Nominal pelunasan tidak boleh lebih besar dari total piutang!');
      return;
    }

    const newDebtAmount = isAddingDebt ? (debtAmount + payAmount) : (debtAmount - payAmount);
    updateUser(userId, { debtAmount: newDebtAmount });

    const now = new Date().toISOString();
    
    // Tentukan akun tujuan berdasarkan metode pembayaran
    const getAccountForMethod = (method: string) => {
      if (method === 'QRIS_SHARIAH') return 'QRIS_SYARIAH';
      if (method === 'TRANSFER_BSI') return 'BANK_BSI';
      return 'KAS';
    };

    const targetAccount = getAccountForMethod(paymentMethod);

    if (isAddingDebt) {
      // Kasbon Tunai: Uang KAS keluar, Piutang bertambah
      if (addJournalEntry) {
        addJournalEntry({
          tenantId: currentUser?.tenantId || 'tenant_default',
          date: now,
          account: 'PIUTANG_KARYAWAN',
          description: `[Auto] Penambahan Piutang (Kasbon Tunai) karyawan: ${userName}`,
          debit: payAmount,
          credit: 0,
          referenceId: userId,
          referenceType: 'MANUAL',
          createdBy: currentUser?.name,
          branchId: currentUser?.branchId
        });
        addJournalEntry({
          tenantId: currentUser?.tenantId || 'tenant_default',
          date: now,
          account: targetAccount,
          description: `[Auto] Pencairan Kasbon Tunai untuk: ${userName} via ${paymentMethod}`,
          debit: 0,
          credit: payAmount,
          referenceId: userId,
          referenceType: 'MANUAL',
          createdBy: currentUser?.name,
          branchId: currentUser?.branchId
        });
      }
      alert(`Pencatatan kasbon berhasil. Total hutang sekarang: Rp ${newDebtAmount}`);
    } else {
      // Pelunasan: Uang masuk ke KAS, Piutang berkurang
      if (addJournalEntry) {
        addJournalEntry({
          tenantId: currentUser?.tenantId || 'tenant_default',
          date: now,
          account: targetAccount,
          description: `[Auto] Pelunasan piutang (kasbon) dari karyawan: ${userName} via ${paymentMethod}`,
          debit: payAmount,
          credit: 0,
          referenceId: userId,
          referenceType: 'MANUAL',
          createdBy: currentUser?.name,
          branchId: currentUser?.branchId
        });
        addJournalEntry({
          tenantId: currentUser?.tenantId || 'tenant_default',
          date: now,
          account: 'PIUTANG_KARYAWAN',
          description: `[Auto] Pengurangan piutang karyawan: ${userName}`,
          debit: 0,
          credit: payAmount,
          referenceId: userId,
          referenceType: 'MANUAL',
          createdBy: currentUser?.name,
          branchId: currentUser?.branchId
        });
      }
      alert(`Pelunasan berhasil diproses. Sisa hutang: Rp ${newDebtAmount}`);
    }

    setPayoffModal({ isOpen: false, userId: '', userName: '', debtAmount: 0, payAmount: 0, isAddingDebt: false, paymentMethod: 'CASH' });
  };

  // Prevent accessing if not admin, owner, or superadmin
  if (!['ADMIN', 'OWNER', 'SUPERADMIN', 'MANAGER', 'PENGURUS'].includes(currentUser?.role || '')) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400 space-y-4 py-20">
        <ShieldAlert className="w-16 h-16 text-red-400" />
        <h2 className="text-xl font-bold">Akses Ditolak</h2>
        <p className="text-sm">Anda tidak memiliki izin untuk mengakses halaman Manajemen Admin.</p>
      </div>
    );
  }

  const isGlobalAdmin = !currentUser?.branchId || ['OWNER', 'SUPERADMIN', 'PENGURUS'].includes(currentUser?.role || '');

  const activeStaff = users.filter(u => 
    u.isApproved && 
    u.isActive && 
    u.role !== 'SUPERADMIN' &&
    u.role !== 'PELANGGAN' &&
    (isGlobalAdmin || u.branchId === currentUser?.branchId) &&
    (isGlobalAdmin || u.role !== 'OWNER')
  );
  
  const pendingUsers = users.filter(u => 
    !u.isApproved && 
    u.role !== 'SUPERADMIN' &&
    (isGlobalAdmin || u.branchId === currentUser?.branchId) &&
    (isGlobalAdmin || u.role !== 'OWNER')
  );

  const handleEditClick = (id: string, currentRole: UserRole, currentName: string, currentUsername: string, currentBranchId?: string, currentJobTitle?: string, currentEmployeeId?: string) => {
    setEditingId(id);
    setEditRole(currentRole);
    setEditName(currentName);
    setEditUsername(currentUsername);
    setEditPassword(''); // Reset password field
    setEditBranch(currentBranchId || '');
    setEditJobTitle(currentJobTitle || '');
    setEditEmployeeId(currentEmployeeId || '');
  };

  const handleSaveEdit = (id: string) => {
    const updates: Partial<any> = { role: editRole, name: editName, username: editUsername, branchId: editBranch || null, jobTitle: editRole === 'PENGURUS' ? editJobTitle : undefined, employeeId: editEmployeeId || undefined };
    if (editPassword) {
      updates.password = editPassword;
    }
    updateUser(id, updates);
    setEditingId(null);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Yakin ingin menonaktifkan akun "${name}"?`)) {
      deleteUser(id);
    }
  };

  const handleApprove = (id: string) => {
    if (currentUser) approveUser(id, currentUser.name);
  };

  const handleReject = (id: string, name: string) => {
    if (window.confirm(`Yakin ingin menolak pendaftaran "${name}"? Akun akan dihapus.`)) {
      rejectUser(id);
    }
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newUsername || !newPassword) return;
    
    // Register user
    const { registerUser } = useAppStore.getState();
    const success = registerUser({
      name: newName,
      username: newUsername,
      password: newPassword,
      role: newRole,
      jobTitle: newRole === 'PENGURUS' ? newJobTitle : undefined,
      branchId: newBranch || null,
      employeeId: newEmployeeId || undefined,
      phone: newUsername, // just default to username if it's a phone number
      tenantId: currentUser?.tenantId || 'tenant_default',
      isKoperasiMember: false
    });
    
    if (!success) {
      alert('Username sudah digunakan. Silakan pilih username lain.');
      return;
    }
    
    // For PELANGGAN role, they are auto-approved. For other roles, they need approval.
    // Find the newly registered user
    setTimeout(() => {
       const latestUsers = useAppStore.getState().users;
       const newlyCreated = latestUsers.find(u => u.username === newUsername);
       if (newlyCreated) {
         if (newRole === 'PELANGGAN') {
           // PELANGGAN is auto-approved, no action needed
           alert(`Pelanggan ${newUsername} berhasil ditambahkan dan aktif otomatis!`);
         } else {
           // Other roles need approval - approve them immediately since added by admin
           approveUser(newlyCreated.id, currentUser?.name || 'Sistem');
           alert(`Pengguna ${newUsername} berhasil ditambahkan dan disetujui otomatis!`);
         }
       }
    }, 100);

    // Reset and close
    setNewName('');
    setNewUsername('');
    setNewPassword('');
    setNewRole('CASHIER');
    setNewJobTitle('');
    setNewBranch('');
    setNewEmployeeId('');
    setIsAddModalOpen(false);
  };

  // Role options based on current user role
  let allowedRoles: UserRole[] = ['CASHIER', 'ADMIN', 'MANAGER', 'PELANGGAN'];
  if (currentUser?.role === 'OWNER') {
    allowedRoles.push('PENGURUS', 'OWNER');
  }
  if (currentUser?.role === 'SUPERADMIN') {
    allowedRoles = ['CASHIER', 'ADMIN', 'MANAGER', 'PENGURUS', 'OWNER', 'PELANGGAN', 'SUPERADMIN'];
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-green-100 text-green-800 rounded-xl">
            <UserCog className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-slate-200 tracking-tight">Manajemen Admin & Pengguna</h1>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Kelola akses, role, dan persetujuan akun pengguna sistem.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold transition-all shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            Tambah Pengguna
          </button>
          <button
            onClick={() => initializeStore()}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold transition-all border border-slate-200 dark:border-slate-700 shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Info Box Aturan Role */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <p className="font-black text-blue-700 uppercase tracking-wider mb-1">👤 Kasir (CASHIER)</p>
          <ul className="text-blue-600 space-y-0.5 list-disc list-inside leading-relaxed">
            <li>Akses: Kasir POS saja</li>
            <li>Transaksi penjualan</li>
            <li>Tidak dapat lihat laporan</li>
          </ul>
        </div>
        <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
          <p className="font-black text-purple-700 uppercase tracking-wider mb-1">🛡️ Admin (ADMIN)</p>
          <ul className="text-purple-600 space-y-0.5 list-disc list-inside leading-relaxed">
            <li>Akses: POS + Inventory + PO</li>
            <li>Laporan Penjualan & Keuangan</li>
            <li>Jurnal Umum & Arus Kas</li>
            <li>Kelola User (kecuali OWNER)</li>
          </ul>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
          <p className="font-black text-amber-700 uppercase tracking-wider mb-1">👑 Owner (OWNER)</p>
          <ul className="text-amber-600 space-y-0.5 list-disc list-inside leading-relaxed">
            <li>Akses: SEMUA menu</li>
            <li>Neraca Laba Rugi & Zakat</li>
            <li>Analitik Strategis</li>
            <li>Promosi ke semua role</li>
          </ul>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-700 pb-0">
        <button
          onClick={() => { setActiveTab('STAFF'); setCurrentPage(1); }}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-t-lg border-b-2 transition-colors ${
            activeTab === 'STAFF'
              ? 'border-green-600 text-green-700 bg-green-50'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300'
          }`}
        >
          <UserCog className="w-4 h-4" />
          Petugas Toko
          <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{activeStaff.length}</span>
        </button>
        <button
          onClick={() => setActiveTab('PENDING')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-t-lg border-b-2 transition-colors ${
            activeTab === 'PENDING'
              ? 'border-amber-500 text-amber-700 bg-amber-50'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300'
          }`}
        >
          <Clock className="w-4 h-4" />
          Menunggu Persetujuan
          {pendingUsers.length > 0 && (
            <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">{pendingUsers.length}</span>
          )}
        </button>
      </div>

      {/* Tab Content: Petugas Toko */}
      {activeTab === 'STAFF' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-[11px] uppercase tracking-wider font-bold">
                  <th className="p-4">Petugas</th>
                  <th className="p-4">Username</th>
                  <th className="p-4">Cabang</th>
                  <th className="p-4">Tanggal Daftar</th>
                  <th className="p-4">Disetujui Oleh</th>
                  <th className="p-4 text-center">Role Akses</th>
                  <th className="p-4 text-right">Piutang (Kasbon)</th>
                  <th className="p-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {activeStaff.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((user) => (
                  <tr key={user.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:bg-slate-800 transition-colors">
                    <td className="p-4">
                      {editingId === user.id ? (
                        <div className="space-y-1.5 min-w-[140px]">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="bg-white dark:bg-slate-900 border border-green-300 text-slate-800 dark:text-slate-200 text-xs rounded-lg px-2 py-1 w-full focus:ring-2 focus:ring-green-500 focus:outline-none"
                            placeholder="Nama Lengkap"
                          />
                          <input
                            type="text"
                            value={editEmployeeId}
                            onChange={(e) => setEditEmployeeId(e.target.value)}
                            className="bg-white dark:bg-slate-900 border border-green-300 text-slate-800 dark:text-slate-200 text-xs rounded-lg px-2 py-1 w-full focus:ring-2 focus:ring-green-500 focus:outline-none font-mono"
                            placeholder="ID Karyawan (Opsional)"
                          />
                        </div>
                      ) : (
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-200">{user.name}</p>
                          {user.employeeId && <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-0.5 font-mono">ID: {user.employeeId}</p>}
                        </div>
                      )}
                    </td>
                    <td className="p-4 font-mono text-xs text-slate-500 dark:text-slate-400">
                      {editingId === user.id ? (
                        <div className="space-y-1.5 min-w-[140px]">
                          <input
                            type="text"
                            value={editUsername}
                            onChange={(e) => setEditUsername(e.target.value)}
                            className="bg-white dark:bg-slate-900 border border-green-300 text-slate-800 dark:text-slate-200 text-xs rounded-lg px-2 py-1.5 w-full focus:ring-2 focus:ring-green-500 focus:outline-none font-mono"
                            placeholder="Username baru"
                          />
                          <input
                            type="text"
                            value={editPassword}
                            onChange={(e) => setEditPassword(e.target.value)}
                            className="bg-white dark:bg-slate-900 border border-amber-300 text-slate-800 dark:text-slate-200 text-[10px] rounded-lg px-2 py-1.5 w-full focus:ring-2 focus:ring-amber-500 focus:outline-none"
                            placeholder="Sandi Baru (Opsional)"
                            title="Kosongkan jika tidak ingin merubah kata sandi"
                          />
                        </div>
                      ) : (
                        `@${user.username}`
                      )}
                    </td>
                    <td className="p-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
                      {editingId === user.id ? (
                        <select
                          value={editBranch}
                          onChange={(e) => setEditBranch(e.target.value)}
                          className="bg-white dark:bg-slate-900 border border-green-300 text-slate-800 dark:text-slate-200 text-xs rounded-lg px-2 py-1 w-full focus:ring-2 focus:ring-green-500 focus:outline-none"
                        >
                          <option value="">Pusat/Global</option>
                          {branches.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                        </select>
                      ) : user.branchId ? (
                        <div className="flex items-center gap-1.5 text-indigo-700 bg-indigo-50 px-2 py-1 rounded w-fit">
                          <Store className="w-3 h-3" />
                          {branches.find(b => b.id === user.branchId)?.name || 'Cabang Tidak Dikenal'}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Pusat/Global</span>
                      )}
                    </td>
                    <td className="p-4 text-xs text-slate-600 dark:text-slate-400">
                      {new Date(user.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="p-4 text-xs text-slate-600 dark:text-slate-400">
                      {user.approvedBy || <span className="text-slate-400 italic">Akun Bawaan Sistem</span>}
                    </td>
                    <td className="p-4 text-center">
                      {editingId === user.id ? (
                        <div className="space-y-1.5">
                          <select
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value as UserRole)}
                            className="bg-white dark:bg-slate-900 border border-green-300 text-slate-800 dark:text-slate-200 text-xs rounded-lg px-2 py-1 focus:ring-2 focus:ring-green-500 focus:outline-none w-full"
                          >
                            {allowedRoles.map(r => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                          {editRole === 'PENGURUS' && (
                            <input
                              type="text"
                              value={editJobTitle}
                              onChange={(e) => setEditJobTitle(e.target.value)}
                              className="bg-white dark:bg-slate-900 border border-indigo-300 text-slate-800 dark:text-slate-200 text-[10px] rounded-lg px-2 py-1 w-full focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                              placeholder="Jabatan (cth: Sekretaris)"
                            />
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider ${
                            user.role === 'OWNER' || user.role === 'PENGURUS' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                            user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                            'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}>
                            {user.role}
                          </span>
                          {user.role === 'PENGURUS' && user.jobTitle && (
                            <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                              {user.jobTitle}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-right font-bold text-red-600 dark:text-red-400">
                      {editingId === user.id ? (
                        <input
                          type="number"
                          value={user.debtAmount || 0}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            // Update locally before save (this requires updating state, we'll just use a prompt or add state)
                            // Better to just prompt for debtAmount update since editingId handles other things.
                          }}
                          className="bg-red-50 dark:bg-red-900/20 border border-red-300 text-red-800 dark:text-red-200 text-xs rounded-lg px-2 py-1 w-24 focus:outline-none"
                          readOnly
                          title="Gunakan tombol Ubah untuk mengedit Kasbon"
                        />
                      ) : (
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center justify-end gap-1">
                            <span className="mr-1 text-sm text-slate-800 dark:text-slate-200">
                              Rp {Number((user.debtAmount || 0) + (customers.find(c => c.phone === user.username)?.debtAmount || 0)).toLocaleString('id-ID')}
                            </span>
                            <button
                              onClick={() => setPayoffModal({ isOpen: true, userId: user.id, userName: user.name, debtAmount: user.debtAmount || 0, payAmount: 0, isAddingDebt: true, paymentMethod: 'CASH' })}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="Tambah Pinjaman Tunai Karyawan"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                            {(user.debtAmount || 0) > 0 && (
                              <button
                                onClick={() => setPayoffModal({ isOpen: true, userId: user.id, userName: user.name, debtAmount: user.debtAmount || 0, payAmount: user.debtAmount || 0, isAddingDebt: false, paymentMethod: 'CASH' })}
                                className="p-1 text-green-600 hover:bg-green-50 rounded-lg"
                                title="Lunasi Pinjaman Tunai"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          <div className="text-[9px] text-slate-400 font-medium">
                            Tunai: Rp {Number(user.debtAmount || 0).toLocaleString('id-ID')} | Belanja: Rp {Number(customers.find(c => c.phone === user.username)?.debtAmount || 0).toLocaleString('id-ID')}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center space-x-2">
                        {editingId === user.id ? (
                          <>
                            <button onClick={() => handleSaveEdit(user.id)} className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors" title="Simpan">
                              <Check className="w-4 h-4" />
                            </button>
                            <button onClick={() => setEditingId(null)} className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-200 transition-colors" title="Batal">
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEditClick(user.id, user.role, user.name, user.username, user.branchId, user.jobTitle, user.employeeId)}
                              className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                              disabled={user.username === currentUser?.username || ((user.role === 'OWNER' || user.role === 'SUPERADMIN' || user.role === 'PENGURUS') && (currentUser?.role !== 'OWNER' && currentUser?.role !== 'SUPERADMIN'))}
                              title="Ubah Data"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(user.id, user.name)}
                              className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                              disabled={user.username === currentUser?.username || ((user.role === 'OWNER' || user.role === 'SUPERADMIN' || user.role === 'PENGURUS') && (currentUser?.role !== 'OWNER' && currentUser?.role !== 'SUPERADMIN'))}
                              title="Hapus Akun"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {activeStaff.length === 0 && (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">Belum ada petugas toko aktif.</div>
            )}
          </div>
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Menampilkan {Math.min((currentPage - 1) * itemsPerPage + 1, activeStaff.length)} - {Math.min(currentPage * itemsPerPage, activeStaff.length)} dari {activeStaff.length} akun
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-[11px] uppercase tracking-wider font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50"
              >
                Sebelumnya
              </button>
              <button 
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={currentPage * itemsPerPage >= activeStaff.length}
                className="px-3 py-1.5 text-[11px] uppercase tracking-wider font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Menunggu Persetujuan */}
      {activeTab === 'PENDING' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
          {pendingUsers.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <p className="font-bold text-slate-600 dark:text-slate-400">Tidak ada pendaftaran yang menunggu persetujuan.</p>
              <p className="text-xs text-slate-400 mt-1">Semua akun telah diproses.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-amber-50 border-b border-amber-100 text-amber-700 text-[11px] uppercase tracking-wider font-bold">
                    <th className="p-4">Nama</th>
                    <th className="p-4">Username</th>
                    <th className="p-4">Cabang</th>
                    <th className="p-4">Tanggal Daftar</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-center">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {pendingUsers.map((user) => (
                    <tr key={user.id} className="border-b border-amber-50 hover:bg-amber-50/50 transition-colors">
                      <td className="p-4">
                        <p className="font-bold text-slate-800 dark:text-slate-200">{user.name}</p>
                      </td>
                      <td className="p-4 font-mono text-xs text-slate-500 dark:text-slate-400">@{user.username}</td>
                      <td className="p-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
                        {user.branchId ? (
                          <div className="flex items-center gap-1.5 text-indigo-700 bg-indigo-50 px-2 py-1 rounded w-fit">
                            <Store className="w-3 h-3" />
                            {branches.find(b => b.id === user.branchId)?.name || 'Cabang Tidak Dikenal'}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Pusat/Global</span>
                        )}
                      </td>
                      <td className="p-4 text-xs text-slate-600 dark:text-slate-400">
                        {new Date(user.createdAt).toLocaleString('id-ID')}
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold animate-pulse">
                          <Clock className="w-3 h-3" />
                          MENUNGGU
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => handleApprove(user.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition-colors"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Setujui
                          </button>
                          <button
                            onClick={() => handleReject(user.id, user.name)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-lg transition-colors border border-red-200"
                          >
                            <UserX className="w-3.5 h-3.5" />
                            Tolak
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal Tambah Pengguna */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-green-700 text-white p-4 flex justify-between items-center">
              <h3 className="font-bold text-lg flex items-center gap-2"><UserPlus className="w-5 h-5"/> Tambah Pengguna Baru</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 hover:bg-white dark:bg-slate-900/20 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddUser} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Nama Lengkap</label>
                <input required type="text" value={newName} onChange={e => setNewName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none" placeholder="Cth: Budi Santoso" />
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">ID Karyawan (Opsional)</label>
                <input type="text" value={newEmployeeId} onChange={e => setNewEmployeeId(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none font-mono" placeholder="Kosongkan jika tidak ada" />
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Username / No HP</label>
                <input required type="text" value={newUsername} onChange={e => setNewUsername(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none" placeholder="Cth: 08123456789" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Password / Sandi</label>
                <input required type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none" placeholder="Minimal 6 karakter" minLength={6} />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Role / Jabatan</label>
                <select value={newRole} onChange={e => setNewRole(e.target.value as UserRole)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none">
                  {allowedRoles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {newRole === 'PENGURUS' && (
                <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Nama Jabatan Spesifik</label>
                  <input required type="text" value={newJobTitle} onChange={e => setNewJobTitle(e.target.value)} className="w-full bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" placeholder="Cth: Ketua DPS, Bendahara, Pengawas" />
                  <p className="text-[10px] text-indigo-600">Penting: Gunakan kata "Pengawas" atau "DPS" agar masuk ke Level 2 di Struktur Organisasi.</p>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Penempatan Cabang (Opsional)</label>
                <select value={newBranch} onChange={e => setNewBranch(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none">
                  <option value="">-- Pusat / Global (Semua Akses) --</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>

              <div className="pt-4 border-t mt-6 flex justify-end gap-2">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold rounded-lg hover:bg-slate-200">Batal</button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 flex items-center gap-2"><Check className="w-4 h-4"/> Buat Akun & Setujui</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Pelunasan / Tambah Kasbon */}
      {payoffModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className={`p-4 flex justify-between items-center ${payoffModal.isAddingDebt ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'}`}>
              <h3 className="font-bold text-lg flex items-center gap-2">
                {payoffModal.isAddingDebt ? <Plus className="w-5 h-5"/> : <Check className="w-5 h-5"/>}
                {payoffModal.isAddingDebt ? 'Pencatatan Pinjaman (Kasbon Tunai)' : 'Pelunasan Kasbon (Piutang)'}
              </h3>
              <button onClick={() => setPayoffModal({ ...payoffModal, isOpen: false })} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Nama Karyawan</label>
                <p className="font-bold text-slate-800 dark:text-slate-200">{payoffModal.userName}</p>
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Total Piutang Berjalan</label>
                <p className="font-black text-xl text-red-600">Rp {payoffModal.debtAmount.toLocaleString('id-ID')}</p>
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Metode Pembayaran/Pencairan</label>
                <select
                  value={payoffModal.paymentMethod}
                  onChange={(e) => setPayoffModal({ ...payoffModal, paymentMethod: e.target.value as any })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="CASH">Tunai (Cash)</option>
                  <option value="TRANSFER_BSI">Transfer BSI</option>
                  <option value="QRIS_SHARIAH">QRIS Syariah</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  {payoffModal.isAddingDebt 
                    ? 'Pilih sumber dana yang dikeluarkan kepada staf.'
                    : 'Pilih rekening/dompet tempat uang cicilan disetor staf.'}
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Nominal {payoffModal.isAddingDebt ? 'Pinjaman' : 'Pelunasan'} (Rp)</label>
                <input
                  type="number"
                  value={payoffModal.payAmount}
                  onChange={(e) => setPayoffModal({ ...payoffModal, payAmount: Number(e.target.value) })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xl font-bold focus:ring-2 focus:ring-blue-500"
                  min="0"
                  max={!payoffModal.isAddingDebt ? payoffModal.debtAmount : undefined}
                />
              </div>

              <div className="pt-4 border-t mt-6 flex justify-end gap-2">
                <button type="button" onClick={() => setPayoffModal({ ...payoffModal, isOpen: false })} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 font-bold rounded-lg hover:bg-slate-200">Batal</button>
                <button type="button" onClick={handleProcessPayoff} className={`px-4 py-2 text-white font-bold rounded-lg flex items-center gap-2 ${payoffModal.isAddingDebt ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}`}>
                  {payoffModal.isAddingDebt ? 'Cairkan Pinjaman' : 'Proses Pelunasan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
