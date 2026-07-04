import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Product } from '../types';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  Smartphone, 
  Tag, 
  Info,
  DollarSign,
  Wifi,
  CheckCircle
} from 'lucide-react';

export default function PPOBInventoryPage() {
  const { products, addProduct, updateProduct, deleteProduct, currentUser, activeBranchId, coaList } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('ALL');

  // Modals status
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form Fields State
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [salesCoaCode, setSalesCoaCode] = useState('');
  const [cogsCoaCode, setCogsCoaCode] = useState('');

  // Default PPOB Providers
  const ppobProviders = ['Pulsa Telkomsel', 'Pulsa Indosat', 'Pulsa XL', 'Token Listrik', 'Tagihan PDAM', 'BPJS Kesehatan', 'Topup Dana', 'Topup GoPay', 'Topup OVO', 'Topup ShopeePay', 'Voucher Game', 'Lainnya'];

  // Filter products: Only show PPOB
  const ppobProducts = products.filter(p => p.isPPOB);
  
  // Extract unique categories (providers) currently in use
  const activeProviders = Array.from(new Set(ppobProducts.map(p => p.category)));

  const filteredProducts = ppobProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProvider = selectedProvider === 'ALL' || product.category === selectedProvider;
    const matchesBranch = !activeBranchId || product.branchId === activeBranchId || !product.branchId;
    return matchesSearch && matchesProvider && matchesBranch;
  });

  const totalPPOB = ppobProducts.length;

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setSku(`PPOB-${Math.floor(1000 + Math.random() * 9000)}`);
    setName('');
    setCategory('');
    setPrice('');
    setCostPrice('');
    setSalesCoaCode('');
    setCogsCoaCode('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setSku(p.sku);
    setName(p.name);
    setCategory(p.category);
    setPrice(p.price.toString());
    setCostPrice(p.costPrice.toString());
    setSalesCoaCode(p.salesCoaCode || '');
    setCogsCoaCode(p.cogsCoaCode || '');
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!category.trim()) {
      alert("Silakan pilih atau ketik nama Provider / Kategori PPOB!");
      return;
    }

    const sellPrice = Number(price);
    const buyPrice = Number(costPrice);
    
    const dataPayload = {
      tenantId: currentUser?.tenantId || 'tenant_default',
      sku,
      name,
      category,
      price: sellPrice,
      costPrice: buyPrice,
      stock: 9999, // PPOB is unlimited
      minStock: 0,
      unit: 'Trx',
      isHalal: true, // Services are assumed halal
      isPPOB: true,
      salesCoaCode: salesCoaCode || undefined,
      cogsCoaCode: cogsCoaCode || undefined
    };

    if (editingProduct) {
      updateProduct({
        ...dataPayload,
        id: editingProduct.id
      });
    } else {
      addProduct(dataPayload);
    }
    
    setIsModalOpen(true);
    setIsModalOpen(false); // Close
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-blue-900 to-indigo-800 p-6 rounded-2xl text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
          <Wifi size={150} />
        </div>
        
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3">
            <Smartphone className="w-8 h-8 text-blue-300" />
            Master Data PPOB & Digital
          </h1>
          <p className="text-blue-100 mt-2 text-sm md:text-base max-w-xl leading-relaxed">
            Kelola produk non-fisik (Pulsa, Token, Tagihan, Topup) secara terpisah. PPOB tidak memerlukan stok fisik dan langsung terhubung dengan tab PPOB di Kasir POS.
          </p>
        </div>
        <div className="flex flex-col md:items-end gap-2 shrink-0">
          <button 
            onClick={handleOpenAdd}
            className="bg-white text-blue-900 hover:bg-blue-50 px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
          >
            <Plus size={18} /> Tambah PPOB Baru
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="bg-blue-100 p-3 rounded-xl text-blue-600">
            <Tag size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Layanan PPOB</p>
            <p className="text-2xl font-black text-slate-800">{totalPPOB}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="bg-indigo-100 p-3 rounded-xl text-indigo-600">
            <Wifi size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Jumlah Provider</p>
            <p className="text-2xl font-black text-slate-800">{activeProviders.length}</p>
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
          <button 
            onClick={() => setSelectedProvider('ALL')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-colors ${selectedProvider === 'ALL' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Semua PPOB
          </button>
          {activeProviders.map(prov => (
            <button 
              key={prov}
              onClick={() => setSelectedProvider(prov)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-colors ${selectedProvider === prov ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {prov}
            </button>
          ))}
        </div>
        
        <div className="relative w-full md:w-72 shrink-0">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Cari Layanan PPOB / SKU..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-100 text-xs uppercase tracking-wider text-slate-500 font-bold">
                <th className="p-4">SKU & Layanan</th>
                <th className="p-4">Provider / Kategori</th>
                <th className="p-4 text-right">Harga Modal</th>
                <th className="p-4 text-right">Harga Jual</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    <Smartphone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="font-medium">Belum ada layanan PPOB yang sesuai kriteria.</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map(product => (
                  <tr key={product.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">{product.name}</span>
                        <span className="text-xs text-slate-500 font-mono mt-1">{product.sku}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-100">
                        {product.category}
                      </span>
                    </td>
                    <td className="p-4 text-right font-medium text-slate-600">
                      Rp {product.costPrice.toLocaleString('id-ID')}
                    </td>
                    <td className="p-4 text-right font-bold text-slate-800">
                      Rp {product.price.toLocaleString('id-ID')}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleOpenEdit(product)}
                          className="p-1.5 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors"
                          title="Edit PPOB"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => {
                            if (confirm(`Hapus layanan ${product.name}?`)) {
                              deleteProduct(product.id);
                            }
                          }}
                          className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                          title="Hapus Layanan"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit PPOB Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                {editingProduct ? 'Edit Layanan PPOB' : 'Tambah Layanan PPOB'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:bg-gray-100 p-2 rounded-full transition-colors">
                <Trash2 className="w-5 h-5 opacity-0" /> {/* Just spacing */}
                <span className="absolute right-6 top-6">✕</span>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="ppobForm" onSubmit={handleFormSubmit} className="space-y-5">
                
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 text-sm text-blue-800">
                  <Info className="w-5 h-5 shrink-0 text-blue-600" />
                  <p>
                    <strong>Info PPOB:</strong> Produk PPOB tidak memerlukan stok fisik (unlimited) dan akan muncul pada Tab Khusus PPOB di Kasir POS.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Kode SKU</label>
                    <input 
                      type="text" 
                      required 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      value={sku}
                      onChange={e => setSku(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Provider / Kategori</label>
                    <input 
                      type="text"
                      list="ppob-providers"
                      required
                      placeholder="Ketik / Pilih Provider..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                    />
                    {/* Datalist makes it a combobox where users can select or type their own! */}
                    <datalist id="ppob-providers">
                      {ppobProviders.map(prov => <option key={prov} value={prov} />)}
                      {activeProviders.filter(p => !ppobProviders.includes(p)).map(prov => <option key={prov} value={prov} />)}
                    </datalist>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Nama Layanan (Deskripsi di Struk)</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Contoh: Pulsa Telkomsel 50.000"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <DollarSign className="w-4 h-4 text-gray-500" /> Harga Modal (Beli)
                    </label>
                    <input 
                      type="number" 
                      required
                      min="0"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      value={costPrice}
                      onChange={e => setCostPrice(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <DollarSign className="w-4 h-4 text-green-500" /> Harga Jual (Konsumen)
                    </label>
                    <input 
                      type="number" 
                      required
                      min={costPrice || 0}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                      value={price}
                      onChange={e => setPrice(e.target.value)}
                    />
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4 mt-2">
                  <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-500" />
                    Pemetaan Akun (CoA) Keuangan
                  </h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700">Akun Pendapatan PPOB</label>
                      <select
                        className="w-full border border-gray-300 rounded-lg py-2 px-3 text-xs focus:ring-2 focus:ring-blue-500"
                        value={salesCoaCode}
                        onChange={(e) => setSalesCoaCode(e.target.value)}
                      >
                        <option value="">-- Bebas / Default --</option>
                        {coaList.filter(c => c.category === 'REVENUE').map(coa => (
                          <option key={coa.code} value={coa.code}>{coa.code} - {coa.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700">Akun Beban Pokok PPOB</label>
                      <select
                        className="w-full border border-gray-300 rounded-lg py-2 px-3 text-xs focus:ring-2 focus:ring-blue-500"
                        value={cogsCoaCode}
                        onChange={(e) => setCogsCoaCode(e.target.value)}
                      >
                        <option value="">-- Bebas / Default --</option>
                        {coaList.filter(c => c.category === 'EXPENSE').map(coa => (
                          <option key={coa.code} value={coa.code}>{coa.code} - {coa.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

              </form>
            </div>
            
            <div className="p-5 border-t border-gray-100 flex justify-end gap-3 bg-slate-50 rounded-b-2xl">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition-colors"
              >
                Batal
              </button>
              <button 
                type="submit" 
                form="ppobForm"
                className="px-5 py-2.5 rounded-xl font-bold text-white bg-blue-700 hover:bg-blue-800 transition-colors shadow-md flex items-center gap-2"
              >
                <CheckCircle size={18} /> {editingProduct ? 'Simpan Perubahan' : 'Simpan Layanan PPOB'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
