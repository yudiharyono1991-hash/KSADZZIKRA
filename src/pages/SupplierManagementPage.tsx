import React, { useState } from 'react';
import { useBranchData } from '../hooks/useBranchData';
import { Truck, Plus, Search, Trash2, Edit, CreditCard } from 'lucide-react';

export default function SupplierManagementPage() {
  const { suppliers, addSupplier, updateSupplier, deleteSupplier, currentUser } = useBranchData();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const [searchTerm, setSearchTerm] = useState('');

  if (!['ADMIN', 'OWNER', 'SUPERADMIN', 'MANAGER', 'PENGURUS'].includes(currentUser?.role || '')) {
    return <div className="p-6 text-red-500">Akses Ditolak. Khusus Admin/Owner.</div>;
  }

  const filtered = suppliers.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateSupplier(editingId, { name, contactPerson, phone, address });
    } else {
      addSupplier({ tenantId: currentUser?.tenantId || 'tenant_default', name, contactPerson, phone, address, debtAmount: 0 });
    }
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setContactPerson('');
    setPhone('');
    setAddress('');
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEdit = (s: any) => {
    setName(s.name);
    setContactPerson(s.contactPerson);
    setPhone(s.phone);
    setAddress(s.address);
    setEditingId(s.id);
    setIsAdding(true);
  };

  const handlePayDebt = (s: any) => {
    const payStr = prompt(`Masukkan nominal bayar hutang ke ${s.name} (Hutang Toko: Rp ${s.debtAmount}):`, '0');
    if (!payStr) return;
    const amount = Number(payStr);
    if (isNaN(amount) || amount <= 0) return;

    if (amount > s.debtAmount) {
      alert('Nominal pelunasan tidak boleh lebih besar dari total hutang!');
      return;
    }

    updateSupplier(s.id, { debtAmount: s.debtAmount - amount });
    alert(`Pelunasan berhasil diproses. Sisa hutang toko ke ${s.name}: Rp ${s.debtAmount - amount}`);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 text-blue-800 rounded-xl">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Master Supplier</h1>
            <p className="text-sm text-gray-500">Buku alamat dan catatan hutang usaha ke Pemasok.</p>
          </div>
        </div>
        <button 
          onClick={() => { resetForm(); setIsAdding(!isAdding); }}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md transition-all"
        >
          {isAdding ? 'Batal' : <><Plus className="w-4 h-4"/> Supplier Baru</>}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
          <h2 className="text-lg font-bold mb-4">{editingId ? 'Edit Supplier' : 'Tambah Supplier Baru'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Nama Supplier/Perusahaan</label>
                <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Nama Kontak (Sales/PIC)</label>
                <input type="text" required value={contactPerson} onChange={e => setContactPerson(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Nomor WhatsApp/Telepon</label>
                <input type="text" required value={phone} onChange={e => setPhone(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Alamat</label>
                <input type="text" required value={address} onChange={e => setAddress(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
            <button type="submit" className="w-full md:w-auto bg-green-600 text-white font-bold py-2 px-6 rounded-lg">Simpan Data</button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Cari supplier..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm outline-none" />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/50 text-gray-500 font-medium">
              <tr>
                <th className="px-6 py-4">Perusahaan</th>
                <th className="px-6 py-4">PIC / Kontak</th>
                <th className="px-6 py-4 text-right">Hutang Toko</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-bold text-gray-800">
                    {s.name}
                    <p className="text-[10px] text-gray-500 font-normal">{s.address}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {s.contactPerson}
                    <p className="text-[10px] text-blue-500">{s.phone}</p>
                  </td>
                  <td className="px-6 py-4 text-right font-bold">
                    {s.debtAmount > 0 ? (
                      <span className="text-red-600">Rp {s.debtAmount.toLocaleString('id-ID')}</span>
                    ) : (
                      <span className="text-green-600">Lunas</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center space-x-2">
                    {s.debtAmount > 0 && (
                      <button onClick={() => handlePayDebt(s)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Bayar Hutang">
                        <CreditCard className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => handleEdit(s)} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg" title="Edit">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteSupplier(s.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Hapus">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    Belum ada data supplier.
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
