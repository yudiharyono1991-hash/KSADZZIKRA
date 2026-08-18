import React, { useState, useMemo } from 'react';
import { useBranchData } from '../hooks/useBranchData';
import * as XLSX from 'xlsx';
import { 
  ShieldAlert, 
  Search, 
  Trash, 
  Filter, 
  Download,
  AlertOctagon,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Trash2
} from 'lucide-react';

export default function AuditLogPage() {
  const { auditLogs, currentUser, activeBranchId, users, deleteAuditLogs } = useBranchData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'POS' | 'INVENTORY' | 'FINANCE' | 'SYSTEM' | 'ZAKAT'>('ALL');
  
  // Date Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Delete Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwnerOrSuperAdmin = currentUser?.role === 'OWNER' || currentUser?.role === 'SUPERADMIN';

  // Filter logs list
  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      // 1. Role / Branch Isolation Check
      const isGlobalAdmin = !currentUser?.branchId || ['OWNER', 'SUPERADMIN', 'PENGURUS'].includes(currentUser?.role || '');
      if (!isGlobalAdmin || activeBranchId) {
        const logUser = users.find(u => u.name === log.user);
        const targetBranch = activeBranchId || currentUser?.branchId;
        if (logUser && logUser.branchId !== targetBranch) {
          return false;
        }
      }

      // 2. Search and Category Filters
      const matchesSearch = log.action.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            log.details.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            log.user.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'ALL' || log.category === selectedCategory;
      
      // 3. Date Range Filter
      let matchesDate = true;
      if (startDate || endDate) {
        // Only use the YYYY-MM-DD part of the ISO string for simple comparison
        const logDate = log.timestamp.split('T')[0];
        if (startDate && logDate < startDate) matchesDate = false;
        if (endDate && logDate > endDate) matchesDate = false;
      }
      
      return matchesSearch && matchesCategory && matchesDate;
    });
  }, [auditLogs, currentUser, activeBranchId, users, searchQuery, selectedCategory, startDate, endDate]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleDownloadLogs = () => {
    const ws_data = [
      ["WAKTU", "KATEGORI", "AKSI", "USER", "DETAIL"],
      ...filteredLogs.map(log => [
        new Date(log.timestamp).toLocaleString('id-ID'),
        log.category,
        log.action,
        log.user,
        log.details
      ])
    ];
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Audit Log");
    XLSX.writeFile(wb, `Audit_Log_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleDeleteLogs = async () => {
    if (!startDate || !endDate) {
      alert("Pilih rentang tanggal (Start Date & End Date) terlebih dahulu untuk membatasi data yang dihapus.");
      return;
    }
    
    // Ensure endDate covers the whole day by setting time to 23:59:59
    const startIso = `${startDate}T00:00:00.000Z`;
    const endIso = `${endDate}T23:59:59.999Z`;

    setIsDeleting(true);
    try {
      await deleteAuditLogs(startIso, endIso);
      alert(`Berhasil menghapus audit log dari ${startDate} sampai ${endDate}.`);
      setShowDeleteModal(false);
      setCurrentPage(1);
    } catch (err) {
      alert("Gagal menghapus audit log.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, startDate, endDate]);

  return (
    <div className="space-y-6">
      {/* Top action header panel */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-200 dark:border-slate-700/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-bold text-gray-800 dark:text-slate-200 text-sm">Log Audit Sistem (Audit Trail)</h2>
          <p className="text-[11px] text-gray-400 mt-0.5">Catatan akuntabilitas riil atas sirkulasi data internal toko KSA Mart</p>
        </div>

        <div className="flex gap-2 self-start md:self-auto">
          {isOwnerOrSuperAdmin && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 font-bold text-xs py-1.5 px-3.5 rounded-lg flex items-center space-x-1 shadow-xs transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Hapus Permanen</span>
            </button>
          )}
          <button
            onClick={handleDownloadLogs}
            className="bg-green-700 hover:bg-green-800 text-white font-bold text-xs py-1.5 px-3.5 rounded-lg flex items-center space-x-1 shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export Audit Log</span>
          </button>
        </div>
      </div>

      {/* Filter and search bars */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-700/80 flex flex-col md:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-gray-400" />
          </span>
          <input
            type="text"
            className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-xs"
            placeholder="Cari kata kunci, operator kasir, No Invoice..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2 items-center">
          <div className="relative flex items-center bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-2">
            <Calendar className="w-4 h-4 text-gray-400 mr-2" />
            <input 
              type="date" 
              className="bg-transparent border-none text-xs py-2 focus:ring-0 text-gray-700 dark:text-slate-300 outline-none"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <span className="mx-2 text-gray-400 text-xs">s/d</span>
            <input 
              type="date" 
              className="bg-transparent border-none text-xs py-2 focus:ring-0 text-gray-700 dark:text-slate-300 outline-none"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2.5 overflow-x-auto pb-1 md:pb-0 w-full md:w-auto">
          {(['ALL', 'POS', 'INVENTORY', 'FINANCE', 'SYSTEM', 'ZAKAT'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold select-none whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-green-700 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {cat === 'ALL' ? 'Semua Kategori' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Logs table representation */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xs overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#f8fafc] dark:bg-slate-800 uppercase tracking-widest text-[9px] text-gray-500 dark:text-slate-400 font-bold border-b border-gray-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-5">Waktu Server</th>
                <th className="py-3 px-5">Operator</th>
                <th className="py-3 px-5">Aksi Sistem</th>
                <th className="py-3 px-5 text-center">Kategori</th>
                <th className="py-3 px-5">Keterangan Detail Audit</th>
                <th className="py-3 px-5 text-right font-mono">Alamat IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50 font-medium text-gray-700 dark:text-slate-300">
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-400">
                    Belum ada log audit terekam untuk parameter pencarian Anda.
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => {
                  let categoryClass = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
                  if (log.category === 'POS') categoryClass = 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-400';
                  if (log.category === 'INVENTORY') categoryClass = 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/30 dark:text-amber-400';
                  if (log.category === 'FINANCE') categoryClass = 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400';
                  if (log.category === 'ZAKAT') categoryClass = 'bg-green-50 text-green-800 border-green-100 dark:bg-green-900/30 dark:text-green-400';
                  if (log.category === 'SYSTEM') categoryClass = 'bg-slate-900 text-slate-200 border-slate-850 dark:bg-slate-950';

                  return (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-3 px-5 font-mono text-gray-500 dark:text-gray-400 text-[10px]">
                        {new Date(log.timestamp).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-5 font-bold text-gray-800 dark:text-slate-200 text-xs">
                        {log.user}
                      </td>
                      <td className="py-3 px-5 font-bold text-gray-700 dark:text-slate-300 font-mono text-[10px]">
                        {log.action}
                      </td>
                      <td className="py-3 px-5 text-center">
                        <span className={`text-[9px] px-2 py-0.5 rounded border text-center font-extrabold font-mono ${categoryClass}`}>
                          {log.category}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-gray-600 dark:text-slate-400 max-w-sm font-medium">
                        {log.details}
                      </td>
                      <td className="py-3 px-5 text-right font-mono text-gray-400 text-[10px]">
                        {log.ipAddress}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
            <span className="text-xs text-gray-500 dark:text-slate-400">
              Menampilkan <span className="font-bold text-gray-700 dark:text-slate-200">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="font-bold text-gray-700 dark:text-slate-200">{Math.min(currentPage * itemsPerPage, filteredLogs.length)}</span> dari <span className="font-bold text-gray-700 dark:text-slate-200">{filteredLogs.length}</span> log
            </span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-md border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold px-2 text-gray-700 dark:text-slate-300">
                Hal {currentPage} / {totalPages}
              </span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-md border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isDeleting && setShowDeleteModal(false)}></div>
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4 text-rose-600 dark:text-rose-500">
                <AlertOctagon className="w-8 h-8" />
                <h2 className="text-xl font-black">Hapus Permanen Audit Log</h2>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-slate-400 mb-6 font-medium">
                Pilih rentang tanggal yang ingin Anda hapus. <strong className="text-rose-600 dark:text-rose-400">Peringatan:</strong> Aksi ini akan menghapus jejak log secara permanen dari server dan tidak dapat dikembalikan.
              </p>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">Mulai Tanggal (Start)</label>
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 p-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">Sampai Tanggal (End)</label>
                  <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 p-2.5 text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  className="flex-1 py-3 px-4 rounded-xl border border-gray-200 dark:border-slate-700 font-bold text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  onClick={handleDeleteLogs}
                  disabled={isDeleting || !startDate || !endDate}
                  className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {isDeleting ? 'Menghapus...' : 'Ya, Hapus Permanen'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

