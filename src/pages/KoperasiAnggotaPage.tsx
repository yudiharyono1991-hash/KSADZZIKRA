import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Users, Plus, Search, Trash2, Edit, CreditCard, Award, ChevronDown } from 'lucide-react';

interface KoperasiMember {
  id: string;
  nia: string; // Nomor Induk Anggota
  name: string;
  phone: string;
  joinDate: string;
  points: number;
  simpananPokok: number;
  simpananWajib: number;
  simpananSukarela: number;
}

// Data Dummy untuk Simulasi
const DUMMY_MEMBERS: KoperasiMember[] = [
  { id: 'kop_1', nia: 'NIA-001', name: 'Ahmad Fauzi', phone: '081234567801', joinDate: '2025-01-15', points: 1540, simpananPokok: 100000, simpananWajib: 120000, simpananSukarela: 500000 },
  { id: 'kop_2', nia: 'NIA-002', name: 'Budi Santoso', phone: '081234567802', joinDate: '2025-02-10', points: 850, simpananPokok: 100000, simpananWajib: 110000, simpananSukarela: 0 },
  { id: 'kop_3', nia: 'NIA-003', name: 'Siti Aminah', phone: '081234567803', joinDate: '2025-03-05', points: 2100, simpananPokok: 100000, simpananWajib: 100000, simpananSukarela: 1500000 },
  { id: 'kop_4', nia: 'NIA-004', name: 'Dewi Lestari', phone: '081234567804', joinDate: '2025-04-20', points: 320, simpananPokok: 100000, simpananWajib: 90000, simpananSukarela: 50000 }
];

export default function KoperasiAnggotaPage() {
  const { currentUser } = useAppStore();
  const [members, setMembers] = useState<KoperasiMember[]>(DUMMY_MEMBERS);
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [simpananPokok, setSimpananPokok] = useState(100000);
  const [simpananWajib, setSimpananWajib] = useState(10000);

  if (!['ADMIN', 'OWNER', 'SUPERADMIN', 'MANAGER', 'PENGURUS'].includes(currentUser?.role || '')) {
    return <div className="p-6 text-red-500">Akses Ditolak. Khusus Admin/Owner.</div>;
  }

  const filtered = members.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.nia.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newMember: KoperasiMember = {
      id: `kop_${Date.now()}`,
      nia: `NIA-00${members.length + 1}`,
      name,
      phone,
      joinDate: new Date().toISOString().split('T')[0],
      points: 0,
      simpananPokok,
      simpananWajib,
      simpananSukarela: 0
    };
    setMembers([...members, newMember]);
    resetForm();
    alert('Anggota berhasil didaftarkan!');
  };

  const resetForm = () => {
    setName('');
    setPhone('');
    setSimpananPokok(100000);
    setSimpananWajib(10000);
    setIsAdding(false);
  };

  const deleteMember = (id: string) => {
    if (confirm('Yakin ingin menghapus anggota ini?')) {
      setMembers(members.filter(m => m.id !== id));
    }
  };

  const totalSimpananSemua = members.reduce((sum, m) => sum + m.simpananPokok + m.simpananWajib + m.simpananSukarela, 0);

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-green-100 text-green-800 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Buku Anggota Koperasi</h1>
            <p className="text-sm text-gray-500">Manajemen keanggotaan, poin belanja, dan simpanan syariah.</p>
          </div>
        </div>
        <button 
          onClick={() => { resetForm(); setIsAdding(!isAdding); }}
          className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md transition-all"
        >
          {isAdding ? 'Batal' : <><Plus className="w-4 h-4"/> Daftar Anggota Baru</>}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Total Anggota</p>
            <p className="text-2xl font-black text-gray-800">{members.length}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Total Poin Beredar</p>
            <p className="text-2xl font-black text-gray-800">{members.reduce((sum, m) => sum + m.points, 0).toLocaleString('id-ID')}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-green-100 flex items-center space-x-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-xl">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Total Simpanan</p>
            <p className="text-2xl font-black text-green-700">Rp {totalSimpananSemua.toLocaleString('id-ID')}</p>
          </div>
        </div>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-green-200 mb-6 animate-in fade-in slide-in-from-top-4">
          <h2 className="text-lg font-bold mb-4 text-green-800">Form Pendaftaran Anggota Koperasi</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Nama Lengkap Sesuai KTP</label>
              <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Nomor WhatsApp Aktif</label>
              <input type="text" required value={phone} onChange={e => setPhone(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Setoran Simpanan Pokok (Rp)</label>
              <input type="number" required value={simpananPokok} onChange={e => setSimpananPokok(Number(e.target.value))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none bg-slate-50" />
              <p className="text-[10px] text-gray-500 mt-1">Simpanan yang dibayarkan 1x saat mendaftar.</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Setoran Simpanan Wajib Awal (Rp)</label>
              <input type="number" required value={simpananWajib} onChange={e => setSimpananWajib(Number(e.target.value))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none bg-slate-50" />
              <p className="text-[10px] text-gray-500 mt-1">Simpanan rutin bulanan.</p>
            </div>
            <div className="md:col-span-2 pt-2">
              <button type="submit" className="w-full bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition-colors">Daftarkan Anggota & Cetak Bukti</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/50">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Cari NIA atau Nama Anggota..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 text-sm outline-none shadow-sm" />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button className="flex-1 md:flex-none px-4 py-2 bg-white border border-gray-200 text-gray-600 font-semibold text-sm rounded-xl hover:bg-gray-50">Filter Status</button>
            <button className="flex-1 md:flex-none px-4 py-2 bg-white border border-gray-200 text-gray-600 font-semibold text-sm rounded-xl hover:bg-gray-50">Export Excel</button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-green-900 text-green-100 font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 rounded-tl-lg">Identitas Anggota</th>
                <th className="px-6 py-4 text-center">Poin Belanja</th>
                <th className="px-6 py-4 text-right">Simpanan Pokok</th>
                <th className="px-6 py-4 text-right">Simpanan Wajib</th>
                <th className="px-6 py-4 text-right">S. Sukarela</th>
                <th className="px-6 py-4 text-right">Total Saldo</th>
                <th className="px-6 py-4 text-center rounded-tr-lg">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(c => {
                const totalSaldo = c.simpananPokok + c.simpananWajib + c.simpananSukarela;
                return (
                  <tr key={c.id} className="hover:bg-green-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-800 text-base">{c.name}</div>
                      <div className="text-xs text-gray-500 font-medium">{c.nia} • {c.phone}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-3 py-1 bg-amber-100 border border-amber-200 text-amber-800 font-black rounded-full text-xs shadow-sm">
                        {c.points.toLocaleString('id-ID')} Pts
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-600">Rp {c.simpananPokok.toLocaleString('id-ID')}</td>
                    <td className="px-6 py-4 text-right font-medium text-gray-600">Rp {c.simpananWajib.toLocaleString('id-ID')}</td>
                    <td className="px-6 py-4 text-right font-medium text-gray-600">Rp {c.simpananSukarela.toLocaleString('id-ID')}</td>
                    <td className="px-6 py-4 text-right font-bold text-green-700 bg-green-50/30">
                      Rp {totalSaldo.toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center items-center space-x-2">
                        <button className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title="Catat Setoran">
                          <CreditCard className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors" title="Edit Data">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteMember(c.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors" title="Hapus Anggota">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    Tidak ada anggota koperasi yang ditemukan.
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
