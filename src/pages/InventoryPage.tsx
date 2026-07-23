import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useBranchData } from '../hooks/useBranchData';
import { Product } from '../types';
import * as XLSX from 'xlsx';
import { uploadImageToStorage, compressImage } from '../lib/supabase';
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
  BookOpen,
  Download
} from 'lucide-react';

export default function InventoryPage() {
  const { initializeStore, products, addProduct, addProductsBulk, updateProduct, deleteProduct, clearProducts, adjustStock, currentUser, activeBranchId, coaList, addNotification, addLog, categories: savedCategories, addCategory, removeCategory, setCategories } = useBranchData();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const searchDebounceRef = useRef<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [stockFilter, setStockFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Upload gambar produk ke Supabase Storage (dengan fallback base64 lokal)
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleImageUpload = async (file: File) => {
    setIsUploadingImage(true);
    try {
      // Kompres gambar terlebih dahulu (maks 600px, kualitas 0.75)
      const { file: compressedFile, base64 } = await compressImage(file, 600, 0.75);

      // Buat nama file unik berdasarkan timestamp
      const fileName = `products/prod_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;

      // Upload ke Supabase Storage, fallback ke base64 jika gagal
      const imageUrl = await uploadImageToStorage(compressedFile, 'product-images', fileName, base64);

      if (imageUrl && imageUrl.startsWith('http')) {
        setImage(imageUrl);
        addNotification({
          title: 'Upload Gambar Berhasil',
          message: 'Foto produk berhasil diupload ke cloud dan akan terlihat di semua perangkat.',
          type: 'SUCCESS'
        });
        addLog('UPLOAD_PRODUCT_IMAGE', 'INVENTORY', 'Upload gambar produk berhasil ke cloud storage');
      } else {
        // Fallback to base64 if cloud upload failed
        setImage(base64);
        addNotification({
          title: 'Upload Gambar Mode Offline',
          message: 'Foto produk disimpan lokal (hanya di perangkat ini). Pastikan koneksi internet aktif untuk upload ke cloud.',
          type: 'WARNING'
        });
        addLog('UPLOAD_PRODUCT_IMAGE_OFFLINE', 'INVENTORY', 'Upload gambar produk fallback ke base64 lokal');
      }
    } catch (err: any) {
      console.error('Gagal upload gambar produk:', err);
      addNotification({
        title: 'Upload Gambar Gagal',
        message: `Gagal upload gambar: ${err.message || 'Unknown error'}. Silakan coba lagi.`,
        type: 'ERROR'
      });
      addLog('UPLOAD_PRODUCT_IMAGE_ERROR', 'INVENTORY', `Gagal upload gambar produk: ${err.message}`);
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Modals status
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ done: 0, total: 0 });
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  const handleBulkDelete = () => {
    if (confirm(`Apakah Anda yakin ingin menghapus ${selectedProductIds.length} produk yang dipilih?`)) {
      selectedProductIds.forEach(id => deleteProduct(id));
      alert(`${selectedProductIds.length} produk berhasil dihapus.`);
      setSelectedProductIds([]);
    }
  };

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

  const defaultCategories = ['Sembako', 'Fresh Food', 'Minuman', 'Kebutuhan Rumah', 'Alat Listrik', 'Perkakas', 'Bahan Bangunan', 'Alat Tulis & Kantor', 'Elektronik', 'Pakaian', 'Kesehatan', 'Mainan', 'Lainnya'];
  const builtInCategorySet = useMemo(() => new Set(defaultCategories.map((cat) => cat.trim())), [defaultCategories]);

  const categories = useMemo(() => {
    const categorySet = new Set<string>();
    defaultCategories.forEach((cat) => categorySet.add(cat.trim()));
    // Use savedCategories + defaults only (avoid iterating full product list for performance)
    savedCategories?.forEach((cat) => { if (cat && typeof cat === 'string') categorySet.add(cat.trim()); });
    
    // Extrack existing categories from products to ensure no orphans
    products.forEach((p) => { if (p.category && typeof p.category === 'string') categorySet.add(p.category.trim()); });
    
    return Array.from(categorySet).sort();
  }, [defaultCategories, savedCategories, products]);

  const customSavedCategories = useMemo(() => {
    return (savedCategories || [])
      .map((cat) => String(cat || '').trim())
      .filter((cat) => cat.length > 0 && !builtInCategorySet.has(cat));
  }, [savedCategories, builtInCategorySet]);

  // Debounce search input to avoid heavy filtering on every keystroke
  useEffect(() => {
    if (searchDebounceRef.current) window.clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = window.setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 250);
    return () => {
      if (searchDebounceRef.current) window.clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery]);

  // Web Worker for fuzzy search (off-main-thread)
  const searchWorkerRef = useRef<Worker | null>(null);

  useEffect(() => {
    // Ensure data is synced when opening Inventory
    initializeStore({ catalogOnly: false, showLoading: false });
  }, []);

  const [searchMatchedIds, setSearchMatchedIds] = useState<Array<string | number> | null>(null);

  useEffect(() => {
    // lazy init worker
    try {
      if (!searchWorkerRef.current) {
        // @ts-ignore - Vite module worker URL
        const worker = new Worker(new URL('../workers/searchWorker.ts', import.meta.url), { type: 'module' });
        worker.onmessage = (ev) => {
          const { type, results } = (ev.data || {});
          if (type === 'result') {
            setSearchMatchedIds(Array.isArray(results) ? results : []);
          }
          if (type === 'ready') {
            // no-op for now
          }
        };
        searchWorkerRef.current = worker;
      }
    } catch (err) {
      console.warn('Failed to init search worker', err);
    }
    return () => {
      if (searchWorkerRef.current) {
        searchWorkerRef.current.terminate();
        searchWorkerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Send minimal docs to worker when products change
  useEffect(() => {
    try {
      if (searchWorkerRef.current) {
        const docs = (products || []).map((p: any) => ({ id: p.id, name: p.name || '', sku: p.sku || '', category: p.category || '' }));
        searchWorkerRef.current.postMessage({ type: 'init', payload: { docs } });
      }
    } catch (err) {
      console.warn('Failed to post init to search worker', err);
    }
  }, [products]);

  // Trigger search when debouncedQuery changes
  useEffect(() => {
    setSearchMatchedIds(null);
    try {
      if (searchWorkerRef.current) {
        searchWorkerRef.current.postMessage({ type: 'search', payload: { q: debouncedQuery } });
      } else {
        setSearchMatchedIds(null);
      }
    } catch (err) {
      console.warn('Search worker error', err);
      setSearchMatchedIds(null);
    }
  }, [debouncedQuery]);


  // Stats Counters (memoized)
  const physicalProducts = useMemo(() => products.filter(p => !p.isPPOB), [products]);
  const totalSku = useMemo(() => physicalProducts.length, [physicalProducts]);
  const outOfStock = useMemo(() => physicalProducts.filter(p => p.stock <= 0).length, [physicalProducts]);
  const lowStock = useMemo(() => physicalProducts.filter(p => p.stock > 0 && p.stock <= p.minStock).length, [physicalProducts]);
  const totalValue = useMemo(() => physicalProducts.reduce((sum, p) => sum + ((Number(p.costPrice) || 0) * (Number(p.stock) || 0)), 0), [physicalProducts]);

  // Filter products (memoized). If there is a search query, use worker-provided matched ids to avoid scanning full array.
  const filteredProducts = useMemo(() => {
    if (!products || products.length === 0) return [];
    const q = (debouncedQuery || '').toString().trim().toLowerCase();

    // If we have a query and the worker returned matched ids, use that limited set.
    // If the worker returned an empty array, that means there are no matches.
    if (q && searchMatchedIds) {
      if (searchMatchedIds.length === 0) {
        return [];
      }
      const idMap = new Map(products.map((p) => [p.id, p]));
      const matched = searchMatchedIds.map((id) => idMap.get(id)).filter(Boolean) as Product[];
      return matched.filter((product) => {
        if (product.isPPOB) return false;
        const matchesCategory = selectedCategory === 'ALL' || product.category === selectedCategory;
        const matchesBranch = !activeBranchId || product.branchId === activeBranchId || !product.branchId;
        
        let matchesStock = true;
        if (stockFilter === 'AMAN') matchesStock = product.stock > product.minStock;
        else if (stockFilter === 'MENIPIS') matchesStock = product.stock > 0 && product.stock <= product.minStock;
        else if (stockFilter === 'HABIS') matchesStock = product.stock <= 0;
        else if (stockFilter === 'NEAR_EXPIRED') {
          if (!product.expiryDate) matchesStock = false;
          else {
            const daysToExpiry = (new Date(product.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
            matchesStock = daysToExpiry >= 0 && daysToExpiry <= 30;
          }
        }
        else if (stockFilter === 'EXPIRED') {
          if (!product.expiryDate) matchesStock = false;
          else {
            const daysToExpiry = (new Date(product.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
            matchesStock = daysToExpiry < 0;
          }
        }
        
        return matchesCategory && matchesBranch && matchesStock;
      });
    }

    // Fallback: no query or worker results not available — do client-side filter (kept minimal)
    return products.filter(product => {
      if (product.isPPOB) return false; // Hide PPOB from physical inventory
      const name = (product.name || '').toString().toLowerCase();
      const skuStr = (product.sku || '').toString().toLowerCase();
      const matchesSearch = !q || name.includes(q) || skuStr.includes(q);
      const matchesCategory = selectedCategory === 'ALL' || product.category === selectedCategory;
      const matchesBranch = !activeBranchId || product.branchId === activeBranchId || !product.branchId;
      
      let matchesStock = true;
      if (stockFilter === 'AMAN') matchesStock = product.stock > product.minStock;
      else if (stockFilter === 'MENIPIS') matchesStock = product.stock > 0 && product.stock <= product.minStock;
      else if (stockFilter === 'HABIS') matchesStock = product.stock <= 0;
      else if (stockFilter === 'NEAR_EXPIRED') {
        if (!product.expiryDate) matchesStock = false;
        else {
          const daysToExpiry = (new Date(product.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
          matchesStock = daysToExpiry >= 0 && daysToExpiry <= 30;
        }
      }
      else if (stockFilter === 'EXPIRED') {
        if (!product.expiryDate) matchesStock = false;
        else {
          const daysToExpiry = (new Date(product.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
          matchesStock = daysToExpiry < 0;
        }
      }
      
      return matchesSearch && matchesCategory && matchesBranch && matchesStock;
    });
  }, [products, debouncedQuery, selectedCategory, stockFilter, activeBranchId, searchMatchedIds]);

  // Pagination calculations
  const totalItems = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(totalItems, startIndex + pageSize);
  const currentPageProducts = filteredProducts.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedCategory, stockFilter]);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setSku(`SKU-${Math.floor(1000 + Math.random() * 9000)}`);
    setName('');
    setCategory(categories.length > 0 ? categories[0] : 'Sembako');
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
    // Avoid persisting large base64 images into the global store/localStorage.
    // If image is a data: URI (base64), we will not include it in saved product to keep localStorage small.
    if (image && image.startsWith('data:')) {
      addNotification({ title: 'Gambar tidak disimpan', message: 'Gambar dalam format base64 tidak akan disimpan ke store untuk menghindari penurunan performa. Silakan upload ulang gambar atau gunakan URL/Cloud storage.', type: 'WARNING' });
      dataPayload.image = undefined;
    } else {
      dataPayload.image = image || undefined;
    }
    if (!defaultCategories.includes(category) && !savedCategories?.includes(category)) {
      addCategory(category);
    }
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
    // Machine-readable headers (used by importer)
    const machineHeaders = ['sku', 'name', 'category', 'price', 'costPrice', 'stock', 'minStock', 'unit', 'barcode', 'expiryDate', 'isHalal', 'salesCoaCode', 'cogsCoaCode'];

    // Friendly labels to help toko mengisi file dengan nama kolom yang mereka kenal
    const friendlyHeaders = ['SKU (sku)', 'Nama / Name (name)', 'Kategori / Category (category)', 'Harga Jual / Price (price)', 'Harga Modal / Cost Price (costPrice)', 'Stok / Stock (stock)', 'Stok Minimum / Min Stock (minStock)', 'Satuan / Unit (unit)', 'Barcode (barcode)', 'Tanggal Kadaluarsa / Expiry Date (expiryDate)', 'Is Halal (isHalal)', 'Sales COA Code (salesCoaCode)', 'COGS COA Code (cogsCoaCode)'];

    const sampleRow = ['BRS-001', 'Beras Premium Cianjur 5kg', categories.length > 0 ? categories[0] : 'Sembako', 78000, 68000, 45, 10, 'Pack', '8991234560012', '31/12/2026', true, '410', '510'];

    // Build worksheet with: friendly header, machine header, sample row, empty row, then a categories list for reference
    const rows: any[] = [];
    rows.push(friendlyHeaders);
    rows.push(machineHeaders);
    rows.push(sampleRow);
    rows.push([]);
    rows.push(['Available Categories (use one of these exact values in the category field):']);
    rows.push(categories.slice(0, 100));

    const ws = XLSX.utils.aoa_to_sheet(rows);
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
        const findIndex = (aliases: string[]) => aliases
          .map((alias) => headers.indexOf(alias.toLowerCase()))
          .find((idx) => idx !== -1) ?? -1;

        const idxSku = findIndex(['sku', 'kode', 'kode barang', 'product code', 'code']);
        const idxName = findIndex(['name', 'nama', 'nama barang', 'product name']);
        const idxCategory = findIndex(['category', 'kategori', 'jenis', 'kelompok']);
        const idxPrice = findIndex(['price', 'harga jual', 'harga', 'selling price']);
        const idxCostPrice = findIndex(['costprice', 'cost price', 'harga modal', 'modal', 'harga pokok']);
        const idxStock = findIndex(['stock', 'stok', 'jumlah', 'quantity']);
        const idxMinStock = findIndex(['minstock', 'min stock', 'stok minimum', 'minimum stock', 'minimum stok']);
        const idxUnit = findIndex(['unit', 'satuan']);
        const idxBarcode = findIndex(['barcode', 'kode barcode', 'kode batang']);
        const idxExpiry = findIndex(['expirydate', 'expiry date', 'tanggal kadaluarsa', 'tanggal kedaluwarsa', 'tanggal expired', 'expired']);
        const idxHalal = findIndex(['ishalal', 'is halal', 'halal']);
        const idxSalesCoa = findIndex(['salescoacode', 'sales coa code', 'salescoa', 'salescoc', 'salesco', 'coa penjualan', 'kode coa penjualan']);
        const idxCogsCoa = findIndex(['cogscoacode', 'cogs coa code', 'cogscoa', 'coa hpp', 'kode coa hpp']);

        if (idxName === -1) {
          alert('Format kolom salah. File Excel wajib memiliki kolom "name" atau "nama". Kolom lainnya yang didukung: sku/kode, category/kategori, price/harga, costPrice/harga modal, stock/stok, minStock/stok minimum, unit/satuan, barcode, expiryDate/tanggal kadaluarsa, isHalal/halal.');
          return;
        }

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;

          const nameVal = idxName !== -1 ? String(row[idxName] || '').trim() : '';
          if (!nameVal) continue;

          const skuVal = idxSku !== -1 ? String(row[idxSku] || '').trim() : '';
          const categoryVal = idxCategory !== -1 ? String(row[idxCategory] || '').trim() : 'Sembako';
          const priceVal = idxPrice !== -1 ? parseFloat(String(row[idxPrice] || '').replace(/[^0-9.,-]/g, '').replace(',', '.')) || 0 : 0;
          const costPriceVal = idxCostPrice !== -1 ? parseFloat(String(row[idxCostPrice] || '').replace(/[^0-9.,-]/g, '').replace(',', '.')) || 0 : 0;
          const stockVal = idxStock !== -1 ? parseFloat(String(row[idxStock] || '').replace(/[^0-9.,-]/g, '').replace(',', '.')) || 0 : 0;
          const minStockVal = idxMinStock !== -1 ? parseFloat(String(row[idxMinStock] || '').replace(/[^0-9.,-]/g, '').replace(',', '.')) || 10 : 10;
          const unitVal = idxUnit !== -1 ? String(row[idxUnit] || '').trim() : 'Pcs';
          const barcodeVal = idxBarcode !== -1 ? String(row[idxBarcode] || '').trim() : '';

          let expiryDateVal = idxExpiry !== -1 ? String(row[idxExpiry] || '').trim() : '';
          if (expiryDateVal) {
            // Coba parsing format: 08072026, 08/07/2026, 08-07-2026
            const cleanDate = expiryDateVal.replace(/[\/\-]/g, ''); // jadikan 08072026
            if (cleanDate.length === 8) {
              const d = cleanDate.substring(0, 2);
              const m = cleanDate.substring(2, 4);
              const y = cleanDate.substring(4, 8);
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
          const toUpdate: any[] = [];
          const toAdd: any[] = [];

          newProducts.forEach(newP => {
            const existing = products.find(p => p.sku === newP.sku && !p.isPPOB);
            if (existing) {
              toUpdate.push({ ...newP, id: existing.id });
            } else {
              toAdd.push(newP);
            }
          });

          // Update existing products synchronously (or one by one to avoid blocking)
          toUpdate.forEach(p => updateProduct(p));

          if (toAdd.length > 0) {
            const importedCategoryValues = Array.from(new Set(toAdd.map((product) => String(product.category || '').trim()).filter((c) => c.length > 0)));
            if (importedCategoryValues.length > 0) {
              setCategories(Array.from(new Set([...(savedCategories || []), ...importedCategoryValues])));
            }
            // Process import in batches to avoid blocking UI
            const batchSize = 100;
            const batches: any[][] = [];
            for (let i = 0; i < toAdd.length; i += batchSize) {
              batches.push(toAdd.slice(i, i + batchSize));
            }

            setIsImporting(true);
            setImportProgress({ done: 0, total: toAdd.length });

            batches.forEach((batch, idx) => {
              // schedule batches with small delay to keep UI responsive
              setTimeout(() => {
                addProductsBulk(batch);
                setImportProgress(prev => ({ done: prev.done + batch.length, total: prev.total }));
                // Last batch -> finish
                if (idx === batches.length - 1) {
                  setIsImporting(false);
                  alert(`✅ Berhasil mengupdate ${toUpdate.length} produk dan mengimpor ${toAdd.length} produk baru dari file Excel!`);
                }
              }, idx * 150);
            });
          } else {
            alert(`✅ Berhasil mengupdate ${toUpdate.length} produk dari file Excel! Tidak ada produk baru yang ditambahkan.`);
          }
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

  const handleClearInventory = () => {
    if (confirm('Apakah Anda yakin ingin menghapus SEMUA produk dari sistem? Tindakan ini tidak dapat dibatalkan.')) {
      clearProducts();
      alert('Semua produk berhasil dihapus.');
      setSearchQuery('');
      setSelectedCategory('ALL');
      setStockFilter('ALL');
      setPage(1);
    }
  };

  const handleExportExcel = () => {
    const ws_data = [
      ["SKU", "NAMA_BARANG", "KATEGORI", "HARGA_MODAL", "HARGA_JUAL", "STOK_MINIMAL", "SISA_STOK", "UNIT", "EXPIRED_DATE"],
      ...filteredProducts.filter(p => !p.isPPOB).map(p => [
        p.sku, p.name, p.category, p.costPrice, p.price, p.minStock, p.stock, p.unit, p.expiryDate || ''
      ])
    ];
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Inventori");
    XLSX.writeFile(wb, `Data_Inventori_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-200 dark:border-slate-700/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-xs font-semibold">Total SKU Terdaftar</p>
            <h3 className="text-2xl font-black text-gray-800 dark:text-slate-200 mt-1">{totalSku} Item</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center text-green-700">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-200 dark:border-slate-700/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-xs font-semibold">Habis Pemesanan (0 Stok)</p>
            <h3 className="text-2xl font-black text-red-600 mt-1">{outOfStock} SKU</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-700">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-200 dark:border-slate-700/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-xs font-semibold">Stok Menipis (Limit Alert)</p>
            <h3 className="text-2xl font-black text-amber-600 mt-1">{lowStock} SKU</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-200 dark:border-slate-700/80 shadow-xs flex items-center justify-between">
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
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xs overflow-hidden">
        {/* Table Filter Topbar */}
        <div className="p-5 border-b border-gray-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="w-4 h-4 text-gray-400" />
              </span>
              <input
                type="text"
                placeholder="Cari SKU / nama produk..."
                className="pl-9 pr-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-xs leading-none w-64 focus:outline-none focus:ring-2 focus:ring-green-500/25"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Category selection */}
            <div className="flex items-center gap-1">
              <select
                className="border border-gray-200 dark:border-slate-700 rounded-lg py-2 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-green-500/20"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="ALL">Semua Kategori</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {selectedCategory !== 'ALL' && customSavedCategories.includes(selectedCategory) && (
                <button
                  onClick={() => {
                    if (confirm(`Hapus kategori "${selectedCategory}" dari daftar pilihan?`)) {
                      removeCategory(selectedCategory);
                      setSelectedCategory('ALL');
                    }
                  }}
                  className="p-1.5 text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200 ml-1"
                  title="Hapus Kategori Ini"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {/* Stock Filter selection */}
            <div className="flex items-center gap-1">
              <select
                className="border border-gray-200 dark:border-slate-700 rounded-lg py-2 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-green-500/20"
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
              >
                <option value="ALL">Semua Status Stok</option>
                <option value="AMAN">Stok Aman</option>
                <option value="MENIPIS">Stok Menipis</option>
                <option value="HABIS">Stok Habis</option>
                <option value="NEAR_EXPIRED">Mendekati Expired</option>
                <option value="EXPIRED">Sudah Expired</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                placeholder="Tambah kategori baru"
                className="border border-gray-200 dark:border-slate-700 rounded-lg py-2 px-3 text-xs w-44 focus:outline-none focus:ring-2 focus:ring-green-500/25"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
              <button
                type="button"
                onClick={() => {
                  const normalized = newCategoryName.trim();
                  if (normalized) {
                    addCategory(normalized);
                    setNewCategoryName('');
                    alert(`Kategori "${normalized}" berhasil ditambahkan! Silakan cek di daftar pilihan Kategori.`);
                  }
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-4 rounded-lg flex items-center space-x-1 shadow-xs active:scale-98 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Kategori</span>
              </button>
            </div>

            <button
              onClick={downloadTemplate}
              className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 border border-slate-350 font-bold text-xs py-2 px-4 rounded-lg flex items-center space-x-1 shadow-xs active:scale-98 transition-all"
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
              onClick={handleExportExcel}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-4 rounded-lg flex items-center space-x-1 shadow-xs active:scale-98 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Export Excel</span>
            </button>

            <button
              onClick={handleClearInventory}
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2 px-4 rounded-lg flex items-center space-x-1 shadow-xs active:scale-98 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              <span>Hapus Semua Produk</span>
            </button>

            {selectedProductIds.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs py-2 px-4 rounded-lg flex items-center space-x-1 shadow-xs active:scale-98 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                <span>Hapus Terpilih ({selectedProductIds.length})</span>
              </button>
            )}

            <button
              onClick={handleOpenAdd}
              className="bg-green-700 hover:bg-green-800 text-white font-bold text-xs py-2 px-4 rounded-lg flex items-center space-x-1 shadow-xs active:scale-98 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah SKU</span>
            </button>
          </div>
        </div>

        {/* Master Products Listing Table (virtualized list for performance) */}
        <div className="overflow-x-auto">
          <div className="min-w-[1000px] text-left text-xs border-collapse">
            <div className="bg-slate-50 dark:bg-slate-800 uppercase tracking-widest text-[10px] text-gray-500 dark:text-slate-400 font-bold border-b border-gray-100 dark:border-slate-800 py-3 px-4 grid grid-cols-12 gap-3 items-center">
              <div className="col-span-1 flex items-center gap-2 whitespace-nowrap">
                <input 
                  type="checkbox" 
                  checked={selectedProductIds.length === filteredProducts.length && filteredProducts.length > 0} 
                  onChange={(e) => setSelectedProductIds(e.target.checked ? filteredProducts.map(p => p.id) : [])} 
                  className="rounded text-green-600 focus:ring-green-500 bg-white" 
                />
                SKU / Code
              </div>
              <div className="col-span-2">Nama Barang</div>
              <div className="col-span-1">Kategori</div>
              <div className="col-span-1 text-right whitespace-nowrap">Harga Modal</div>
              <div className="col-span-1 text-right whitespace-nowrap">Harga Jual</div>
              <div className="col-span-1 text-center whitespace-nowrap">Margin</div>
              <div className="col-span-1 text-center whitespace-nowrap">Expired Date</div>
              <div className="col-span-1 text-center whitespace-nowrap">Sisa Stok</div>
              <div className="col-span-1 text-center">Status</div>
              <div className="col-span-2 text-center">Aksi</div>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="text-center py-16 text-gray-400">Tidak ada barang inventori untuk ditampilkan.</div>
            ) : (
              <>
              <div className="flex flex-col">
                {filteredProducts.slice((page - 1) * pageSize, page * pageSize).map((p) => {
                  const profitAmt = p.price - p.costPrice;
                  const marginPct = p.costPrice > 0 ? ((profitAmt / p.price) * 100).toFixed(1) : '0';
                  const isOutOfStock = p.stock === 0;
                  const isLowStock = p.stock > 0 && p.stock <= p.minStock;
                  return (
                    <div key={p.id} className={`px-4 py-2 border-b border-gray-100 dark:border-slate-800 grid grid-cols-12 gap-3 items-center text-xs hover:bg-slate-50 dark:bg-slate-800 transition-colors ${selectedProductIds.includes(p.id) ? 'bg-green-50/50 dark:bg-green-900/20' : ''}`}>
                      <div className="col-span-1 flex items-center gap-2 font-mono text-gray-500 dark:text-slate-400 truncate" title={p.sku}>
                        <input 
                          type="checkbox" 
                          checked={selectedProductIds.includes(p.id)} 
                          onChange={(e) => {
                            if (e.target.checked) setSelectedProductIds([...selectedProductIds, p.id]);
                            else setSelectedProductIds(selectedProductIds.filter(id => id !== p.id));
                          }}
                          className="rounded text-green-600 focus:ring-green-500 bg-white"
                        />
                        {p.sku}
                      </div>
                      <div className="col-span-2 font-bold text-gray-900 dark:text-white truncate" title={p.name}>{p.name}</div>
                      <div className="col-span-1 truncate">
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[9px] px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">{p.category}</span>
                      </div>
                      <div className="col-span-1 text-right font-mono text-gray-600 dark:text-slate-400 whitespace-nowrap">Rp {p.costPrice.toLocaleString('id-ID')}</div>
                      <div className="col-span-1 text-right font-bold text-green-700 whitespace-nowrap">Rp {p.price.toLocaleString('id-ID')}</div>
                      <div className="col-span-1 text-center text-green-700 font-mono text-[9px] whitespace-nowrap flex flex-col items-center justify-center">
                        <span>Rp {profitAmt.toLocaleString('id-ID')}</span>
                        <span className="text-[8px] text-slate-500 dark:text-slate-400">({marginPct}%)</span>
                      </div>
                      <div className="col-span-1 text-center text-[9px] whitespace-nowrap">{p.expiryDate ? new Date(p.expiryDate).toLocaleDateString('id-ID') : '-'}</div>
                      <div className="col-span-1 text-center font-mono font-bold whitespace-nowrap">{p.stock} <span className="text-gray-400 font-sans text-[9px] font-normal">{p.unit}</span></div>
                      <div className="col-span-1 text-center">
                        {isOutOfStock ? <span className="bg-red-50 text-red-700 text-[9px] px-2 py-0.5 rounded">Habis</span> : isLowStock ? <span className="bg-amber-50 text-amber-700 text-[9px] px-2 py-0.5 rounded">Kritis</span> : <span className="bg-green-50 text-green-800 text-[9px] px-2 py-0.5 rounded">Sehat</span>}
                      </div>
                      <div className="col-span-2 text-center flex items-center justify-center gap-1">
                        <button onClick={() => handleOpenEdit(p)} className="p-1 rounded bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:border-green-300 hover:bg-green-50 hover:text-green-800 text-gray-600 dark:text-slate-400">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => { const amountStr = prompt(`Tambah/Kurang stok ${p.name}. Masukkan angka (misal: 10 atau -5):`); const amount = Number(amountStr); if (!isNaN(amount) && amount !== 0) adjustStock(p.id, amount); }} className="px-2 py-1 text-[9px] font-bold rounded bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-amber-50 hover:border-amber-300 whitespace-nowrap">
                          +/- Stok
                        </button>
                        <button onClick={() => { if (confirm(`Apakah Anda yakin mencabut SKU ${p.name} dari catalog?`)) deleteProduct(p.id); }} className="p-1 rounded bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:border-red-300 hover:bg-red-50 text-gray-400">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* TOTAL ROW */}
              <div className="bg-indigo-50/50 text-[11px] text-gray-800 dark:text-slate-200 font-extrabold border-t-2 border-indigo-100 py-4 px-4 grid grid-cols-12 gap-3 items-center shadow-inner mt-4">
                <div className="col-span-4 text-right pr-4 uppercase tracking-widest text-indigo-700 flex items-center justify-end gap-2">
                  <span>TOTAL KESELURUHAN</span>
                  <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full text-[9px]">{filteredProducts.length} Jenis (SKU)</span>
                </div>
                <div className="col-span-1 text-right whitespace-nowrap text-indigo-700">Rp {filteredProducts.reduce((sum, p) => sum + (p.costPrice * p.stock), 0).toLocaleString('id-ID')}</div>
                <div className="col-span-1 text-right whitespace-nowrap text-green-700">Rp {filteredProducts.reduce((sum, p) => sum + (p.price * p.stock), 0).toLocaleString('id-ID')}</div>
                <div className="col-span-1"></div>
                <div className="col-span-1"></div>
                <div className="col-span-1 text-center whitespace-nowrap text-indigo-700">{filteredProducts.reduce((sum, p) => sum + p.stock, 0).toLocaleString('id-ID')} Pcs</div>
                <div className="col-span-1"></div>
                <div className="col-span-2"></div>
              </div>

              {/* Pagination Controls */}
              {Math.ceil(filteredProducts.length / pageSize) > 1 && (
                <div className="flex justify-between items-center py-4 px-4 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 sticky bottom-0">
                  <span className="text-xs text-gray-500 dark:text-slate-400 font-medium">
                    Menampilkan {((page - 1) * pageSize) + 1} - {Math.min(page * pageSize, filteredProducts.length)} dari {filteredProducts.length} produk
                  </span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 disabled:opacity-50 text-xs font-bold shadow-sm"
                    >
                      Sebelumnya
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(Math.ceil(filteredProducts.length / pageSize), p + 1))}
                      disabled={page === Math.ceil(filteredProducts.length / pageSize)}
                      className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 disabled:opacity-50 text-xs font-bold shadow-sm"
                    >
                      Selanjutnya
                    </button>
                  </div>
                </div>
              )}
            </>
            )}
          </div>
        </div>
      </div>

      {/* Inventory Modal Sheet: Create / Edit Products */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex justify-between items-center">
              <h3 className="font-extrabold text-gray-800 dark:text-slate-200 text-md">
                {editingProduct ? 'Ubah SKU Inventori' : 'Tambah SKU Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:text-slate-400 font-bold text-sm"
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
                          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Kode SKU</label>
                          <input
                            type="text"
                            required
                            className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 font-mono text-sm"
                            value={sku}
                            onChange={e => setSku(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-600 dark:text-slate-400">Kategori</label>
                          <select
                            className="w-full border border-gray-200 dark:border-slate-700 rounded-lg py-2 px-3 text-xs focus:outline-none"
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
                        <label className="text-xs font-bold text-gray-600 dark:text-slate-400">Nama Barang</label>
                        <input
                          type="text"
                          className="w-full border border-gray-200 dark:border-slate-700 rounded-lg py-2 px-3 text-xs"
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
                            className="w-full border border-gray-200 dark:border-slate-700 rounded-lg py-2 px-3 text-xs focus:outline-none font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900"
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
                            className="w-full border border-gray-205 rounded-lg py-2 px-3 text-xs focus:outline-none font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900"
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
                          <label className="text-xs font-bold text-gray-600 dark:text-slate-400">Satuan Unit</label>
                          <input
                            type="text"
                            className="w-full border border-gray-200 dark:border-slate-700 rounded-lg py-2 px-3 text-xs"
                            placeholder="Pcs, Kg, Botol, dll"
                            value={unit}
                            onChange={(e) => setUnit(e.target.value)}
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-600 dark:text-slate-400">Stok Awal</label>
                          <input
                            type="number"
                            className="w-full border border-gray-200 dark:border-slate-700 rounded-lg py-2 px-3 text-xs"
                            value={stock}
                            onChange={(e) => setStock(e.target.value)}
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-600 dark:text-slate-400">Batas Minimum</label>
                          <input
                            type="number"
                            className="w-full border border-gray-200 dark:border-slate-700 rounded-lg py-2 px-3 text-xs"
                            value={minStock}
                            onChange={(e) => setMinStock(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-600 dark:text-slate-400">Harga Modal (Beli)</label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-gray-400 font-bold">Rp</span>
                            <input
                              type="number"
                              disabled={isPriceEditLockedForAdmin}
                              className={`w-full border border-gray-200 dark:border-slate-700 rounded-lg py-2 pl-8 pr-3 text-xs font-bold ${isPriceEditLockedForAdmin ? 'bg-gray-100 dark:bg-slate-800 text-gray-400 cursor-not-allowed border-dashed' : ''
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
                              className={`w-full border border-green-200 rounded-lg py-2 pl-3 pr-8 text-xs font-bold ${isPriceEditLockedForAdmin ? 'bg-gray-100 dark:bg-slate-800 text-gray-400 cursor-not-allowed border-dashed' : 'bg-green-50 focus:ring-2 focus:ring-green-500/20'
                                } outline-none`}
                              value={marginPct}
                              onChange={(e) => handleMarginChange(e.target.value)}
                              placeholder="Misal: 10"
                            />
                            <span className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-green-600 font-bold">%</span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-600 dark:text-slate-400">Harga Jual POS</label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-gray-400 font-bold">Rp</span>
                            <input
                              type="number"
                              disabled={isPriceEditLockedForAdmin}
                              className={`w-full border border-gray-200 dark:border-slate-700 rounded-lg py-2 pl-8 pr-3 text-xs font-bold ${isPriceEditLockedForAdmin ? 'bg-gray-100 dark:bg-slate-800 text-gray-400 cursor-not-allowed border-dashed' : 'bg-green-50/20 focus:ring-2 focus:ring-green-500/20'
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
                              className={`w-full border border-green-200 rounded-lg py-2 pl-8 pr-3 text-xs font-bold ${isPriceEditLockedForAdmin ? 'bg-gray-100 dark:bg-slate-800 text-gray-400 cursor-not-allowed border-dashed' : 'bg-green-50'
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
                            className={`w-full border border-green-200 rounded-lg py-2 px-3 text-xs font-bold ${isPriceEditLockedForAdmin ? 'bg-gray-100 dark:bg-slate-800 text-gray-400 cursor-not-allowed border-dashed' : 'bg-green-50'
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
                    <label className="text-xs font-bold text-gray-600 dark:text-slate-400">Scan Barcode / Kode Batang</label>
                    <input
                      type="text"
                      className="w-full border border-gray-200 dark:border-slate-700 rounded-lg py-2 px-3 text-xs font-mono"
                      placeholder="Masukkan Barcode..."
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-red-600">Tanggal Expired (Opsional)</label>
                    <input
                      type="date"
                      className="w-full border border-gray-200 dark:border-slate-700 rounded-lg py-2 px-3 text-xs font-mono"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="border border-indigo-100 bg-indigo-50/30 rounded-xl p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                      <Package className="w-5 h-5 text-indigo-600" />
                      Opsi Penjualan Box/Karton
                    </label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={hasBoxUnit}
                        onChange={(e) => setHasBoxUnit(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-slate-900 after:border-gray-300 dark:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  {hasBoxUnit && (
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-indigo-100">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-600 dark:text-slate-400">Barcode Box</label>
                        <input
                          type="text"
                          className="w-full border border-gray-200 dark:border-slate-700 rounded-lg py-2 px-3 text-xs font-mono"
                          placeholder="Scan Barcode Box"
                          value={boxBarcode}
                          onChange={(e) => setBoxBarcode(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-600 dark:text-slate-400">Isi per Box (Satuan {unit})</label>
                        <input
                          type="number"
                          className="w-full border border-gray-200 dark:border-slate-700 rounded-lg py-2 px-3 text-xs"
                          placeholder="Contoh: 24"
                          value={pcsPerBox}
                          onChange={(e) => setPcsPerBox(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-600 dark:text-slate-400">Harga Modal (Box)</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-gray-400 font-bold">Rp</span>
                          <input
                            type="number"
                            className="w-full border border-gray-200 dark:border-slate-700 rounded-lg py-2 pl-8 pr-3 text-xs font-bold bg-white dark:bg-slate-900"
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

                <div className="space-y-2 border border-gray-200 dark:border-slate-700 rounded-xl p-4 bg-white dark:bg-slate-900">
                  <label className="text-xs font-bold text-gray-800 dark:text-slate-200 flex items-center gap-2"><Camera className="w-4 h-4 text-green-600" /> Foto Produk (Opsional)</label>

                  {isUploadingImage && (
                    <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-800">
                      <svg className="animate-spin h-4 w-4 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      <span className="font-semibold">Mengupload foto ke cloud... Mohon tunggu.</span>
                    </div>
                  )}

                  {image && !isUploadingImage && (
                    <div className="relative w-32 h-32 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm mx-auto mb-3">
                      <img loading="lazy" src={image} alt="Preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="100%" height="100%" fill="#f1f5f9"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="20" fill="#64748b">No Image</text></svg>'); }} />
                      <button
                        type="button"
                        onClick={() => setImage('')}
                        className="absolute top-1 right-1 bg-white dark:bg-slate-900/90 p-1.5 rounded-lg text-red-700 hover:bg-red-50 border border-red-100 shadow-xs"
                        title="Hapus Foto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      {image.startsWith('http') && (
                        <div className="absolute bottom-0 left-0 right-0 bg-green-600/90 text-white text-[8px] font-bold text-center py-1">
                          ✅ Cloud Storage
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2">
                    <label className={`cursor-pointer bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 text-[10px] font-bold py-2.5 px-1 rounded-xl text-center flex flex-col items-center justify-center gap-1 transition-colors ${isUploadingImage ? 'opacity-50 pointer-events-none' : ''}`}>
                      <Upload className="w-4 h-4" /> Upload Galeri
                      <input type="file" accept="image/*" className="hidden" disabled={isUploadingImage} onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                      }} />
                    </label>

                    <label className={`cursor-pointer bg-green-600 text-white hover:bg-green-700 shadow-md text-[10px] font-bold py-2.5 px-1 rounded-xl text-center flex flex-col items-center justify-center gap-1 transition-colors ${isUploadingImage ? 'opacity-50 pointer-events-none' : ''}`}>
                      <Camera className="w-4 h-4" /> Buka Kamera
                      <input type="file" accept="image/*" capture="environment" className="hidden" disabled={isUploadingImage} onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                      }} />
                    </label>

                    <button
                      type="button"
                      disabled={isUploadingImage || !name}
                      onClick={() => {
                        setIsUploadingImage(true);
                        // Simulate AI processing delay
                        setTimeout(() => {
                          const keyword = category.split(' ')[0] || 'product';
                          // Use a semantic image placeholder service
                          setImage(`https://loremflickr.com/400/400/${encodeURIComponent(keyword)},retail,product/all?lock=${Math.floor(Math.random() * 1000)}`);
                          setIsUploadingImage(false);
                        }, 1500);
                      }}
                      className={`bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 shadow-sm text-[10px] font-bold py-2.5 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors ${(isUploadingImage || !name) ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                      <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg> Auto AI (Internet)
                    </button>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-800">
                    <p className="text-[10px] text-gray-400 mb-1 font-semibold">Atau gunakan URL Gambar (Link Internet):</p>
                    <input
                      type="text"
                      className="w-full border border-gray-200 dark:border-slate-700 rounded-lg py-2 px-3 text-xs bg-gray-50 dark:bg-slate-800 focus:bg-white dark:bg-slate-900 focus:ring-2 focus:ring-green-500/20 outline-none transition-all"
                      placeholder="https://images.unsplash.com/..."
                      value={image.startsWith('data:') ? '' : image}
                      onChange={(e) => setImage(e.target.value)}
                    />
                    <p className="text-[9px] text-gray-500 mt-1">Gunakan link langsung (akhiran .jpg / .png). Jika gambar kosong/gagal, website asal memblokir (Hotlinking). Solusi: Download gambarnya ke HP/PC, lalu gunakan tombol "Upload Galeri".</p>
                  </div>
                </div>

                <div className="border border-amber-200 bg-amber-50/50 rounded-xl p-4 space-y-4">
                  <label className="text-sm font-bold text-amber-900 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-amber-600" />
                    Pemetaan Akun (CoA)
                  </label>
                  <p className="text-[10px] text-amber-700 font-semibold mb-2 leading-relaxed">
                    Pilih akun perkiraan untuk mencatat Pendapatan dan HPP otomatis saat barang terjual.
                  </p>
                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700 dark:text-slate-300">Akun Pendapatan (Sales)</label>
                      <select
                        value={salesCoaCode}
                        onChange={(e) => setSalesCoaCode(e.target.value)}
                        className="w-full border border-gray-200 dark:border-slate-700 rounded-lg py-2 px-3 text-xs bg-white dark:bg-slate-900 focus:ring-2 focus:ring-green-500"
                      >
                        <option value="">- Default (Auto) -</option>
                        {coaList.filter(c => c.category === 'REVENUE' && c.isActive).map(c => (
                          <option key={c.id} value={c.code}>{c.code} - {c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700 dark:text-slate-300">Akun Beban Pokok (COGS)</label>
                      <select
                        value={cogsCoaCode}
                        onChange={(e) => setCogsCoaCode(e.target.value)}
                        className="w-full border border-gray-200 dark:border-slate-700 rounded-lg py-2 px-3 text-xs bg-white dark:bg-slate-900 focus:ring-2 focus:ring-green-500"
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
              <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-gray-100 dark:border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2 px-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-50 dark:bg-slate-800"
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
          {isImporting && (
            <div className="p-3 text-xs text-gray-700 dark:text-slate-300 bg-yellow-50 border-t border-yellow-100 flex items-center justify-between">
              <div>Import berjalan: {importProgress.done} / {importProgress.total}</div>
              <div className="text-[11px] text-gray-500 dark:text-slate-400">Proses background, halaman tetap responsif.</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
