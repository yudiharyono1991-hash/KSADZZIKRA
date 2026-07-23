import React, { useState, useMemo, useRef } from 'react';
import { useBranchData } from '../hooks/useBranchData';
import { useAppStore } from '../store';
import { BookOpen, Calendar, Printer, Download, Search, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useReactToPrint } from 'react-to-print';
import PrintHeader from '../components/Print/PrintHeader';
import PrintFooter from '../components/Print/PrintFooter';

export default function BukuBesarPage() {
  const { journalEntries, coaList } = useBranchData();
  const reportRef = useRef<HTMLDivElement>(null);
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toLocaleDateString('en-CA');
  const currentDay = today.toLocaleDateString('en-CA');

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(currentDay);
  const [selectedAccount, setSelectedAccount] = useState<string>('SEMUA');
  
  // Custom Searchable Dropdown state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Get active accounts sorted by code
  const activeAccounts = useMemo(() => {
    return coaList.filter(c => c.isActive).sort((a, b) => a.code.localeCompare(b.code));
  }, [coaList]);

  // Click outside to close dropdown
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Group accounts by category
  const groupedAccounts = useMemo(() => {
    const groups: Record<string, typeof activeAccounts> = {
      'SEMUA AKUN': [{ id: 'all', code: 'SEMUA', name: 'Seluruh Transaksi Akun', type: 'ALL', normalBalance: 'DEBIT', isActive: true, branchId: '' }],
      '1 - ASET': [], '2 - KEWAJIBAN': [], '3 - EKUITAS': [], 
      '4 - PENDAPATAN': [], '5 - HARGA POKOK': [], '6 - BEBAN': [], 'LAINNYA': []
    };
    
    activeAccounts.forEach(acc => {
      // Filter by search term if exists
      if (searchTerm && !acc.code.toLowerCase().includes(searchTerm.toLowerCase()) && !acc.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return;
      }
      
      const firstDigit = acc.code.charAt(0);
      if (firstDigit === '1') groups['1 - ASET'].push(acc);
      else if (firstDigit === '2') groups['2 - KEWAJIBAN'].push(acc);
      else if (firstDigit === '3') groups['3 - EKUITAS'].push(acc);
      else if (firstDigit === '4') groups['4 - PENDAPATAN'].push(acc);
      else if (firstDigit === '5') groups['5 - HARGA POKOK'].push(acc);
      else if (firstDigit === '6') groups['6 - BEBAN'].push(acc);
      else groups['LAINNYA'].push(acc);
    });
    
    return groups;
  }, [activeAccounts, searchTerm]);

  const handlePrint = useReactToPrint({
    contentRef: reportRef,
    documentTitle: `Buku_Besar_${selectedAccount}_${startDate}_${endDate}`,
  });

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      processedEntries.entries.map((e: any) => ({
        'Tanggal': new Date(e.date).toLocaleDateString('id-ID'),
        'Deskripsi': e.description,
        'Ref': e.referenceId,
        'Debit': e.debit,
        'Kredit': e.credit,
        'Saldo': e.runningBalance
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Buku Besar");
    XLSX.writeFile(wb, `Buku_Besar_${selectedAccount}.xlsx`);
  };

  const processedEntries = useMemo(() => {
    if (!selectedAccount) return { saldoAwal: 0, entries: [], akhir: 0, normalBalance: 'DEBIT' };

    const accountObj = selectedAccount === 'SEMUA' ? { normalBalance: 'DEBIT' } : activeAccounts.find(a => a.code === selectedAccount);
    const normalBalance = accountObj?.normalBalance || 'DEBIT';

    // 1. Sort all entries chronologically
    const allSorted = [...journalEntries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // 2. Separate into "Before Start Date" (Saldo Awal) and "Within Date Range"
    let saldoAwal = 0;
    const currentPeriodEntries: any[] = [];

    allSorted.forEach(entry => {
      // Ensure we match the account exactly, checking code
      const entryAccCode = entry.account?.includes(' - ') ? entry.account.split(' - ')[0].trim() : entry.account?.trim();
      const selectedAccCode = selectedAccount.includes(' - ') ? selectedAccount.split(' - ')[0].trim() : selectedAccount.trim();
      
      const isMatch = selectedAccount === 'SEMUA' ||
                      entryAccCode === selectedAccCode || 
                      entry.account === selectedAccount;
      
      if (isMatch) {
        if (entry.date < startDate) {
          // Accumulate to Saldo Awal
          if (normalBalance === 'DEBIT') {
            saldoAwal += (Number(entry.debit) || 0) - (Number(entry.credit) || 0);
          } else {
            saldoAwal += (Number(entry.credit) || 0) - (Number(entry.debit) || 0);
          }
        } else if (entry.date >= startDate && entry.date <= endDate + 'T23:59:59') {
          // Add to current period
          currentPeriodEntries.push({ ...entry });
        }
      }
    });

    // 3. Calculate running balance for current period
    // Sort ascending by date for correct running balance calculation
    currentPeriodEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let runningBalance = saldoAwal;
    let totalDebit = 0;
    let totalCredit = 0;
    const finalEntries = currentPeriodEntries.map(entry => {
      const d = Number(entry.debit) || 0;
      const c = Number(entry.credit) || 0;
      totalDebit += d;
      totalCredit += c;
      if (normalBalance === 'DEBIT') {
        runningBalance += d - c;
      } else {
        runningBalance += c - d;
      }
      return { ...entry, runningBalance };
    });

    return { saldoAwal, entries: finalEntries, akhir: runningBalance, normalBalance, totalDebit, totalCredit };
  }, [journalEntries, selectedAccount, startDate, endDate, activeAccounts]);

  const accInfo = selectedAccount === 'SEMUA' 
    ? { code: 'SEMUA', name: 'Seluruh Transaksi Akun' } 
    : activeAccounts.find(a => a.code === selectedAccount);

  // Pagination logic
  const totalPages = Math.ceil((processedEntries.entries?.length || 0) / itemsPerPage);
  const paginatedEntries = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return processedEntries.entries?.slice(startIndex, startIndex + itemsPerPage) || [];
  }, [processedEntries.entries, currentPage, itemsPerPage]);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="print:hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-slate-200 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-600" />
            Buku Besar (General Ledger)
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Lacak mutasi dan saldo berjalan tiap akun secara detail.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportToExcel} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold transition-colors">
            <FileSpreadsheet className="w-4 h-4" /> Excel
          </button>
          <button onClick={handlePrint} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold transition-colors">
            <Printer className="w-4 h-4" /> Cetak
          </button>
        </div>
      </div>

      <div className="print:hidden bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full relative" ref={dropdownRef}>
          <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-1 uppercase">Cari & Pilih Akun COA</label>
          <div 
            className="w-full p-2.5 border border-gray-200 dark:border-slate-700 rounded-lg text-sm bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-slate-200 cursor-pointer flex justify-between items-center"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <span className="font-semibold">{selectedAccount ? `${accInfo?.code || selectedAccount} - ${accInfo?.name || ''}` : 'Pilih Akun...'}</span>
            <Search className="w-4 h-4 text-gray-400" />
          </div>
          
          {isDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
              <div className="p-2 border-b border-gray-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                <input 
                  type="text" 
                  autoFocus
                  placeholder="Ketik kode atau nama akun..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-2 text-sm border border-gray-200 dark:border-slate-700 rounded focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none"
                />
              </div>
              <div className="max-h-60 overflow-y-auto p-1">
                {Object.entries(groupedAccounts).map(([groupName, accounts]) => {
                  const accountList = accounts as any[];
                  if (accountList.length === 0) return null;
                  return (
                    <div key={groupName} className="mb-1">
                      <div className="px-3 py-1.5 text-[10px] font-black text-gray-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900/50 uppercase tracking-wider">{groupName}</div>
                      {accountList.map(acc => (
                        <div 
                          key={acc.id}
                          className={`px-4 py-2 text-sm cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors ${selectedAccount === acc.code ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-bold' : 'text-gray-700 dark:text-slate-300'}`}
                          onClick={() => {
                            setSelectedAccount(acc.code);
                            setIsDropdownOpen(false);
                            setSearchTerm('');
                            setCurrentPage(1); // reset page on filter change
                          }}
                        >
                          <span className="font-mono text-xs mr-2">{acc.code}</span>
                          {acc.name}
                        </div>
                      ))}
                    </div>
                  );
                })}
                {Object.values(groupedAccounts).every(arr => (arr as any[]).length === 0) && (
                  <div className="p-4 text-center text-sm text-gray-500 italic">Pencarian tidak ditemukan</div>
                )}
              </div>
            </div>
          )}
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-1 uppercase">Periode Mulai</label>
          <input 
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="p-2.5 border border-gray-200 dark:border-slate-700 rounded-lg text-sm bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-1 uppercase">Sampai</label>
          <input 
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="p-2.5 border border-gray-200 dark:border-slate-700 rounded-lg text-sm bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden" ref={reportRef}>
        <PrintHeader title="Laporan Buku Besar" period={`Periode: ${new Date(startDate).toLocaleDateString('id-ID')} - ${new Date(endDate).toLocaleDateString('id-ID')}`} />
        
        <div className="p-5 border-b border-gray-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex justify-between items-center">
          <div>
            <h2 className="font-black text-lg text-gray-800 dark:text-slate-200">{accInfo?.code} - {accInfo?.name}</h2>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 uppercase tracking-wider font-semibold">Saldo Normal: <span className="text-indigo-600 font-bold">{processedEntries.normalBalance}</span></p>
          </div>
        </div>

        <div className="overflow-x-auto ui-paginated-table">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                <th className="p-3 border-b border-gray-200 dark:border-slate-700 font-bold whitespace-nowrap">Tanggal</th>
                <th className="p-3 border-b border-gray-200 dark:border-slate-700 font-bold w-1/3">Keterangan</th>
                <th className="p-3 border-b border-gray-200 dark:border-slate-700 font-bold">No. Ref</th>
                <th className="p-3 border-b border-gray-200 dark:border-slate-700 font-bold text-right">Debit</th>
                <th className="p-3 border-b border-gray-200 dark:border-slate-700 font-bold text-right">Kredit</th>
                <th className="p-3 border-b border-gray-200 dark:border-slate-700 font-bold text-right">Saldo Berjalan</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-indigo-50/50 dark:bg-indigo-900/10">
                <td className="p-3 font-semibold text-gray-600 dark:text-slate-400" colSpan={3}>Saldo Awal Per {new Date(startDate).toLocaleDateString('id-ID')}</td>
                <td className="p-3 text-right"></td>
                <td className="p-3 text-right"></td>
                <td className="p-3 text-right font-bold text-indigo-700 dark:text-indigo-400">Rp {processedEntries.saldoAwal?.toLocaleString('id-ID') || 0}</td>
              </tr>
              {processedEntries.entries?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400 italic">Tidak ada transaksi pada periode ini.</td>
                </tr>
              ) : (
                paginatedEntries.map((entry: any, i: number) => (
                  <tr key={entry.id || i} className="border-b border-gray-100 dark:border-slate-800 hover:bg-slate-50 dark:bg-slate-800/50 transition-colors">
                    <td className="p-3 text-gray-700 dark:text-slate-300 font-medium whitespace-nowrap">{new Date(entry.date).toLocaleDateString('id-ID')}</td>
                    <td className="p-3 text-gray-600 dark:text-slate-400">{entry.description}</td>
                    <td className="p-3 text-xs text-gray-500 font-mono">{entry.referenceId}</td>
                    <td className="p-3 text-right font-semibold text-gray-800 dark:text-slate-200 whitespace-nowrap">
                      {entry.debit > 0 ? `Rp ${Number(entry.debit).toLocaleString('id-ID')}` : '-'}
                    </td>
                    <td className="p-3 text-right font-semibold text-gray-800 dark:text-slate-200 whitespace-nowrap">
                      {entry.credit > 0 ? `Rp ${Number(entry.credit).toLocaleString('id-ID')}` : '-'}
                    </td>
                    <td className="p-3 text-right font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                      Rp {entry.runningBalance?.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))
              )}
              {/* Total Mutasi */}
              <tr className="bg-slate-50 dark:bg-slate-800">
                <td className="p-4 font-bold text-gray-700 dark:text-slate-300 uppercase text-right" colSpan={3}>Total Mutasi Periode</td>
                <td className="p-4 text-right font-bold text-gray-700 dark:text-slate-300 whitespace-nowrap">Rp {processedEntries.totalDebit?.toLocaleString('id-ID') || 0}</td>
                <td className="p-4 text-right font-bold text-gray-700 dark:text-slate-300 whitespace-nowrap">Rp {processedEntries.totalCredit?.toLocaleString('id-ID') || 0}</td>
                <td></td>
              </tr>
              {/* Saldo Akhir */}
              <tr className="bg-indigo-100/50 dark:bg-indigo-900/30">
                <td className="p-4 font-black text-gray-800 dark:text-slate-200 uppercase tracking-wider text-right" colSpan={5}>Saldo Akhir</td>
                <td className="p-4 text-right font-black text-lg text-indigo-700 dark:text-indigo-400 whitespace-nowrap">Rp {processedEntries.akhir?.toLocaleString('id-ID') || 0}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        {/* Pagination UI (Hidden when printing) */}
        {totalPages > 1 && (
          <div className="print:hidden p-4 border-t border-gray-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
            <span className="text-xs text-gray-500">
              Menampilkan Halaman {currentPage} dari {totalPages} ({processedEntries.entries.length} Total Mutasi)
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-xs font-bold border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-white disabled:opacity-50 transition-colors text-slate-700 dark:text-slate-300"
              >
                Sebelumnya
              </button>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-xs font-bold border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-white disabled:opacity-50 transition-colors text-slate-700 dark:text-slate-300"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
        
        {/* Full Table Render strictly for printing, hidden in UI to avoid duplicate visually */}
        <style dangerouslySetInnerHTML={{__html: `
          @media screen { .print-only-table { display: none !important; } }
          @media print { .ui-paginated-table { display: none !important; } .print-only-table { display: block !important; } }
        `}} />
        
        <div className="overflow-x-auto print-only-table">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-600">
                <th className="p-2 border-b border-gray-200 font-bold whitespace-nowrap">Tanggal</th>
                <th className="p-2 border-b border-gray-200 font-bold w-1/3">Keterangan</th>
                <th className="p-2 border-b border-gray-200 font-bold">No. Ref</th>
                <th className="p-2 border-b border-gray-200 font-bold text-right whitespace-nowrap">Debit</th>
                <th className="p-2 border-b border-gray-200 font-bold text-right whitespace-nowrap">Kredit</th>
                <th className="p-2 border-b border-gray-200 font-bold text-right whitespace-nowrap">Saldo Berjalan</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-indigo-50/50">
                <td className="p-2 font-semibold text-gray-600" colSpan={3}>Saldo Awal Per {new Date(startDate).toLocaleDateString('id-ID')}</td>
                <td className="p-2 text-right"></td>
                <td className="p-2 text-right"></td>
                <td className="p-2 text-right font-bold text-indigo-700 whitespace-nowrap">Rp {processedEntries.saldoAwal?.toLocaleString('id-ID') || 0}</td>
              </tr>
              {processedEntries.entries?.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-400 italic">Tidak ada transaksi.</td></tr>
              ) : (
                processedEntries.entries?.map((entry: any, i: number) => (
                  <tr key={'print-'+(entry.id || i)} className="border-b border-gray-100">
                    <td className="p-2 text-gray-700 font-medium whitespace-nowrap">{new Date(entry.date).toLocaleDateString('id-ID')}</td>
                    <td className="p-2 text-gray-600">{entry.description}</td>
                    <td className="p-2 text-xs text-gray-500 font-mono">{entry.referenceId}</td>
                    <td className="p-2 text-right font-semibold text-gray-800 whitespace-nowrap">
                      {entry.debit > 0 ? `Rp ${Number(entry.debit).toLocaleString('id-ID')}` : '-'}
                    </td>
                    <td className="p-2 text-right font-semibold text-gray-800 whitespace-nowrap">
                      {entry.credit > 0 ? `Rp ${Number(entry.credit).toLocaleString('id-ID')}` : '-'}
                    </td>
                    <td className="p-2 text-right font-bold text-indigo-600 whitespace-nowrap">
                      Rp {entry.runningBalance?.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))
              )}
              {/* Total Mutasi Print */}
              <tr className="bg-slate-50 border-t-2 border-slate-300">
                <td className="p-2 font-bold text-gray-700 text-right" colSpan={3}>Total Mutasi</td>
                <td className="p-2 text-right font-bold text-gray-800 whitespace-nowrap">Rp {processedEntries.totalDebit?.toLocaleString('id-ID') || 0}</td>
                <td className="p-2 text-right font-bold text-gray-800 whitespace-nowrap">Rp {processedEntries.totalCredit?.toLocaleString('id-ID') || 0}</td>
                <td></td>
              </tr>
              <tr className="bg-indigo-50/50 border-t border-gray-200">
                <td className="p-2 font-bold text-gray-800 text-right uppercase" colSpan={5}>Saldo Akhir</td>
                <td className="p-2 text-right font-bold text-indigo-800 whitespace-nowrap">Rp {processedEntries.akhir?.toLocaleString('id-ID') || 0}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <PrintFooter />
      </div>
    </div>
  );
}
