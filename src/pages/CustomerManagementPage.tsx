import React, { useState } from 'react';
import { useBranchData } from '../hooks/useBranchData';
import { Users, Plus, Search, Trash2, Edit, CreditCard, Download, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function CustomerManagementPage() {
  const { customers, addCustomer, updateCustomer, deleteCustomer, currentUser, addJournalEntry, settings } = useBranchData();
  const [isAdding, setIsAdding] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ done: 0, total: 0 });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [customId, setCustomId] = useState('');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [totalPointsEarned, setTotalPointsEarned] = useState(0);
  const [totalPointsRedeemed, setTotalPointsRedeemed] = useState(0);
  const [points, setPoints] = useState(0);
  const [lastPointsUpdate, setLastPointsUpdate] = useState(new Date().toISOString().split('T')[0]);
  const [debtAmount, setDebtAmount] = useState(0);

  const [searchTerm, setSearchTerm] = useState('');

  if (!['ADMIN', 'OWNER', 'SUPERADMIN', 'MANAGER', 'PENGURUS'].includes(currentUser?.role || '')) {
    return <div className="p-6 text-red-500">Akses Ditolak. Khusus Admin/Owner.</div>;
  }

  const filtered = customers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const totalPointsEarnedSum = filtered.reduce((sum, c) => sum + (c.totalPointsEarned || c.points), 0);
  const totalPointsRedeemedSum = filtered.reduce((sum, c) => sum + (c.totalPointsRedeemed || 0), 0);
  const totalRemainingPointsSum = filtered.reduce((sum, c) => sum + (c.points || 0), 0);
  const totalValueSum = filtered.reduce((sum, c) => sum + ((c.points || 0) * (settings?.pointRedemptionValue || 10)), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateCustomer(editingId, { id: customId || editingId, name, phone, points, totalPointsEarned, totalPointsRedeemed, lastPointsUpdate, debtAmount });
      if (customId && customId !== editingId) setEditingId(customId);
    } else {
      addCustomer({ id: customId || undefined, tenantId: currentUser?.tenantId || 'tenant_default', name, phone, points, totalPointsEarned, totalPointsRedeemed, lastPointsUpdate, debtAmount, branchId: currentUser?.branchId });
    }
    resetForm();
  };

  const resetForm = () => {
    setCustomId('');
    setName('');
    setPhone('');
    setTotalPointsEarned(0);
    setTotalPointsRedeemed(0);
    setPoints(0);
    setLastPointsUpdate(new Date().toISOString().split('T')[0]);
    setDebtAmount(0);
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEdit = (c: any) => {
    setCustomId(c.id);
    setName(c.name);
    setPhone(c.phone);
    setTotalPointsEarned(c.totalPointsEarned || c.points || 0);
    setTotalPointsRedeemed(c.totalPointsRedeemed || 0);
    setPoints(c.points || 0);
    setLastPointsUpdate(c.lastPointsUpdate || (c.createdAt ? c.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]));
    setDebtAmount(c.debtAmount || 0);
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

    // Add auto journal for debt payment
    const now = new Date().toISOString();
    addJournalEntry({
      tenantId: currentUser?.tenantId || 'tenant_default',
      date: now,
      account: 'KAS',
      description: `[Auto] Pelunasan piutang (kasbon) dari pelanggan: ${c.name}`,
      debit: amount,
      credit: 0,
      referenceId: c.id,
      referenceType: 'MANUAL',
      createdBy: currentUser?.name,
      branchId: currentUser?.branchId
    });
    addJournalEntry({
      tenantId: currentUser?.tenantId || 'tenant_default',
      date: now,
      account: 'PIUTANG_DAGANG',
      description: `[Auto] Pengurangan piutang pelanggan: ${c.name}`,
      debit: 0,
      credit: amount,
      referenceId: c.id,
      referenceType: 'MANUAL',
      createdBy: currentUser?.name,
      branchId: currentUser?.branchId
    });

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
        <div className="flex items-center gap-2">
          <button
            onClick={() => { resetForm(); setIsAdding(!isAdding); }}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md transition-all"
          >
            {isAdding ? 'Batal' : <><Plus className="w-4 h-4" /> Pelanggan Baru</>}
          </button>
          <button onClick={() => {
            const headers = ['id', 'phone', 'name', 'Total Point', 'point terpakai', 'Sisa Point', 'tanggal update', 'Nilai (Rp)', 'Aksi'];
            const sample = ['1', '', 'Aan Andriani', 2732, 0, 2732, '2026-06-01', 13660, ''];
            const ws = XLSX.utils.aoa_to_sheet([headers, sample]);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Template Master Pelanggan');
            XLSX.writeFile(wb, 'template_master_pelanggan_ksa_mart.xlsx');
          }} className="ml-2 bg-white border border-gray-200 px-3 py-2 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2">
            <Download className="w-4 h-4" /> Unduh Template
          </button>
          <label className="ml-2 bg-white border border-gray-200 px-3 py-2 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4" /> Import
            <input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => {
              const file = e.target.files?.[0]; if (!file) return;
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
                  const idxName = headers.findIndex(h => ['name', 'nama pelanggan', 'nama akun', 'customer name'].includes(h));
                  const idxPhone = headers.findIndex(h => ['phone', 'no whatsapp', 'whatsapp', 'no hp'].includes(h));
                  const idxTotalPoint = headers.findIndex(h => ['total point', 'total poin', 'total points'].includes(h));
                  const idxUsedPoint = headers.findIndex(h => ['point terpakai', 'poin terpakai'].includes(h));
                  const idxRemainingPoint = headers.findIndex(h => ['sisa point', 'sisa poin', 'remaining points'].includes(h));
                  const idxDebt = headers.findIndex(h => ['debtamount', 'piutang (rp)', 'kasbon', 'piutang', 'debt'].includes(h));
                  const idxBranch = headers.findIndex(h => ['branchid', 'cabang'].includes(h));
                  if (idxName === -1) { alert('Template salah. Pastikan ada kolom name / Nama Pelanggan.'); setIsImporting(false); e.target.value = ''; return; }
                  let imported = 0;
                  for (let i = 1; i < rows.length; i++) {
                    const row = rows[i]; if (!row || row.length === 0) { setImportProgress(p => ({ ...p, done: p.done + 1 })); continue; }
                    const nameVal = String(row[idxName] || '').trim(); if (!nameVal) { setImportProgress(p => ({ ...p, done: p.done + 1 })); continue; }
                    const phoneVal = idxPhone !== -1 ? String(row[idxPhone] || '').trim() : '';

                    const totalPt = idxTotalPoint !== -1 ? Number(row[idxTotalPoint]) || 0 : 0;
                    const usedPt = idxUsedPoint !== -1 ? Number(row[idxUsedPoint]) || 0 : 0;
                    const remainingPt = idxRemainingPoint !== -1 ? Number(row[idxRemainingPoint]) || 0 : 0;

                    const pointsVal = remainingPt > 0 ? remainingPt : Math.max(0, totalPt - usedPt);
                    const debtVal = idxDebt !== -1 ? Number(row[idxDebt]) || 0 : 0;
                    const branchVal = idxBranch !== -1 ? String(row[idxBranch] || '').trim() : currentUser?.branchId;
                    addCustomer({
                      tenantId: currentUser?.tenantId || 'tenant_default',
                      name: nameVal,
                      phone: phoneVal,
                      points: pointsVal,
                      debtAmount: debtVal,
                      branchId: branchVal || currentUser?.branchId
                    });
                    imported++;
                    setImportProgress(p => ({ ...p, done: p.done + 1 }));
                  }
                  alert(`Berhasil mengimpor ${imported} pelanggan.`);
                } catch (err: any) { console.error(err); alert('Gagal mengimpor file: ' + (err.message || err)); }
                setIsImporting(false);
                e.target.value = '';
              };
              reader.readAsArrayBuffer(file);
            }} style={{ display: 'none' }} />
          </label>
        </div>
      </div>
      {isImporting && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
          Mengimpor data pelanggan... Progres: {importProgress.done}/{importProgress.total}
        </div>
      )}

      {isAdding && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
          <h2 className="text-lg font-bold mb-4">{editingId ? 'Edit Pelanggan' : 'Tambah Pelanggan Baru'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">id</label>
              <input type="text" value={customId} onChange={e => setCustomId(e.target.value)} placeholder="(Otomatis)" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">phone</label>
              <input type="text" required value={phone} onChange={e => setPhone(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">name</label>
              <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Total Point</label>
                <input type="number" min={0} value={totalPointsEarned} onChange={e => {
                  const val = Number(e.target.value) || 0;
                  setTotalPointsEarned(val);
                  setPoints(Math.max(0, val - totalPointsRedeemed));
                }} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">point terpakai</label>
                <input type="number" min={0} value={totalPointsRedeemed} onChange={e => {
                  const val = Number(e.target.value) || 0;
                  setTotalPointsRedeemed(val);
                  setPoints(Math.max(0, totalPointsEarned - val));
                }} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Sisa Point</label>
                <input type="number" min={0} value={points} onChange={e => setPoints(Number(e.target.value) || 0)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold text-center" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">tanggal update</label>
                <input type="date" required value={lastPointsUpdate} onChange={e => setLastPointsUpdate(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-center" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Nilai (Rp)</label>
                <input type="number" min={0} value={points * (settings?.pointRedemptionValue || 10)} onChange={e => setPoints(Math.floor((Number(e.target.value) || 0) / (settings?.pointRedemptionValue || 10)))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-right font-bold text-green-700" />
              </div>
            </div>
            <button type="submit" className="w-full bg-green-600 text-white font-bold py-2 rounded-lg mt-2">Simpan Data</button>
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
            <thead className="bg-gray-50/50 text-gray-500 font-medium whitespace-nowrap">
              <tr>
                <th className="px-4 py-4 align-middle">No</th>
                <th className="px-4 py-4 align-middle">id</th>
                <th className="px-4 py-4 align-middle">phone</th>
                <th className="px-4 py-4 align-middle">name</th>
                <th className="px-4 py-4 text-center align-middle">Total Point</th>
                <th className="px-4 py-4 text-center align-middle">point terpakai</th>
                <th className="px-4 py-4 text-center align-middle">Sisa Point</th>
                <th className="px-4 py-4 align-middle">tanggal update</th>
                <th className="px-4 py-4 text-right align-middle">Nilai (Rp)</th>
                <th className="px-4 py-4 text-center align-middle">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 whitespace-nowrap">
              {filtered.map((c, index) => {
                const totalPoint = c.totalPointsEarned || c.points;
                const pointTerpakai = c.totalPointsRedeemed || 0;
                const sisaPoint = c.points;
                const updateDate = c.lastPointsUpdate || c.createdAt.split('T')[0];
                const nilaiRp = sisaPoint * (settings?.pointRedemptionValue || 10);

                return (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 text-gray-600 align-middle">{index + 1}</td>
                    <td className="px-4 py-4 text-gray-500 font-mono text-xs align-middle">{c.id.substring(0, 8)}</td>
                    <td className="px-4 py-4 text-gray-600 align-middle">{c.phone}</td>
                    <td className="px-4 py-4 font-bold text-gray-800 align-middle whitespace-normal min-w-[200px]">{c.name}</td>
                    <td className="px-4 py-4 text-center align-middle">{totalPoint}</td>
                    <td className="px-4 py-4 text-center align-middle">{pointTerpakai}</td>
                    <td className="px-4 py-4 text-center align-middle">
                      <button onClick={() => {
                        const val = prompt(`Ubah poin untuk ${c.name}:`, String(c.points));
                        if (val === null) return;
                        const n = Number(val);
                        if (isNaN(n)) { alert('Masukkan angka valid'); return; }
                        updateCustomer(c.id, { points: n });
                      }} className="px-2 py-1 bg-amber-100 text-amber-800 font-bold rounded-full text-xs hover:opacity-80">
                        {sisaPoint}
                      </button>
                    </td>
                    <td className="px-4 py-4 text-gray-500 text-xs align-middle">{updateDate}</td>
                    <td className="px-4 py-4 text-right font-bold text-green-700 align-middle">Rp {nilaiRp.toLocaleString('id-ID')}</td>
                    <td className="px-4 py-4 text-center space-x-2 align-middle">
                      <button onClick={() => handleEdit(c)} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg" title="Edit">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteCustomer(c.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Hapus">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gray-100 font-bold text-gray-800 border-t border-gray-200 whitespace-nowrap">
              <tr>
                <td colSpan={4} className="px-4 py-4 text-right align-middle">TOTAL</td>
                <td className="px-4 py-4 text-center align-middle">{totalPointsEarnedSum}</td>
                <td className="px-4 py-4 text-center align-middle">{totalPointsRedeemedSum}</td>
                <td className="px-4 py-4 text-center align-middle">{totalRemainingPointsSum}</td>
                <td className="px-4 py-4 align-middle"></td>
                <td className="px-4 py-4 text-right text-green-700 align-middle">Rp {totalValueSum.toLocaleString('id-ID')}</td>
                <td className="px-4 py-4 align-middle"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
