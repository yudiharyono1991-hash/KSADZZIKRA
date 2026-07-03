import React, { useState } from 'react';
import { useAppStore } from '../store';
import { BookOpen, Plus, Search, Scale, Zap, PenLine } from 'lucide-react';
import { JournalSourceType } from '../types';

export default function JurnalUmumPage() {
  const { journalEntries, addJournalEntry, currentUser, coaList } = useAppStore();
  const [isAdding, setIsAdding] = useState(false);
  const [account, setAccount] = useState(() => {
    const activeAccounts = useAppStore.getState().coaList.filter(c => c.isActive);
    return activeAccounts[0]?.code || '1-1000';
  });
  const [description, setDescription] = useState('');
  const [debit, setDebit] = useState(0);
  const [credit, setCredit] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || (debit === 0 && credit === 0)) return;

    addJournalEntry({
      tenantId: currentUser?.tenantId || 'tenant_default',
      date: new Date().toISOString(),
      account,
      description,
      debit,
      credit
    });

    setIsAdding(false);
    setDescription('');
    setDebit(0);
    setCredit(0);
  };

  const totalDebit = journalEntries.reduce((sum, e) => sum + e.debit, 0);
  const totalCredit = journalEntries.reduce((sum, e) => sum + e.credit, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-green-100 text-green-800 rounded-xl">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Jurnal Umum</h1>
            <p className="text-xs font-semibold text-slate-500 mt-1">Pencatatan akuntansi standar syariah.</p>
          </div>
        </div>
        
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md shadow-green-900/20 transition-all active:scale-95"
        >
          {isAdding ? <><Search className="w-4 h-4"/> <span>Lihat Jurnal</span></> : <><Plus className="w-4 h-4"/> <span>Tambah Jurnal</span></>}
        </button>
      </div>

      {isAdding ? (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Input Jurnal Manual</h2>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500">Akun (Perkiraan)</label>
                <select value={account} onChange={(e) => setAccount(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none font-bold text-slate-800">
                  {coaList.filter(c => c.isActive).map(c => (
                    <option key={c.id} value={c.code}>{c.code} - {c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500">Keterangan / Deskripsi</label>
                <input type="text" required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Misal: Penjualan tunai" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500">Debit (Rp)</label>
                <input type="number" min="0" value={debit} onChange={(e) => setDebit(Number(e.target.value))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500">Kredit (Rp)</label>
                <input type="number" min="0" value={credit} onChange={(e) => setCredit(Number(e.target.value))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none" />
              </div>
            </div>
            <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-colors">Simpan Jurnal</button>
          </form>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total Debit</p>
                <p className="text-xl font-mono font-bold text-green-700">Rp {totalDebit.toLocaleString('id-ID')}</p>
              </div>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total Kredit</p>
                <p className="text-xl font-mono font-bold text-green-700">Rp {totalCredit.toLocaleString('id-ID')}</p>
              </div>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Status Keseimbangan</p>
                {totalDebit === totalCredit ? (
                  <p className="text-sm font-bold text-green-600 flex items-center gap-1"><Scale className="w-4 h-4"/> SEIMBANG (BALANCE)</p>
                ) : (
                  <p className="text-sm font-bold text-red-600 flex items-center gap-1"><Scale className="w-4 h-4"/> TIDAK SEIMBANG</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px] uppercase tracking-wider font-bold">
                    <th className="p-4">Tanggal</th>
                    <th className="p-4">Akun</th>
                    <th className="p-4">Keterangan</th>
                    <th className="p-4 text-right">Debit (Rp)</th>
                    <th className="p-4 text-right">Kredit (Rp)</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {journalEntries.map((entry) => (
                    <tr key={entry.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="p-4 text-xs text-slate-500">{new Date(entry.date).toLocaleString('id-ID')}</td>
                      <td className="p-4 font-bold text-slate-700">{entry.account}</td>
                      <td className="p-4 text-slate-600">{entry.description}</td>
                      <td className="p-4 text-right font-mono text-green-700">{entry.debit > 0 ? entry.debit.toLocaleString('id-ID') : '-'}</td>
                      <td className="p-4 text-right font-mono text-green-700">{entry.credit > 0 ? entry.credit.toLocaleString('id-ID') : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {journalEntries.length === 0 && (
                <div className="p-8 text-center text-slate-500 text-sm">
                  Belum ada catatan jurnal.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
