import React, { useState } from 'react';
import { useBranchData } from '../hooks/useBranchData';
import { Tag, Plus, Search, Trash2, Edit } from 'lucide-react';

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

  if (!['ADMIN', 'OWNER', 'SUPERADMIN', 'MANAGER', 'PENGURUS'].includes(currentUser?.role || '')) {
    return <div className="p-6 text-red-500">Akses Ditolak. Khusus Admin/Owner.</div>;
  }

  const filtered = promos.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

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
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-fuchsia-100 text-fuchsia-800 rounded-xl">
            <Tag className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Manajemen Promo</h1>
            <p className="text-sm text-gray-500">Buat program diskon Syariah untuk pelanggan.</p>
          </div>
        </div>
        <button 
          onClick={() => { resetForm(); setIsAdding(!isAdding); }}
          className="flex items-center justify-center gap-2 bg-fuchsia-600 hover:bg-fuchsia-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md transition-all"
        >
          {isAdding ? 'Batal' : <><Plus className="w-4 h-4"/> Buat Promo Baru</>}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
          <h2 className="text-lg font-bold mb-4">{editingId ? 'Edit Promo' : 'Buat Promo Baru'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-600">Nama Promo</label>
                <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Misal: Diskon Jumat Berkah" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-fuchsia-500 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-600">Tipe Potongan</label>
                <select value={type} onChange={e => setType(e.target.value as any)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-fuchsia-500 outline-none bg-white">
                  <option value="PERCENTAGE">Diskon Persentase (%)</option>
                  <option value="FIXED">Potongan Tunai (Rp)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-600">Nilai Potongan</label>
                <div className="relative">
                  {type === 'FIXED' && <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">Rp</span>}
                  <input type="number" required min="1" value={value} onChange={e => setValue(e.target.value)} placeholder={type === 'PERCENTAGE' ? "Misal: 10" : "Misal: 5000"} className={`w-full border border-gray-200 rounded-lg py-2 ${type === 'FIXED' ? 'pl-9 pr-3' : 'px-3'} text-sm focus:ring-2 focus:ring-fuchsia-500 outline-none`} />
                  {type === 'PERCENTAGE' && <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400">%</span>}
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-600">Minimal Belanja (Rp)</label>
                <input type="number" required min="0" value={minPurchase} onChange={e => setMinPurchase(e.target.value)} placeholder="Misal: 50000" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-fuchsia-500 outline-none" />
              </div>
              <div className="space-y-1 md:col-span-2 flex items-center gap-2 mt-2">
                <input type="checkbox" id="isActive" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="w-4 h-4 text-fuchsia-600 rounded border-gray-300 focus:ring-fuchsia-500" />
                <label htmlFor="isActive" className="text-sm font-bold text-gray-700">Promo Aktif & Bisa Digunakan Kasir</label>
              </div>
            </div>
            <button type="submit" className="w-full md:w-auto bg-fuchsia-600 text-white font-bold py-2 px-6 rounded-lg mt-4">Simpan Promo</button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Cari promo..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-fuchsia-500 text-sm outline-none" />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/50 text-gray-500 font-medium">
              <tr>
                <th className="px-6 py-4">Nama Promo</th>
                <th className="px-6 py-4">Tipe & Nilai</th>
                <th className="px-6 py-4">Syarat Minimum</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-bold text-gray-800">{p.name}</td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-fuchsia-700">
                      {p.type === 'PERCENTAGE' ? `Diskon ${p.value}%` : `Potongan Rp ${p.value.toLocaleString('id-ID')}`}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">Rp {p.minPurchase.toLocaleString('id-ID')}</td>
                  <td className="px-6 py-4 text-center">
                    {p.isActive ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 font-bold rounded-full text-xs">Aktif</span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 font-bold rounded-full text-xs">Nonaktif</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center space-x-2">
                    <button onClick={() => handleEdit(p)} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg" title="Edit">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => deletePromo(p.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Hapus">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
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
