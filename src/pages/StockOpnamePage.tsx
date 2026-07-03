import React, { useState } from 'react';
import { useAppStore } from '../store';
import { PackageSearch, History, ArrowDownToLine, ArrowUpFromLine, AlertTriangle, FileSpreadsheet, CheckCircle, Search, Filter } from 'lucide-react';

export default function StockOpnamePage() {
  const { products, stockMovements, adjustStock, currentUser, activeBranchId, addLog } = useAppStore();
  const [selectedProductId, setSelectedProductId] = useState('');
  const [physicalCount, setPhysicalCount] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const categories = ['Sembako', 'Fresh Food', 'Minuman', 'Kebutuhan Rumah'];
  
  if (currentUser?.role !== 'OWNER' && currentUser?.role !== 'ADMIN') {
    return <div className="p-6 text-red-500 font-bold">Akses ditolak.</div>;
  }

  const handleAdjust = () => {
    if (!selectedProductId || physicalCount === '') return;
    const prod = products.find(p => p.id === selectedProductId);
    if (!prod) return;
    
    const physical = Number(physicalCount);
    const currentStock = prod.stock || 0;
    const variance = physical - currentStock;
    
    if (variance === 0) {
      alert("Stok fisik sama dengan stok sistem. Tidak ada penyesuaian yang perlu dilakukan.");
      return;
    }
    
    adjustStock(selectedProductId, variance);
    
    addLog('STOCK_OPNAME', 'INVENTORY', `Opname: ${prod.name}. Fisik: ${physical}, Sistem sblm: ${currentStock}. Variance: ${variance > 0 ? '+' : ''}${variance}`);
    
    setPhysicalCount('');
    alert(`Stok berhasil disesuaikan! Selisih ${variance > 0 ? '+' : ''}${variance} dicatat di Audit Log.`);
  };

  const filteredProducts = products.filter(p => {
    const matchBranch = !activeBranchId || p.branchId === activeBranchId || !p.branchId;
    const matchCat = selectedCategory === 'ALL' || p.category === selectedCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchBranch && matchCat && matchSearch;
  });

  const filteredMovements = selectedProductId 
    ? stockMovements.filter(sm => sm.productId === selectedProductId && (!activeBranchId || sm.branchId === activeBranchId || !sm.branchId))
    : stockMovements.filter(sm => !activeBranchId || sm.branchId === activeBranchId || !sm.branchId);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <PackageSearch className="w-6 h-6 text-indigo-600" />
            Stock Opname & Kartu Stok
          </h1>
          <p className="text-sm text-gray-500 mt-1">Lacak pergerakan riwayat stok dan sesuaikan fisik barang.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Adjustment Form */}
        <div className="lg:col-span-1 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-800 flex items-center gap-2 border-b border-gray-100 pb-3">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Stock Opname & Variance
          </h3>
          
          <div className="space-y-3 pb-3 border-b border-gray-100">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari SKU / nama produk..."
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="relative">
              <Filter className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">Semua Kategori</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-600 mb-1 block">Pilih Produk untuk Opname</label>
            <select 
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Silakan Pilih Produk --</option>
              {filteredProducts.map(p => (
                <option key={p.id} value={p.id}>{p.sku} - {p.name} (Sistem: {p.stock})</option>
              ))}
            </select>
          </div>
          {selectedProductId && (
            <>
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 mt-2">
                 <p className="text-xs text-amber-800 font-medium">Stok Sistem saat ini: <b className="text-sm">{products.find(p=>p.id === selectedProductId)?.stock}</b></p>
                 <p className="text-[10px] text-amber-700 mt-1">Masukkan hasil perhitungan fisik aktual di rak/gudang.</p>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">Stok Fisik Aktual</label>
                <input 
                  type="number"
                  value={physicalCount}
                  onChange={(e) => setPhysicalCount(e.target.value)}
                  placeholder="Jumlah Fisik"
                  min="0"
                  className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
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
              <button 
                onClick={handleAdjust}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-sm shadow-xs flex justify-center items-center gap-2"
              >
                <CheckCircle className="w-4 h-4"/> Setujui Opname (Approve)
              </button>
            </>
          )}
        </div>

        {/* Stock Card Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-100 bg-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
              Kartu Stok {selectedProductId ? 'Produk Terpilih' : 'Semua Produk'}
            </h3>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/50 text-gray-500 font-medium text-xs">
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
                {filteredMovements.map(m => {
                  const prod = products.find(p => p.id === m.productId);
                  return (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                        {new Date(m.date).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-800">{prod?.name || 'Unknown'}</td>
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
                      <td className="px-4 py-3 text-xs text-gray-500">{m.reason}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{m.userId}</td>
                    </tr>
                  );
                })}
                {filteredMovements.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                      <History className="w-10 h-10 mx-auto mb-2 text-slate-200" />
                      Belum ada riwayat pergerakan stok.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
