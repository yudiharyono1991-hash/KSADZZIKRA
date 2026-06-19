import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Product } from '../types';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  AlertTriangle, 
  CheckCircle, 
  Package, 
  Tag, 
  Info,
  DollarSign
} from 'lucide-react';

export default function InventoryPage() {
  const { products, addProduct, updateProduct, deleteProduct, adjustStock, currentUser, activeBranchId } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  
  // Modals status
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form Fields State
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Sembako');
  const [price, setPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [marginPct, setMarginPct] = useState('');
  const [stock, setStock] = useState('');
  const [minStock, setMinStock] = useState('');
  const [unit, setUnit] = useState('Pcs');
  const [barcode, setBarcode] = useState('');
  const [wholesalePrice, setWholesalePrice] = useState<number | ''>('');
  const [wholesaleMinQty, setWholesaleMinQty] = useState<number | ''>('');
  const [image, setImage] = useState('');

  const categories = ['Sembako', 'Fresh Food', 'Minuman', 'Kebutuhan Rumah'];

  // Stats Counters
  const totalSku = products.length;
  const outOfStock = products.filter(p => p.stock === 0).length;
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= p.minStock).length;
  const totalValue = products.reduce((sum, p) => sum + (p.costPrice * p.stock), 0);

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || product.category === selectedCategory;
    const matchesBranch = !activeBranchId || product.branchId === activeBranchId || !product.branchId;
    return matchesSearch && matchesCategory && matchesBranch;
  });

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setSku(`SKU-${Math.floor(1000 + Math.random() * 9000)}`);
    setName('');
    setCategory('Sembako');
    setPrice('');
    setCostPrice('');
    setMarginPct('');
    setStock('');
    setMinStock('10');
    setUnit('Pcs');
    setBarcode('');
    setWholesalePrice('');
    setWholesaleMinQty('');
    setImage('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setSku(p.sku);
    setName(p.name);
    setCategory(p.category);
    setPrice(p.price.toString());
    setCostPrice(p.costPrice.toString());
    const m = p.costPrice > 0 ? ((p.price - p.costPrice) / p.costPrice * 100).toFixed(1) : '0';
    setMarginPct(m);
    setStock(p.stock.toString());
    setMinStock(p.minStock.toString());
    setUnit(p.unit);
    setBarcode(p.barcode || '');
    setWholesalePrice(p.wholesalePrice || '');
    setWholesaleMinQty(p.wholesaleMinQty || '');
    setImage(p.image || '');
    setIsModalOpen(true);
  };

  const handleCostPriceChange = (val: string) => {
    setCostPrice(val);
    const cp = Number(val);
    const m = Number(marginPct);
    if (cp > 0 && m > 0) {
      const sp = cp + (cp * m / 100);
      setPrice(Math.round(sp).toString());
    }
  };

  const handleMarginChange = (val: string) => {
    setMarginPct(val);
    const cp = Number(costPrice);
    const m = Number(val);
    if (cp > 0 && m >= 0) {
      const sp = cp + (cp * m / 100);
      setPrice(Math.round(sp).toString());
    }
  };

  const handlePriceChange = (val: string) => {
    setPrice(val);
    const cp = Number(costPrice);
    const sp = Number(val);
    if (cp > 0 && sp >= cp) {
      const m = ((sp - cp) / cp * 100).toFixed(1);
      setMarginPct(m);
    } else {
      setMarginPct('0');
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const sellPrice = Number(price);
    const buyPrice = Number(costPrice);
    
    if (sellPrice < buyPrice) {
      alert("Syariah Alert: Harga Jual tidak boleh lebih rendah dari Harga Beli (Harga Modal) untuk menjaga akad perdagangan yang adil/halal.");
      return;
    }

    const dataPayload = {
      sku,
      name,
      category,
      price: sellPrice,
      costPrice: buyPrice,
      stock: Number(stock),
      minStock: Number(minStock),
      unit,
      barcode: barcode || undefined,
      wholesalePrice: wholesalePrice ? Number(wholesalePrice) : undefined,
      wholesaleMinQty: wholesaleMinQty ? Number(wholesaleMinQty) : undefined,
      isHalal: true,
      image: image || undefined
    };

    if (editingProduct) {
      updateProduct({
        ...dataPayload,
        id: editingProduct.id
      });
    } else {
      addProduct(dataPayload);
    }
    
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-xs font-semibold">Total SKU Terdaftar</p>
            <h3 className="text-2xl font-black text-gray-800 mt-1">{totalSku} Item</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-xs font-semibold">Habis Pemesanan (0 Stok)</p>
            <h3 className="text-2xl font-black text-red-600 mt-1">{outOfStock} SKU</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-500">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-xs font-semibold">Stok Menipis (Limit Alert)</p>
            <h3 className="text-2xl font-black text-amber-600 mt-1">{lowStock} SKU</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-xs font-semibold">Estimasi Modal Inventori</p>
            <h3 className="text-xl font-extrabold text-emerald-800 mt-1">Rp {totalValue.toLocaleString('id-ID')}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* List / Stock Control Controls panel */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        {/* Table Filter Topbar */}
        <div className="p-5 border-b border-gray-100 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="w-4 h-4 text-gray-400" />
              </span>
              <input
                type="text"
                placeholder="Cari SKU / nama produk..."
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-xs leading-none w-64 focus:outline-none focus:ring-2 focus:ring-emerald-500/25"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* Category selection */}
            <select
              className="border border-gray-200 rounded-lg py-2 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="ALL">Semua Kategori</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleOpenAdd}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-2 px-4 rounded-lg flex items-center space-x-1 shadow-xs active:scale-98 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah SKU</span>
          </button>
        </div>

        {/* Master Products Listing Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 uppercase tracking-widest text-[10px] text-gray-500 font-bold border-b border-gray-100">
              <tr>
                <th className="py-3 px-5">SKU / Code</th>
                <th className="py-3 px-5">Nama Barang</th>
                <th className="py-3 px-5">Kategori</th>
                <th className="py-2.5 px-4 text-right">Harga Modal</th>
                <th className="py-2.5 px-4 text-right">Harga Jual</th>
                <th className="py-2.5 px-4 text-center">Margin Untung</th>
                <th className="py-3 px-5 text-center">Sisa Stok</th>
                <th className="py-3 px-5 text-center">Status</th>
                <th className="py-3 px-5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-gray-400">
                    Tidak ada barang inventori untuk ditampilkan.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const profitAmt = p.price - p.costPrice;
                  const marginPct = p.costPrice > 0 ? ((profitAmt / p.price) * 100).toFixed(1) : '0';
                  const isOutOfStock = p.stock === 0;
                  const isLowStock = p.stock > 0 && p.stock <= p.minStock;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-5 font-mono text-gray-500 font-semibold">{p.sku}</td>
                      <td className="py-3 px-5 font-bold text-gray-900">{p.name}</td>
                      <td className="py-3 px-5">
                        <span className="bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 rounded border border-slate-200">
                          {p.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-gray-600">
                        Rp {p.costPrice.toLocaleString('id-ID')}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <p className="font-bold text-emerald-700">Rp {p.price.toLocaleString('id-ID')}</p>
                        {p.wholesalePrice && p.wholesaleMinQty && (
                          <p className="text-[10px] text-emerald-600 font-bold bg-emerald-50 inline-block px-1.5 py-0.5 rounded border border-emerald-100">
                            Grosir: Rp {p.wholesalePrice.toLocaleString('id-ID')} (≥{p.wholesaleMinQty})
                          </p>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span className="text-emerald-700 font-semibold font-mono">
                          Rp {profitAmt.toLocaleString('id-ID')} ({marginPct}%)
                        </span>
                      </td>
                      <td className="py-3 px-5 text-center font-mono font-bold">
                        {p.stock} <span className="text-gray-400 font-sans text-[10px] font-normal">{p.unit}</span>
                      </td>
                      <td className="py-3 px-5 text-center">
                        {isOutOfStock ? (
                          <span className="bg-red-50 text-red-700 border border-red-100 text-[10px] px-2 py-0.5 rounded font-bold">
                            Habis
                          </span>
                        ) : isLowStock ? (
                          <span className="bg-amber-50 text-amber-700 border border-amber-100 text-[10px] px-2 py-0.5 rounded font-bold flex items-center justify-center space-x-1 max-w-[100px] mx-auto">
                            <AlertTriangle className="w-3 h-3 text-amber-500" />
                            <span>Kritis</span>
                          </span>
                        ) : (
                          <span className="bg-emerald-50 text-emerald-800 border border-emerald-100 text-[10px] px-2 py-0.5 rounded font-bold">
                            Sehat
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-5 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1 rounded bg-slate-50 border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 text-gray-600 transition-colors"
                            title="Edit SKU"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          
                          <button
                            onClick={() => {
                              const amountStr = prompt(`Tambah/Kurang stok ${p.name}. Masukkan angka (misal: 10 atau -5):`);
                              const amount = Number(amountStr);
                              if (!isNaN(amount) && amount !== 0) {
                                adjustStock(p.id, amount);
                              }
                            }}
                            className="p-1 rounded bg-slate-50 border border-gray-200 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-800 text-gray-600 text-[10px] font-bold px-1.5"
                            title="Atur Jumlah Stok"
                          >
                            +/- Stok
                          </button>

                          <button
                            onClick={() => {
                              if (confirm(`Apakah Anda yakin mencabut SKU ${p.name} dari catalog?`)) {
                                deleteProduct(p.id);
                              }
                            }}
                            className="p-1 rounded bg-slate-50 border border-gray-200 hover:border-red-300 hover:bg-red-50 hover:text-red-700 text-gray-400 hover:text-red-600"
                            title="Hapus SKU"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inventory Modal Sheet: Create / Edit Products */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 bg-slate-50 flex justify-between items-center">
              <h3 className="font-extrabold text-gray-800 text-md">
                {editingProduct ? 'Ubah SKU Inventori' : 'Tambah SKU Baru'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit}>
              <div className="p-6 space-y-4 max-h-[420px] overflow-y-auto">
                
                {/* isPriceEditLockedForAdmin definition */}
                {(() => {
                  const isPriceEditLockedForAdmin = (currentUser?.role === 'ADMIN' && editingProduct && editingProduct.stock > editingProduct.minStock) || currentUser?.role === 'CASHIER';
                  
                  return (
                    <>
                      {/* Visual shariah warning */}
                      <div className="bg-amber-50 text-amber-900 text-xs p-3 rounded-xl border border-amber-100 flex flex-col space-y-2">
                        <div className="flex items-start space-x-2.5">
                          <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                          <p className="leading-normal">
                            Pencatatan SKU ini wajib berdasar pada komoditas rill (<b>Halalan Thayyiban</b>). Menentukan margin sewajarnya untuk menjaga etika kemaslahatan konsumen.
                          </p>
                        </div>
                        {currentUser?.role === 'CASHIER' ? (
                          <div className="bg-red-50 text-red-800 p-2.5 rounded-lg border border-red-200/80 text-[10px] font-bold">
                            ⚠️ AKSES HARGA TERKUNCI: Sebagai Kasir, Anda tidak diperkenankan mengubah harga jual, harga pokok (modal), atau margin keuntungan barang sembako. Silakan hubungi Owner atau Admin untuk meng-update katalog harga resmi.
                          </div>
                        ) : isPriceEditLockedForAdmin && (
                          <div className="bg-red-50 text-red-800 p-2.5 rounded-lg border border-red-200/80 text-[10px] font-bold">
                            ⚠️ AKSES HARGA TERKUNCI: Berdasarkan aturan UMKM BA Mart, akun Superadmin hanya diperkenankan mengupdate harga barang sembako jika stok tersisa menipis (sedang low kurang dari atau sama dengan batas minimum). Untuk merubah harga saat stok aman, silakan login dengan akun Owner.
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-600">Kode SKU</label>
                          <input
                            type="text"
                            className="w-full border border-gray-200 rounded-lg py-2 px-3 text-xs font-mono font-bold bg-gray-50 focus:outline-none"
                            value={sku}
                            onChange={(e) => setSku(e.target.value)}
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-600">Kategori</label>
                          <select
                            className="w-full border border-gray-200 rounded-lg py-2 px-3 text-xs focus:outline-none"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                          >
                            {categories.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-600">Nama Barang</label>
                        <input
                          type="text"
                          className="w-full border border-gray-200 rounded-lg py-2 px-3 text-xs"
                          placeholder="Contoh: Beras Pandan Wangi 5kg"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-600">Satuan Unit</label>
                          <input
                            type="text"
                            className="w-full border border-gray-200 rounded-lg py-2 px-3 text-xs"
                            placeholder="Pcs, Kg, Botol, dll"
                            value={unit}
                            onChange={(e) => setUnit(e.target.value)}
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-600">Stok Awal</label>
                          <input
                            type="number"
                            className="w-full border border-gray-200 rounded-lg py-2 px-3 text-xs"
                            value={stock}
                            onChange={(e) => setStock(e.target.value)}
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-600">Batas Minimum</label>
                          <input
                            type="number"
                            className="w-full border border-gray-200 rounded-lg py-2 px-3 text-xs"
                            value={minStock}
                            onChange={(e) => setMinStock(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-600">Harga Modal (Beli)</label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-gray-400 font-bold">Rp</span>
                            <input
                              type="number"
                              disabled={isPriceEditLockedForAdmin}
                              className={`w-full border border-gray-200 rounded-lg py-2 pl-8 pr-3 text-xs font-bold ${
                                isPriceEditLockedForAdmin ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-dashed' : ''
                              }`}
                              value={costPrice}
                              onChange={(e) => handleCostPriceChange(e.target.value)}
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-emerald-600">Margin Profit (%)</label>
                          <div className="relative">
                            <input
                              type="number"
                              disabled={isPriceEditLockedForAdmin}
                              className={`w-full border border-emerald-200 rounded-lg py-2 pl-3 pr-8 text-xs font-bold ${
                                isPriceEditLockedForAdmin ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-dashed' : 'bg-emerald-50 focus:ring-2 focus:ring-emerald-500/20'
                              } outline-none`}
                              value={marginPct}
                              onChange={(e) => handleMarginChange(e.target.value)}
                              placeholder="Misal: 10"
                            />
                            <span className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-emerald-600 font-bold">%</span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-600">Harga Jual POS</label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-gray-400 font-bold">Rp</span>
                            <input
                              type="number"
                              disabled={isPriceEditLockedForAdmin}
                              className={`w-full border border-gray-200 rounded-lg py-2 pl-8 pr-3 text-xs font-bold ${
                                isPriceEditLockedForAdmin ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-dashed' : 'bg-emerald-50/20 focus:ring-2 focus:ring-emerald-500/20'
                              } outline-none`}
                              value={price}
                              onChange={(e) => handlePriceChange(e.target.value)}
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-emerald-600">Harga Grosir (Opsional)</label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-emerald-400 font-bold">Rp</span>
                            <input
                              type="number"
                              disabled={isPriceEditLockedForAdmin}
                              className={`w-full border border-emerald-200 rounded-lg py-2 pl-8 pr-3 text-xs font-bold ${
                                isPriceEditLockedForAdmin ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-dashed' : 'bg-emerald-50'
                              }`}
                              value={wholesalePrice}
                              onChange={(e) => setWholesalePrice(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-emerald-600">Min. Qty Grosir</label>
                          <input
                            type="number"
                            disabled={isPriceEditLockedForAdmin}
                            className={`w-full border border-emerald-200 rounded-lg py-2 px-3 text-xs font-bold ${
                              isPriceEditLockedForAdmin ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-dashed' : 'bg-emerald-50'
                            }`}
                            value={wholesaleMinQty}
                            onChange={(e) => setWholesaleMinQty(e.target.value)}
                            placeholder="Misal: 5"
                          />
                        </div>
                      </div>
                    </>
                  );
                })()}

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600">Scan Barcode / Kode Batang (Opsional)</label>
                  <input
                    type="text"
                    className="w-full border border-gray-200 rounded-lg py-2 px-3 text-xs font-mono"
                    placeholder="Masukkan Barcode..."
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600">URL Gambar/Foto Produk (Opsional)</label>
                  <input
                    type="text"
                    className="w-full border border-gray-200 rounded-lg py-2 px-3 text-xs"
                    placeholder="Misal: https://images.unsplash.com/..."
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                  />
                </div>
              </div>

              {/* Form actions */}
              <div className="p-4 bg-slate-50 border-t border-gray-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2 px-4 bg-white border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-xs"
                >
                  Simpan SKU
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
