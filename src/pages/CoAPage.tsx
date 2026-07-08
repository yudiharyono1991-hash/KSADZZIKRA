import React, { useState } from 'react';
import { useAppStore } from '../store';
import { CoaAccount } from '../types';
import { BookOpen, Plus, Edit, Trash2, CheckCircle, Search, Filter, AlertCircle, Download, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function CoAPage() {
  const { coaList, addCoaAccount, updateCoaAccount, deleteCoaAccount, currentUser, settings } = useAppStore();

  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ done: 0, total: 0 });

  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<CoaAccount | null>(null);

  // Form states
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE'>('ASSET');
  const [isActive, setIsActive] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const canEditCoa = ['OWNER', 'ADMIN', 'MANAGER', 'SUPERADMIN', 'PENGURUS'].includes(currentUser?.role || '');

  const categories = [
    { value: 'ALL', label: 'Semua Kategori' },
    { value: 'ASSET', label: 'Aset (Asset)' },
    { value: 'LIABILITY', label: 'Kewajiban (Liability)' },
    { value: 'EQUITY', label: 'Ekuitas (Equity)' },
    { value: 'REVENUE', label: 'Pendapatan (Revenue)' },
    { value: 'EXPENSE', label: 'Beban (Expense)' },
  ];

  const handleOpenAdd = () => {
    setEditingAccount(null);
    setCode('');
    setName('');
    setCategory('ASSET');
    setIsActive(true);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (acc: CoaAccount) => {
    setEditingAccount(acc);
    setCode(acc.code);
    setName(acc.name);
    setCategory(acc.category);
    setIsActive(acc.isActive);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) {
      setErrorMsg('Kode dan Nama akun wajib diisi.');
      return;
    }

    // Check if code duplicate
    const codeDup = coaList.find(c => c.code === code && (!editingAccount || c.id !== editingAccount.id));
    if (codeDup) {
      setErrorMsg('Kode akun sudah digunakan.');
      return;
    }

    if (editingAccount) {
      updateCoaAccount({
        ...editingAccount,
        code,
        name,
        category,
        isActive
      });
    } else {
      addCoaAccount({
        code,
        name,
        category,
        tenantId: currentUser?.tenantId || 'tenant_default',
        isActive: true
      });
    }
    setIsModalOpen(false);
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'ASSET': return 'bg-green-50 text-green-800 border-green-100';
      case 'LIABILITY': return 'bg-amber-50 text-amber-800 border-amber-100';
      case 'EQUITY': return 'bg-blue-50 text-blue-800 border-blue-100';
      case 'REVENUE': return 'bg-purple-50 text-purple-800 border-purple-100';
      case 'EXPENSE': return 'bg-rose-50 text-rose-800 border-rose-100';
      default: return 'bg-gray-50 text-gray-800 border-gray-100';
    }
  };

  // Filtered accounts
  const filteredCoa = coaList.filter(acc => {
    const matchesCategory = activeCategoryFilter === 'ALL' || acc.category === activeCategoryFilter;
    const matchesSearch = acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.code.includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-[#135d25] text-white p-8 rounded-2xl shadow-lg relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="absolute -top-12 -right-12 text-[#0e441b] opacity-25">
          <BookOpen className="w-48 h-48" />
        </div>
        <div className="relative z-10 space-y-2">
          <h1 className="text-3xl font-black flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-amber-400" /> Chart of Accounts (CoA)
          </h1>
          <p className="text-green-100 text-sm max-w-2xl">
            Manajemen Daftar Akun Perkiraan untuk memetakan pencatatan transaksi keuangan, HPP barang, modal investasi, hingga laporan neraca rugi laba koperasi syariah secara tertib.
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-2">
          {canEditCoa && (
            <>
              <button
                onClick={handleOpenAdd}
                className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-extrabold text-sm px-4 py-2 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-5 h-5" /> TAMBAH AKUN
              </button>
              <button onClick={() => {
                const headers = ['Kode', 'Nama Akun', 'Kategori', 'Saldo Normal', 'Saldo Awal', 'Status', 'Aksi'];
                const sample = ['1103', 'Bank Syariah Indonesia 7216467242', 'ASSET', 'Debit', 0, 'Aktif', ''];
                const ws = XLSX.utils.aoa_to_sheet([headers, sample]);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, 'Template CoA');
                XLSX.writeFile(wb, 'template_coa_ksa_mart.xlsx');
              }} className="ml-2 bg-white border border-gray-200 px-3 py-2 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                <Download className="w-4 h-4" /> Unduh Template
              </button>
              <label className="ml-2 bg-white border border-gray-200 px-3 py-2 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer">
                <Upload className="w-4 h-4" /> Import
                <input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  // If upload password configured, require it
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
                      const idxCode = headers.findIndex(h => ['code', 'kode'].includes(h));
                      const idxName = headers.findIndex(h => ['name', 'nama akun'].includes(h));
                      const idxCategory = headers.findIndex(h => ['category', 'kategori'].includes(h));
                      const idxNormalBalance = headers.findIndex(h => ['saldo normal', 'normal balance'].includes(h));
                      const idxOpeningBalance = headers.findIndex(h => ['saldo awal', 'opening balance', 'saldo awal'].includes(h));
                      const idxStatus = headers.findIndex(h => ['status', 'isactive'].includes(h));
                      if (idxCode === -1 || idxName === -1) { alert('Template salah. Pastikan ada kolom Kode dan Nama Akun.'); setIsImporting(false); e.target.value = ''; return; }
                      let imported = 0;
                      for (let i = 1; i < rows.length; i++) {
                        const row = rows[i]; if (!row || row.length === 0) { setImportProgress(p => ({ ...p, done: p.done + 1 })); continue; }
                        const codeVal = String(row[idxCode] || '').trim();
                        const nameVal = String(row[idxName] || '').trim();
                        if (!codeVal || !nameVal) { setImportProgress(p => ({ ...p, done: p.done + 1 })); continue; }
                        const catVal = idxCategory !== -1 ? String(row[idxCategory] || 'ASSET').trim().toUpperCase() : 'ASSET';
                        let statusVal = true;
                        if (idxStatus !== -1) {
                          const raw = String(row[idxStatus] || '').trim().toLowerCase();
                          statusVal = ['aktif', 'active', 'true', '1', 'ya', 'yes'].includes(raw);
                        }
                        addCoaAccount({ code: codeVal, name: nameVal, category: catVal as any, tenantId: currentUser?.tenantId || 'tenant_default', isActive: statusVal });
                        imported++;
                        setImportProgress(p => ({ ...p, done: p.done + 1 }));
                      }
                      alert(`Berhasil mengimpor ${imported} akun CoA.`);
                    } catch (err: any) { console.error(err); alert('Gagal mengimpor file: ' + (err.message || err)); }
                    setIsImporting(false);
                    e.target.value = '';
                  };
                  reader.readAsArrayBuffer(file);
                }} style={{ display: 'none' }} />
              </label>
            </>
          )}
        </div>
      </div>

      {isImporting && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
          Mengimpor data CoA... Progres: {importProgress.done}/{importProgress.total}
        </div>
      )}

      {/* Filters & Search Control */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari kode atau nama akun..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setActiveCategoryFilter(cat.value)}
              className={`px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap border transition-all cursor-pointer ${activeCategoryFilter === cat.value
                  ? 'bg-green-700 border-green-700 text-white shadow-xs'
                  : 'bg-slate-50 border-gray-200 text-slate-600 hover:bg-slate-100'
                }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* CoA Table Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs font-medium text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-extrabold text-[10px]">
              <tr>
                <th className="px-6 py-4">Kode</th>
                <th className="px-6 py-4">Nama Akun</th>
                <th className="px-6 py-4">Kategori</th>
                <th className="px-6 py-4">Status</th>
                {canEditCoa && <th className="px-6 py-4 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
              {filteredCoa.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400 italic">
                    Belum ada akun perkiraan terdaftar atau tidak cocok dengan filter pencarian Anda.
                  </td>
                </tr>
              ) : (
                filteredCoa.map((acc) => (
                  <tr key={acc.id} className={acc.isActive ? 'hover:bg-slate-50' : 'bg-slate-50/50 opacity-60'}>
                    <td className="px-6 py-4 font-mono text-sm text-slate-900 font-bold">{acc.code}</td>
                    <td className="px-6 py-4 text-sm text-slate-900">{acc.name}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${getCategoryColor(acc.category)}`}>
                        {acc.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {acc.isActive ? (
                        <span className="text-green-700 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Aktif</span>
                      ) : (
                        <span className="text-slate-400 flex items-center gap-1"><AlertCircle className="w-4 h-4" /> Nonaktif</span>
                      )}
                    </td>
                    {canEditCoa && (
                      <td className="px-6 py-4 text-right space-x-1">
                        <button
                          onClick={() => handleOpenEdit(acc)}
                          className="p-1.5 hover:bg-slate-100 rounded text-slate-600 hover:text-green-700 transition cursor-pointer"
                          title="Edit Akun"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Apakah Anda yakin ingin HAPUS PERMANEN akun ${acc.code} - ${acc.name}? Aksi ini tidak dapat dikembalikan.`)) {
                              deleteCoaAccount(acc.id);
                            }
                          }}
                          className="p-1.5 hover:bg-slate-100 rounded text-slate-600 hover:text-rose-600 transition cursor-pointer"
                          title="Hapus Permanen Akun"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-[#135d25] text-white px-6 py-4 flex justify-between items-center">
              <h3 className="font-extrabold text-sm uppercase tracking-wider">{editingAccount ? 'Ubah Akun CoA' : 'Tambah Akun CoA Baru'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-green-100 hover:text-white font-bold text-lg animate-pulse">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span className="font-bold">{errorMsg}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Kode Akun Perkiraan</label>
                <input
                  type="text"
                  placeholder="Contoh: 1-1005"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Nama Akun Perkiraan</label>
                <input
                  type="text"
                  placeholder="Contoh: Kas Kecil POS"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Kategori Laporan Keuangan</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none font-semibold text-slate-700"
                >
                  <option value="ASSET">ASET (Assets)</option>
                  <option value="LIABILITY">KEWAJIBAN (Liabilities)</option>
                  <option value="EQUITY">EKUITAS (Equity)</option>
                  <option value="REVENUE">PENDAPATAN (Revenues)</option>
                  <option value="EXPENSE">BEBAN (Expenses)</option>
                </select>
              </div>

              {editingAccount && (
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="coa-active"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label htmlFor="coa-active" className="text-xs font-bold text-slate-700 cursor-pointer">Akun ini berstatus Aktif</label>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-lg text-slate-600 text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  BATAL
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-green-700 hover:bg-green-800 text-white text-xs font-extrabold rounded-lg shadow-sm transition cursor-pointer"
                >
                  SIMPAN AKUN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
