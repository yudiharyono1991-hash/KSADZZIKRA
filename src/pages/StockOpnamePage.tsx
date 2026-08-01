import React, { useState } from 'react';
import { useBranchData } from '../hooks/useBranchData';
import { PackageSearch, History, ArrowDownToLine, ArrowUpFromLine, AlertTriangle, FileSpreadsheet, CheckCircle, Search, Filter, Calendar, ClipboardCheck, X, FileText, Check, XCircle } from 'lucide-react';

const getLocalDateString = () => {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export default function StockOpnamePage() {
  const { products, stockMovements, adjustStock, addStockMovement, currentUser, activeBranchId, addLog, opnameRequests, requestStockOpname, reviewStockOpname } = useBranchData();
  const [selectedProductId, setSelectedProductId] = useState('');
  const [physicalCount, setPhysicalCount] = useState('');
  const [opnameReason, setOpnameReason] = useState('');
  const [activeTab, setActiveTab] = useState<'HISTORY' | 'APPROVALS'>('HISTORY');
  const [approvalModal, setApprovalModal] = useState<{ isOpen: boolean, id: string, isApproved: boolean }>({ isOpen: false, id: '', isApproved: false });
  const [approvalReason, setApprovalReason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [opnameSearch, setOpnameSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Date Filters
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}-01`;
  });
  const [endDate, setEndDate] = useState(getLocalDateString);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  
  // Get unique categories dynamically from products
  const categories = Array.from(new Set(products.map(p => p.category))).sort();
  
  if (!['ADMIN', 'OWNER', 'SUPERADMIN', 'MANAGER', 'PENGURUS'].includes(currentUser?.role || '')) {
    return <div className="p-6 text-red-700 font-bold">Akses ditolak.</div>;
  }

  const handleAdjust = () => {
    if (!selectedProductId || physicalCount === '') return;
    if (!opnameReason.trim()) {
      alert("Keterangan/Alasan opname wajib diisi!");
      return;
    }
    const prod = products.find(p => p.id === selectedProductId);
    if (!prod) return;
    
    const physical = Number(physicalCount);
    const currentStock = prod.stock || 0;
    const variance = physical - currentStock;
    
    if (variance === 0) {
      alert("Stok fisik sama dengan stok sistem. Tidak ada penyesuaian yang perlu dilakukan.");
      return;
    }
    
    requestStockOpname({
      tenantId: currentUser?.tenantId || 'tenant_default',
      productId: selectedProductId,
      productName: prod.name,
      branchId: activeBranchId || undefined,
      systemStock: currentStock,
      physicalStock: physical,
      variance,
      reason: opnameReason,
      requestedBy: currentUser?.name || 'Unknown'
    });
    
    setPhysicalCount('');
    setOpnameReason('');
    setSelectedProductId('');
    setOpnameSearch('');
    alert(`Pengajuan Opname berhasil dikirim dan menunggu persetujuan.`);
  };

  const filteredProducts = products.filter(p => {
    const matchBranch = !activeBranchId || p.branchId === activeBranchId || !p.branchId;
    const matchCat = selectedCategory === 'ALL' || p.category === selectedCategory;
    const matchSearch = p.name.toLowerCase().includes(opnameSearch.toLowerCase()) || p.sku.toLowerCase().includes(opnameSearch.toLowerCase());
    return matchBranch && matchCat && matchSearch;
  });

  let filteredMovements = selectedProductId 
    ? stockMovements.filter(sm => sm.productId === selectedProductId && (!activeBranchId || sm.branchId === activeBranchId || !sm.branchId))
    : stockMovements.filter(sm => !activeBranchId || sm.branchId === activeBranchId || !sm.branchId);

  // Apply date filter
  filteredMovements = filteredMovements.filter(sm => {
    const smDate = sm.date.split('T')[0];
    return smDate >= startDate && smDate <= endDate;
  });

  const totalPages = Math.ceil(filteredMovements.length / itemsPerPage);
  const paginatedMovements = filteredMovements.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-slate-200 flex items-center gap-2">
            <PackageSearch className="w-6 h-6 text-indigo-600" />
            Stock Opname & Kartu Stok
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Lacak pergerakan riwayat stok dan sesuaikan fisik barang.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Adjustment Form */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-800 dark:text-slate-200 flex items-center gap-2 border-b border-gray-100 dark:border-slate-800 pb-3">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Stock Opname & Variance
          </h3>
          
          <div className="space-y-3 pb-3 border-b border-gray-100 dark:border-slate-800">
            <div className="relative">
              <Filter className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">Semua Kategori</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="relative">
            <label className="text-xs font-bold text-gray-600 dark:text-slate-400 mb-1 block">Scan Barcode / Cari Produk</label>
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
              <input 
                type="text"
                placeholder="Scan Barcode atau ketik nama produk..."
                className="w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 font-bold"
                value={opnameSearch}
                onFocus={() => setIsDropdownOpen(true)}
                onChange={(e) => {
                  const val = e.target.value;
                  setOpnameSearch(val);
                  setIsDropdownOpen(true);
                  setSelectedProductId('');
                  
                  // Auto-select if exact SKU match (for barcode scanners)
                  const exactMatch = products.find(p => p.sku.toLowerCase() === val.toLowerCase());
                  if (exactMatch) {
                    setSelectedProductId(exactMatch.id);
                    setOpnameSearch(`${exactMatch.sku} - ${exactMatch.name}`);
                    setSelectedCategory(exactMatch.category);
                    setIsDropdownOpen(false);
                  }
                }}
              />
            </div>
            
            {/* Custom Dropdown */}
            {isDropdownOpen && !selectedProductId && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                {filteredProducts.length > 0 ? (
                  filteredProducts.slice(0, 50).map(p => (
                    <div 
                      key={p.id} 
                      className="p-3 hover:bg-indigo-50 cursor-pointer border-b border-gray-50 last:border-0 flex justify-between items-center"
                      onClick={() => {
                        setSelectedProductId(p.id);
                        setOpnameSearch(`${p.sku} - ${p.name}`);
                        setSelectedCategory(p.category);
                        setIsDropdownOpen(false);
                      }}
                    >
                      <div>
                        <div className="font-bold text-sm text-gray-800 dark:text-slate-200">{p.name}</div>
                        <div className="text-xs text-gray-500 dark:text-slate-400">SKU: {p.sku}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-gray-500 dark:text-slate-400 font-semibold uppercase">Stok Inventory</div>
                        <div className="font-bold text-indigo-600 text-sm">{p.stock || 0}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-sm text-gray-500 dark:text-slate-400 text-center font-medium">Produk tidak ditemukan</div>
                )}
              </div>
            )}
          </div>
          {selectedProductId && (
            <>
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 mt-2">
                 <p className="text-xs text-amber-800 font-medium">Stok Sistem saat ini: <b className="text-sm">{products.find(p=>p.id === selectedProductId)?.stock}</b></p>
                 <p className="text-[10px] text-amber-700 mt-1">Masukkan hasil perhitungan fisik aktual di rak/gudang.</p>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 dark:text-slate-400 mb-1 block">Stok Fisik Aktual</label>
                <input 
                  type="number"
                  value={physicalCount}
                  onChange={(e) => setPhysicalCount(e.target.value)}
                  placeholder="Jumlah Fisik"
                  min="0"
                  className="w-full border border-gray-200 dark:border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
                />
              </div>
              {physicalCount !== '' && (
                <div className={`p-2 rounded border text-xs font-bold flex justify-between items-center ${
                  Number(physicalCount) === products.find(p=>p.id === selectedProductId)?.stock 
                  ? 'bg-green-50 text-green-700 border-green-100' 
                  : 'bg-red-50 text-red-700 border-red-100'
                }`}>
                  <span>Selisih (Variance):</span>
                  <span>{Number(physicalCount) - (products.find(p=>p.id === selectedProductId)?.stock || 0)}</span>
                </div>
              )}
              <div className="mt-3">
                <label className="text-xs font-bold text-gray-600 dark:text-slate-400 mb-1 block">Keterangan / Alasan (Wajib)</label>
                <textarea 
                  value={opnameReason}
                  onChange={(e) => setOpnameReason(e.target.value)}
                  placeholder="Misal: Barang rusak, expired, salah hitung..."
                  rows={2}
                  className="w-full border border-gray-200 dark:border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button 
                onClick={handleAdjust}
                className="w-full mt-3 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-sm shadow-xs flex justify-center items-center gap-2"
              >
                <CheckCircle className="w-4 h-4"/> Ajukan Opname
              </button>
            </>
          )}
        </div>

        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex gap-2">
            <button 
              onClick={() => setActiveTab('HISTORY')}
              className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${activeTab === 'HISTORY' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-700 hover:bg-gray-50'}`}
            >
              <History className="w-4 h-4" /> Riwayat Kartu Stok
            </button>
            {['MANAGER', 'OWNER', 'SUPERADMIN', 'PENGURUS'].includes(currentUser?.role || '') && (
              <button 
                onClick={() => setActiveTab('APPROVALS')}
                className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors relative ${activeTab === 'APPROVALS' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-700 hover:bg-gray-50'}`}
              >
                <ClipboardCheck className="w-4 h-4" /> Persetujuan Opname
                {opnameRequests.filter(r => r.status === 'PENDING').length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
                    {opnameRequests.filter(r => r.status === 'PENDING').length}
                  </span>
                )}
              </button>
            )}
          </div>
          
          {activeTab === 'HISTORY' ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col flex-1">
          <div className="p-4 border-b border-gray-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <h3 className="font-bold text-gray-800 dark:text-slate-200 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
              Kartu Stok {selectedProductId ? 'Produk Terpilih' : 'Semua Produk'}
            </h3>
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1 shadow-xs">
              <Calendar className="w-4 h-4 text-slate-400 ml-2" />
              <input 
                type="date" 
                value={startDate}
                onChange={e => { setStartDate(e.target.value); setCurrentPage(1); }}
                className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none p-1 cursor-pointer"
              />
              <span className="text-slate-400 text-xs">-</span>
              <input 
                type="date" 
                value={endDate}
                onChange={e => { setEndDate(e.target.value); setCurrentPage(1); }}
                className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none p-1 cursor-pointer"
              />
            </div>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-slate-400 font-medium text-xs">
                <tr>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Produk</th>
                  <th className="px-4 py-3">Tipe</th>
                  <th className="px-4 py-3">Qty</th>
                  <th className="px-4 py-3">Keterangan</th>
                  <th className="px-4 py-3">User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedMovements.map(m => {
                  const prod = products.find(p => p.id === m.productId);
                  return (
                    <tr key={m.id} className="hover:bg-slate-50 dark:bg-slate-800">
                      <td className="px-4 py-3 whitespace-nowrap text-gray-500 dark:text-slate-400">
                        {new Date(m.date).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-800 dark:text-slate-200">{prod?.name || 'Unknown'}</td>
                      <td className="px-4 py-3">
                        {m.type === 'IN' ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                            <ArrowDownToLine className="w-3 h-3" /> MASUK
                          </span>
                        ) : m.type === 'OUT' ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                            <ArrowUpFromLine className="w-3 h-3" /> KELUAR
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                            <History className="w-3 h-3" /> ADJUST
                          </span>
                        )}
                      </td>
                      <td className={`px-4 py-3 font-bold ${m.type === 'IN' ? 'text-green-600' : 'text-amber-600'}`}>
                        {m.type === 'IN' ? '+' : '-'}{m.qty}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-slate-400">{m.reason}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-slate-400">{m.userId}</td>
                    </tr>
                  );
                })}
                {filteredMovements.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                      <History className="w-10 h-10 mx-auto mb-2 text-slate-200" />
                      Belum ada riwayat pergerakan stok pada periode ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-slate-50 dark:bg-slate-800 border-t border-gray-100 dark:border-slate-800 p-4 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">
                Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredMovements.length)} dari {filteredMovements.length} riwayat
              </span>
              <div className="flex gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-bold disabled:opacity-50"
                >
                  Sebelumnya
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-bold disabled:opacity-50"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          )}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col flex-1">
              <div className="p-4 border-b border-gray-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
                <h3 className="font-bold text-gray-800 dark:text-slate-200 flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-indigo-600" />
                  Persetujuan Opname (Manager)
                </h3>
              </div>
              <div className="overflow-x-auto flex-1 p-4">
                {opnameRequests.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">Belum ada pengajuan opname.</div>
                ) : (
                  <div className="space-y-4">
                    {opnameRequests.map(req => (
                      <div key={req.id} className="border border-gray-200 dark:border-slate-700 rounded-xl p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-bold text-gray-800 dark:text-slate-200">{req.productName}</h4>
                            <p className="text-xs text-gray-500">{new Date(req.requestDate).toLocaleString('id-ID')}</p>
                          </div>
                          {req.status === 'PENDING' ? (
                            <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-[10px] font-bold">MENUNGGU</span>
                          ) : req.status === 'APPROVED' ? (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-[10px] font-bold">DISETUJUI</span>
                          ) : (
                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-[10px] font-bold">DITOLAK</span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 mb-3 bg-gray-50 dark:bg-slate-800 p-2 rounded-lg text-sm text-center">
                          <div>
                            <p className="text-[10px] text-gray-500 font-semibold uppercase">Sistem</p>
                            <p className="font-bold">{req.systemStock}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-500 font-semibold uppercase">Fisik</p>
                            <p className="font-bold">{req.physicalStock}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-500 font-semibold uppercase">Selisih</p>
                            <p className={`font-bold ${req.variance > 0 ? 'text-green-600' : 'text-amber-600'}`}>
                              {req.variance > 0 ? '+' : ''}{req.variance}
                            </p>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-700 dark:text-slate-300 mb-2">
                          <span className="font-semibold text-gray-500">Alasan:</span> {req.reason}
                        </p>
                        <p className="text-xs text-gray-400 mb-3">Diajukan oleh: {req.requestedBy}</p>
                        
                        {req.status === 'PENDING' && (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => { setApprovalReason(''); setApprovalModal({ isOpen: true, id: req.id, isApproved: true }); }}
                              className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-1"
                            >
                              <Check className="w-4 h-4"/> Setujui
                            </button>
                            <button 
                              onClick={() => { setApprovalReason(''); setApprovalModal({ isOpen: true, id: req.id, isApproved: false }); }}
                              className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-1"
                            >
                              <XCircle className="w-4 h-4"/> Tolak
                            </button>
                          </div>
                        )}
                        {req.status !== 'PENDING' && (
                          <div className="mt-3 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm border border-slate-100 dark:border-slate-700">
                            <p className="font-semibold text-gray-700 dark:text-slate-300">Catatan Approval:</p>
                            <p className="text-gray-600 dark:text-slate-400 italic">{req.approvalReason || '-'}</p>
                            <p className="text-xs text-gray-400 mt-1">Oleh: {req.approvedBy}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Approval Modal */}
      {approvalModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className={`p-4 border-b ${approvalModal.isApproved ? 'border-green-100 bg-green-50' : 'border-red-100 bg-red-50'} flex justify-between items-center`}>
              <h3 className={`font-bold ${approvalModal.isApproved ? 'text-green-800' : 'text-red-800'} flex items-center gap-2`}>
                {approvalModal.isApproved ? <CheckCircle className="w-5 h-5"/> : <XCircle className="w-5 h-5"/>}
                Keterangan {approvalModal.isApproved ? 'Persetujuan' : 'Penolakan'}
              </h3>
              <button onClick={() => setApprovalModal({ isOpen: false, id: '', isApproved: false })} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-gray-600 dark:text-slate-400">
                Mohon isi keterangan manual terkait {approvalModal.isApproved ? 'disetujui karena apa' : 'ditolak karena apa'} agar tercatat di sistem:
              </p>
              <textarea 
                value={approvalReason}
                onChange={e => setApprovalReason(e.target.value)}
                placeholder="Ketik keterangan persetujuan/penolakan..."
                rows={4}
                className="w-full border border-gray-300 dark:border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setApprovalModal({ isOpen: false, id: '', isApproved: false })}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-bold"
                >
                  Batal
                </button>
                <button 
                  onClick={() => {
                    if (!approvalReason.trim()) { alert('Keterangan wajib diisi!'); return; }
                    reviewStockOpname(approvalModal.id, approvalModal.isApproved, approvalReason, currentUser?.name || 'Manager');
                    setApprovalModal({ isOpen: false, id: '', isApproved: false });
                    alert(`Pengajuan berhasil di${approvalModal.isApproved ? 'setujui' : 'tolak'}.`);
                  }}
                  className={`flex-1 py-2.5 text-white rounded-lg font-bold ${approvalModal.isApproved ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                >
                  Konfirmasi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
