import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Shield, UserCog, Trash2, Edit, Check, X, ShieldAlert, Clock, CheckCircle, UserX, Users, Store } from 'lucide-react';
import { UserRole } from '../types';

type Tab = 'ACTIVE' | 'PENDING';

export default function AdminManagementPage() {
  const { users, currentUser, updateUser, deleteUser, approveUser, rejectUser, branches } = useAppStore();
  const [activeTab, setActiveTab] = useState<Tab>('ACTIVE');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('CASHIER');

  // Prevent accessing if not admin or owner
  if (currentUser?.role !== 'ADMIN' && currentUser?.role !== 'OWNER') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4 py-20">
        <ShieldAlert className="w-16 h-16 text-red-400" />
        <h2 className="text-xl font-bold">Akses Ditolak</h2>
        <p className="text-sm">Anda tidak memiliki izin untuk mengakses halaman Manajemen Admin.</p>
      </div>
    );
  }

  const activeUsers = users.filter(u => u.isApproved && u.isActive);
  const pendingUsers = users.filter(u => !u.isApproved);

  const handleEditClick = (id: string, currentRole: UserRole) => {
    setEditingId(id);
    setEditRole(currentRole);
  };

  const handleSaveEdit = (id: string) => {
    updateUser(id, { role: editRole });
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

  // Role options based on current user role
  const allowedRoles: UserRole[] = currentUser?.role === 'OWNER'
    ? ['CASHIER', 'ADMIN', 'OWNER']
    : ['CASHIER', 'ADMIN']; // Admin cannot promote to OWNER

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-2">
        <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl">
          <UserCog className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Manajemen Admin & Pengguna</h1>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">Kelola akses, role, dan persetujuan akun pengguna sistem.</p>
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
      <div className="flex space-x-2 border-b border-slate-200 pb-0">
        <button
          onClick={() => setActiveTab('ACTIVE')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-t-lg border-b-2 transition-colors ${
            activeTab === 'ACTIVE'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users className="w-4 h-4" />
          Pengguna Aktif
          <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{activeUsers.length}</span>
        </button>
        <button
          onClick={() => setActiveTab('PENDING')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-t-lg border-b-2 transition-colors ${
            activeTab === 'PENDING'
              ? 'border-amber-500 text-amber-700 bg-amber-50'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Clock className="w-4 h-4" />
          Menunggu Persetujuan
          {pendingUsers.length > 0 && (
            <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">{pendingUsers.length}</span>
          )}
        </button>
      </div>

      {/* Tab Content: Pengguna Aktif */}
      {activeTab === 'ACTIVE' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px] uppercase tracking-wider font-bold">
                  <th className="p-4">Pengguna</th>
                  <th className="p-4">Username</th>
                  <th className="p-4">Cabang</th>
                  <th className="p-4">Tanggal Daftar</th>
                  <th className="p-4">Disetujui Oleh</th>
                  <th className="p-4 text-center">Role Akses</th>
                  <th className="p-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {activeUsers.map((user) => (
                  <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-slate-800">{user.name}</p>
                    </td>
                    <td className="p-4 font-mono text-xs text-slate-500">@{user.username}</td>
                    <td className="p-4 text-xs font-semibold text-slate-600">
                      {user.branchId ? (
                        <div className="flex items-center gap-1.5 text-indigo-700 bg-indigo-50 px-2 py-1 rounded w-fit">
                          <Store className="w-3 h-3" />
                          {branches.find(b => b.id === user.branchId)?.name || 'Cabang Tidak Dikenal'}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Pusat/Global</span>
                      )}
                    </td>
                    <td className="p-4 text-xs text-slate-600">
                      {new Date(user.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="p-4 text-xs text-slate-600">
                      {user.approvedBy || <span className="text-slate-400 italic">Akun Bawaan Sistem</span>}
                    </td>
                    <td className="p-4 text-center">
                      {editingId === user.id ? (
                        <select
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value as UserRole)}
                          className="bg-white border border-emerald-300 text-slate-800 text-xs rounded-lg px-2 py-1 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        >
                          {allowedRoles.map(r => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      ) : (
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider ${
                          user.role === 'OWNER' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                          user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                          'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}>
                          {user.role}
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center space-x-2">
                        {editingId === user.id ? (
                          <>
                            <button onClick={() => handleSaveEdit(user.id)} className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors" title="Simpan">
                              <Check className="w-4 h-4" />
                            </button>
                            <button onClick={() => setEditingId(null)} className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors" title="Batal">
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEditClick(user.id, user.role)}
                              className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                              disabled={user.username === currentUser?.username || (currentUser?.role === 'ADMIN' && user.role === 'OWNER')}
                              title="Ubah Role"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(user.id, user.name)}
                              className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                              disabled={user.username === currentUser?.username}
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
            {activeUsers.length === 0 && (
              <div className="p-8 text-center text-slate-500 text-sm">Belum ada pengguna aktif.</div>
            )}
          </div>
        </div>
      )}

      {/* Tab Content: Menunggu Persetujuan */}
      {activeTab === 'PENDING' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {pendingUsers.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <p className="font-bold text-slate-600">Tidak ada pendaftaran yang menunggu persetujuan.</p>
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
                        <p className="font-bold text-slate-800">{user.name}</p>
                      </td>
                      <td className="p-4 font-mono text-xs text-slate-500">@{user.username}</td>
                      <td className="p-4 text-xs font-semibold text-slate-600">
                        {user.branchId ? (
                          <div className="flex items-center gap-1.5 text-indigo-700 bg-indigo-50 px-2 py-1 rounded w-fit">
                            <Store className="w-3 h-3" />
                            {branches.find(b => b.id === user.branchId)?.name || 'Cabang Tidak Dikenal'}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Pusat/Global</span>
                        )}
                      </td>
                      <td className="p-4 text-xs text-slate-600">
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
                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors"
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
    </div>
  );
}
