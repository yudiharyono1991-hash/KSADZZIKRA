import React, { useState, useMemo } from 'react';
import { useBranchData } from '../hooks/useBranchData';
import { useAppStore } from '../store';
import { BookOpen, Plus, Search, Scale, Edit, Trash2, Save, X, Calendar, ArrowRight, PenLine } from 'lucide-react';
import { JournalSourceType, JournalEntry } from '../types';

export default function JurnalUmumPage() {
  const { journalEntries, addJournalEntry, deleteJournalEntryByRef, currentUser, coaList } = useBranchData();
  const [isAdding, setIsAdding] = useState(false);
  
  // Form State
  const [editingRefId, setEditingRefId] = useState<string | null>(null);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [debitAccount, setDebitAccount] = useState(() => {
    const activeAccounts = useAppStore.getState().coaList.filter(c => c.isActive);
    return activeAccounts[0]?.code || '1-1000';
  });
  const [creditAccount, setCreditAccount] = useState(() => {
    const activeAccounts = useAppStore.getState().coaList.filter(c => c.isActive);
    return activeAccounts.length > 1 ? activeAccounts[1].code : '1-1000';
  });
  const [amount, setAmount] = useState(0);

  const resetForm = () => {
    setIsAdding(false);
    setEditingRefId(null);
    setDescription('');
    setAmount(0);
    setDate(new Date().toISOString().split('T')[0]);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAdding(true);
  };

  const handleEdit = (refId: string) => {
    const entries = journalEntries.filter(j => j.referenceId === refId);
    if (entries.length === 2) {
      const debitEntry = entries.find(e => e.debit > 0);
      const creditEntry = entries.find(e => e.credit > 0);
      
      if (debitEntry && creditEntry) {
        setEditingRefId(refId);
        setDate(new Date(debitEntry.date).toISOString().split('T')[0]);
        setDescription(debitEntry.description);
        setDebitAccount(debitEntry.account);
        setCreditAccount(creditEntry.account);
        setAmount(debitEntry.debit);
        setIsAdding(true);
      }
    } else {
      alert("Hanya jurnal manual standar (1 Debit, 1 Kredit) yang dapat diedit.");
    }
  };

  const handleDelete = (refId: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus transaksi jurnal ini?")) {
      deleteJournalEntryByRef(refId);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || amount <= 0) return;
    if (debitAccount === creditAccount) {
      alert("Akun Debit dan Akun Kredit (Jurnal Lawan) tidak boleh sama!");
      return;
    }

    const tenantId = currentUser?.tenantId || 'tenant_default';
    const refId = editingRefId || `MANUAL_${Date.now()}`;
    // Preserve current time if today, else use midnight
    const now = new Date();
    const isToday = date === now.toISOString().split('T')[0];
    const isoDate = isToday ? now.toISOString() : new Date(`${date}T12:00:00Z`).toISOString();

    if (editingRefId) {
      deleteJournalEntryByRef(editingRefId);
    }

    // Insert Debit Leg
    addJournalEntry({
      tenantId,
      date: isoDate,
      account: debitAccount,
      description,
      debit: amount,
      credit: 0,
      referenceId: refId,
      referenceType: 'MANUAL',
      createdBy: currentUser?.name
    });

    // Insert Credit Leg
    addJournalEntry({
      tenantId,
      date: isoDate,
      account: creditAccount,
      description,
      debit: 0,
      credit: amount,
      referenceId: refId,
      referenceType: 'MANUAL',
      createdBy: currentUser?.name
    });

    resetForm();
  };

  const totalDebit = journalEntries.reduce((sum, e) => sum + e.debit, 0);
  const totalCredit = journalEntries.reduce((sum, e) => sum + e.credit, 0);

  // Group Journals for view
  const groupedJournals = useMemo(() => {
    const groups: Record<string, {
      refId: string;
      date: string;
      description: string;
      type: string;
      entries: JournalEntry[];
    }> = {};

    journalEntries.forEach(entry => {
      const ref = entry.referenceId || `UNCATEGORIZED_${entry.id}`;
      if (!groups[ref]) {
        groups[ref] = {
          refId: ref,
          date: entry.date,
          description: entry.description,
          type: entry.referenceType || 'UNKNOWN',
          entries: []
        };
      }
      groups[ref].entries.push(entry);
    });

    return Object.values(groups).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [journalEntries]);

  const getAccountName = (code: string) => {
    if (!code || !code.trim()) return "Tidak Diketahui / Kosong";
    const coa = coaList.find(c => c.code === code);
    return coa ? `${coa.code} - ${coa.name}` : code;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-green-100 text-green-800 rounded-xl">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Jurnal Umum</h1>
            <p className="text-xs font-semibold text-slate-500 mt-1">Pencatatan akuntansi standar syariah. Otomatis & Manual.</p>
          </div>
        </div>
        
        <button 
          onClick={isAdding ? resetForm : handleOpenAdd}
          className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-xl text-sm font-bold shadow-md transition-all active:scale-95 ${
            isAdding ? 'bg-slate-200 hover:bg-slate-300 text-slate-700' : 'bg-green-600 hover:bg-green-700 text-white shadow-green-900/20'
          }`}
        >
          {isAdding ? <><Search className="w-4 h-4"/> <span>Lihat Daftar Jurnal</span></> : <><Plus className="w-4 h-4"/> <span>Buat Jurnal Manual</span></>}
        </button>
      </div>

      {isAdding ? (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-slate-50 p-6 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <PenLine className="w-5 h-5 text-green-600" />
              {editingRefId ? 'Edit Jurnal Manual' : 'Input Jurnal Manual (Double-Entry)'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Setiap pencatatan akan otomatis menjurnal Akun Debit dan Akun Lawan (Kredit) dengan nominal yang sama (Seimbang).
            </p>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500">Tanggal Transaksi</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="w-full pl-9 border border-slate-200 rounded-lg py-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none font-medium" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500">Keterangan / Deskripsi Transaksi</label>
                <input type="text" required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Misal: Penambahan Modal Kas, Pembayaran Hutang..." className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none font-medium" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center bg-green-50/50 p-4 rounded-xl border border-green-100">
              <div className="md:col-span-2 space-y-1">
                <label className="text-[10px] uppercase font-bold text-green-700">Akun Debit (Tujuan)</label>
                <input 
                  list="coa-list-debit" 
                  value={debitAccount} 
                  onChange={(e) => {
                    setDebitAccount(e.target.value);
                    const selected = coaList.find(c => c.code === e.target.value);
                    if (selected && !description) {
                      setDescription(`Jurnal Manual: ${selected.name}`);
                    }
                  }} 
                  className="w-full border border-green-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none font-bold text-slate-800 bg-white"
                  placeholder="Ketik Kode atau Nama Akun..."
                />
                <datalist id="coa-list-debit">
                  {coaList.filter(c => c.isActive).map(c => (
                    <option key={c.id} value={c.code}>{c.code} - {c.name}</option>
                  ))}
                </datalist>
              </div>

              <div className="hidden md:flex justify-center">
                <div className="bg-white p-2 rounded-full shadow-sm border border-slate-100">
                  <ArrowRight className="w-5 h-5 text-slate-400" />
                </div>
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="text-[10px] uppercase font-bold text-orange-700">Akun Kredit / Jurnal Lawan (Sumber)</label>
                <input 
                  list="coa-list-credit" 
                  value={creditAccount} 
                  onChange={(e) => setCreditAccount(e.target.value)} 
                  className="w-full border border-orange-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 outline-none font-bold text-slate-800 bg-white"
                  placeholder="Ketik Kode atau Nama Akun..."
                />
                <datalist id="coa-list-credit">
                  {coaList.filter(c => c.isActive).map(c => (
                    <option key={c.id} value={c.code}>{c.code} - {c.name}</option>
                  ))}
                </datalist>
              </div>
            </div>

            <div className="max-w-md mx-auto space-y-1 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <label className="text-xs uppercase font-bold text-slate-600 text-center block mb-2">Nominal (Total Debit = Total Kredit)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 font-bold text-slate-500">Rp</span>
                <input type="number" min="1" required value={amount || ''} onChange={(e) => setAmount(Number(e.target.value))} className="w-full pl-10 pr-4 py-3 border-2 border-slate-300 rounded-xl text-lg font-bold font-mono focus:ring-4 focus:ring-green-500/20 focus:border-green-500 outline-none" placeholder="0" />
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
              <button type="button" onClick={resetForm} className="px-6 py-2.5 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                Batal
              </button>
              <button type="submit" className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-md transition-colors">
                <Save className="w-5 h-5" />
                {editingRefId ? 'Simpan Perubahan' : 'Simpan Jurnal'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total Debit Seluruhnya</p>
                <p className="text-xl font-mono font-bold text-green-700">Rp {totalDebit.toLocaleString('id-ID')}</p>
              </div>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total Kredit Seluruhnya</p>
                <p className="text-xl font-mono font-bold text-green-700">Rp {totalCredit.toLocaleString('id-ID')}</p>
              </div>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Status Keseimbangan (Neraca)</p>
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
                    <th className="p-4 w-40">Tanggal & Ref</th>
                    <th className="p-4">Keterangan / Transaksi</th>
                    <th className="p-4">Akun (CoA)</th>
                    <th className="p-4">Jurnal Lawan</th>
                    <th className="p-4 text-right">Debit (Rp)</th>
                    <th className="p-4 text-right">Kredit (Rp)</th>
                    <th className="p-4 text-center w-24">Aksi</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-slate-100">
                  {groupedJournals.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-slate-500 font-medium">
                        <BookOpen className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                        Belum ada catatan jurnal sama sekali.
                      </td>
                    </tr>
                  ) : (
                    groupedJournals.map((group) => {
                      const isManual = group.type === 'MANUAL';
                      return (
                        <React.Fragment key={group.refId}>
                          {/* Group Header Row (Optional visual grouping) */}
                          <tr className="bg-slate-50/50">
                            <td className="p-3 text-xs text-slate-500 align-top" rowSpan={group.entries.length}>
                              <div className="font-bold text-slate-700">{new Date(group.date).toLocaleDateString('id-ID')}</div>
                              <div className="font-mono text-[10px] mt-1 break-all">{group.refId}</div>
                              {isManual && <span className="inline-block mt-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-[9px] font-bold rounded">MANUAL</span>}
                            </td>
                            <td className="p-3 text-slate-700 font-medium align-top" rowSpan={group.entries.length}>
                              {group.description}
                            </td>
                            {/* Render First Entry */}
                            <td className="p-3 font-medium text-slate-800 text-xs">{getAccountName(group.entries[0].account)}</td>
                            <td className="p-3 font-medium text-slate-600 text-xs italic">
                              {group.entries.length > 1 
                                ? getAccountName(group.entries.find(e => e.id !== group.entries[0].id)?.account || '') 
                                : '-'}
                            </td>
                            <td className="p-3 text-right font-mono text-slate-600">{group.entries[0].debit > 0 ? group.entries[0].debit.toLocaleString('id-ID') : '-'}</td>
                            <td className="p-3 text-right font-mono text-slate-600">{group.entries[0].credit > 0 ? group.entries[0].credit.toLocaleString('id-ID') : '-'}</td>
                            <td className="p-3 text-center align-top" rowSpan={group.entries.length}>
                              {isManual && (
                                <div className="flex items-center justify-center gap-2">
                                  <button onClick={() => handleEdit(group.refId)} className="p-1.5 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors" title="Edit">
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => handleDelete(group.refId)} className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors" title="Hapus">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                          {/* Render Remaining Entries */}
                          {group.entries.slice(1).map((entry, idx) => (
                            <tr key={entry.id} className="bg-slate-50/50">
                              <td className="p-3 font-medium text-slate-800 text-xs border-l-2 border-slate-100">{getAccountName(entry.account)}</td>
                              <td className="p-3 font-medium text-slate-600 text-xs italic">
                                {group.entries.length > 1 
                                  ? getAccountName(group.entries.find(e => e.id !== entry.id)?.account || '') 
                                  : '-'}
                              </td>
                              <td className="p-3 text-right font-mono text-slate-600">{entry.debit > 0 ? entry.debit.toLocaleString('id-ID') : '-'}</td>
                              <td className="p-3 text-right font-mono text-slate-600">{entry.credit > 0 ? entry.credit.toLocaleString('id-ID') : '-'}</td>
                            </tr>
                          ))}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
