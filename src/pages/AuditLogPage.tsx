import React, { useState } from 'react';
import { useAppStore } from '../store';
import { 
  ShieldAlert, 
  Search, 
  Trash, 
  Filter, 
  Download,
  AlertOctagon
} from 'lucide-react';

export default function AuditLogPage() {
  const { auditLogs } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'POS' | 'INVENTORY' | 'FINANCE' | 'SYSTEM' | 'ZAKAT'>('ALL');

  // Filter logs list
  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.action.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          log.details.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          log.user.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || log.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDownloadLogs = () => {
    alert("Proses simpan / unduh Log Audit (.csv) disimulasikan berhasil.");
  };

  return (
    <div className="space-y-6">
      {/* Top action header panel */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-bold text-gray-800 text-sm">Log Audit Sistem (Audit Trail)</h2>
          <p className="text-[11px] text-gray-400 mt-0.5">Catatan akuntabilitas rill atas sirkulasi data internal toko BA Mart</p>
        </div>

        <button
          onClick={handleDownloadLogs}
          className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-1.5 px-3.5 rounded-lg flex items-center space-x-1 shadow-xs transition-colors self-start md:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Export Audit Log (.csv)</span>
        </button>
      </div>

      {/* Filter and search bars */}
      <div className="bg-white p-4 rounded-xl border border-gray-200/80 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-gray-400" />
          </span>
          <input
            type="text"
            className="w-full pl-9 pr-4 py-1.5 border border-gray-200 rounded-lg text-xs"
            placeholder="Cari kata kunci, operator kasir, No Invoice..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2.5 overflow-x-auto pb-1 md:pb-0">
          {(['ALL', 'POS', 'INVENTORY', 'FINANCE', 'SYSTEM', 'ZAKAT'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold select-none whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-emerald-700 text-white'
                  : 'bg-slate-100 text-gray-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'ALL' ? 'Semua Kategori' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Logs table representation */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#f8fafc] uppercase tracking-widest text-[9px] text-gray-500 font-bold border-b">
              <tr>
                <th className="py-3 px-5">Waktu Server</th>
                <th className="py-3 px-5">Operator</th>
                <th className="py-3 px-5">Aksi Sistem</th>
                <th className="py-3 px-5 text-center">Kategori</th>
                <th className="py-3 px-5">Keterangan Detail Audit</th>
                <th className="py-3 px-5 text-right font-mono">Alamat IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-400">
                    Belum ada log audit terekam untuk parameter pencarian Anda.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  
                  // Color codes for categories
                  let categoryClass = 'bg-slate-100 text-slate-700 border-slate-200';
                  if (log.category === 'POS') categoryClass = 'bg-blue-50 text-blue-700 border-blue-100';
                  if (log.category === 'INVENTORY') categoryClass = 'bg-amber-50 text-amber-700 border-amber-100';
                  if (log.category === 'FINANCE') categoryClass = 'bg-indigo-50 text-indigo-700 border-indigo-100';
                  if (log.category === 'ZAKAT') categoryClass = 'bg-emerald-50 text-emerald-800 border-emerald-100';
                  if (log.category === 'SYSTEM') categoryClass = 'bg-slate-900 text-slate-200 border-slate-850';

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/30">
                      <td className="py-3 px-5 font-mono text-gray-400 text-[10px]">
                        {new Date(log.timestamp).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-5 font-bold text-gray-800 text-xs">
                        {log.user}
                      </td>
                      <td className="py-3 px-5 font-bold text-gray-700 font-mono text-[10px]">
                        {log.action}
                      </td>
                      <td className="py-3 px-5 text-center">
                        <span className={`text-[9px] px-2 py-0.5 rounded border text-center font-extrabold font-mono ${categoryClass}`}>
                          {log.category}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-gray-600 max-w-sm font-medium">
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
      </div>
    </div>
  );
}
