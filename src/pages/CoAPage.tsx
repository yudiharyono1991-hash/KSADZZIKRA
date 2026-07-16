import React, { useState } from 'react';
import { useAppStore } from '../store';
import { CoaAccount } from '../types';
import { BookOpen, Plus, Edit, Trash2, CheckCircle, Search, Filter, AlertCircle, Download, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function CoAPage() {
  const { coaList, addCoaAccount, addCoaAccountsBulk, updateCoaAccount, deleteCoaAccount, clearCoaList, currentUser, settings } = useAppStore();

  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ done: 0, total: 0 });

  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<CoaAccount | null>(null);

  // Form states
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE'>('ASSET');
  const [isActive, setIsActive] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

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
      default: return 'bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-slate-200 border-gray-100 dark:border-slate-800';
    }
  };

  // Filtered accounts
  const filteredCoa = coaList.filter(acc => {
    const matchesCategory = activeCategoryFilter === 'ALL' || acc.category === activeCategoryFilter;
    const matchesSearch = acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.code.includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  const totalPages = Math.ceil(filteredCoa.length / itemsPerPage);
  const paginatedCoa = filteredCoa.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
                const headers = ['Kode', 'Nama Akun', 'Kategori', 'Saldo Normal', 'Status'];
                const data = coaList.map(c => [c.code, c.name, c.category, c.category === 'ASSET' || c.category === 'EXPENSE' ? 'Debit' : 'Kredit', c.isActive ? 'Aktif' : 'Non-Aktif']);
                const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, 'Data CoA');
                XLSX.writeFile(wb, 'Laporan_CoA_KSA_Mart.xlsx');
              }} className="ml-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 px-3 py-2 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-800 flex items-center gap-2">
                <Download className="w-4 h-4" /> Unduh Data CoA
              </button>
              <button onClick={() => {
                const headers = ['Kode', 'Nama Akun', 'Kategori', 'Saldo Normal', 'Saldo Awal', 'Status', 'Aksi'];
                const sample = ['1101', 'Kas', 'Aset', 'Debit', 0, 'Aktif', ''];
                const ws = XLSX.utils.aoa_to_sheet([headers, sample]);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, 'Template CoA');
                XLSX.writeFile(wb, 'template_coa_ksa_mart.xlsx');
              }} className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 flex items-center gap-2">
                Template Import
              </button>
              <label className="ml-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 px-3 py-2 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-800 flex items-center gap-2 cursor-pointer">
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
                      const coasToImport: any[] = [];
                      for (let i = 1; i < rows.length; i++) {
                        const row = rows[i]; if (!row || row.length === 0) { continue; }
                        const codeVal = String(row[idxCode] || '').trim();
                        const nameVal = String(row[idxName] || '').trim();
                        if (!codeVal || !nameVal) { continue; }
                        
                        let rawCat = idxCategory !== -1 ? String(row[idxCategory] || '').trim().toUpperCase() : '';
                        let catVal = 'ASSET';
                        if (['ASET', 'ASSET'].includes(rawCat)) catVal = 'ASSET';
                        else if (['LIABILITAS', 'LIABILITY', 'KEWAJIBAN'].includes(rawCat)) catVal = 'LIABILITY';
                        else if (['EKUITAS', 'EQUITY', 'MODAL'].includes(rawCat)) catVal = 'EQUITY';
                        else if (['PENDAPATAN', 'REVENUE'].includes(rawCat)) catVal = 'REVENUE';
                        else if (['BEBAN', 'EXPENSE', 'BIAYA'].includes(rawCat)) catVal = 'EXPENSE';
                        
                        let statusVal = true;
                        if (idxStatus !== -1) {
                          const raw = String(row[idxStatus] || '').trim().toLowerCase();
                          statusVal = ['aktif', 'active', 'true', '1', 'ya', 'yes'].includes(raw);
                        }
                        coasToImport.push({ code: codeVal, name: nameVal, category: catVal as any, tenantId: currentUser?.tenantId || 'tenant_default', isActive: statusVal });
                      }
                      if (coasToImport.length > 0) {
                        addCoaAccountsBulk(coasToImport);
                        alert(`Berhasil mengimpor ${coasToImport.length} akun CoA.`);
                      } else {
                        alert('Tidak ada CoA valid yang ditemukan untuk diimpor.');
                      }
                    } catch (err: any) { console.error(err); alert('Gagal mengimpor file: ' + (err.message || err)); }
                    setIsImporting(false);
                    e.target.value = '';
                  };
                  reader.readAsArrayBuffer(file);
                }} style={{ display: 'none' }} />
              </label>
              <button onClick={() => setIsDeleteAllOpen(true)} className="ml-2 bg-red-50 border border-red-200 px-3 py-2 rounded-lg text-sm font-bold text-red-600 hover:bg-red-100 flex items-center gap-2">
                <Trash2 className="w-4 h-4" /> Hapus Semua
              </button>
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
      <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari kode atau nama akun..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => {
                setActiveCategoryFilter(cat.value);
                setCurrentPage(1);
              }}
              className={`px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap border transition-all cursor-pointer ${activeCategoryFilter === cat.value
                  ? 'bg-green-700 border-green-700 text-white shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-800'
                }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* CoA Table Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs font-medium text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-extrabold text-[10px]">
              <tr>
                <th className="px-6 py-4">Kode</th>
                <th className="px-6 py-4">Nama Akun</th>
                <th className="px-6 py-4">Kategori</th>
                <th className="px-6 py-4">Status</th>
                {canEditCoa && <th className="px-6 py-4 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-800 dark:text-slate-200">
              {filteredCoa.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400 italic">
                    Belum ada akun perkiraan terdaftar atau tidak cocok dengan filter pencarian Anda.
                  </td>
                </tr>
              ) : (
                paginatedCoa.map((acc) => (
                  <tr key={acc.id} className={acc.isActive ? 'hover:bg-slate-50 dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-800/50 opacity-60'}>
                    <td className="px-6 py-4 font-mono text-sm text-slate-900 dark:text-white font-bold">{acc.code}</td>
                    <td className="px-6 py-4 text-sm text-slate-900 dark:text-white">{acc.name}</td>
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
                          className="p-1.5 hover:bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-400 hover:text-green-700 transition cursor-pointer"
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
                          className="p-1.5 hover:bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-400 hover:text-rose-600 transition cursor-pointer"
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

        {/* Pagination UI */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="px-3 py-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded text-sm disabled:opacity-50"
            >
              Sebelumnya
            </button>
            <span className="text-sm font-semibold text-gray-600 dark:text-slate-400">Halaman {currentPage} dari {totalPages}</span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="px-3 py-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded text-sm disabled:opacity-50"
            >
              Selanjutnya
            </button>
          </div>
        )}
      </div>

      {/* Add / Edit Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
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
                <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">Kode Akun Perkiraan</label>
                <input
                  type="text"
                  placeholder="Contoh: 1-1005"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">Nama Akun Perkiraan</label>
                <input
                  type="text"
                  placeholder="Contoh: Kas Kecil POS"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">Kategori Laporan Keuangan</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none font-semibold text-slate-700 dark:text-slate-300"
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
                    className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 dark:border-slate-600 rounded"
                  />
                  <label htmlFor="coa-active" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">Akun ini berstatus Aktif</label>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 text-xs font-bold hover:bg-slate-50 dark:bg-slate-800 cursor-pointer"
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

      {/* Modal Delete All */}
      {isDeleteAllOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2">
              <Trash2 className="w-6 h-6 text-red-500" /> Konfirmasi Hapus Semua Data
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 bg-red-50 p-3 rounded-xl border border-red-100 font-medium text-red-800">
              PERINGATAN: Anda akan menghapus seluruh data Chart of Accounts. Data yang dihapus tidak dapat dikembalikan.
            </p>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1 block">Masukkan Password Anda</label>
                <input 
                  type="password" 
                  value={deletePassword}
                  onChange={e => { setDeletePassword(e.target.value); setDeleteError(''); }}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Password untuk konfirmasi"
                  autoFocus
                />
                {deleteError && <p className="text-xs text-red-500 mt-1 font-bold">{deleteError}</p>}
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => { setIsDeleteAllOpen(false); setDeletePassword(''); setDeleteError(''); }} className="px-4 py-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-800 rounded-xl font-bold transition-colors">Batal</button>
              <button onClick={() => {
                if (!deletePassword) { setDeleteError('Password tidak boleh kosong'); return; }
                if (deletePassword !== currentUser?.password && currentUser?.password) {
                  setDeleteError('Password salah. Silakan coba lagi.');
                  return;
                }
                clearCoaList();
                setIsDeleteAllOpen(false);
                setDeletePassword('');
                alert('Seluruh data CoA berhasil dibersihkan!');
              }} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors shadow-md shadow-red-200 flex items-center gap-2">
                Ya, Bersihkan Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
