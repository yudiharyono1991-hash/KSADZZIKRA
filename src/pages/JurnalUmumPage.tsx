import React, { useState, useMemo, useRef } from 'react';
import { useBranchData } from '../hooks/useBranchData';
import { useAppStore } from '../store';
import { BookOpen, Plus, Search, Scale, Edit, Trash2, Save, X, Calendar, ArrowRight, PenLine, ChevronDown, Download, Printer } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useReactToPrint } from 'react-to-print';
import { JournalSourceType, JournalEntry } from '../types';
import PrintHeader from '../components/Print/PrintHeader';
import PrintFooter from '../components/Print/PrintFooter';

export default function JurnalUmumPage() {
  const { journalEntries, addJournalEntry, deleteJournalEntryByRef, currentUser, coaList } = useBranchData();
  const reportRef = useRef<HTMLDivElement>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isDebitDropdownOpen, setIsDebitDropdownOpen] = useState(false);
  const [isCreditDropdownOpen, setIsCreditDropdownOpen] = useState(false);
  
  // Form State
  const [editingRefId, setEditingRefId] = useState<string | null>(null);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [debitAccount, setDebitAccount] = useState(() => {
    const activeAccounts = useAppStore.getState().coaList.filter(c => c.isActive);
    return activeAccounts[0] ? `${activeAccounts[0].code} - ${activeAccounts[0].name}` : '1-1000';
  });
  const [creditAccount, setCreditAccount] = useState(() => {
    const activeAccounts = useAppStore.getState().coaList.filter(c => c.isActive);
    return activeAccounts.length > 1 ? `${activeAccounts[1].code} - ${activeAccounts[1].name}` : '1-1000';
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
        const dCoa = coaList.find(c => c.code === debitEntry.account);
        const cCoa = coaList.find(c => c.code === creditEntry.account);
        setDebitAccount(dCoa ? `${dCoa.code} - ${dCoa.name}` : debitEntry.account);
        setCreditAccount(cCoa ? `${cCoa.code} - ${cCoa.name}` : creditEntry.account);
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
    const actDebit = debitAccount.includes(' - ') ? debitAccount.split(' - ')[0].trim() : debitAccount.trim();
    const actCredit = creditAccount.includes(' - ') ? creditAccount.split(' - ')[0].trim() : creditAccount.trim();

    if (actDebit === actCredit) {
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
      account: actDebit,
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
      account: actCredit,
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
      // Abaikan entri yang rusak/kosong dari sisa pengujian lama (debit 0, kredit 0, akun kosong)
      if (!entry.account && !entry.debit && !entry.credit) return;

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

  const handleExportExcel = () => {
    const headers = ['TANGGAL', 'REF ID', 'KETERANGAN', 'TIPE', 'KODE AKUN', 'NAMA AKUN', 'DEBIT', 'KREDIT'];
    const data: any[] = [];
    groupedJournals.forEach(g => {
      g.entries.forEach((e, i) => {
        data.push([
          i === 0 ? new Date(g.date).toLocaleDateString('id-ID') : '',
          i === 0 ? g.refId : '',
          i === 0 ? g.description : '',
          i === 0 ? g.type : '',
          e.account,
          getAccountName(e.account).replace(`${e.account} - `, ''),
          e.debit || 0,
          e.credit || 0
        ]);
      });
    });
    
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Jurnal_Umum');
    XLSX.writeFile(wb, `Jurnal_Umum_KSA_Mart_${new Date().toLocaleDateString('id-ID').replace(/\//g, '-')}.xlsx`);
  };

  const handlePrint = useReactToPrint({
    contentRef: reportRef,
    documentTitle: `Jurnal_Umum_KSA_Mart_${new Date().toISOString().split('T')[0]}`,
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300 print:space-y-0 print:m-0 print:p-0">
      {/* Header Print */}
      <PrintHeader title="Laporan Jurnal Umum" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 print:hidden">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-green-100 text-green-800 rounded-xl">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-slate-200 tracking-tight">Jurnal Umum</h1>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">Pencatatan akuntansi standar syariah. Otomatis & Manual.</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button onClick={handleExportExcel} className="flex items-center justify-center space-x-2 px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-all active:scale-95 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-800">
            <Download className="w-4 h-4"/> <span className="hidden sm:inline">Excel</span>
          </button>
          <button onClick={() => handlePrint()} className="flex items-center justify-center space-x-2 px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-all active:scale-95 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-800">
            <Printer className="w-4 h-4"/> <span className="hidden sm:inline">Cetak</span>
          </button>
          <button 
            onClick={isAdding ? resetForm : handleOpenAdd}
            className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-xl text-sm font-bold shadow-md transition-all active:scale-95 ${
              isAdding ? 'bg-slate-200 hover:bg-slate-300 text-slate-700 dark:text-slate-300' : 'bg-green-600 hover:bg-green-700 text-white shadow-green-900/20'
            }`}
          >
            {isAdding ? <><Search className="w-4 h-4"/> <span>Lihat Daftar Jurnal</span></> : <><Plus className="w-4 h-4"/> <span>Buat Jurnal Manual</span></>}
          </button>
        </div>
      </div>


      {isAdding ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden print:hidden">
          <div className="bg-slate-50 dark:bg-slate-800 p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <PenLine className="w-5 h-5 text-green-600" />
              {editingRefId ? 'Edit Jurnal Manual' : 'Input Jurnal Manual (Double-Entry)'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Setiap pencatatan akan otomatis menjurnal Akun Debit dan Akun Lawan (Kredit) dengan nominal yang sama (Seimbang).
            </p>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Tanggal Transaksi</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="w-full pl-9 border border-slate-200 dark:border-slate-700 rounded-lg py-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none font-medium" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Keterangan / Deskripsi Transaksi</label>
                <input type="text" required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Misal: Penambahan Modal Kas, Pembayaran Hutang..." className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none font-medium" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center bg-green-50/50 p-4 rounded-xl border border-green-100">
              <div className="md:col-span-2 space-y-1 relative">
                <label className="text-[10px] uppercase font-bold text-green-700">Akun Debit (Tujuan)</label>
                <div className="relative">
                  <input 
                    value={debitAccount} 
                    onFocus={() => setIsDebitDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setIsDebitDropdownOpen(false), 200)}
                    onChange={(e) => {
                      setDebitAccount(e.target.value);
                      setIsDebitDropdownOpen(true);
                      const actCode = e.target.value.includes(' - ') ? e.target.value.split(' - ')[0].trim() : e.target.value.trim();
                      const selected = coaList.find(c => c.code === actCode);
                      if (selected && !description) {
                        setDescription(`Jurnal Manual: ${selected.name}`);
                      }
                    }} 
                    className="w-full border border-green-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900"
                    placeholder="Ketik Kode atau Nama Akun..."
                  />
                  <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                {isDebitDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-900 border border-green-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {coaList.filter(c => c.isActive && (c.code.toLowerCase().includes(debitAccount.toLowerCase()) || c.name.toLowerCase().includes(debitAccount.toLowerCase()))).map(c => (
                      <div 
                        key={c.id} 
                        className="p-2 hover:bg-green-50 cursor-pointer border-b border-green-50 last:border-0"
                        onMouseDown={() => {
                          setDebitAccount(`${c.code} - ${c.name}`);
                          setIsDebitDropdownOpen(false);
                          if (!description) setDescription(`Jurnal Manual: ${c.name}`);
                        }}
                      >
                        <div className="font-bold text-sm text-green-800">{c.code}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{c.name}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="hidden md:flex justify-center">
                <div className="bg-white dark:bg-slate-900 p-2 rounded-full shadow-sm border border-slate-100 dark:border-slate-800">
                  <ArrowRight className="w-5 h-5 text-slate-400" />
                </div>
              </div>

              <div className="md:col-span-2 space-y-1 relative">
                <label className="text-[10px] uppercase font-bold text-orange-700">Akun Kredit / Jurnal Lawan (Sumber)</label>
                <div className="relative">
                  <input 
                    value={creditAccount} 
                    onFocus={() => setIsCreditDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setIsCreditDropdownOpen(false), 200)}
                    onChange={(e) => {
                      setCreditAccount(e.target.value);
                      setIsCreditDropdownOpen(true);
                    }} 
                    className="w-full border border-orange-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 outline-none font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900"
                    placeholder="Ketik Kode atau Nama Akun..."
                  />
                  <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                {isCreditDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-900 border border-orange-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {coaList.filter(c => c.isActive && (c.code.toLowerCase().includes(creditAccount.toLowerCase()) || c.name.toLowerCase().includes(creditAccount.toLowerCase()))).map(c => (
                      <div 
                        key={c.id} 
                        className="p-2 hover:bg-orange-50 cursor-pointer border-b border-orange-50 last:border-0"
                        onMouseDown={() => {
                          setCreditAccount(`${c.code} - ${c.name}`);
                          setIsCreditDropdownOpen(false);
                        }}
                      >
                        <div className="font-bold text-sm text-orange-800">{c.code}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{c.name}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="max-w-md mx-auto space-y-1 bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <label className="text-xs uppercase font-bold text-slate-600 dark:text-slate-400 text-center block mb-2">Nominal (Total Debit = Total Kredit)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 font-bold text-slate-500 dark:text-slate-400">Rp</span>
                <input type="number" min="1" required value={amount || ''} onChange={(e) => setAmount(Number(e.target.value))} className="w-full pl-10 pr-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl text-lg font-bold font-mono focus:ring-4 focus:ring-green-500/20 focus:border-green-500 outline-none" placeholder="0" />
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
              <button type="button" onClick={resetForm} className="px-6 py-2.5 font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition-colors">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Total Debit Seluruhnya</p>
                <p className="text-xl font-mono font-bold text-green-700">Rp {totalDebit.toLocaleString('id-ID')}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Total Kredit Seluruhnya</p>
                <p className="text-xl font-mono font-bold text-green-700">Rp {totalCredit.toLocaleString('id-ID')}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Status Keseimbangan (Neraca)</p>
                {totalDebit === totalCredit ? (
                  <p className="text-sm font-bold text-green-600 flex items-center gap-1"><Scale className="w-4 h-4"/> SEIMBANG (BALANCE)</p>
                ) : (
                  <p className="text-sm font-bold text-red-600 flex items-center gap-1"><Scale className="w-4 h-4"/> TIDAK SEIMBANG</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden print:border-none print:shadow-none print:rounded-none">
            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full text-left border-collapse print:w-full print:text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] uppercase font-black text-slate-500 dark:text-slate-400 tracking-wider print:bg-slate-100 dark:bg-slate-800">
                  <tr>
                    <th className="p-4 border-b border-slate-100 dark:border-slate-800 print:border-slate-300 dark:border-slate-600">Tanggal & Ref</th>
                    <th className="p-4 border-b border-slate-100 dark:border-slate-800 print:border-slate-300 dark:border-slate-600">Keterangan / Transaksi</th>
                    <th className="p-4 border-b border-slate-100 dark:border-slate-800 print:border-slate-300 dark:border-slate-600">Akun (CoA)</th>
                    <th className="p-4 border-b border-slate-100 dark:border-slate-800 print:border-slate-300 dark:border-slate-600">Jurnal Lawan</th>
                    <th className="p-4 border-b border-slate-100 dark:border-slate-800 text-right print:border-slate-300 dark:border-slate-600">Debit (Rp)</th>
                    <th className="p-4 border-b border-slate-100 dark:border-slate-800 text-right print:border-slate-300 dark:border-slate-600">Kredit (Rp)</th>
                    <th className="p-4 border-b border-slate-100 dark:border-slate-800 text-center print:hidden">Aksi</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-slate-100">
                  {groupedJournals.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-slate-500 dark:text-slate-400 font-medium">
                        <BookOpen className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                        Belum ada catatan jurnal sama sekali.
                      </td>
                    </tr>
                  ) : (
                    groupedJournals.map((group) => {
                      const isManual = group.type === 'MANUAL';
                      return (
                        <React.Fragment key={group.refId}>
                          <tr className="bg-slate-50 dark:bg-slate-800/50">
                            <td className="p-3 text-xs text-slate-500 dark:text-slate-400 align-top" rowSpan={group.entries.length}>
                              <div className="font-bold text-slate-700 dark:text-slate-300">{new Date(group.date).toLocaleDateString('id-ID')}</div>
                              <div className="font-mono text-[10px] mt-1 break-all">{group.refId}</div>
                              {isManual && <span className="inline-block mt-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-[9px] font-bold rounded">MANUAL</span>}
                            </td>
                            <td className="p-3 text-slate-700 dark:text-slate-300 font-medium align-top" rowSpan={group.entries.length}>
                              {group.description}
                            </td>
                            <td className="p-3 font-medium text-slate-800 dark:text-slate-200 text-xs">{getAccountName(group.entries[0].account)}</td>
                            <td className="p-3 font-medium text-slate-600 dark:text-slate-400 text-xs italic border-l-2 border-slate-100 dark:border-slate-800 print:border-none">
                              {group.entries.length > 1 
                                ? getAccountName(group.entries.find(e => e.id !== group.entries[0].id)?.account || '') 
                                : '-'}
                            </td>
                            <td className="p-3 text-right font-mono text-slate-600 dark:text-slate-400 border-l-2 border-slate-100 dark:border-slate-800 print:border-none print:text-black">{group.entries[0].debit > 0 ? group.entries[0].debit.toLocaleString('id-ID') : '-'}</td>
                            <td className="p-3 text-right font-mono text-slate-600 dark:text-slate-400 border-l-2 border-slate-100 dark:border-slate-800 print:border-none print:text-black">{group.entries[0].credit > 0 ? group.entries[0].credit.toLocaleString('id-ID') : '-'}</td>
                            <td className="p-3 text-center align-top print:hidden" rowSpan={group.entries.length}>
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
                          {group.entries.slice(1).map((entry, idx) => (
                            <tr key={entry.id} className="bg-slate-50 dark:bg-slate-800/50">
                              <td className="p-3 font-medium text-slate-800 dark:text-slate-200 text-xs border-l-2 border-slate-100 dark:border-slate-800 print:border-none">{getAccountName(entry.account)}</td>
                              <td className="p-3 font-medium text-slate-600 dark:text-slate-400 text-xs italic border-l-2 border-slate-100 dark:border-slate-800 print:border-none">
                                {getAccountName(group.entries.find(e => e.id !== entry.id)?.account || '')}
                              </td>
                              <td className="p-3 text-right font-mono text-slate-600 dark:text-slate-400 border-l-2 border-slate-100 dark:border-slate-800 print:border-none print:text-black">{entry.debit > 0 ? entry.debit.toLocaleString('id-ID') : '-'}</td>
                              <td className="p-3 text-right font-mono text-slate-600 dark:text-slate-400 border-l-2 border-slate-100 dark:border-slate-800 print:border-none print:text-black">{entry.credit > 0 ? entry.credit.toLocaleString('id-ID') : '-'}</td>
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
          
          <PrintFooter />
        </div>
      )}

      {/* Hidden Printable Area for react-to-print - always in DOM */}
      <div style={{ display: 'none' }}>
        <div className="printable-a4 bg-white dark:bg-slate-900 p-8 text-black" ref={reportRef}>
          <PrintHeader title="Laporan Jurnal Umum" />
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', marginTop: '16px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #374151' }}>
                <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 'bold' }}>Tanggal</th>
                <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 'bold' }}>Keterangan</th>
                <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 'bold' }}>Akun (CoA)</th>
                <th style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 'bold' }}>Debit (Rp)</th>
                <th style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 'bold' }}>Kredit (Rp)</th>
              </tr>
            </thead>
            <tbody>
              {groupedJournals.map((group) => (
                <React.Fragment key={group.refId}>
                  {group.entries.map((entry, idx) => (
                    <tr key={entry.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      {idx === 0 && (
                        <td rowSpan={group.entries.length} style={{ padding: '4px 8px', verticalAlign: 'top', fontSize: '9px', color: '#475569' }}>
                          <div style={{ fontWeight: 'bold' }}>{new Date(group.date).toLocaleDateString('id-ID')}</div>
                          <div style={{ fontFamily: 'monospace', fontSize: '8px', marginTop: '2px', wordBreak: 'break-all' }}>{group.refId.substring(0, 20)}</div>
                        </td>
                      )}
                      {idx === 0 && (
                        <td rowSpan={group.entries.length} style={{ padding: '4px 8px', verticalAlign: 'top', fontSize: '9px' }}>
                          {group.description}
                        </td>
                      )}
                      <td style={{ padding: '4px 8px', fontSize: '9px' }}>{getAccountName(entry.account)}</td>
                      <td style={{ padding: '4px 8px', textAlign: 'right', fontFamily: 'monospace' }}>{entry.debit > 0 ? entry.debit.toLocaleString('id-ID') : '-'}</td>
                      <td style={{ padding: '4px 8px', textAlign: 'right', fontFamily: 'monospace' }}>{entry.credit > 0 ? entry.credit.toLocaleString('id-ID') : '-'}</td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid #374151', fontWeight: 'bold', backgroundColor: '#f8fafc' }}>
                <td colSpan={3} style={{ padding: '6px 8px', textAlign: 'right' }}>TOTAL:</td>
                <td style={{ padding: '6px 8px', textAlign: 'right', fontFamily: 'monospace' }}>
                  {journalEntries.reduce((s, e) => s + (e.debit || 0), 0).toLocaleString('id-ID')}
                </td>
                <td style={{ padding: '6px 8px', textAlign: 'right', fontFamily: 'monospace' }}>
                  {journalEntries.reduce((s, e) => s + (e.credit || 0), 0).toLocaleString('id-ID')}
                </td>
              </tr>
            </tfoot>
          </table>
          <PrintFooter />
        </div>
      </div>
    </div>
  );
}
