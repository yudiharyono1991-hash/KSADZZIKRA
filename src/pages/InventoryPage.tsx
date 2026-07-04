import React, { useState } from 'react';
import { useBranchData } from '../hooks/useBranchData';
import { Product } from '../types';
import * as XLSX from 'xlsx';
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
  DollarSign,
  Camera,
  Upload,
  BookOpen
} from 'lucide-react';

export default function InventoryPage() {
  const { products, addProduct, addProductsBulk, updateProduct, deleteProduct, adjustStock, currentUser, activeBranchId, coaList } = useBranchData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Compress image before saving to prevent localStorage overflow
  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 300;
        const MAX_HEIGHT = 300;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Use high compression JPEG to save storage space
        setImage(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };
  
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
  const [expiryDate, setExpiryDate] = useState('');
  const [wholesalePrice, setWholesalePrice] = useState<number | ''>('');
  const [wholesaleMinQty, setWholesaleMinQty] = useState<number | ''>('');
  const [image, setImage] = useState('');
  const [salesCoaCode, setSalesCoaCode] = useState('');
  const [cogsCoaCode, setCogsCoaCode] = useState('');
  const [isPPOB, setIsPPOB] = useState(false);
  
  // Box Configuration
  const [hasBoxUnit, setHasBoxUnit] = useState(false);
  const [boxBarcode, setBoxBarcode] = useState('');
  const [pcsPerBox, setPcsPerBox] = useState('');
  const [boxPrice, setBoxPrice] = useState('');
  const [boxCostPrice, setBoxCostPrice] = useState('');

  const categories = ['Sembako', 'Fresh Food', 'Minuman', 'Kebutuhan Rumah', 'Alat Listrik', 'Perkakas', 'Bahan Bangunan', 'Alat Tulis & Kantor', 'Elektronik', 'Pakaian', 'Kesehatan', 'Mainan', 'Lainnya'];

  // Stats Counters
  const totalSku = products.length;
  const outOfStock = products.filter(p => p.stock === 0).length;
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= p.minStock).length;
  const totalValue = products.reduce((sum, p) => sum + (p.costPrice * p.stock), 0);

  // Filter products
  const filteredProducts = products.filter(product => {
    if (product.isPPOB) return false; // Hide PPOB from physical inventory
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
    setExpiryDate('');
    setWholesalePrice('');
    setWholesaleMinQty('');
    setImage('');
    setHasBoxUnit(false);
    setBoxBarcode('');
    setPcsPerBox('');
    setBoxPrice('');
    setBoxCostPrice('');
    setSalesCoaCode('');
    setCogsCoaCode('');
    setIsPPOB(false);
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
    setExpiryDate(p.expiryDate || '');
    setWholesalePrice(p.wholesalePrice || '');
    setWholesaleMinQty(p.wholesaleMinQty || '');
    setImage(p.image || '');
    setHasBoxUnit(p.hasBoxUnit || false);
    setBoxBarcode(p.boxBarcode || '');
    setPcsPerBox(p.pcsPerBox ? p.pcsPerBox.toString() : '');
    setBoxPrice(p.boxPrice ? p.boxPrice.toString() : '');
    setBoxCostPrice(p.boxCostPrice ? p.boxCostPrice.toString() : '');
    setSalesCoaCode(p.salesCoaCode || '');
    setCogsCoaCode(p.cogsCoaCode || '');
    setIsPPOB(p.isPPOB || false);
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
      tenantId: currentUser?.tenantId || 'tenant_default',
      sku,
      name,
      category,
      price: sellPrice,
      costPrice: buyPrice,
      stock: Number(stock),
      minStock: Number(minStock),
      unit,
      barcode: barcode || undefined,
      expiryDate: expiryDate || undefined,
      wholesalePrice: wholesalePrice ? Number(wholesalePrice) : undefined,
      wholesaleMinQty: wholesaleMinQty ? Number(wholesaleMinQty) : undefined,
      isHalal: true,
      image: image || undefined,
      hasBoxUnit,
      boxBarcode: hasBoxUnit ? boxBarcode : undefined,
      pcsPerBox: hasBoxUnit && pcsPerBox ? Number(pcsPerBox) : undefined,
      boxPrice: hasBoxUnit && boxPrice ? Number(boxPrice) : undefined,
      boxCostPrice: hasBoxUnit && boxCostPrice ? Number(boxCostPrice) : undefined,
      salesCoaCode: salesCoaCode || undefined,
      cogsCoaCode: cogsCoaCode || undefined,
      isPPOB: false // Always false for physical inventory
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

  const downloadTemplate = () => {
    const headers = ['sku', 'name', 'category', 'price', 'costPrice', 'stock', 'minStock', 'unit', 'barcode', 'expiryDate', 'isHalal', 'salesCoaCode', 'cogsCoaCode'];
    const sampleRow = ['BRS-001', 'Beras Premium Cianjur 5kg', 'Sembako', 78000, 68000, 45, 10, 'Pack', '8991234560012', '31/12/2026', true, '410', '510'];
    
    const ws = XLSX.utils.aoa_to_sheet([headers, sampleRow]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Produk');
    
    XLSX.writeFile(wb, 'template_produk_ksa_mart.xlsx');
  };

  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
        if (rows.length <= 1) {
          alert('File Excel kosong atau tidak memiliki data.');
          return;
        }

        const newProducts: any[] = [];
        const headers = rows[0].map(h => String(h || '').trim().toLowerCase());

        const idxSku = headers.indexOf('sku');
        const idxName = headers.indexOf('name');
        const idxCategory = headers.indexOf('category');
        const idxPrice = headers.indexOf('price');
        const idxCostPrice = headers.indexOf('costprice');
        const idxStock = headers.indexOf('stock');
        const idxMinStock = headers.indexOf('minstock');
        const idxUnit = headers.indexOf('unit');
        const idxBarcode = headers.indexOf('barcode');
        const idxExpiry = headers.indexOf('expirydate');
        const idxHalal = headers.indexOf('ishalal');
        const idxSalesCoa = headers.indexOf('salescoacode');
        const idxCogsCoa = headers.indexOf('cogscoacode');

        if (idxName === -1) {
          alert('Format kolom salah. File Excel wajib memiliki kolom "name". Kolom lainnya: sku, name, category, price, costPrice, stock, minStock, unit, barcode, expiryDate, isHalal');
          return;
        }

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;

          const nameVal = idxName !== -1 ? String(row[idxName] || '').trim() : '';
          if (!nameVal) continue; 

          const skuVal = idxSku !== -1 ? String(row[idxSku] || '').trim() : '';
          const categoryVal = idxCategory !== -1 ? String(row[idxCategory] || '').trim() : 'Sembako';
          const priceVal = idxPrice !== -1 ? parseFloat(row[idxPrice]) || 0 : 0;
          const costPriceVal = idxCostPrice !== -1 ? parseFloat(row[idxCostPrice]) || 0 : 0;
          const stockVal = idxStock !== -1 ? parseFloat(row[idxStock]) || 0 : 0;
          const minStockVal = idxMinStock !== -1 ? parseFloat(row[idxMinStock]) || 10 : 10;
          const unitVal = idxUnit !== -1 ? String(row[idxUnit] || '').trim() : 'Pcs';
          const barcodeVal = idxBarcode !== -1 ? String(row[idxBarcode] || '').trim() : '';
          
          let expiryDateVal = idxExpiry !== -1 ? String(row[idxExpiry] || '').trim() : '';
          if (expiryDateVal) {
            // Coba parsing format: 08072026, 08/07/2026, 08-07-2026
            const cleanDate = expiryDateVal.replace(/[\/\-]/g, ''); // jadikan 08072026
            if (cleanDate.length === 8) {
              const d = cleanDate.substring(0,2);
              const m = cleanDate.substring(2,4);
              const y = cleanDate.substring(4,8);
              expiryDateVal = `${y}-${m}-${d}`;
            }
          }
          
          const salesCoaVal = idxSalesCoa !== -1 ? String(row[idxSalesCoa] || '').trim() : '';
          const cogsCoaVal = idxCogsCoa !== -1 ? String(row[idxCogsCoa] || '').trim() : '';
          
          let isHalalVal = true;
          if (idxHalal !== -1 && row[idxHalal] !== undefined) {
            const hRaw = String(row[idxHalal]).toLowerCase();
            if (hRaw.includes('false') || hRaw === '0') isHalalVal = false;
          }

          newProducts.push({
            tenantId: currentUser?.tenantId || 'tenant_default',
            sku: skuVal || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
            name: nameVal,
            category: categoryVal,
            price: priceVal,
            costPrice: costPriceVal,
            stock: stockVal,
            minStock: minStockVal,
            unit: unitVal,
            barcode: barcodeVal || undefined,
            expiryDate: expiryDateVal || undefined,
            isHalal: isHalalVal,
            hasBoxUnit: false,
            salesCoaCode: salesCoaVal || undefined,
            cogsCoaCode: cogsCoaVal || undefined
          });
        }

        if (newProducts.length > 0) {
          addProductsBulk(newProducts);
          alert(`✅ Berhasil mengimpor ${newProducts.length} produk dari file Excel!`);
        } else {
          alert('❌ Tidak ada produk valid yang berhasil diimpor.');
        }
      } catch (err: any) {
        console.error(err);
        alert(`❌ Gagal membaca file Excel: ${err.message}`);
      }
      e.target.value = '';
    };
    reader.readAsArrayBuffer(file);
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
          <div className="w-10 h-10 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center text-green-700">
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
            <h3 className="text-xl font-extrabold text-green-800 mt-1">Rp {totalValue.toLocaleString('id-ID')}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center text-green-600">
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
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-xs leading-none w-64 focus:outline-none focus:ring-2 focus:ring-green-500/25"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* Category selection */}
            <select
              className="border border-gray-200 rounded-lg py-2 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-green-500/20"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="ALL">Semua Kategori</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={downloadTemplate}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-350 font-bold text-xs py-2 px-4 rounded-lg flex items-center space-x-1 shadow-xs active:scale-98 transition-all"
            >
              <span>📥 Template Excel</span>
            </button>
            
            <label className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-4 rounded-lg flex items-center space-x-1 shadow-xs active:scale-98 transition-all cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>Import Excel</span>
              <input 
                type="file" 
                accept=".xlsx, .xls" 
                onChange={handleExcelImport} 
                className="hidden" 
              />
            </label>

            <button
              onClick={handleOpenAdd}
              className="bg-green-700 hover:bg-green-800 text-white font-bold text-xs py-2 px-4 rounded-lg flex items-center space-x-1 shadow-xs active:scale-98 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah SKU</span>
            </button>
          </div>
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
                <th className="py-3 px-5 text-center">Expired Date</th>
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
                        <p className="font-bold text-green-700">Rp {p.price.toLocaleString('id-ID')}</p>
                        {p.wholesalePrice && p.wholesaleMinQty && (
                          <p className="text-[10px] text-green-600 font-bold bg-green-50 inline-block px-1.5 py-0.5 rounded border border-green-100">
                            Grosir: Rp {p.wholesalePrice.toLocaleString('id-ID')} (≥{p.wholesaleMinQty})
                          </p>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span className="text-green-700 font-semibold font-mono">
                          Rp {profitAmt.toLocaleString('id-ID')} ({marginPct}%)
                        </span>
                      </td>
                      <td className="py-3 px-5 text-center text-xs">
                        {p.expiryDate ? (
                          <span className={`${new Date(p.expiryDate) < new Date() ? 'text-red-600 font-bold' : 'text-gray-600'}`}>
                            {new Date(p.expiryDate).toLocaleDateString('id-ID')}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
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
                          <span className="bg-green-50 text-green-800 border border-green-100 text-[10px] px-2 py-0.5 rounded font-bold">
                            Sehat
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-5 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1 rounded bg-slate-50 border border-gray-200 hover:border-green-300 hover:bg-green-50 hover:text-green-800 text-gray-600 transition-colors"
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
                  const isPriceEditLockedForAdmin = currentUser?.role === 'CASHIER';
                  
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
                        {isPriceEditLockedForAdmin && (
                          <div className="bg-red-50 text-red-800 p-2.5 rounded-lg border border-red-200/80 text-[10px] font-bold">
                            ⚠️ AKSES HARGA TERKUNCI: Sebagai Kasir, Anda tidak diperkenankan mengatur atau mengubah harga jual, harga pokok (modal), maupun margin keuntungan barang. Silakan hubungi Owner atau Admin untuk meng-update katalog harga resmi.
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="block text-sm font-bold text-slate-700 mb-1">Kode SKU</label>
                          <input 
                            type="text" 
                            required 
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 font-mono text-sm"
                            value={sku}
                            onChange={e => setSku(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
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

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-650">Akun Penjualan (Revenue)</label>
                          <select
                            className="w-full border border-gray-200 rounded-lg py-2 px-3 text-xs focus:outline-none font-semibold text-slate-700 bg-white"
                            value={salesCoaCode}
                            onChange={(e) => setSalesCoaCode(e.target.value)}
                          >
                            <option value="">-- Hubungkan Akun Pendapatan --</option>
                            {coaList.filter(c => c.isActive && c.category === 'REVENUE').map(c => (
                              <option key={c.id} value={c.code}>{c.code} - {c.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-650">Akun Beban HPP (Expense)</label>
                          <select
                            className="w-full border border-gray-205 rounded-lg py-2 px-3 text-xs focus:outline-none font-semibold text-slate-700 bg-white"
                            value={cogsCoaCode}
                            onChange={(e) => setCogsCoaCode(e.target.value)}
                          >
                            <option value="">-- Hubungkan Akun HPP --</option>
                            {coaList.filter(c => c.isActive && c.category === 'EXPENSE').map(c => (
                              <option key={c.id} value={c.code}>{c.code} - {c.name}</option>
                            ))}
                          </select>
                        </div>
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
                          <label className="text-xs font-bold text-green-600">Margin Profit (%)</label>
                          <div className="relative">
                            <input
                              type="number"
                              disabled={isPriceEditLockedForAdmin}
                              className={`w-full border border-green-200 rounded-lg py-2 pl-3 pr-8 text-xs font-bold ${
                                isPriceEditLockedForAdmin ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-dashed' : 'bg-green-50 focus:ring-2 focus:ring-green-500/20'
                              } outline-none`}
                              value={marginPct}
                              onChange={(e) => handleMarginChange(e.target.value)}
                              placeholder="Misal: 10"
                            />
                            <span className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-green-600 font-bold">%</span>
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
                                isPriceEditLockedForAdmin ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-dashed' : 'bg-green-50/20 focus:ring-2 focus:ring-green-500/20'
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
                          <label className="text-xs font-bold text-green-600">Harga Grosir (Opsional)</label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-green-400 font-bold">Rp</span>
                            <input
                              type="number"
                              disabled={isPriceEditLockedForAdmin}
                              className={`w-full border border-green-200 rounded-lg py-2 pl-8 pr-3 text-xs font-bold ${
                                isPriceEditLockedForAdmin ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-dashed' : 'bg-green-50'
                              }`}
                              value={wholesalePrice}
                              onChange={(e) => setWholesalePrice(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-green-600">Min. Qty Grosir</label>
                          <input
                            type="number"
                            disabled={isPriceEditLockedForAdmin}
                            className={`w-full border border-green-200 rounded-lg py-2 px-3 text-xs font-bold ${
                              isPriceEditLockedForAdmin ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-dashed' : 'bg-green-50'
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600">Scan Barcode / Kode Batang</label>
                    <input
                      type="text"
                      className="w-full border border-gray-200 rounded-lg py-2 px-3 text-xs font-mono"
                      placeholder="Masukkan Barcode..."
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-red-600">Tanggal Expired (Opsional)</label>
                    <input
                      type="date"
                      className="w-full border border-gray-200 rounded-lg py-2 px-3 text-xs font-mono"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="border border-indigo-100 bg-indigo-50/30 rounded-xl p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                      <Package className="w-5 h-5 text-indigo-600"/> 
                      Opsi Penjualan Box/Karton
                    </label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={hasBoxUnit}
                        onChange={(e) => setHasBoxUnit(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                  
                  {hasBoxUnit && (
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-indigo-100">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-600">Barcode Box</label>
                        <input
                          type="text"
                          className="w-full border border-gray-200 rounded-lg py-2 px-3 text-xs font-mono"
                          placeholder="Scan Barcode Box"
                          value={boxBarcode}
                          onChange={(e) => setBoxBarcode(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-600">Isi per Box (Satuan {unit})</label>
                        <input
                          type="number"
                          className="w-full border border-gray-200 rounded-lg py-2 px-3 text-xs"
                          placeholder="Contoh: 24"
                          value={pcsPerBox}
                          onChange={(e) => setPcsPerBox(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-600">Harga Modal (Box)</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-gray-400 font-bold">Rp</span>
                          <input
                            type="number"
                            className="w-full border border-gray-200 rounded-lg py-2 pl-8 pr-3 text-xs font-bold bg-white"
                            value={boxCostPrice}
                            onChange={(e) => setBoxCostPrice(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-indigo-600">Harga Jual (Box)</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-indigo-400 font-bold">Rp</span>
                          <input
                            type="number"
                            className="w-full border border-indigo-200 bg-indigo-50 rounded-lg py-2 pl-8 pr-3 text-xs font-bold"
                            value={boxPrice}
                            onChange={(e) => setBoxPrice(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2 border border-gray-200 rounded-xl p-4 bg-white">
                  <label className="text-xs font-bold text-gray-800 flex items-center gap-2"><Camera className="w-4 h-4 text-green-600"/> Foto Produk (Opsional)</label>
                  
                  {image && (
                    <div className="relative w-32 h-32 border border-gray-200 rounded-xl overflow-hidden shadow-sm mx-auto mb-3">
                      <img src={image} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        type="button" 
                        onClick={() => setImage('')} 
                        className="absolute top-1 right-1 bg-white/90 p-1.5 rounded-lg text-red-500 hover:bg-red-50 border border-red-100 shadow-xs"
                        title="Hapus Foto"
                      >
                        <Trash2 className="w-4 h-4"/>
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <label className="cursor-pointer bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 text-xs font-bold py-2.5 px-3 rounded-xl text-center flex items-center justify-center gap-1.5 transition-colors">
                      <Upload className="w-4 h-4" /> Upload Galeri
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                      }} />
                    </label>
                    
                    <label className="cursor-pointer bg-green-600 text-white hover:bg-green-700 shadow-md text-xs font-bold py-2.5 px-3 rounded-xl text-center flex items-center justify-center gap-1.5 transition-colors">
                      <Camera className="w-4 h-4" /> Buka Kamera
                      <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                      }} />
                    </label>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-[10px] text-gray-400 mb-1 font-semibold">Atau gunakan URL Gambar (Link Internet):</p>
                    <input
                      type="text"
                      className="w-full border border-gray-200 rounded-lg py-2 px-3 text-xs bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500/20 outline-none transition-all"
                      placeholder="https://images.unsplash.com/..."
                      value={image.startsWith('data:') ? '' : image}
                      onChange={(e) => setImage(e.target.value)}
                    />
                  </div>
                </div>

                <div className="border border-amber-200 bg-amber-50/50 rounded-xl p-4 space-y-4">
                  <label className="text-sm font-bold text-amber-900 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-amber-600"/> 
                    Pemetaan Akun (CoA)
                  </label>
                  <p className="text-[10px] text-amber-700 font-semibold mb-2 leading-relaxed">
                    Pilih akun perkiraan untuk mencatat Pendapatan dan HPP otomatis saat barang terjual.
                  </p>
                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700">Akun Pendapatan (Sales)</label>
                      <select
                        value={salesCoaCode}
                        onChange={(e) => setSalesCoaCode(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg py-2 px-3 text-xs bg-white focus:ring-2 focus:ring-green-500"
                      >
                        <option value="">- Default (Auto) -</option>
                        {coaList.filter(c => c.category === 'REVENUE' && c.isActive).map(c => (
                          <option key={c.id} value={c.code}>{c.code} - {c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700">Akun Beban Pokok (COGS)</label>
                      <select
                        value={cogsCoaCode}
                        onChange={(e) => setCogsCoaCode(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg py-2 px-3 text-xs bg-white focus:ring-2 focus:ring-green-500"
                      >
                        <option value="">- Default (Auto) -</option>
                        {coaList.filter(c => c.category === 'EXPENSE' && c.isActive).map(c => (
                          <option key={c.id} value={c.code}>{c.code} - {c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
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
                  className="py-2 px-4 bg-green-700 hover:bg-green-800 text-white text-xs font-bold rounded-lg shadow-xs"
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
