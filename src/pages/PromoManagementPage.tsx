import React, { useState } from 'react';
import { useBranchData } from '../hooks/useBranchData';
import { Tag, Plus, Search, Trash2, Edit, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function PromoManagementPage() {
  const { promos, addPromo, updatePromo, deletePromo, currentUser } = useBranchData();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [type, setType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [value, setValue] = useState('');
  const [minPurchase, setMinPurchase] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

  if (!['ADMIN', 'OWNER', 'SUPERADMIN', 'MANAGER', 'PENGURUS'].includes(currentUser?.role || '')) {
    return <div className="p-6 text-red-700">Akses Ditolak. Khusus Admin/Owner.</div>;
  }

  const filtered = promos.filter(p => {
    let match = true;
    if (searchTerm) {
      match = match && p.name.toLowerCase().includes(searchTerm.toLowerCase());
    }
    if (statusFilter === 'ACTIVE') match = match && p.isActive;
    if (statusFilter === 'INACTIVE') match = match && !p.isActive;
    if (dateRange.startDate) {
      const start = new Date(dateRange.startDate).setHours(0, 0, 0, 0);
      match = match && new Date(p.createdAt).getTime() >= start;
    }
    if (dateRange.endDate) {
      const end = new Date(dateRange.endDate).setHours(23, 59, 59, 999);
      match = match && new Date(p.createdAt).getTime() <= end;
    }
    return match;
  });

  const activePromosCount = promos.filter(p => p.isActive).length;
  const inactivePromosCount = promos.length - activePromosCount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updatePromo(editingId, { name, type, value: Number(value), minPurchase: Number(minPurchase), isActive });
    } else {
      addPromo({ tenantId: currentUser?.tenantId || 'tenant_default', name, type, value: Number(value), minPurchase: Number(minPurchase), isActive });
    }
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setType('PERCENTAGE');
    setValue('');
    setMinPurchase('');
    setIsActive(true);
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEdit = (p: any) => {
    setName(p.name);
    setType(p.type);
    setValue(p.value.toString());
    setMinPurchase(p.minPurchase.toString());
    setIsActive(p.isActive);
    setEditingId(p.id);
    setIsAdding(true);
  };

  return (
    <div className="p-3 md:p-6 max-w-5xl mx-auto space-y-4 md:space-y-6 w-full min-w-0 pb-10">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-fuchsia-100 text-fuchsia-800 rounded-xl">
            <Tag className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-slate-200">Manajemen Promo</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">Buat program diskon Syariah untuk pelanggan.</p>
          </div>
        </div>
        <button 
          onClick={() => { resetForm(); setIsAdding(!isAdding); }}
          className="flex items-center justify-center gap-2 bg-fuchsia-600 hover:bg-fuchsia-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md transition-all whitespace-nowrap flex-shrink-0"
        >
          {isAdding ? 'Batal' : <><Plus className="w-4 h-4"/> Buat Promo Baru</>}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Promo Aktif</p>
            <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{activePromosCount} Program</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Promo Non-Aktif</p>
            <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{inactivePromosCount} Program</p>
          </div>
        </div>
      </div>

      {isAdding && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 mb-6">
          <h2 className="text-lg font-bold mb-4">{editingId ? 'Edit Promo' : 'Buat Promo Baru'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-600 dark:text-slate-400">Nama Promo</label>
                <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Misal: Diskon Jumat Berkah" className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-fuchsia-500 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-600 dark:text-slate-400">Tipe Potongan</label>
                <select value={type} onChange={e => setType(e.target.value as any)} className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-fuchsia-500 outline-none bg-white dark:bg-slate-900">
                  <option value="PERCENTAGE">Diskon Persentase (%)</option>
                  <option value="FIXED">Potongan Tunai (Rp)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-600 dark:text-slate-400">Nilai Potongan</label>
                <div className="relative">
                  {type === 'FIXED' && <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">Rp</span>}
                  <input type="number" required min="1" value={value} onChange={e => setValue(e.target.value)} placeholder={type === 'PERCENTAGE' ? "Misal: 10" : "Misal: 5000"} className={`w-full border border-gray-200 dark:border-slate-700 rounded-lg py-2 ${type === 'FIXED' ? 'pl-9 pr-3' : 'px-3'} text-sm focus:ring-2 focus:ring-fuchsia-500 outline-none`} />
                  {type === 'PERCENTAGE' && <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400">%</span>}
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-600 dark:text-slate-400">Minimal Belanja (Rp)</label>
                <input type="number" required min="0" value={minPurchase} onChange={e => setMinPurchase(e.target.value)} placeholder="Misal: 50000" className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-fuchsia-500 outline-none" />
              </div>
              <div className="space-y-1 md:col-span-2 flex items-center gap-2 mt-2">
                <input type="checkbox" id="isActive" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="w-4 h-4 text-fuchsia-600 rounded border-gray-300 dark:border-slate-600 focus:ring-fuchsia-500" />
                <label htmlFor="isActive" className="text-sm font-bold text-gray-700 dark:text-slate-300">Promo Aktif & Bisa Digunakan Kasir</label>
              </div>
            </div>
            <button type="submit" className="w-full md:w-auto bg-fuchsia-600 text-white font-bold py-2 px-6 rounded-lg mt-4">Simpan Promo</button>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden flex-1 flex flex-col">
        <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex flex-col md:flex-row gap-3 justify-between items-center bg-gray-50 dark:bg-slate-800/50">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Cari nama promo..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-fuchsia-500 text-sm outline-none" />
          </div>
          
          <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3 items-center">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full sm:w-auto px-4 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-fuchsia-500 outline-none"
            >
              <option value="ALL">Semua Status</option>
              <option value="ACTIVE">Aktif (Sedang Berjalan)</option>
              <option value="INACTIVE">Non-Aktif (Dihentikan)</option>
            </select>
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto hide-scrollbar">
              <input 
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full sm:w-auto px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-fuchsia-500 outline-none"
              />
              <span className="text-slate-400">-</span>
              <input 
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full sm:w-auto px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-fuchsia-500 outline-none"
              />
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto w-full hide-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
          <table className="w-full text-left text-[10px] sm:text-xs min-w-[700px]">
            <thead className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-slate-400 font-medium">
              <tr>
                <th className="px-3 py-3">Tgl Dibuat</th>
                <th className="px-3 py-3">Nama Promo</th>
                <th className="px-3 py-3">Tipe & Nilai</th>
                <th className="px-3 py-3">Syarat Minimum</th>
                <th className="px-3 py-3 text-center">Status</th>
                <th className="px-3 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 dark:bg-slate-800">
                  <td className="px-3 py-3 text-gray-500 dark:text-slate-400 text-[10px] sm:text-xs">{p.createdAt ? format(new Date(p.createdAt), 'dd/MM/yyyy') : '-'}</td>
                  <td className="px-3 py-3 font-bold text-gray-800 dark:text-slate-200 truncate max-w-[150px]">{p.name}</td>
                  <td className="px-3 py-3">
                    <span className="font-bold text-fuchsia-700">
                      {p.type === 'PERCENTAGE' ? `Diskon ${p.value}%` : `Potongan Rp ${p.value.toLocaleString('id-ID')}`}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-gray-600 dark:text-slate-400">Rp {p.minPurchase.toLocaleString('id-ID')}</td>
                  <td className="px-3 py-3 text-center">
                    {p.isActive ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 font-bold rounded-full text-[9px] sm:text-[10px]">Aktif</span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 font-bold rounded-full text-[9px] sm:text-[10px]">Nonaktif</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center space-x-1 sm:space-x-2 whitespace-nowrap">
                    <button onClick={() => handleEdit(p)} className="p-1 sm:p-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-800 rounded-lg" title="Edit">
                      <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                    <button onClick={() => deletePromo(p.id)} className="p-1 sm:p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Hapus">
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-slate-400">
                    Belum ada data promo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
