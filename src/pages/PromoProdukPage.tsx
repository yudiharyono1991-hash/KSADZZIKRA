import React, { useState, useMemo } from 'react';
import { useBranchData } from '../hooks/useBranchData';
import { Percent, Search, Save, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Product } from '../types';

export default function PromoProdukPage() {
  const { products, updateProduct, currentUser, activeBranchId, addLog } = useBranchData();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  
  // States for fast inline editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<number>(0);
  const [tempActive, setTempActive] = useState<boolean>(false);

  // Authorization check
  if (!['ADMIN', 'OWNER', 'SUPERADMIN', 'MANAGER', 'PENGURUS'].includes(currentUser?.role || '')) {
    return <div className="p-6 text-red-500 font-bold">Akses ditolak. Anda tidak memiliki izin untuk mengelola promo.</div>;
  }

  const filteredProducts = useMemo(() => {
    let list = products;
    if (activeBranchId) {
      list = list.filter(p => p.branchId === activeBranchId || !p.branchId);
    }
    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(lower) || p.sku.toLowerCase().includes(lower));
    }
    // Sort active promos first
    return list.sort((a, b) => {
      if (a.isPromoActive && !b.isPromoActive) return -1;
      if (!a.isPromoActive && b.isPromoActive) return 1;
      return 0;
    });
  }, [products, searchQuery, activeBranchId]);

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setTempPrice(product.promoPrice || product.price);
    setTempActive(product.isPromoActive || false);
  };

  const handleSave = (product: Product) => {
    if (tempActive && tempPrice <= 0) {
      alert("Harga Promo harus lebih besar dari 0 jika status promo diaktifkan.");
      return;
    }
    if (tempActive && tempPrice >= product.price) {
      alert("Harga Promo harus lebih murah dari Harga Normal.");
      return;
    }

    const updated = {
      ...product,
      promoPrice: tempPrice,
      isPromoActive: tempActive
    };
    
    updateProduct(updated);
    addLog('PROMO_UPDATE', 'INVENTORY', `Mengupdate status promo untuk ${product.name}: Aktif=${tempActive}, Harga=${tempPrice}`);
    setEditingId(null);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-green-100">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg shadow-green-500/20">
            <Percent className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Manajemen Promo Produk</h1>
            <p className="text-sm font-semibold text-slate-500 mt-1">Atur harga diskon untuk produk tertentu agar otomatis tampil di kategori PROMO</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari produk (Nama atau SKU)..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 font-medium outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/50 border-b border-slate-200 text-slate-600 text-[11px] uppercase tracking-wider font-bold">
                <th className="p-4">Info Produk</th>
                <th className="p-4">Harga Normal</th>
                <th className="p-4">Status Promo</th>
                <th className="p-4">Harga Promo</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(p => {
                const isEditing = editingId === p.id;
                return (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{p.name}</div>
                      <div className="text-xs text-slate-500">SKU: {p.sku} | Kat: {p.category}</div>
                    </td>
                    <td className="p-4 font-bold text-slate-700">
                      Rp {p.price.toLocaleString('id-ID')}
                    </td>
                    <td className="p-4">
                      {isEditing ? (
                        <select
                          value={tempActive ? 'true' : 'false'}
                          onChange={(e) => setTempActive(e.target.value === 'true')}
                          className="px-2 py-1 border border-slate-300 rounded text-sm font-bold"
                        >
                          <option value="false">TIDAK AKTIF</option>
                          <option value="true">AKTIF</option>
                        </select>
                      ) : (
                        p.isPromoActive ? 
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] uppercase font-black rounded flex items-center w-max gap-1">
                            <CheckCircle2 className="w-3 h-3" /> AKTIF
                          </span> : 
                          <span className="px-2 py-1 bg-slate-100 text-slate-500 text-[10px] uppercase font-bold rounded">Tidak Aktif</span>
                      )}
                    </td>
                    <td className="p-4">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-500">Rp</span>
                          <input
                            type="number"
                            value={tempPrice}
                            onChange={(e) => setTempPrice(Number(e.target.value))}
                            className="w-24 px-2 py-1 border border-slate-300 rounded text-sm font-bold focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                      ) : (
                        <span className={`font-bold ${p.isPromoActive ? 'text-red-600' : 'text-slate-400'}`}>
                          Rp {(p.promoPrice || 0).toLocaleString('id-ID')}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {isEditing ? (
                        <button
                          onClick={() => handleSave(p)}
                          className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors mx-auto"
                        >
                          <Save className="w-4 h-4" /> Simpan
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEdit(p)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                        >
                          Atur Promo
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 font-medium">
                    Tidak ada produk ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {filteredProducts.length > itemsPerPage && (
          <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between">
            <span className="text-sm text-slate-500 font-medium">
              Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredProducts.length)} dari {filteredProducts.length} produk
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-slate-600" />
              </button>
              <span className="text-sm font-bold text-slate-700 min-w-[3rem] text-center">
                {currentPage} / {Math.ceil(filteredProducts.length / itemsPerPage)}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredProducts.length / itemsPerPage), p + 1))}
                disabled={currentPage === Math.ceil(filteredProducts.length / itemsPerPage)}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
