import React, { useState, useMemo, useEffect, useRef } from 'react';
import { FixedSizeList as List } from 'react-window';
import { useBranchData } from '../hooks/useBranchData';
import { Product } from '../types';
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  CheckCircle, 
  Plus, 
  Minus, 
  Coins, 
  QrCode, 
  CreditCard,
  Building,
  Check,
  AlertCircle,
  Package,
  Users,
  AlertTriangle,
  Smartphone,
  Store,
  ChevronDown,
  XOctagon,
  Bluetooth
} from 'lucide-react';
import { printToBluetooth, openCashDrawerBluetooth } from '../lib/bluetoothPrinter';

export default function KasirPOS() {
  const { 
    products, 
    cart, 
    addToCart, 
    removeFromCart, 
    updateCartQuantity, 
    clearCart, 
    checkout,
    customers,
    promos,
    settings,
    activeBranchId,
    categories: savedCategories
  } = useBranchData();

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const searchDebounceRef = useRef<number | null>(null);
  const searchWorkerRef = useRef<Worker | null>(null);
  const [searchMatchedIds, setSearchMatchedIds] = useState<Array<string | number> | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  
  // Checkout Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'QRIS_SHARIAH' | 'TRANSFER_BSI' | 'KASBON'>('CASH');
  const [amountPaidInput, setAmountPaidInput] = useState('');
  const [receiptTx, setReceiptTx] = useState<any>(null); // To show transaction receipt after checkout
  const [customerPhone, setCustomerPhone] = useState('');
  
  // PPOB States
  const [activeTab, setActiveTab] = useState<'PHYSICAL' | 'PPOB'>('PHYSICAL');
  const [ppobModalOpen, setPpobModalOpen] = useState(false);
  const [selectedPpobProduct, setSelectedPpobProduct] = useState<Product | null>(null);
  const [ppobTargetNumber, setPpobTargetNumber] = useState('');
  
  // Payment Simulation States for Presentation
  const [isQrisSimulated, setIsQrisSimulated] = useState(false);
  const [isTransferSimulated, setIsTransferSimulated] = useState(false);
  const [transferSenderName, setTransferSenderName] = useState('');
  
  // New States for QRIS simulation
  const [isQrisEnlarged, setIsQrisEnlarged] = useState(false);
  const [qrisValidationStatus, setQrisValidationStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS'>('IDLE');
  const [qrisRefCode, setQrisRefCode] = useState('');
  
  const [qrisScanMode, setQrisScanMode] = useState<'MERCHANT' | 'CUSTOMER'>('MERCHANT');
  const [scannedCustomerToken, setScannedCustomerToken] = useState('');
  
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const customerDropdownRef = React.useRef<HTMLDivElement>(null);

  const [selectedPromoId, setSelectedPromoId] = useState<string>('');
  const [pointsToRedeemInput, setPointsToRedeemInput] = useState('');

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target as Node)) {
        setIsCustomerDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCustomers = React.useMemo(() => {
    if (!customerSearchTerm) return customers;
    const term = customerSearchTerm.toLowerCase();
    return customers.filter(c => 
      c.name.toLowerCase().includes(term) || 
      (c.phone && c.phone.includes(term))
    );
  }, [customers, customerSearchTerm]);

  // Countdown Timer
  const [timeLeft, setTimeLeft] = useState(0);
  const [isExpired, setIsExpired] = useState(false);

  React.useEffect(() => {
    let timer: any;
    const timeoutMins = settings.paymentTimeoutMinutes || 0;
    
    if (timeoutMins > 0 && isCheckoutOpen && !isExpired && qrisValidationStatus !== 'SUCCESS' && !isTransferSimulated) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsExpired(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isCheckoutOpen, isExpired, qrisValidationStatus, isTransferSimulated, settings.paymentTimeoutMinutes]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Categories
  const categories = React.useMemo(() => {
    const categorySet = new Set<string>(['ALL', 'PROMO']);
    savedCategories?.forEach((cat) => {
      if (cat && typeof cat === 'string') categorySet.add(cat.trim());
    });
    products.forEach((product) => {
      if (product.category && typeof product.category === 'string') {
        categorySet.add(product.category.trim());
      }
    });
    return Array.from(categorySet);
  }, [products, savedCategories]);

  const ppobCategories = React.useMemo(() => {
    const categorySet = new Set<string>(['ALL']);
    products.forEach((product) => {
      if (product.isPPOB && product.category && typeof product.category === 'string') {
        categorySet.add(product.category.trim());
      }
    });
    return Array.from(categorySet);
  }, [products]);

  // Init worker
  useEffect(() => {
    try {
      if (!searchWorkerRef.current) {
        const worker = new Worker(new URL('../workers/searchWorker.ts', import.meta.url), { type: 'module' });
        worker.onmessage = (ev) => {
          const { type, results } = (ev.data || {});
          if (type === 'result') setSearchMatchedIds(Array.isArray(results) ? results : []);
        };
        searchWorkerRef.current = worker;
      }
    } catch (err) {
      console.warn('Failed to init search worker in KasirPOS', err);
    }
    return () => { if (searchWorkerRef.current) { searchWorkerRef.current.terminate(); searchWorkerRef.current = null; } };
  }, []);

  // send docs to worker on products change
  useEffect(() => {
    try {
      if (searchWorkerRef.current) {
        const docs = (products || []).map((p: any) => ({ id: p.id, name: p.name || '', sku: p.sku || '', category: p.category || '' }));
        searchWorkerRef.current.postMessage({ type: 'init', payload: { docs } });
      }
    } catch (err) { console.warn(err); }
  }, [products]);

  // Debounce search input
  useEffect(() => {
    if (searchDebounceRef.current) window.clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = window.setTimeout(() => setDebouncedQuery(searchQuery), 200);
    return () => { if (searchDebounceRef.current) window.clearTimeout(searchDebounceRef.current); };
  }, [searchQuery]);

  // Trigger worker search
  useEffect(() => {
    setSearchMatchedIds(null);
    try {
      if (searchWorkerRef.current) {
        searchWorkerRef.current.postMessage({ type: 'search', payload: { q: debouncedQuery } });
      } else {
        setSearchMatchedIds(null);
      }
    } catch (err) {
      console.warn('KasirPOS search worker error', err);
      setSearchMatchedIds(null);
    }
  }, [debouncedQuery]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    const q = (debouncedQuery || '').toLowerCase().trim();
    if (q && searchMatchedIds) {
      if (searchMatchedIds.length === 0) {
        return [];
      }
      const idMap = new Map(products.map((p) => [p.id, p]));
      const matched = searchMatchedIds.map((id) => idMap.get(id)).filter(Boolean) as Product[];
      return matched.filter(product => {
        let matchesCategory = false;
        if (selectedCategory === 'ALL') matchesCategory = true;
        else if (selectedCategory === 'PROMO') matchesCategory = (product.wholesalePrice !== undefined && product.wholesalePrice < product.price);
        else matchesCategory = product.category === selectedCategory;
        const matchesBranch = !activeBranchId || product.branchId === activeBranchId || !product.branchId;
        if (activeTab === 'PHYSICAL' && product.isPPOB) return false;
        if (activeTab === 'PPOB' && !product.isPPOB) return false;
        return matchesCategory && matchesBranch;
      });
    }

    return products.filter(product => {
      const matchesSearch = !q || product.name.toLowerCase().includes(q) ||
                            product.sku.toLowerCase().includes(q) ||
                            (product.barcode && product.barcode.toLowerCase().includes(q)) ||
                            (product.hasBoxUnit && product.boxBarcode && product.boxBarcode.toLowerCase().includes(q));

      let matchesCategory = false;
      if (selectedCategory === 'ALL') {
        matchesCategory = true;
      } else if (selectedCategory === 'PROMO') {
        matchesCategory = (product.wholesalePrice !== undefined && product.wholesalePrice < product.price);
      } else {
        matchesCategory = product.category === selectedCategory;
      }

      const matchesBranch = !activeBranchId || product.branchId === activeBranchId || !product.branchId;

      if (activeTab === 'PHYSICAL' && product.isPPOB) return false;
      if (activeTab === 'PPOB' && !product.isPPOB) return false;

      return matchesSearch && matchesCategory && matchesBranch;
    });
  }, [products, debouncedQuery, selectedCategory, activeTab, activeBranchId, searchMatchedIds]);

  const displayCategories = activeTab === 'PHYSICAL' ? categories : ppobCategories;

  const handlePpobClick = (product: Product) => {
    setSelectedPpobProduct(product);
    setPpobTargetNumber('');
    setPpobModalOpen(true);
  };

  const handleAddPpobToCart = () => {
    if (selectedPpobProduct && ppobTargetNumber) {
      addToCart(selectedPpobProduct, false, ppobTargetNumber);
      setPpobModalOpen(false);
      setSelectedPpobProduct(null);
      setPpobTargetNumber('');
    } else {
      alert("Masukkan nomor tujuan/ID Pelanggan terlebih dahulu!");
    }
  };

  const getDynamicPrice = (item: any) => {
    if (item.isBox && item.product.hasBoxUnit) {
      return item.product.boxPrice || item.product.price;
    }
    if (item.product.wholesalePrice && item.product.wholesaleMinQty && item.quantity >= item.product.wholesaleMinQty) {
      return item.product.wholesalePrice;
    }
    return item.product.price;
  };

  const baseTotal = cart.reduce((sum, item) => sum + (getDynamicPrice(item) * item.quantity), 0);

  const selectedPromo = promos.find(p => p.id === selectedPromoId);
  let discountAmount = 0;
  if (selectedPromo && selectedPromo.isActive && baseTotal >= selectedPromo.minPurchase) {
    if (selectedPromo.type === 'PERCENTAGE') {
      discountAmount = baseTotal * (selectedPromo.value / 100);
    } else {
      discountAmount = selectedPromo.value;
    }
  }

  let cartTotal = baseTotal - discountAmount;
  let taxAmount = 0;
  if (settings.isTaxEnabled) {
    taxAmount = cartTotal * (settings.taxRate / 100);
    cartTotal += taxAmount;
  }

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
  const maxRedeemablePoints = selectedCustomer ? Math.min(selectedCustomer.points, Math.floor(cartTotal / 10)) : 0;
  const pointsDiscountVal = (Number(pointsToRedeemInput) || 0) * 10;
  const finalTotalWithPoints = Math.max(0, cartTotal - pointsDiscountVal);

  const handleCheckoutSubmit = () => {
    let finalPaymentMethod: any = paymentMethod;
    let finalAmountPaid = paymentMethod === 'CASH' ? Number(amountPaidInput) : finalTotalWithPoints;
    let splitParams = undefined;

    if (finalAmountPaid < finalTotalWithPoints) {
      alert("Jumlah uang dibayarkan kurang dari total belanja.");
      return;
    }
    
    const tx = checkout({
      paymentMethod: finalPaymentMethod,
      amountPaid: finalAmountPaid,
      customerId: selectedCustomerId || undefined,
      promoId: selectedPromoId || undefined,
      pointsToRedeem: Number(pointsToRedeemInput) || undefined,
      splitPayments: splitParams
    });
    if (tx) {
      setReceiptTx(tx);
      setAmountPaidInput('');
      setPointsToRedeemInput('');
    } else {
      alert("Sistem POS mendapati kegagalan sirkulasi transaksi. Periksa kembali stok barang.");
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const handleBluetoothPrint = async () => {
    if (!receiptTx) return;
    try {
      const address = `${activeBranchId ? `CABANG ${activeBranchId}` : 'KANTOR PUSAT'}, INDONESIA`;
      const zakatTitle = settings.charityTitle || 'MISI BERKAH BERAMAL';
      const zakatDesc = settings.charityDescription ? settings.charityDescription : 'Zakat Kontribusi Sebesar Rp {amount} dari transaksi ini\ndicadangkan untuk kaum Dhuafa.';
      await printToBluetooth(receiptTx, 'Toko KSA Mart', address, 'Telp: 082210027952', zakatTitle, zakatDesc);
    } catch (err: any) {
      alert(err.message || 'Gagal terhubung ke printer Bluetooth.');
    }
  };

  const handleSendWhatsApp = () => {
    if (!receiptTx) return;
    if (!customerPhone) {
      alert("Silakan masukkan nomor WhatsApp pelanggan terlebih dahulu.");
      return;
    }
    
    // Format nomor HP agar menggunakan kode negara (mengubah 0 di depan ke 62)
    let formattedPhone = customerPhone.replace(/[^0-9]/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '62' + formattedPhone.slice(1);
    }
    
    const itemsText = receiptTx.items.map((it: any) => {
      const targetStr = it.targetNumber ? `\n   [No: ${it.targetNumber}]` : '';
      return `• ${it.productName}${targetStr} (${it.quantity}x @ Rp ${it.price.toLocaleString('id-ID')}) -> Rp ${(it.price * it.quantity).toLocaleString('id-ID')}`;
    }).join('\n');
    
    const textMessage = `🕌 *Toko KSA Mart* 🕌\n` +
      `Toko KSA Mart, Indonesia\n` +
      `No. Struk: ${receiptTx.invoiceNo}\n` +
      `===============================\n` +
      `📄 *No Invoice:* ${receiptTx.invoiceNo}\n` +
      `⏰ *Waktu:* ${new Date(receiptTx.timestamp).toLocaleString('id-ID')}\n` +
      `👤 *Kasir:* ${receiptTx.cashierName}\n` +
      `💳 *Metode:* ${receiptTx.paymentMethod}\n` +
      `===============================\n\n` +
      `${itemsText}\n\n` +
      `===============================\n` +
      (receiptTx.discountAmount > 0 ? `🎊 *Diskon Promo:* -Rp ${receiptTx.discountAmount.toLocaleString('id-ID')}\n` : '') +
      (receiptTx.pointsDiscount > 0 ? `🪙 *Tukar Poin:* -Rp ${receiptTx.pointsDiscount.toLocaleString('id-ID')} (${receiptTx.pointsRedeemed} Poin)\n` : '') +
      (receiptTx.taxAmount > 0 ? `🧾 *Pajak:* Rp ${receiptTx.taxAmount.toLocaleString('id-ID')}\n` : '') +
      `💰 *Total Belanja:* Rp ${receiptTx.totalAmount.toLocaleString('id-ID')}\n` +
      `💵 *Uang Diterima:* Rp ${receiptTx.amountPaid.toLocaleString('id-ID')}\n` +
      `🪙 *Uang Kembali:* Rp ${receiptTx.changeAmount.toLocaleString('id-ID')}\n` +
      (receiptTx.pointsEarned > 0 ? `✨ *Poin Diperoleh:* +${receiptTx.pointsEarned} Poin\n` : '') +
      `\n===============================\n\n` +
      (receiptTx.zakatContribution > 0 ? `Zakat Kontribusi Sebesar *Rp ${receiptTx.zakatContribution.toLocaleString('id-ID')}* dari transaksi ini dicadangkan untuk kaum Dhuafa. Terima kasih atas kepercayaan Anda membeli barang halal di Toko KSA Mart. Semoga berkah!` : '');

    const encodedText = encodeURIComponent(textMessage);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedText}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="flex flex-col md:flex-row gap-2 md:gap-4 flex-1 min-h-[500px] w-full min-w-0 overflow-hidden">
      {/* Product Catalog Grid - Left */}
      <div className="flex-1 flex flex-col min-w-0 h-[60vh] md:h-[calc(100vh-100px)] space-y-3">
        
        {/* Type Tabs */}
        <div className="flex gap-2">
          <button 
            onClick={() => { setActiveTab('PHYSICAL'); setSelectedCategory('ALL'); }}
            className={`flex-1 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'PHYSICAL' ? 'bg-green-600 text-white shadow-lg' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Package className="w-5 h-5" />
            Produk Fisik
          </button>
          <button 
            onClick={() => { setActiveTab('PPOB'); setSelectedCategory('ALL'); }}
            className={`flex-1 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'PPOB' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Smartphone className="w-5 h-5" />
            PPOB & Digital
          </button>
        </div>

        {/* Search & Filter Header */}
        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs flex flex-col gap-4">
          <div className="relative w-full">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="w-5 h-5 text-gray-400" />
            </span>
            <input
              type="text"
              autoFocus
              className="w-full pl-10 pr-4 py-2 bg-white text-slate-800 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/25 focus:border-green-600"
              placeholder="Cari item berdasar nama produk / SKU / No Barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim() !== '') {
                  const exactMatch = products.find(p => p.barcode === searchQuery.trim() || p.sku === searchQuery.trim());
                  const exactBoxMatch = products.find(p => p.hasBoxUnit && p.boxBarcode === searchQuery.trim());
                  
                  if (exactMatch) {
                    addToCart(exactMatch, false);
                    setSearchQuery('');
                  } else if (exactBoxMatch) {
                    addToCart(exactBoxMatch, true);
                    setSearchQuery('');
                  }
                }
              }}
            />
          </div>

          <div className="flex overflow-x-auto hide-scrollbar gap-2 py-1 w-full">
            {displayCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  selectedCategory === cat
                    ? (activeTab === 'PHYSICAL' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700')
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Catalog List scrollable area */}
        <div className="flex-1 overflow-y-auto pr-1">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <AlertCircle className="w-12 h-12 text-amber-600 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Produk tidak ditemukan.</p>
            </div>
          ) : (
            <List
              height={Math.min(window.innerHeight * 0.72, 780)}
              itemCount={Math.ceil(filteredProducts.length / (window.innerWidth >= 1536 ? 6 : window.innerWidth >= 1280 ? 5 : window.innerWidth >= 1024 ? 4 : window.innerWidth >= 768 ? 4 : 3))}
              itemSize={260}
              width={'100%'}
            >
              {({ index, style }) => {
                const cols = window.innerWidth >= 1536 ? 6 : window.innerWidth >= 1280 ? 5 : window.innerWidth >= 1024 ? 4 : window.innerWidth >= 768 ? 4 : 3;
                const start = index * cols;
                const items = filteredProducts.slice(start, start + cols);
                return (
                  <div style={style} className={`grid grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 px-1`}>
                    {items.map((p) => {
                      const cartQty = cart.find(c => c.product.id === p.id)?.quantity || 0;
                      const isOutOfStock = p.stock <= 0;
                      const isLowStock = p.stock <= p.minStock && p.stock > 0;
                      return (
                        <div 
                          key={p.id}
                          onClick={() => {
                            if (activeTab === 'PPOB') {
                              handlePpobClick(p);
                            } else if (!isOutOfStock) {
                              addToCart(p, false);
                            }
                          }}
                          className={`bg-white rounded-xl border flex flex-col overflow-hidden transition-all relative ${
                            isOutOfStock ? 'opacity-65 border-gray-200' : 'border-gray-200 hover:shadow-md hover:border-green-300'
                          }`}
                        >
                          <div className="absolute top-2 right-2 z-10">
                            <span className="bg-green-50 text-green-700 text-[8px] font-bold px-1 py-0.5 rounded-sm border border-green-100 uppercase tracking-widest shadow-sm backdrop-blur-md">Halal</span>
                          </div>
                          <div className="w-full h-20 bg-slate-100 flex-shrink-0 relative">
                            {p.image ? (
                              <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <img 
                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=random&color=fff&size=200&bold=true`}
                                alt={p.name} 
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <div className="p-2.5 pb-3 flex flex-col flex-1 justify-between">
                            <div className="mb-1">
                              <span className="text-[9px] text-gray-400 font-mono font-semibold block">{p.sku}</span>
                              <h3 className="font-bold text-xs text-gray-800 line-clamp-2 mt-0.5 leading-snug h-8">{p.name}</h3>
                              <p className="text-[9px] text-gray-400 font-semibold uppercase mt-0.5">{p.category}</p>
                            </div>
                            <div className="mt-auto pt-1.5 border-t border-gray-50">
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-bold text-gray-800 text-xs">Rp {p.price.toLocaleString('id-ID')}</span>
                                {!p.isPPOB ? (
                                  isOutOfStock ? (
                                    <span className="text-[9px] font-semibold text-white bg-red-500 px-1.5 py-0.5 rounded-full">Habis</span>
                                  ) : isLowStock ? (
                                    <span className="text-[9px] font-semibold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded-full border border-amber-200">{p.stock}</span>
                                  ) : (
                                    <span className="text-[9px] font-semibold text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded-full">{p.stock}</span>
                                  )
                                ) : (
                                  <span className="text-[9px] font-semibold text-blue-800 bg-blue-100 px-1.5 py-0.5 rounded-full">Digital</span>
                                )}
                              </div>
                              {isOutOfStock && !p.isPPOB ? (
                                <button disabled className="w-full bg-slate-100 text-gray-400 py-1.5 rounded-lg text-xs font-semibold cursor-not-allowed">Stok Kosong</button>
                              ) : (
                                <div className="w-full bg-green-700 text-white py-1.5 rounded-lg text-xs font-bold flex items-center justify-center space-x-1 shadow-xs active:scale-98 transition-all">
                                  <Plus className="w-3.5 h-3.5 mr-0.5" />
                                  <span>{activeTab === 'PPOB' ? 'Pilih Layanan' : 'Pilih Produk'}</span>
                                  {cartQty > 0 && (<span className="bg-amber-400 text-green-950 font-bold ml-1 px-1.5 py-0.1 rounded-full text-[10px]">{cartQty}</span>)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              }}
            </List>
          )}
        </div>
      </div>

      {/* Shopping Cart Section - Right */}
      <div id="cart-section" className="w-full md:w-[300px] lg:w-[320px] xl:w-[400px] 2xl:w-[450px] shrink-0 h-auto md:max-h-[calc(100vh-100px)] flex flex-col bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden mt-4 md:mt-0">
        {/* Cart Header */}
        <div className="p-4 border-b border-gray-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="w-5 h-5 text-green-800" />
            <h2 className="font-bold text-gray-800 text-md">Keranjang Belanja</h2>
          </div>
          <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-0.5 rounded-full">
            {cart.reduce((s, c) => s + c.quantity, 0)} Pcs
          </span>
        </div>

        {/* Shariah Compliance & Locked Prices Indicator */}
        <div className="bg-green-800 text-white p-3 border-b border-[#0e441b] text-[10px] space-y-1">
          <p className="font-black uppercase tracking-wider flex items-center justify-between">
            <span>AKAD: JUAL BELI</span>
            <span className="bg-amber-400 text-green-950 font-black px-1.5 py-0.5 rounded text-[8px]">TERKUNCI</span>
          </p>
          <p className="text-gray-100/90 leading-relaxed font-medium">
            Harga beli dan jual barang/komoditas sudah otomatis ditentukan oleh sistem berdasarkan ketetapan Owner & Admin Syariah.
          </p>
        </div>

        {/* Active Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-10 text-gray-400">
              <ShoppingCart className="w-12 h-12 text-slate-200" />
              <p className="text-xs font-medium">Belum ada item ditambahkan.</p>
            </div>
          ) : (
            cart.map((item) => (
              <div 
                key={item.product.id + (item.targetNumber || '')}
                className="flex items-center justify-between p-2 rounded-lg border border-gray-100 hover:bg-slate-50/50"
              >
                <div className="flex-1 min-w-0 pr-2">
                  <h4 className="text-xs font-bold text-gray-800 truncate">
                    {item.product.name} {item.isBox && <span className="text-[10px] text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded ml-1 border border-indigo-100">Box</span>}
                  </h4>
                  {item.targetNumber && <p className="text-[10px] text-blue-600 font-bold">No: {item.targetNumber}</p>}
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-[10px] text-gray-400 font-semibold">
                      Rp {getDynamicPrice(item).toLocaleString('id-ID')} / {item.isBox ? 'Box' : item.product.unit}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 flex-shrink-0">
                  <button
                    onClick={() => updateCartQuantity(item.product.id, item.quantity - 1, item.isBox)}
                    className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center hover:bg-slate-100 focus:outline-none"
                  >
                    <Minus className="w-3 h-3 text-gray-500" />
                  </button>
                  <span className="text-xs font-bold text-gray-800 w-5 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateCartQuantity(item.product.id, item.quantity + 1, item.isBox)}
                    className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center hover:bg-slate-100 focus:outline-none"
                  >
                    <Plus className="w-3 h-3 text-gray-500" />
                  </button>
                  <button
                    onClick={() => removeFromCart(item.product.id, item.isBox)}
                    className="text-gray-300 hover:text-red-500 p-1 transition-colors"
                    title="Buang"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Customer & Promo Selection */}
        <div className="px-4 pb-2 pt-1 border-t border-gray-100 bg-white grid grid-cols-1 md:grid-cols-2 gap-2">
          <div ref={customerDropdownRef} className="relative">
            <label className="text-[10px] font-bold text-gray-500 uppercase">Pelanggan</label>
            <div 
              className="w-full text-xs border border-gray-200 rounded p-1.5 outline-none focus:border-green-500 bg-white cursor-pointer flex justify-between items-center"
              onClick={() => setIsCustomerDropdownOpen(!isCustomerDropdownOpen)}
            >
              <span className="truncate">
                {selectedCustomerId ? customers.find(c => c.id === selectedCustomerId)?.name || 'Umum' : '-- Umum --'}
              </span>
              <span className="text-gray-400">▼</span>
            </div>

            {isCustomerDropdownOpen && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded shadow-lg">
                <div className="p-2 border-b border-gray-100">
                  <input
                    type="text"
                    placeholder="Cari nama atau no telepon..."
                    className="w-full text-xs border border-gray-200 rounded p-1.5 outline-none focus:border-green-500"
                    value={customerSearchTerm}
                    onChange={(e) => setCustomerSearchTerm(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                  />
                </div>
                <div className="max-h-40 overflow-y-auto">
                  <div 
                    className="p-2 text-xs hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      setSelectedCustomerId('');
                      setIsCustomerDropdownOpen(false);
                      setCustomerSearchTerm('');
                    }}
                  >
                    -- Umum --
                  </div>
                  {filteredCustomers.map(c => (
                    <div 
                      key={c.id} 
                      className="p-2 text-xs hover:bg-gray-50 cursor-pointer border-t border-gray-50"
                      onClick={() => {
                        setSelectedCustomerId(c.id);
                        setIsCustomerDropdownOpen(false);
                        setCustomerSearchTerm('');
                      }}
                    >
                      <div className="font-bold text-gray-700">{c.name}</div>
                      {c.phone && <div className="text-[10px] text-gray-500">{c.phone}</div>}
                    </div>
                  ))}
                  {filteredCustomers.length === 0 && (
                    <div className="p-2 text-xs text-gray-400 text-center">Pelanggan tidak ditemukan</div>
                  )}
                </div>
              </div>
            )}
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase">Promo</label>
            <select 
              className="w-full text-xs border border-gray-200 rounded p-1 outline-none focus:border-green-500"
              value={selectedPromoId}
              onChange={e => setSelectedPromoId(e.target.value)}
            >
              <option value="">-- Tanpa Promo --</option>
              {promos.filter(p => p.isActive).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>

        {/* Loyalitas Poin Pelanggan UI */}
        {selectedCustomer && selectedCustomer.points > 0 && settings.enablePoints !== false && (
          <div className="px-4 pb-4 bg-white">
            <div className="bg-fuchsia-50/50 border border-fuchsia-100 rounded-xl p-3.5 space-y-2 animate-in fade-in zoom-in-95">
              <div className="flex justify-between items-center text-xs font-bold text-fuchsia-800">
                <span>Poin Pelanggan</span>
                <span>Tersedia: {selectedCustomer.points} Pts</span>
              </div>
              <p className="text-[10px] text-fuchsia-700">Nilai Tukar: Rp {settings.pointRedemptionValue || 10}/poin. Maks: {maxRedeemablePoints} poin.</p>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  max={maxRedeemablePoints}
                  value={pointsToRedeemInput}
                  onChange={(e) => {
                    const val = Math.max(0, Math.min(maxRedeemablePoints, Number(e.target.value) || 0));
                    setPointsToRedeemInput(val > 0 ? val.toString() : '');
                  }}
                  placeholder="Masukkan poin..."
                  className="flex-1 bg-white border border-fuchsia-200 rounded-lg py-1.5 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20"
                />
                <button
                  type="button"
                  onClick={() => setPointsToRedeemInput(maxRedeemablePoints.toString())}
                  className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  Tukar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Checkout Summaries Section */}
        <div className="p-4 border-t border-gray-100 bg-slate-50">
          <div className="space-y-1 mb-4">
            <div className="flex justify-between items-center text-xs text-gray-500 font-medium">
              <span>Subtotal</span>
              <span>Rp {baseTotal.toLocaleString('id-ID')}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between items-center text-xs text-fuchsia-600 font-medium">
                <span>Diskon Promo</span>
                <span>- Rp {discountAmount.toLocaleString('id-ID')}</span>
              </div>
            )}
            {pointsDiscountVal > 0 && (
              <div className="flex justify-between items-center text-xs text-fuchsia-600 font-medium">
                <span>Diskon Poin ({pointsToRedeemInput} Pts)</span>
                <span>- Rp {pointsDiscountVal.toLocaleString('id-ID')}</span>
              </div>
            )}
            {settings.isTaxEnabled && (
              <div className="flex justify-between items-center text-xs text-amber-600 font-medium">
                <span>Pajak PPN ({settings.taxRate}%)</span>
                <span>Rp {taxAmount.toLocaleString('id-ID')}</span>
              </div>
            )}
            {settings.enableCharityZakat !== false && (
              <div className="flex justify-between items-center text-xs text-gray-500 font-medium pb-2 border-b border-gray-200 mt-1">
                <span>Zakat Kontribusi (Est.)</span>
                <span className="text-green-700">Rp {((finalTotalWithPoints - taxAmount - cart.reduce((s, i) => s + (i.product.costPrice || 0) * i.quantity, 0)) * ((settings.charityZakatPercentage ?? 2.5) / 100) > 0 ? (finalTotalWithPoints - taxAmount - cart.reduce((s, i) => s + (i.product.costPrice || 0) * i.quantity, 0)) * ((settings.charityZakatPercentage ?? 2.5) / 100) : 0).toLocaleString('id-ID')}</span>
              </div>
            )}
            <div className="flex justify-between items-center mt-2 pt-1">
              <span className="font-bold text-gray-800 text-sm">Total Pembayaran</span>
              <span className="font-extrabold text-gray-900 text-lg">Rp {finalTotalWithPoints.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={clearCart}
              disabled={cart.length === 0}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                cart.length === 0 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-red-50 text-red-600 hover:bg-red-100'
              }`}
            >
              Kosongkan
            </button>
            <button
              onClick={() => {
                if(cart.length > 0) {
                  setIsCheckoutOpen(true);
                  setTimeLeft((settings.paymentTimeoutMinutes || 0) * 60);
                  setIsExpired(false);
                }
              }}
              disabled={cart.length === 0}
              className={`py-2 text-xs font-bold rounded-lg transition-all text-center flex items-center justify-center space-x-1 shadow-xs ${
                cart.length === 0
                  ? 'bg-green-500/20 text-white/50 cursor-not-allowed'
                  : 'bg-green-700 hover:bg-green-800 text-white'
              }`}
            >
              <span>Bayar Sekarang</span>
            </button>
          </div>
        </div>
      </div>

      {/* Checkout Processing Dialog / Modal overlay */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsCheckoutOpen(false)}></div>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden relative animate-in slide-in-from-bottom-8 duration-300">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white/50 backdrop-blur-md">
              <h2 className="text-lg font-bold text-gray-800 tracking-tight">Pencatatan Pembayaran POS</h2>
              <div className="flex items-center gap-4">
                {(settings.paymentTimeoutMinutes || 0) > 0 && isCheckoutOpen && !isExpired && qrisValidationStatus !== 'SUCCESS' && !isTransferSimulated && (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-full border border-amber-200 text-xs font-bold font-mono">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </span>
                    {formatTime(timeLeft)}
                  </div>
                )}
                <button onClick={() => setIsCheckoutOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <XOctagon className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <div className="bg-green-50/50 rounded-xl p-4 border border-green-100 text-center">
                <p className="text-xs text-gray-500 font-medium">Total Tagihan Belanja</p>
                <p className="text-2xl font-extrabold text-gray-900 mt-1">Rp {cartTotal.toLocaleString('id-ID')}</p>
                {pointsDiscountVal > 0 && (
                  <p className="text-xs text-fuchsia-600 font-semibold mt-1">Potongan Poin: - Rp {pointsDiscountVal.toLocaleString('id-ID')}</p>
                )}
                {pointsDiscountVal > 0 && (
                  <p className="text-sm font-extrabold text-green-800 mt-1 border-t border-dashed border-green-200 pt-1">Total Baru: Rp {finalTotalWithPoints.toLocaleString('id-ID')}</p>
                )}
              </div>

              {/* Points Redemption block */}
              {/* Payment Method selectors */}
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Metode Pembayaran Syariah</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                <button onClick={() => { setPaymentMethod('CASH'); setTimeLeft((settings.paymentTimeoutMinutes || 0) * 60); setIsExpired(false); }} className={`flex flex-col items-center justify-center p-2 rounded-xl border ${paymentMethod === 'CASH' ? 'border-green-500 bg-green-50 text-green-700 ring-2 ring-green-500/20' : 'border-gray-200 text-gray-500 hover:bg-slate-50'} transition-all`}>
                  <Coins className="w-5 h-5 mb-1" />
                  <span className="text-[10px] font-bold">Tunai</span>
                </button>
                <button disabled={isExpired || settings.qrisEnabled === false} onClick={() => { setPaymentMethod('QRIS_SHARIAH'); setTimeLeft((settings.paymentTimeoutMinutes || 0) * 60); setIsExpired(false); }} className={`flex flex-col items-center justify-center p-2 rounded-xl border ${paymentMethod === 'QRIS_SHARIAH' ? 'border-green-500 bg-green-50 text-green-700 ring-2 ring-green-500/20' : 'border-gray-200 text-gray-500 hover:bg-slate-50'} transition-all ${isExpired ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <QrCode className="w-5 h-5 mb-1" />
                  <span className="text-[10px] font-bold">QRIS</span>
                </button>
                <button disabled={isExpired} onClick={() => { setPaymentMethod('TRANSFER_BSI'); setTimeLeft((settings.paymentTimeoutMinutes || 0) * 60); setIsExpired(false); }} className={`flex flex-col items-center justify-center p-2 rounded-xl border ${paymentMethod === 'TRANSFER_BSI' ? 'border-green-500 bg-green-50 text-green-700 ring-2 ring-green-500/20' : 'border-gray-200 text-gray-500 hover:bg-slate-50'} transition-all ${isExpired ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <CreditCard className="w-5 h-5 mb-1" />
                  <span className="text-[10px] font-bold">Transfer</span>
                </button>
                <button disabled={isExpired} onClick={() => { setPaymentMethod('KASBON'); setTimeLeft((settings.paymentTimeoutMinutes || 0) * 60); setIsExpired(false); }} className={`flex flex-col items-center justify-center p-2 rounded-xl border ${paymentMethod === 'KASBON' ? 'border-red-500 bg-red-50 text-red-700 ring-2 ring-red-500/20' : 'border-gray-200 text-gray-500 hover:bg-slate-50'} transition-all ${isExpired ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <Users className="w-5 h-5 mb-1" />
                  <span className="text-[10px] font-bold">Kasbon</span>
                </button>
              </div>

              {/* Expiration Message */}
              {isExpired ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-800 animate-in zoom-in-95">
                  <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                  <h3 className="text-lg font-bold mb-1">Sesi Pembayaran Berakhir</h3>
                  <p className="text-sm">Waktu tunggu pembayaran telah melebihi batas maksimal (5 Menit). Silakan batalkan transaksi dan coba lagi.</p>
                </div>
              ) : (
                <>
                  {/* Payment Inputs */}
                  {paymentMethod === 'CASH' ? (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600">Terima Uang Cash (Rp)</label>
                      <input
                        type="number"
                        value={amountPaidInput}
                        onChange={(e) => setAmountPaidInput(e.target.value)}
                        className="w-full pl-4 pr-4 py-2 bg-white text-slate-800 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/25 focus:border-green-600 font-bold"
                        placeholder="Masukkan jumlah yang diserahkan pelanggan..."
                      />
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {[finalTotalWithPoints, Math.ceil(finalTotalWithPoints / 10000) * 10000, Math.ceil(finalTotalWithPoints / 50000) * 50000, 100000, 200000].map((val) => (
                          <button key={val} onClick={() => setAmountPaidInput(val.toString())} className="bg-slate-100 hover:bg-slate-200 text-gray-600 text-[10px] px-2 py-1 rounded cursor-pointer">
                            Rp {val.toLocaleString('id-ID')}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : paymentMethod === 'KASBON' ? (
                    <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 space-y-3">
                      <div className="flex items-start gap-3 text-rose-800">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-bold">Peringatan Transaksi Kasbon!</p>
                          <p className="text-xs mt-1 text-rose-700/80">Anda wajib memilih <b>Nama Pelanggan</b> di bagian atas untuk mencatat piutang ini.</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 rounded-lg p-3 border border-gray-100 text-xs text-slate-500 leading-relaxed">
                      {paymentMethod === 'QRIS_SHARIAH' ? (
                        <div className="flex flex-col space-y-3">
                          {/* Tabs for Scan Mode */}
                          <div className="flex bg-slate-200/50 p-1 rounded-lg">
                            <button 
                              onClick={() => setQrisScanMode('MERCHANT')}
                              className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${qrisScanMode === 'MERCHANT' ? 'bg-white text-green-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                              Pelanggan Scan QR Toko
                            </button>
                            <button 
                              onClick={() => { setQrisScanMode('CUSTOMER'); setTimeout(() => document.getElementById('barcode-scanner-input')?.focus(), 100); }}
                              className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${qrisScanMode === 'CUSTOMER' ? 'bg-white text-green-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                              Kasir Scan QR Pelanggan
                            </button>
                          </div>

                          {qrisScanMode === 'MERCHANT' ? (
                            <div className="flex flex-col items-center">
                              <p className="text-center font-medium mb-3">Arahkan pelanggan untuk scan QR Code statis toko dan tunjukkan bukti berhasil pada layar HP mereka.</p>
                              <div 
                                className="w-40 h-40 bg-white border border-gray-200 rounded-xl flex items-center justify-center p-2 shadow-sm overflow-hidden mb-3 cursor-pointer hover:shadow-md hover:border-green-300 transition-all group relative"
                                onClick={() => setIsQrisEnlarged(true)}
                              >
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <span className="text-white text-[10px] font-bold">Perbesar</span>
                                </div>
                                {settings.qrisImageUrl ? (
                                  <img src={settings.qrisImageUrl} alt="QRIS Toko" className="w-full h-full object-contain" />
                                ) : (
                                  <div className="flex flex-col items-center justify-center text-green-800 opacity-60">
                                    <QrCode className="w-16 h-16 mb-2" />
                                    <span className="text-[10px] text-center">Belum ada QRIS<br/>Upload di Pengaturan</span>
                                  </div>
                                )}
                              </div>
                              
                              {qrisValidationStatus === 'IDLE' && (
                                <button 
                                  onClick={() => {
                                    setQrisValidationStatus('LOADING');
                                    setTimeout(() => {
                                      setQrisValidationStatus('SUCCESS');
                                      setQrisRefCode(`QRS-${Math.floor(100000 + Math.random() * 900000)}`);
                                      setIsQrisSimulated(true);
                                    }, 2000);
                                  }}
                                  className="w-full py-2 bg-green-100 hover:bg-green-200 text-green-800 font-bold rounded-lg border border-green-300 transition-colors"
                                >
                                  Verifikasi Bukti QRIS Selesai
                                </button>
                              )}
                              
                              {qrisValidationStatus === 'LOADING' && (
                                <div className="w-full py-2 bg-slate-100 text-slate-600 font-bold rounded-lg text-center flex items-center justify-center space-x-2 border border-slate-200">
                                  <div className="w-4 h-4 border-2 border-slate-400 border-t-slate-600 rounded-full animate-spin"></div>
                                  <span>Menunggu Pembayaran...</span>
                                </div>
                              )}
                              
                              {qrisValidationStatus === 'SUCCESS' && (
                                <div className="w-full py-2 bg-green-600 text-white font-bold rounded-lg text-center flex flex-col items-center justify-center shadow-xs">
                                  <div className="flex items-center space-x-1 mb-1">
                                    <CheckCircle className="w-4 h-4" />
                                    <span>Pembayaran QRIS Berhasil!</span>
                                  </div>
                                  <span className="text-[10px] bg-green-800 px-2 py-0.5 rounded-full">Ref: {qrisRefCode}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-col space-y-3">
                              <p className="text-center font-medium">Arahkan Scanner (Barcode Gun) ke layar HP pelanggan (GoPay/OVO/Dana) lalu tekan tombol tembak.</p>
                              
                              <div className="relative">
                                <input
                                  id="barcode-scanner-input"
                                  type="text"
                                  autoFocus
                                  value={scannedCustomerToken}
                                  onChange={(e) => setScannedCustomerToken(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && scannedCustomerToken.length > 5) {
                                      setIsQrisSimulated(true);
                                    }
                                  }}
                                  className="w-full pl-10 pr-4 py-3 bg-white text-slate-800 border-2 border-green-500 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 text-center font-mono text-lg font-bold tracking-widest placeholder-gray-300 shadow-inner"
                                  placeholder="Klik di sini & Tembakkan Scanner..."
                                />
                                {!isQrisSimulated && (
                                   <div className="absolute right-3 top-4 flex space-x-1">
                                     <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
                                     <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                   </div>
                                )}
                              </div>

                              {!isQrisSimulated ? (
                                <button 
                                  onClick={() => {
                                    if (scannedCustomerToken.length > 5) setIsQrisSimulated(true);
                                    else alert("Silakan scan barcode pelanggan terlebih dahulu (minimal 6 karakter token).");
                                  }}
                                  className="w-full py-2 bg-green-100 hover:bg-green-200 text-green-800 font-bold rounded-lg border border-green-300 transition-colors"
                                >
                                  Tarik Dana dari Pelanggan
                                </button>
                              ) : (
                                <div className="w-full py-2 bg-green-600 text-white font-bold rounded-lg text-center flex items-center justify-center space-x-1 shadow-xs">
                                  <CheckCircle className="w-4 h-4" />
                                  <span>Dana Berhasil Ditarik!</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p>Pastikan dana masuk ke rekening: <b>{settings.ownerBankName || 'BSI'}</b> No. Rek: <b>{settings.ownerBankAccount || '-'}</b>.</p>
                          
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-600 uppercase">Nama Pengirim (Sesuai Mutasi Bank)</label>
                            <input
                              type="text"
                              value={transferSenderName}
                              onChange={(e) => setTransferSenderName(e.target.value)}
                              className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 bg-white"
                              placeholder="Masukkan nama pengirim untuk dicatat..."
                            />
                          </div>

                          {!isTransferSimulated ? (
                            <button 
                              onClick={() => {
                                if (!transferSenderName) { alert("Masukkan nama pengirim untuk verifikasi!"); return; }
                                setIsTransferSimulated(true);
                              }}
                              className="w-full py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold rounded-lg border border-blue-300 transition-colors"
                            >
                              Verifikasi Dana Masuk (Mutasi)
                            </button>
                          ) : (
                            <div className="w-full py-2 bg-blue-600 text-white font-bold rounded-lg text-center flex items-center justify-center space-x-1 shadow-xs">
                              <CheckCircle className="w-4 h-4" />
                              <span>Dana Masuk Diverifikasi!</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Show Cash changes */}
                  {!isExpired && paymentMethod === 'CASH' && Number(amountPaidInput) > 0 && (
                    <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded-lg border text-xs">
                      <span className="font-semibold text-gray-500">Uang Kembalian</span>
                      <span className={`font-bold text-sm ${Number(amountPaidInput) - finalTotalWithPoints < 0 ? 'text-red-500' : 'text-green-700'}`}>
                        {Number(amountPaidInput) - finalTotalWithPoints < 0 
                          ? `Kurang Rp ${(finalTotalWithPoints - Number(amountPaidInput)).toLocaleString('id-ID')}` 
                          : `Rp ${(Number(amountPaidInput) - finalTotalWithPoints).toLocaleString('id-ID')}`
                        }
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-gray-100 grid grid-cols-2 gap-2">
              <button
                onClick={() => { setIsCheckoutOpen(false); setIsQrisSimulated(false); setIsTransferSimulated(false); setQrisValidationStatus('IDLE'); setIsExpired(false); }}
                className="py-2.5 bg-white border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  handleCheckoutSubmit();
                  setIsCheckoutOpen(false);
                  setIsQrisSimulated(false);
                  setIsTransferSimulated(false);
                  setQrisValidationStatus('IDLE');
                  setIsExpired(false);
                }}
                disabled={
                  isExpired ||
                  cart.length === 0 || 
                  (paymentMethod === 'CASH' && Number(amountPaidInput) < finalTotalWithPoints) ||
                  (paymentMethod === 'QRIS_SHARIAH' && !isQrisSimulated) ||
                  (paymentMethod === 'TRANSFER_BSI' && !isTransferSimulated) ||
                  (paymentMethod === 'KASBON' && !selectedCustomerId)
                }
                className={`py-2.5 text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer ${
                  isExpired ||
                  (paymentMethod === 'CASH' && Number(amountPaidInput) < finalTotalWithPoints) ||
                  (paymentMethod === 'QRIS_SHARIAH' && !isQrisSimulated) ||
                  (paymentMethod === 'TRANSFER_BSI' && !isTransferSimulated) ||
                  (paymentMethod === 'KASBON' && !selectedCustomerId)
                    ? 'bg-green-300 text-green-50 cursor-not-allowed'
                    : 'bg-green-700 hover:bg-green-800 text-white'
                }`}
              >
                Selesaikan Pembayaran
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modern Shariah Print Receipt Popup card */}
      {receiptTx && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
          <style dangerouslySetInnerHTML={{__html: `
            @media print {
              @page { size: 80mm auto; margin: 0; }
              body * { visibility: hidden; }
              .printable-thermal, .printable-thermal * { visibility: visible; }
              .printable-thermal { position: absolute; left: 0; top: 0; width: 80mm; padding: 2mm; margin: 0; border: none; max-height: none; overflow: visible; }
            }
          `}} />
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Receipt headers */}
            <div className="p-6 text-center border-b border-gray-100 bg-green-50/20">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
              <h3 className="font-extrabold text-gray-800 text-md">Pembayaran Sukses!</h3>
              <p className="text-xs text-gray-400 mt-1">Struk Digital penjualan KSA Mart</p>
            </div>

            {/* Simulated Thermic strip content */}
            <div className="printable-area printable-thermal p-6 space-y-4 text-xs font-mono text-gray-700 border-b border-dashed border-gray-200 max-h-96 overflow-y-auto">
              <div className="text-center space-y-0.5 border-b border-gray-100 pb-3">
                <p className="font-bold text-gray-800 text-sm">Toko KSA Mart</p>
                <p className="text-slate-400 text-[10px] uppercase">{activeBranchId ? `Cabang ${activeBranchId}` : 'Kantor Pusat'}, Indonesia</p>
                <p className="text-slate-400">Telp: 082210027952</p>
              </div>

              <div className="space-y-1 text-xs">
                <p><span className="text-slate-400">No Invoice:</span> {receiptTx.invoiceNo}</p>
                <p><span className="text-slate-400">Waktu:</span> {new Date(receiptTx.timestamp).toLocaleString('id-ID')}</p>
                <p><span className="text-slate-400">Kasir:</span> {receiptTx.cashierName}</p>
                <p><span className="text-slate-400">Pelanggan:</span> {receiptTx.customerName || 'Umum'}</p>
                <p><span className="text-slate-400">Metode:</span> {receiptTx.paymentMethod}</p>
              </div>

              <div className="border-t border-b border-gray-100 py-2 space-y-2">
                {receiptTx.items.map((it: any, index: number) => (
                  <div key={index} className="flex justify-between items-start text-xs font-bold text-slate-700">
                    <div>
                      <p>{it.productName}</p>
                      {it.targetNumber && <p className="text-[9px] text-blue-600">No: {it.targetNumber}</p>}
                      <p className="text-slate-400 text-[10px]">{it.quantity} x Rp {it.price.toLocaleString('id-ID')}</p>
                    </div>
                    <span>Rp {(it.price * it.quantity).toLocaleString('id-ID')}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 text-right mt-2 text-xs">
                {receiptTx.discountAmount > 0 && (
                  <div className="flex justify-between text-fuchsia-600 font-bold border-b border-dashed border-gray-100 pb-1 mb-1">
                    <span>Diskon Promo:</span>
                    <span>- Rp {receiptTx.discountAmount.toLocaleString('id-ID')}</span>
                  </div>
                )}
                {receiptTx.pointsDiscount > 0 && (
                  <div className="flex justify-between text-purple-600 font-bold border-b border-dashed border-gray-100 pb-1 mb-1">
                    <span>Tukar Poin ({receiptTx.pointsRedeemed} Poin):</span>
                    <span>- Rp {receiptTx.pointsDiscount.toLocaleString('id-ID')}</span>
                  </div>
                )}
                {receiptTx.pointsEarned > 0 && (
                  <div className="flex justify-between text-green-600 font-bold border-b border-dashed border-gray-100 pb-1 mb-1">
                    <span>Poin Didapat:</span>
                    <span>+ {receiptTx.pointsEarned} Poin</span>
                  </div>
                )}
                {receiptTx.taxAmount > 0 && (
                  <div className="flex justify-between text-amber-600 font-bold border-b border-dashed border-gray-100 pb-1 mb-1">
                    <span>Pajak (PPN):</span>
                    <span>Rp {receiptTx.taxAmount.toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm mt-2">
                  <span>Total Belanja:</span>
                  <span>Rp {receiptTx.totalAmount.toLocaleString('id-ID')}</span>
                </div>
                {receiptTx.splitPayments ? (
                  <>
                    {receiptTx.splitPayments.map((sp: any, i: number) => (
                      <div key={i} className="flex justify-between text-gray-600">
                        <span>Bayar {sp.method}:</span>
                        <span>Rp {sp.amount.toLocaleString('id-ID')}</span>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="flex justify-between">
                    <span>Uang Diterima:</span>
                    <span>Rp {receiptTx.amountPaid.toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-green-700 border-t border-gray-100 pt-1.5 mt-1">
                  <span>Uang Kembali:</span>
                  <span>Rp {receiptTx.changeAmount.toLocaleString('id-ID')}</span>
                </div>
                {receiptTx.pointsEarned > 0 && (
                  <div className="flex justify-between text-green-850 font-bold border-t border-dashed border-green-100 pt-1 mt-1 bg-green-50 p-1.5 rounded">
                    <span>Poin Diperoleh:</span>
                    <span>+ {receiptTx.pointsEarned} Poin</span>
                  </div>
                )}
              </div>

              {receiptTx.zakatContribution > 0 && settings.enableCharityZakat !== false && (
                <div className="border-t border-green-900/20 pt-3 text-center text-[10px] text-green-800 bg-green-50 p-2.5 rounded-lg border border-green-100 leading-normal">
                  <p className="font-bold uppercase tracking-wider mb-1">{settings.charityTitle || 'MISI BERKAH BERAMAL'}</p>
                  <p>{settings.charityDescription 
                    ? settings.charityDescription.replace('{amount}', `Rp ${receiptTx.zakatContribution.toLocaleString('id-ID')}`)
                    : `Zakat Kontribusi Sebesar Rp ${receiptTx.zakatContribution.toLocaleString('id-ID')} dari transaksi ini dicadangkan untuk kaum Dhuafa.`}
                  </p>
                </div>
              )}
            </div>

            {/* Kirim WhatsApp Struk */}
            <a id="wa-receipt-link" href="#" target="_blank" className="hidden">Kirim WA</a>
            
            {/* QRIS Enlarge Modal */}
            {isQrisEnlarged && (
              <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-200" onClick={() => setIsQrisEnlarged(false)}>
                <button className="absolute top-6 right-6 text-white hover:text-gray-300 transition-colors" onClick={() => setIsQrisEnlarged(false)}>
                  <XOctagon className="w-10 h-10" />
                </button>
                
                <div className="bg-white p-6 rounded-3xl w-full max-w-md shadow-2xl flex flex-col items-center" onClick={e => e.stopPropagation()}>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">QRIS {settings.storeName}</h3>
                  <p className="text-sm text-gray-500 mb-6 text-center">Arahkan kamera ke layar ini untuk membayar.</p>
                  
                  {settings.qrisImageUrl ? (
                    <img src={settings.qrisImageUrl} alt="QRIS Besar" className="w-full max-h-[50vh] object-contain rounded-xl border border-gray-100 p-2" />
                  ) : (
                    <div className="w-64 h-64 border-2 border-dashed border-gray-300 rounded-2xl flex items-center justify-center text-gray-400">
                      Belum ada QRIS
                    </div>
                  )}
                  
                  <div className="mt-8 bg-green-50 w-full py-4 rounded-xl border border-green-100 text-center">
                    <p className="text-xs font-bold text-green-700 uppercase mb-1">Total Tagihan Pelanggan</p>
                    <p className="text-3xl font-black text-green-800 tracking-tight">Rp {finalTotalWithPoints.toLocaleString('id-ID')}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="px-6 py-4 bg-green-50/30 border-t border-b border-gray-100 flex flex-col space-y-2">
              <label className="text-[11px] font-bold text-gray-700 flex items-center space-x-1">
                <span>📱 Kirim Struk Digital via WhatsApp</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="No WhatsApp (misal: 08123456789)"
                  className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-green-500 font-sans"
                />
                <button
                  onClick={handleSendWhatsApp}
                  className="bg-green-600 hover:bg-green-700 active:scale-95 text-white font-bold text-xs px-3 py-2 rounded-lg transition-all flex items-center space-x-1"
                >
                  Kirim WA
                </button>
              </div>
            </div>

            {/* Modal footer printers */}
            <div className="p-4 bg-slate-50 flex gap-2">
              <button
                onClick={() => setReceiptTx(null)}
                className="py-2 px-3 bg-white border border-gray-200 rounded-lg text-gray-700 font-semibold text-xs text-center"
              >
                Tutup
              </button>
              <button
                onClick={handlePrintReceipt}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg text-center shadow-xs"
              >
                Cetak PDF / Biasa
              </button>
              <button
                onClick={handleBluetoothPrint}
                className="flex-1 py-2 bg-green-700 hover:bg-green-800 text-white font-bold text-xs rounded-lg text-center shadow-xs flex items-center justify-center gap-1"
              >
                <Bluetooth className="w-4 h-4" />
                Cetak Bluetooth
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PPOB Input Modal */}
      {ppobModalOpen && selectedPpobProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-blue-600 p-4 text-white">
              <h3 className="font-bold text-lg">Input Data {selectedPpobProduct.category}</h3>
              <p className="text-blue-100 text-sm">{selectedPpobProduct.name}</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nomor Tujuan / ID Pelanggan</label>
                <input
                  type="text"
                  value={ppobTargetNumber}
                  onChange={(e) => setPpobTargetNumber(e.target.value)}
                  className="w-full pl-4 pr-4 py-3 bg-white text-slate-800 border-2 border-blue-500 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 text-lg font-bold placeholder-gray-300 shadow-inner"
                  placeholder="Misal: 0812xxxx / 5123xxxx"
                  autoFocus
                />
              </div>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">Harga Bayar</span>
                  <span className="font-black text-xl text-blue-700">Rp {selectedPpobProduct.price.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
              <button
                onClick={() => setPpobModalOpen(false)}
                className="px-4 py-2 text-gray-600 font-semibold hover:bg-gray-200 rounded-lg"
              >
                Batal
              </button>
              <button
                onClick={handleAddPpobToCart}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm"
              >
                Tambahkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Floating Cart Button */}
      {cart.length > 0 && (
        <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-5">
          <button 
            onClick={() => {
              document.getElementById('cart-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full font-bold shadow-2xl flex items-center gap-2 border-[3px] border-white/50 backdrop-blur-md"
          >
            <ShoppingCart className="w-5 h-5" />
            Keranjang ({cart.reduce((s, c) => s + c.quantity, 0)}) - Rp {cartTotal.toLocaleString('id-ID')}
          </button>
        </div>
      )}

    </div>
  );
}
