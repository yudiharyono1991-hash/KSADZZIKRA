import React, { useState, useEffect } from 'react';
import { Wallet, Plus, Save, Trash2, Search, FileText } from 'lucide-react';

interface Pembiayaan {
  id: string;
  anggotaName: string;
  akad: 'Murabahah' | 'Qardh' | 'Ijarah';
  nominal: number;
  margin: number;
  tenorBulan: number;
  tanggal: string;
  status: 'Aktif' | 'Lunas';
}

export default function KoperasiPembiayaanPage() {
  const [data, setData] = useState<Pembiayaan[]>([]);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Pembiayaan>>({
    akad: 'Murabahah',
    status: 'Aktif'
  });

  useEffect(() => {
    const saved = localStorage.getItem('ksa_pembiayaan');
    if (saved) {
      try { setData(JSON.parse(saved)); } catch(e) {}
    }
  }, []);

  const saveToStorage = (newData: Pembiayaan[]) => {
    setData(newData);
    localStorage.setItem('ksa_pembiayaan', JSON.stringify(newData));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newRecord: Pembiayaan = {
      id: `pemb_${Date.now()}`,
      anggotaName: formData.anggotaName || 'Fulan',
      akad: formData.akad as any,
      nominal: Number(formData.nominal) || 0,
      margin: Number(formData.margin) || 0,
      tenorBulan: Number(formData.tenorBulan) || 1,
      tanggal: new Date().toLocaleDateString('en-CA'),
      status: 'Aktif'
    };
    saveToStorage([newRecord, ...data]);
    setShowForm(false);
    setFormData({ akad: 'Murabahah', status: 'Aktif' });
  };

  const handleDelete = (id: string) => {
    if(confirm('Hapus data pembiayaan ini?')) {
      saveToStorage(data.filter(d => d.id !== id));
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-slate-200 flex items-center gap-2">
            <Wallet className="w-6 h-6 text-green-600" />
            Pembiayaan Koperasi
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Kelola data pembiayaan anggota dengan berbagai pilihan akad syariah.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-green-700 transition"
        >
          <Plus className="w-4 h-4" /> Pengajuan Baru
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
          <h2 className="font-bold text-gray-800 dark:text-slate-200 mb-4 border-b pb-2">Form Pengajuan Pembiayaan</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">Nama Anggota</label>
              <input required type="text" className="w-full border rounded-lg p-2 text-sm" value={formData.anggotaName || ''} onChange={e => setFormData({...formData, anggotaName: e.target.value})} placeholder="Cari / Ketik Nama" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">Pilihan Akad</label>
              <select className="w-full border rounded-lg p-2 text-sm" value={formData.akad} onChange={e => setFormData({...formData, akad: e.target.value as any})}>
                <option value="Murabahah">Murabahah (Jual Beli Cicilan)</option>
                <option value="Qardh">Qardh (Pinjaman Murni tanpa Margin)</option>
                <option value="Ijarah">Ijarah (Sewa Menyewa)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">Nominal Pokok (Rp)</label>
              <input required type="number" className="w-full border rounded-lg p-2 text-sm" value={formData.nominal || ''} onChange={e => setFormData({...formData, nominal: Number(e.target.value)})} />
            </div>
            {formData.akad !== 'Qardh' && (
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">Margin / Ujrah (Rp)</label>
                <input required type="number" className="w-full border rounded-lg p-2 text-sm" value={formData.margin || ''} onChange={e => setFormData({...formData, margin: Number(e.target.value)})} />
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">Tenor (Bulan)</label>
              <input required type="number" className="w-full border rounded-lg p-2 text-sm" value={formData.tenorBulan || ''} onChange={e => setFormData({...formData, tenorBulan: Number(e.target.value)})} />
            </div>
            <div className="md:col-span-2 flex justify-end gap-2 mt-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm font-bold text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:bg-slate-800">Batal</button>
              <button type="submit" className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-teal-700"><Save className="w-4 h-4"/> Simpan Data</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50 dark:bg-slate-800">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Cari anggota..." className="pl-9 pr-4 py-1.5 text-sm border rounded-lg focus:ring-1 focus:ring-green-500 outline-none w-64" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-400 border-b">
              <tr>
                <th className="p-4 font-semibold">Tanggal</th>
                <th className="p-4 font-semibold">Anggota</th>
                <th className="p-4 font-semibold">Akad</th>
                <th className="p-4 font-semibold text-right">Nominal Pokok</th>
                <th className="p-4 font-semibold text-right">Margin/Ujrah</th>
                <th className="p-4 font-semibold text-center">Tenor</th>
                <th className="p-4 font-semibold text-center">Status</th>
                <th className="p-4 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.length === 0 ? (
                <tr><td colSpan={8} className="p-8 text-center text-gray-400">Belum ada data pembiayaan</td></tr>
              ) : data.map(item => (
                <tr key={item.id} className="hover:bg-gray-50 dark:bg-slate-800/50">
                  <td className="p-4 text-gray-600 dark:text-slate-400">{new Date(item.tanggal).toLocaleDateString('id-ID')}</td>
                  <td className="p-4 font-medium text-gray-800 dark:text-slate-200">{item.anggotaName}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
                      {item.akad}
                    </span>
                  </td>
                  <td className="p-4 text-right font-medium text-green-600">Rp {item.nominal.toLocaleString('id-ID')}</td>
                  <td className="p-4 text-right font-medium text-amber-600">Rp {item.margin.toLocaleString('id-ID')}</td>
                  <td className="p-4 text-center text-gray-600 dark:text-slate-400">{item.tenorBulan} Bln</td>
                  <td className="p-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${item.status === 'Aktif' ? 'bg-green-100 text-green-700' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400'}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <button onClick={() => handleDelete(item.id)} className="p-1.5 text-red-700 hover:bg-red-50 rounded-lg transition" title="Hapus">
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
