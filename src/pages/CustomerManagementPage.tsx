import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Users, Plus, Search, Trash2, Edit, CreditCard } from 'lucide-react';

export default function CustomerManagementPage() {
  const { customers, addCustomer, updateCustomer, deleteCustomer, currentUser } = useAppStore();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const [searchTerm, setSearchTerm] = useState('');

  if (currentUser?.role !== 'ADMIN' && currentUser?.role !== 'OWNER') {
    return <div className="p-6 text-red-500">Akses Ditolak. Khusus Admin/Owner.</div>;
  }

  const filtered = customers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateCustomer(editingId, { name, phone });
    } else {
      addCustomer({ name, phone, points: 0, debtAmount: 0 });
    }
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setPhone('');
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEdit = (c: any) => {
    setName(c.name);
    setPhone(c.phone);
    setEditingId(c.id);
    setIsAdding(true);
  };

  const handlePayDebt = (c: any) => {
    const payStr = prompt(`Masukkan nominal pelunasan piutang untuk ${c.name} (Total Piutang: Rp ${c.debtAmount}):`, '0');
    if (!payStr) return;
    const amount = Number(payStr);
    if (isNaN(amount) || amount <= 0) return;

    if (amount > c.debtAmount) {
      alert('Nominal pelunasan tidak boleh lebih besar dari total piutang!');
      return;
    }

    updateCustomer(c.id, { debtAmount: c.debtAmount - amount });
    alert(`Pelunasan berhasil diproses. Sisa piutang: Rp ${c.debtAmount - amount}`);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 text-blue-800 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Master Pelanggan (CRM)</h1>
            <p className="text-sm text-gray-500">Kelola data pelanggan, loyalitas, dan catatan piutang/kasbon.</p>
          </div>
        </div>
        <button 
          onClick={() => { resetForm(); setIsAdding(!isAdding); }}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md transition-all"
        >
          {isAdding ? 'Batal' : <><Plus className="w-4 h-4"/> Pelanggan Baru</>}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
          <h2 className="text-lg font-bold mb-4">{editingId ? 'Edit Pelanggan' : 'Tambah Pelanggan Baru'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Nama Lengkap</label>
              <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Nomor WhatsApp</label>
              <input type="text" required value={phone} onChange={e => setPhone(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-2 rounded-lg">Simpan Data</button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Cari pelanggan..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm outline-none" />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/50 text-gray-500 font-medium">
              <tr>
                <th className="px-6 py-4">Nama Pelanggan</th>
                <th className="px-6 py-4">No. WhatsApp</th>
                <th className="px-6 py-4 text-center">Poin Loyalitas</th>
                <th className="px-6 py-4 text-right">Piutang (Kasbon)</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-bold text-gray-800">{c.name}</td>
                  <td className="px-6 py-4 text-gray-600">{c.phone}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2 py-1 bg-amber-100 text-amber-800 font-bold rounded-full text-xs">{c.points} Pts</span>
                  </td>
                  <td className="px-6 py-4 text-right font-bold">
                    {c.debtAmount > 0 ? (
                      <span className="text-red-600">Rp {c.debtAmount.toLocaleString('id-ID')}</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center space-x-2">
                    {c.debtAmount > 0 && (
                      <button onClick={() => handlePayDebt(c)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Bayar Piutang">
                        <CreditCard className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => handleEdit(c)} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg" title="Edit">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteCustomer(c.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Hapus">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
