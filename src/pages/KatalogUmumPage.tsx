import React, { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '../store';
import { ShoppingBag, Package, ArrowLeft, Send, HelpCircle, AlertTriangle, MessageCircle, Loader, Search, ChevronLeft, ChevronRight, ShoppingCart, X } from 'lucide-react';
import { calculateDistanceKm } from '../utils/distance';
import { useNavigate } from 'react-router-dom';

const PAGE_SIZE = 24;

// Lightweight local placeholder — no external API call
function ProductPlaceholder({ name, category }: { name: string; category: string }) {
  const colors = [
    ['#16a34a', '#bbf7d0'], // green
    ['#0ea5e9', '#bae6fd'], // blue
    ['#f59e0b', '#fde68a'], // amber
    ['#8b5cf6', '#ddd6fe'], // violet
    ['#ef4444', '#fecaca'], // red
    ['#06b6d4', '#cffafe'], // cyan
    ['#ec4899', '#fbcfe8'], // pink
    ['#14b8a6', '#99f6e4'], // teal
  ];
  const idx = name.charCodeAt(0) % colors.length;
  const [bg, fg] = colors[idx];
  const initial = name.charAt(0).toUpperCase();
  return (
    <div style={{ backgroundColor: fg, color: bg }} className="w-full h-full flex flex-col items-center justify-center gap-1">
      <span style={{ color: bg }} className="text-2xl font-black">{initial}</span>
      <span style={{ color: bg, opacity: 0.75 }} className="text-[9px] font-semibold text-center px-1 leading-tight line-clamp-1">{category}</span>
    </div>
  );
}

export default function KatalogUmumPage() {
  const {
    products,
    customerCart,
    addToCustomerCart,
    updateCustomerCartQuantity,
    removeFromCustomerCart,
    submitOnlineOrder,
    settings,
    customers,
    addCustomer,
    initializeStore,
    isLoading
  } = useAppStore();

  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'CATALOG' | 'CART' | 'GUIDE'>('CATALOG');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [currentPage, setCurrentPage] = useState(1);

  const [isDataSyncing, setIsDataSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Checkout Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [isOutsideHours, setIsOutsideHours] = useState(false);
  const [checkoutNotes, setCheckoutNotes] = useState('');
  const [deliveryPeriod, setDeliveryPeriod] = useState('Periode 1 (08.00-09.00)');
  const [customerDistanceKm, setCustomerDistanceKm] = useState<number | null>(null);
  const [isCheckingLocation, setIsCheckingLocation] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'TRANSFER' | 'QRIS' | 'EWALLET'>('COD');
  const [isPaymentConfirmed, setIsPaymentConfirmed] = useState(false);

  // Sync data on mount
  useEffect(() => {
    const syncData = async () => {
      setIsDataSyncing(true);
      setSyncError(null);
      try {
        await initializeStore({ catalogOnly: true, showLoading: false });
        setSyncError(null);
      } catch (err: any) {
        setSyncError('Gagal memuat data produk. Data ditampilkan dari cache lokal.');
      } finally {
        setIsDataSyncing(false);
      }
    };
    syncData();
    const interval = setInterval(syncData, 60000); // Refresh every 60s (not 30s to reduce load)
    return () => clearInterval(interval);
  }, [initializeStore]);

  // Check operational hours
  useEffect(() => {
    const checkHours = () => {
      const h = new Date().getHours();
      setIsOutsideHours(h < 7 || h >= 19);
    };
    checkHours();
    const interval = setInterval(checkHours, 60000);
    return () => clearInterval(interval);
  }, []);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  // All available products (in stock only)
  const availableProducts = useMemo(() => products.filter(p => p.stock > 0), [products]);

  // Unique categories
  const categories = useMemo(() => {
    const cats = Array.from(new Set(availableProducts.map(p => p.category))).filter(Boolean).sort();
    return ['Semua', ...cats];
  }, [availableProducts]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return availableProducts.filter(p => {
      const matchCategory = selectedCategory === 'Semua' || p.category === selectedCategory;
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [availableProducts, selectedCategory, searchQuery]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredProducts.slice(start, start + PAGE_SIZE);
  }, [filteredProducts, currentPage]);

  const cartTotal = customerCart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const cartCount = customerCart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckLocation = () => {
    if (!settings.storeLocationLat || !settings.storeLocationLng) {
      alert("Mohon maaf, lokasi toko belum diatur oleh admin.");
      return;
    }
    setIsCheckingLocation(true);
    navigator.geolocation?.getCurrentPosition(
      (position) => {
        setIsCheckingLocation(false);
        const dist = calculateDistanceKm(
          settings.storeLocationLat!,
          settings.storeLocationLng!,
          position.coords.latitude,
          position.coords.longitude
        );
        setCustomerDistanceKm(dist);
      },
      (error) => {
        setIsCheckingLocation(false);
        alert("Gagal mendapatkan lokasi Anda. Pastikan izin GPS diaktifkan. " + error.message);
      }
    );
  };

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (customerCart.length === 0) return;
    if (!customerName.trim() || !customerPhone.trim() || !customerAddress.trim()) {
      alert("Mohon lengkapi Nama, No WhatsApp, dan Alamat Pengiriman!");
      return;
    }
    if (paymentMethod !== 'COD' && !isPaymentConfirmed) {
      alert("Mohon centang konfirmasi bahwa Anda sudah melakukan transfer/pembayaran.");
      return;
    }
    const customerId = `public_${Date.now()}`;
    const finalNotes = `[WAKTU PENGIRIMAN: ${deliveryPeriod}] [Metode: ${paymentMethod}] ${checkoutNotes || ''}`;
    const paymentCode = paymentMethod !== 'COD' ? `PAY-${Math.floor(100000 + Math.random() * 900000)}` : undefined;

    if (customerPhone && customerName) {
      const existing = customers.find(c =>
        c.phone === customerPhone ||
        c.phone === customerPhone.replace(/^0/, '62') ||
        c.phone.replace(/^0/, '62') === customerPhone.replace(/^0/, '62')
      );
      if (!existing) {
        addCustomer({ tenantId: 'tenant_default', name: customerName, phone: customerPhone, points: 0, debtAmount: 0 });
      }
    }
    submitOnlineOrder(customerId, customerName, customerPhone, finalNotes, customerAddress, paymentCode);

    const storeWa = (settings.ownerWhatsapp || '085881893650').replace(/^0/, '62');
    const itemList = customerCart.map(c => `▪ ${c.quantity}x ${c.product.name}`).join('\n');
    let paymentText = paymentMethod === 'TRANSFER' ? 'Transfer Bank' : paymentMethod === 'QRIS' ? 'QRIS Syariah' : paymentMethod === 'EWALLET' ? 'E-Wallet' : 'COD (Bayar di Tempat)';
    let waMessage = `Assalamu'alaikum Warahmatullahi Wabarakatuh,\nAdmin KSA Mart, saya ingin memesan:\n\n*🛒 DAFTAR PESANAN:*\n${itemList}\n\n*💰 TOTAL:* Rp ${cartTotal.toLocaleString('id-ID')}\n*💳 PEMBAYARAN:* ${paymentText}`;
    if (paymentCode) waMessage += `\n*🔢 KODE:* ${paymentCode}`;
    waMessage += `\n\n*📦 PENGIRIMAN:*\n- Nama: ${customerName}\n- HP: ${customerPhone}\n- Alamat: ${customerAddress}`;
    if (checkoutNotes) waMessage += `\n- Catatan: ${checkoutNotes}`;
    waMessage += `\n- Waktu: ${deliveryPeriod}\n\nMohon bantuannya. Terima kasih! 🙏`;

    setCustomerName(''); setCustomerPhone(''); setCustomerAddress(''); setCheckoutNotes('');
    setIsPaymentConfirmed(false); setPaymentMethod('COD'); setActiveTab('CATALOG');
    window.location.href = `https://wa.me/${storeWa}?text=${encodeURIComponent(waMessage)}`;
  };

  return (
    <div className="min-h-[100dvh] bg-slate-50 flex flex-col">

      {/* ── STICKY HEADER ──────────────────────────────────────── */}
      <header className="bg-gradient-to-r from-green-700 to-green-600 text-white shadow-lg sticky top-0 z-30">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <img src="/ksa_mart_logo.png" alt="KSA Mart" className="h-9 w-auto rounded-md shadow-sm" />
            <div>
              <h1 className="font-black text-base leading-tight">Katalog Belanja</h1>
              <p className="text-green-200 text-[11px] font-medium">KSA Mart Syariah</p>
            </div>
          </div>
          {/* Cart Indicator */}
          <button
            onClick={() => setActiveTab('CART')}
            className="relative p-2.5 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-0.5 shadow">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-t border-green-600">
          {([['CATALOG', '🛍️ Katalog'], ['CART', '🛒 Keranjang'], ['GUIDE', '📖 Panduan']] as const).map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-xs font-bold transition-colors relative ${
                activeTab === tab
                  ? 'text-white bg-white/20'
                  : 'text-green-200 hover:text-white hover:bg-white/10'
              }`}
            >
              {label}
              {tab === 'CART' && cartCount > 0 && activeTab !== 'CART' && (
                <span className="ml-1 inline-flex items-center justify-center w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full">
                  {cartCount}
                </span>
              )}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-t-full" />
              )}
            </button>
          ))}
        </div>
      </header>

      {/* ── SCROLLABLE CENTER CONTENT ──────────────────────────── */}
      <main className="flex-1 overflow-auto">

        {/* Outside Hours Banner */}
        {isOutsideHours && (
          <div className="bg-amber-500 text-white px-4 py-2.5 flex items-center gap-2 text-xs font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Di luar jam operasional (07:00-19:00). Pesanan akan diproses jam kerja berikutnya.</span>
          </div>
        )}

        {/* ═══ TAB: CATALOG ════════════════════════════════════════ */}
        {activeTab === 'CATALOG' && (
          <div className="pb-6">
            {/* Sync Status */}
            {isDataSyncing && (
              <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 text-xs border-b border-blue-100">
                <Loader className="w-3.5 h-3.5 animate-spin" />
                <span>Memperbarui data produk...</span>
              </div>
            )}
            {syncError && (
              <div className="flex items-center gap-2 bg-amber-50 text-amber-800 px-4 py-2 text-xs border-b border-amber-100">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span className="flex-1">{syncError}</span>
                <button onClick={() => initializeStore({ catalogOnly: true, showLoading: false }).then(() => setSyncError(null)).catch(() => {})} className="underline font-bold">Coba lagi</button>
              </div>
            )}

            {/* Search Bar */}
            <div className="px-4 pt-4 pb-3 bg-white border-b border-slate-100 sticky top-0 z-10 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="search"
                  placeholder={`Cari dari ${availableProducts.length.toLocaleString('id-ID')} produk...`}
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none focus:bg-white transition-colors"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Category Filter — Horizontal Scroll */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                      selectedCategory === cat
                        ? 'bg-green-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Stats Bar */}
            <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Menampilkan <span className="font-bold text-slate-700">{filteredProducts.length.toLocaleString('id-ID')}</span> produk
                {selectedCategory !== 'Semua' && <span className="text-green-600"> · {selectedCategory}</span>}
              </p>
              <p className="text-xs text-slate-400">
                Hal {currentPage} / {totalPages}
              </p>
            </div>

            {/* Loading State */}
            {isDataSyncing && availableProducts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Loader className="w-6 h-6 animate-spin text-green-600" />
                </div>
                <p className="text-slate-500 text-sm">Memuat katalog produk...</p>
              </div>
            )}

            {/* Empty State */}
            {!isDataSyncing && filteredProducts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 gap-3 px-8 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                  <Package className="w-8 h-8 text-slate-300" />
                </div>
                <div>
                  <p className="font-bold text-slate-700 mb-1">
                    {availableProducts.length === 0 ? 'Belum Ada Produk' : 'Tidak Ada Produk Ditemukan'}
                  </p>
                  <p className="text-slate-500 text-sm">
                    {availableProducts.length === 0
                      ? 'Produk sedang dimuat. Hubungi admin jika terus kosong.'
                      : `Tidak ada produk yang cocok dengan "${searchQuery}"`
                    }
                  </p>
                </div>
                {searchQuery && (
                  <button onClick={() => { setSearchQuery(''); setSelectedCategory('Semua'); }} className="text-sm text-green-600 font-bold underline">
                    Hapus Filter
                  </button>
                )}
              </div>
            )}

            {/* Product Grid */}
            {paginatedProducts.length > 0 && (
              <div className="p-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {paginatedProducts.map(p => {
                  const inCart = customerCart.find(c => c.product.id === p.id)?.quantity || 0;
                  return (
                    <div key={p.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:shadow-md hover:-translate-y-0.5 transition-all duration-150">
                      {/* Product Image */}
                      <div className="aspect-square w-full overflow-hidden relative flex-shrink-0">
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <ProductPlaceholder name={p.name} category={p.category} />
                        )}
                        {/* Category Badge */}
                        <div className="absolute top-1.5 left-1.5">
                          <span className="bg-black/50 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full backdrop-blur-sm">
                            {p.category}
                          </span>
                        </div>
                        {inCart > 0 && (
                          <div className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-0.5 shadow">
                            {inCart}
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="p-2 flex flex-col flex-1 gap-1.5">
                        <h3 className="font-semibold text-slate-800 text-xs leading-tight line-clamp-2 flex-1">{p.name}</h3>
                        <p className="text-green-700 font-black text-sm">Rp {p.price.toLocaleString('id-ID')}</p>
                        <p className="text-[10px] text-slate-400">Stok: {p.stock} {p.unit}</p>

                        {/* Add to Cart */}
                        {inCart > 0 ? (
                          <div className="flex items-center justify-between bg-green-50 rounded-lg p-0.5 border border-green-200">
                            <button
                              onClick={() => updateCustomerCartQuantity(p.id, inCart - 1)}
                              className="w-7 h-7 flex items-center justify-center bg-white rounded-md text-green-700 font-black hover:bg-green-100 shadow-sm text-sm"
                            >-</button>
                            <span className="font-black text-green-800 text-sm min-w-[1.5rem] text-center">{inCart}</span>
                            <button
                              onClick={() => updateCustomerCartQuantity(p.id, inCart + 1)}
                              disabled={inCart >= p.stock}
                              className="w-7 h-7 flex items-center justify-center bg-white rounded-md text-green-700 font-black hover:bg-green-100 shadow-sm disabled:opacity-40 text-sm"
                            >+</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCustomerCart(p)}
                            className="w-full py-1.5 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center justify-center gap-1"
                          >
                            <ShoppingBag className="w-3 h-3" /> Tambah
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 px-4 py-6">
                <button
                  onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0 }); }}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Sebelumnya
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let page: number;
                    if (totalPages <= 5) page = i + 1;
                    else if (currentPage <= 3) page = i + 1;
                    else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
                    else page = currentPage - 2 + i;
                    return (
                      <button
                        key={page}
                        onClick={() => { setCurrentPage(page); window.scrollTo({ top: 0 }); }}
                        className={`w-9 h-9 rounded-lg text-sm font-bold transition-colors ${
                          page === currentPage
                            ? 'bg-green-600 text-white shadow-sm'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0 }); }}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-colors"
                >
                  Berikutnya <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ═══ TAB: CART ══════════════════════════════════════════ */}
        {activeTab === 'CART' && (
          <div className="p-4 pb-8 max-w-3xl mx-auto">
            {customerCart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
                  <ShoppingBag className="w-10 h-10 text-slate-300" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-700 mb-1">Keranjang Kosong</h3>
                  <p className="text-slate-500 text-sm">Tambahkan produk dari katalog belanja kami.</p>
                </div>
                <button onClick={() => setActiveTab('CATALOG')} className="bg-green-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-green-700 transition-colors shadow-sm">
                  Lihat Katalog
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Cart Items */}
                <div className="space-y-2">
                  <h2 className="font-bold text-slate-800 text-lg">Pesanan Anda ({cartCount} item)</h2>
                  {customerCart.map(item => (
                    <div key={item.product.id} className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3">
                      <div className="w-14 h-14 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                        {item.product.image
                          ? <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                          : <ProductPlaceholder name={item.product.name} category={item.product.category} />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-800 text-sm leading-tight truncate">{item.product.name}</h4>
                        <p className="text-green-600 font-bold text-sm">Rp {item.product.price.toLocaleString('id-ID')}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => updateCustomerCartQuantity(item.product.id, item.quantity - 1)} className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-700 hover:bg-slate-200">-</button>
                        <span className="w-6 text-center font-bold text-sm">{item.quantity}</span>
                        <button onClick={() => updateCustomerCartQuantity(item.product.id, item.quantity + 1)} className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-700 hover:bg-slate-200">+</button>
                        <button onClick={() => removeFromCustomerCart(item.product.id)} className="ml-1 p-1.5 text-rose-400 hover:bg-rose-50 rounded-lg hover:text-rose-600">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total Summary */}
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex justify-between items-center">
                  <span className="font-bold text-slate-700">Total Belanja</span>
                  <span className="text-xl font-black text-green-700">Rp {cartTotal.toLocaleString('id-ID')}</span>
                </div>

                {/* Checkout Form */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                  <h3 className="font-bold text-lg text-slate-800 mb-4 pb-3 border-b border-slate-100">Informasi Pengiriman</h3>
                  <form onSubmit={handleCheckout} className="space-y-4">
                    {/* GPS Distance */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm">
                      <p className="font-bold text-blue-800 mb-1.5">Deteksi Jarak (GPS)</p>
                      {customerDistanceKm !== null
                        ? <p className="text-blue-700">Jarak ke toko: <span className="font-black text-lg">{customerDistanceKm.toFixed(2)} km</span></p>
                        : <p className="text-blue-600 text-xs mb-2">Aktifkan GPS untuk estimasi ongkir otomatis.</p>
                      }
                      <button type="button" onClick={handleCheckLocation} disabled={isCheckingLocation}
                        className="mt-1 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-3 rounded-lg disabled:opacity-50">
                        {isCheckingLocation ? 'Mendeteksi...' : (customerDistanceKm !== null ? 'Perbarui Lokasi' : 'Cek Jarak ke Toko')}
                      </button>
                      {customerDistanceKm !== null && settings.maxDeliveryRadiusKm && customerDistanceKm > settings.maxDeliveryRadiusKm && (
                        <p className="mt-2 text-rose-600 text-xs font-bold bg-rose-50 border border-rose-200 p-2 rounded">
                          Jarak melebihi batas pengiriman ({settings.maxDeliveryRadiusKm} km).
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap *</label>
                      <input type="text" required value={customerName} onChange={e => setCustomerName(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-green-500 outline-none" placeholder="Masukkan nama lengkap" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Nomor WhatsApp *</label>
                      <input type="tel" required value={customerPhone} onChange={e => setCustomerPhone(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-green-500 outline-none" placeholder="08123456789" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Pengiriman *</label>
                      <textarea required value={customerAddress} onChange={e => setCustomerAddress(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-green-500 outline-none h-20 resize-none" placeholder="Alamat lengkap pengiriman..." />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Periode Pengiriman *</label>
                      <select value={deliveryPeriod} onChange={e => setDeliveryPeriod(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-green-500 outline-none bg-white">
                        <option>Periode 1 (08.00-09.00)</option>
                        <option>Periode 2 (11.00-12.00)</option>
                        <option>Periode 3 (14.00-15.00)</option>
                        <option>Periode 4 (17.00-18.00)</option>
                        <option>Periode 5 (20.00-21.00)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Catatan (Opsional)</label>
                      <input type="text" value={checkoutNotes} onChange={e => setCheckoutNotes(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-green-500 outline-none" placeholder="Misal: minta tas/kantong ekstra" />
                    </div>

                    {/* Payment Method */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">Metode Pembayaran *</label>
                      <div className="grid grid-cols-2 gap-2">
                        {(['COD', 'TRANSFER', 'EWALLET', 'QRIS'] as const).map(method => {
                          const labels: Record<string, string> = { COD: '🤝 COD (Bayar di Tempat)', TRANSFER: '🏦 Transfer Bank', EWALLET: '📱 E-Wallet', QRIS: '📷 QRIS' };
                          const colors: Record<string, string> = { COD: 'border-green-500 bg-green-50 text-green-800', TRANSFER: 'border-blue-500 bg-blue-50 text-blue-800', EWALLET: 'border-purple-500 bg-purple-50 text-purple-800', QRIS: 'border-fuchsia-500 bg-fuchsia-50 text-fuchsia-800' };
                          return (
                            <button key={method} type="button" onClick={() => setPaymentMethod(method)}
                              className={`p-3 rounded-xl border-2 text-xs font-bold text-center transition-all ${paymentMethod === method ? colors[method] : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>
                              {labels[method]}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Payment Instructions */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-3">
                      <p className="font-bold text-slate-800 border-b pb-2">💳 Instruksi Pembayaran</p>
                      {paymentMethod === 'COD' && (
                        <p className="text-slate-600">Siapkan uang tunai sebesar <b className="text-green-700">Rp {cartTotal.toLocaleString('id-ID')}</b> saat kurir tiba.</p>
                      )}
                      {paymentMethod === 'TRANSFER' && (
                        <div className="space-y-2">
                          <p className="text-slate-600">Transfer <b className="text-green-700">Rp {cartTotal.toLocaleString('id-ID')}</b> ke:</p>
                          {(settings.paymentMethods?.bankTransfer?.length ? settings.paymentMethods.bankTransfer : [{ bankName: 'BSI (Bank Syariah Indonesia)', accountNumber: '7182938495', accountName: 'KSA Mart Syariah' }]).map((b, i) => (
                            <div key={i} className="bg-white p-3 rounded-lg border border-blue-200">
                              <p className="font-bold text-blue-800">{b.bankName}</p>
                              <p className="font-mono text-base mt-0.5">{b.accountNumber}</p>
                              <p className="text-slate-500 text-[11px]">a.n. {b.accountName}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      {paymentMethod === 'EWALLET' && (
                        <div className="space-y-2">
                          <p className="text-slate-600">Transfer <b className="text-green-700">Rp {cartTotal.toLocaleString('id-ID')}</b> via e-wallet:</p>
                          {(settings.paymentMethods?.ewallet?.length ? settings.paymentMethods.ewallet : [{ provider: 'DANA / OVO', number: 'Belum diatur', accountName: '' }]).map((w, i) => (
                            <div key={i} className="bg-white p-3 rounded-lg border border-purple-200">
                              <p className="font-bold text-purple-800">{w.provider}</p>
                              <p className="font-mono text-base mt-0.5">{w.number}</p>
                              {w.accountName && <p className="text-slate-500 text-[11px]">a.n. {w.accountName}</p>}
                            </div>
                          ))}
                        </div>
                      )}
                      {paymentMethod === 'QRIS' && (
                        <div className="flex flex-col items-center gap-2">
                          <p className="text-slate-600 text-center">Scan QRIS dengan nominal <b className="text-green-700">Rp {cartTotal.toLocaleString('id-ID')}</b>:</p>
                          {settings.qrisImageUrl
                            ? <img src={settings.qrisImageUrl} alt="QRIS" className="w-40 h-auto rounded-xl border-2 border-fuchsia-200 p-1 bg-white shadow-sm" />
                            : <div className="p-3 bg-rose-50 text-rose-700 rounded-lg text-center w-full">Toko belum mengunggah QRIS. Pilih metode lain.</div>
                          }
                        </div>
                      )}
                      {paymentMethod !== 'COD' && (
                        <label className="flex items-start gap-2 mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg cursor-pointer">
                          <input type="checkbox" required checked={isPaymentConfirmed} onChange={e => setIsPaymentConfirmed(e.target.checked)} className="mt-0.5 w-4 h-4 text-blue-600" />
                          <span className="text-blue-900 font-medium leading-relaxed">Saya sudah melakukan pembayaran sebesar <b>Rp {cartTotal.toLocaleString('id-ID')}</b> dan siap mengirim bukti via WhatsApp.</span>
                        </label>
                      )}
                    </div>

                    {/* Submit */}
                    <div className="pt-2">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-slate-600 font-medium">Total Bayar</span>
                        <span className="text-xl font-black text-green-700">Rp {cartTotal.toLocaleString('id-ID')}</span>
                      </div>
                      <button type="submit"
                        disabled={paymentMethod !== 'COD' && !isPaymentConfirmed}
                        className="w-full py-3.5 text-white font-black rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all text-base bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:bg-slate-300 disabled:cursor-not-allowed">
                        <Send className="w-5 h-5" /> Buat Pesanan via WhatsApp
                      </button>
                      <p className="text-center text-[10px] text-slate-400 mt-2">Pesanan otomatis dikirim ke WhatsApp admin KSA Mart.</p>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ TAB: GUIDE ══════════════════════════════════════════ */}
        {activeTab === 'GUIDE' && (
          <div className="p-4 pb-8 max-w-2xl mx-auto space-y-4">
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl">
              <h3 className="font-bold text-amber-900 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" /> Jam Operasional
              </h3>
              <ul className="text-amber-800 text-sm leading-relaxed space-y-1.5 list-disc list-inside">
                <li><strong>Jam operasional:</strong> 07.00 - 19.00 WIB setiap hari</li>
                <li>Pesanan di luar jam operasional diproses hari kerja berikutnya</li>
                <li>Layanan antar radius <strong>maksimal 5 KM</strong></li>
                <li>Pastikan nomor HP/WhatsApp aktif untuk konfirmasi pesanan</li>
              </ul>
            </div>

            {[
              { num: '1', title: 'Pilih Produk', body: 'Lihat produk di Katalog Belanja. Gunakan filter kategori atau pencarian. Tekan "Tambah" untuk memasukkan produk ke keranjang.' },
              { num: '2', title: 'Cek Keranjang & Isi Alamat', body: 'Buka tab Keranjang, pastikan jumlah barang sesuai. Isi Nama, No. WhatsApp, dan Alamat Pengiriman dengan lengkap.' },
              { num: '3', title: 'Buat Pesanan via WhatsApp', body: 'Tekan "Buat Pesanan". Sistem otomatis membuka WhatsApp dengan format pesanan yang sudah rapi. Kirim dan tunggu konfirmasi dari admin.' },
            ].map(step => (
              <div key={step.num} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex gap-4">
                <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-black text-lg shrink-0">
                  {step.num}
                </div>
                <div>
                  <h3 className="font-bold text-green-800 mb-1">{step.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── FLOATING CART BUTTON (only when catalog tab & has items) ── */}
      {activeTab === 'CATALOG' && cartCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-30 pointer-events-none flex justify-center">
          <button
            onClick={() => setActiveTab('CART')}
            className="pointer-events-auto flex items-center gap-3 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-black py-3 px-6 rounded-2xl shadow-2xl transition-all hover:scale-105 active:scale-95"
          >
            <ShoppingCart className="w-5 h-5" />
            <span>Lihat Keranjang ({cartCount} item)</span>
            <span className="bg-white/20 px-2.5 py-0.5 rounded-full font-black text-sm">
              Rp {cartTotal.toLocaleString('id-ID')}
            </span>
          </button>
        </div>
      )}

      {/* ── FLOATING WA BUTTON ─────────────────────────────────── */}
      {settings.ownerWhatsapp && (
        <a
          href={`https://wa.me/${settings.ownerWhatsapp.replace(/^0/, '62')}?text=${encodeURIComponent("Assalamu'alaikum Admin KSA Mart, saya ingin bertanya tentang produk/pesanan.")}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`fixed z-50 flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 group ${activeTab === 'CATALOG' && cartCount > 0 ? 'bottom-20' : 'bottom-6'} right-4`}
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap">Chat Admin</span>
        </a>
      )}
    </div>
  );
}
